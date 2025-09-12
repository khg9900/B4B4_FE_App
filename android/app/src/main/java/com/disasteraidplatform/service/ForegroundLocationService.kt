package com.disasteraidplatform.service

import android.Manifest
import android.app.*
import android.content.Intent
import android.content.pm.PackageManager
import android.location.Location
import android.os.*
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.disasteraidplatform.cache.LocationCache
import com.disasteraidplatform.network.BackendApi
import com.disasteraidplatform.util.Logger
import com.disasteraidplatform.auth.JwtManager
import com.disasteraidplatform.websocket.WebSocketManager
import com.disasteraidplatform.websocket.TrackingWebSocketClient
import com.google.android.gms.location.*
import kotlinx.coroutines.*
import com.disasteraidplatform.R

class ForegroundLocationService : Service() {

    companion object {
        private const val CHANNEL_ID = "foreground_service_channel"
        private const val NOTIFICATION_ID = 1
        private const val LOCATION_UPDATE_INTERVAL_MS = 10_000L
        private const val LOCATION_SEND_INTERVAL_MS = 60_000L
    }

    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var locationRequest: LocationRequest
    private lateinit var locationCallback: LocationCallback
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var sendJob: Job? = null
    private var wsManager: WebSocketManager? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildForegroundNotification("서비스 시작"))

        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
        locationRequest = LocationRequest.Builder(
            Priority.PRIORITY_HIGH_ACCURACY,
            LOCATION_UPDATE_INTERVAL_MS
        ).setMinUpdateIntervalMillis(5_000L).build()

        locationCallback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                val loc: Location? = result.lastLocation
                loc?.let {
                    Logger.d("ForegroundLocationService", "새 위치 수신: lat=${it.latitude}, lng=${it.longitude}")
                    LocationCache.set(it.latitude, it.longitude)
                    updateForegroundNotification("위치 추적 중…")
                }
            }
        }

        scope.launch {
            ensureValidToken()
            startWebSocket()
            startSendingLoop()
        }

        startLocationUpdates()
    }

    private suspend fun ensureValidToken() {
        val token = JwtManager.getToken()
        if (token == null || JwtManager.isAccessTokenExpired(token)) {
            val newToken = JwtManager.refreshTokenSync()
            if (newToken == null) {
                Logger.e("ForegroundLocationService", "토큰 갱신 실패, 서비스 종료")
                stopSelf()
            } else {
                Logger.d("ForegroundLocationService", "토큰 갱신 성공")
            }
        }
    }

    private fun startLocationUpdates() {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED &&
            ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            Logger.e("ForegroundLocationService", "위치 권한 없음")
            stopSelf()
            return
        }
        fusedLocationClient.requestLocationUpdates(locationRequest, locationCallback, Looper.getMainLooper())
    }

    private fun startWebSocket() {
        val token = JwtManager.getToken() ?: return
        val locationUrl = "ws://192.168.25.177:8080/api/location-tracking?token=$token"
        val trackingUrl = "ws://192.168.25.177:8080/api/tracking?token=$token"

        wsManager = WebSocketManager(locationUrl, trackingUrl)
        wsManager?.connectAll(
            onTrackingEvent = { event ->
                when (event) {
                    is TrackingWebSocketClient.TrackingEvent.Ready -> showVolunteerNotification("출석 준비")
                    is TrackingWebSocketClient.TrackingEvent.Started -> showVolunteerNotification("출석 시작")
                    is TrackingWebSocketClient.TrackingEvent.Ended -> showVolunteerNotification("출석 종료")
                    else -> {}
                }
            },
            onReady = {}
        )
    }

    private fun startSendingLoop() {
        if (sendJob?.isActive == true) return

        sendJob = scope.launch {
            while (isActive) {
                val loc = LocationCache.get()
                loc?.let { location ->
                    try {
                        val region = RegionSender(this@ForegroundLocationService)
                            .fetchRegion(location.longitude, location.latitude)
                        region?.let { r ->
                            BackendApi.requestSyncWithRefresh(
                                url = "/location/region",
                                method = "POST",
                                body = BackendApi.createJsonRequestBody(mapOf(
                                    "province" to r.province,
                                    "city" to r.city
                                ))
                            )?.let { resp ->
                                if (resp.isSuccessful)
                                    Logger.d("ForegroundLocationService", "REST 위치 전송 성공: ${r.province}, ${r.city}")
                                else
                                    Logger.e("ForegroundLocationService", "REST 전송 실패: ${resp.code}")
                            }
                        }
                    } catch (e: Exception) {
                        Logger.e("ForegroundLocationService", "REST 위치 전송 오류", e)
                    }

                    wsManager?.volunteerId?.let { vid ->
                        try {
                            wsManager?.locationWS?.sendLocation(vid, location.latitude, location.longitude)
                        } catch (e: Exception) {
                            Logger.e("ForegroundLocationService", "WebSocket 위치 전송 오류", e)
                        }
                    }
                }

                delay(LOCATION_SEND_INTERVAL_MS)
            }
        }
    }

    override fun onDestroy() {
        fusedLocationClient.removeLocationUpdates(locationCallback)
        sendJob?.cancel()
        wsManager?.disconnectAll()
        scope.cancel()
        super.onDestroy()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID, "Foreground Service Channel",
                NotificationManager.IMPORTANCE_DEFAULT
            )
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
    }

    private fun buildForegroundNotification(message: String): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Disaster Aid Platform")
            .setContentText("📍 $message")
            .setSmallIcon(R.drawable.b4b4)
            .setOngoing(true)
            .build()
    }

    private fun updateForegroundNotification(message: String) {
        NotificationManagerCompat.from(this)
            .notify(NOTIFICATION_ID, buildForegroundNotification(message))
    }

    private fun showVolunteerNotification(title: String, content: String = "") {
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("❤️ $title")
            .setContentText(content)
            .setSmallIcon(R.drawable.b4b4)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .build()

        NotificationManagerCompat.from(this)
            .notify(System.currentTimeMillis().toInt(), notification)
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
