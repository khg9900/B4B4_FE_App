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
import com.disasteraidplatform.websocket.WebSocketManager
import com.disasteraidplatform.websocket.TrackingWebSocketClient
import com.google.android.gms.location.*
import com.disasteraidplatform.kakao.RegionParser
import com.disasteraidplatform.R
import kotlinx.coroutines.*
import com.disasteraidplatform.BuildConfig

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
    private var isFirstLocationReceived = false

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildForegroundNotification("서비스 시작"))

        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
        locationRequest = LocationRequest.Builder(
            Priority.PRIORITY_HIGH_ACCURACY,
            LOCATION_UPDATE_INTERVAL_MS
        ).setMinUpdateIntervalMillis(5_000L)
            .setMaxUpdateDelayMillis(15_000L)
            .build()

        locationCallback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                val loc: Location? = result.lastLocation
                loc?.let {
                    Logger.d("ForegroundLocationService", "새 위치 수신: lat=${it.latitude}, lng=${it.longitude}")
                    LocationCache.set(it.latitude, it.longitude)
                    updateForegroundNotification("위치 추적 중…")

                    if (!isFirstLocationReceived) {
                        isFirstLocationReceived = true
                        startSendingLoop()
                        scope.launch { initWebSocket() }
                    }
                }
            }
        }

        startInitialLocation()
        startLocationUpdates()
    }

    // --- 초기 위치 가져오기 ---
    private fun startInitialLocation() {
        if (!checkLocationPermission()) return

        fusedLocationClient.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, null)
            .addOnSuccessListener { loc ->
                loc?.let {
                    Logger.d("ForegroundLocationService", "초기 위치 수신: lat=${it.latitude}, lng=${it.longitude}")
                    LocationCache.set(it.latitude, it.longitude)
                    if (!isFirstLocationReceived) {
                        isFirstLocationReceived = true
                        startSendingLoop()
                        scope.launch { initWebSocket() }
                    }
                }
            }
            .addOnFailureListener { e ->
                Logger.e("ForegroundLocationService", "초기 위치 수신 실패", e)
            }
    }

    private fun startLocationUpdates() {
        if (!checkLocationPermission()) return

        fusedLocationClient.requestLocationUpdates(
            locationRequest,
            locationCallback,
            Looper.getMainLooper()
        )
    }

    private fun checkLocationPermission(): Boolean {
        val granted = ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED ||
                ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
        if (!granted) {
            Logger.e("ForegroundLocationService", "위치 권한 없음")
            stopSelf()
        }
        return granted
    }

    // --- WebSocket 초기화 ---
    private suspend fun initWebSocket() {

        val baseUrl = BuildConfig.BASE_URL.removeSuffix("/")
        val locationUrl = "$baseUrl/location-tracking"
        val trackingUrl = "$baseUrl/tracking"



        wsManager = WebSocketManager(locationUrl, trackingUrl)
        wsManager?.connectAll(
            onTrackingEvent = { event -> handleTrackingEvent(event) },
            onReady = { Logger.d("ForegroundLocationService", "WebSocket READY") }
        )
    }

    // --- 위치 전송 루프 ---
    private fun startSendingLoop() {
        if (sendJob?.isActive == true) return
        sendJob = scope.launch {
            while (isActive) {
                val loc = LocationCache.get()
                loc?.let { location ->
                    try {
                        // 좌표 -> 지역 정보 가져오기
                        val geoRegion = RegionSender(this@ForegroundLocationService)
                            .fetchRegion(location.longitude, location.latitude)

                        // Kakao RegionParser로 변환
                        val region = RegionParser.parse(
                            geoRegion?.province ?: "",
                            geoRegion?.city
                        )

                        // REST API 전송
                        BackendApi.requestSyncWithRefresh(
                            url = "/location/region",
                            method = "POST",
                            body = BackendApi.createJsonRequestBody(mapOf(
                                "province" to region.province,
                                "city" to region.city
                            ))
                        )?.let { resp ->
                            if (resp.isSuccessful)
                                Logger.d("ForegroundLocationService", "REST 위치 전송 성공: ${region.province}, ${region.city}")
                            else
                                Logger.e("ForegroundLocationService", "REST 전송 실패: ${resp.code}")
                        }

                    } catch (e: Exception) {
                        Logger.e("ForegroundLocationService", "REST 위치 전송 오류", e)
                    }

                    try {
                        wsManager?.volunteerId?.let { vid ->
                            wsManager?.locationWS?.sendLocation(vid, location.latitude, location.longitude)
                            Logger.d("ForegroundLocationService", "WebSocket 위치 전송: $vid, ${location.latitude}, ${location.longitude}")
                        }
                    } catch (e: Exception) {
                        Logger.e("ForegroundLocationService", "WebSocket 위치 전송 오류", e)
                    }
                }
                delay(LOCATION_SEND_INTERVAL_MS)
            }
        }
    }

    private fun handleTrackingEvent(event: TrackingWebSocketClient.TrackingEvent) {
        when (event) {
            is TrackingWebSocketClient.TrackingEvent.Ready -> showVolunteerNotification("출석 준비")
            is TrackingWebSocketClient.TrackingEvent.Started -> showVolunteerNotification("출석 시작")
            is TrackingWebSocketClient.TrackingEvent.Ended -> showVolunteerNotification("출석 종료")
            else -> {}
        }
    }

    // --- Notification ---
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID, "Foreground Service Channel",
                NotificationManager.IMPORTANCE_DEFAULT
            )
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
    }

    private fun buildForegroundNotification(message: String): Notification =
        NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Disaster Aid Platform")
            .setContentText("📍 $message")
            .setSmallIcon(R.drawable.b4b4)
            .setOngoing(true)
            .build()

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

    override fun onDestroy() {
        fusedLocationClient.removeLocationUpdates(locationCallback)
        sendJob?.cancel()
        wsManager?.disconnectAll()
        scope.cancel()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
