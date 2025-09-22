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
import com.disasteraidplatform.MainActivity
import com.disasteraidplatform.R
import com.disasteraidplatform.cache.LocationCache
import com.disasteraidplatform.network.BackendApi
import com.disasteraidplatform.util.Logger
import com.disasteraidplatform.websocket.WebSocketManager
import com.disasteraidplatform.websocket.TrackingWebSocketClient
import com.google.android.gms.location.*
import com.disasteraidplatform.kakao.RegionParser
import com.disasteraidplatform.BuildConfig
import kotlinx.coroutines.*
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

class ForegroundLocationService : Service() {

    companion object {
        private const val CHANNEL_ID = "foreground_service_channel"
        private const val FOREGROUND_NOTIFICATION_ID = 1
        private const val VOLUNTEER_NOTIFICATION_ID = 1002
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

    // 출석 메시지 누적
    private val volunteerMessages = mutableListOf<NotificationCompat.MessagingStyle.Message>()
    private var isFirstVolunteerNotification = true

    // 클릭 시 알림 초기화용 액션
    private val ACTION_CLEAR_VOLUNTEER_NOTIFICATION = "com.disasteraidplatform.CLEAR_VOLUNTEER_NOTIFICATION"

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startForeground(FOREGROUND_NOTIFICATION_ID, buildForegroundNotification("서비스 시작"))

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

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        intent?.action?.let { action ->
            if (action == ACTION_CLEAR_VOLUNTEER_NOTIFICATION) {
                volunteerMessages.clear() // 누적 메시지 초기화
                NotificationManagerCompat.from(this).cancel(VOLUNTEER_NOTIFICATION_ID) // 알림 제거
            }
        }
        return super.onStartCommand(intent, flags, startId)
    }

    private fun startInitialLocation() {
        if (!checkLocationPermission()) return

        fusedLocationClient.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, null)
            .addOnSuccessListener { loc ->
                loc?.let {
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
        val granted = ActivityCompat.checkSelfPermission(
            this,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED ||
                ActivityCompat.checkSelfPermission(
                    this,
                    Manifest.permission.ACCESS_COARSE_LOCATION
                ) == PackageManager.PERMISSION_GRANTED
        if (!granted) {
            Logger.e("ForegroundLocationService", "위치 권한 없음")
            stopSelf()
        }
        return granted
    }

    private suspend fun initWebSocket() {
        val baseUrl = BuildConfig.BASE_URL.removeSuffix("/")
        val locationUrl = "$baseUrl/location-tracking"
        val trackingUrl = "$baseUrl/tracking"

        wsManager = WebSocketManager(locationUrl, trackingUrl)
        wsManager?.connectAll(
            onTrackingEvent = { event -> handleTrackingEvent(event) },
            onReady = { Logger.d("ForegroundLocationService", "WebSocket READY") }
        )

        // 서버 notify 메시지 처리
        wsManager?.trackingWS?.onRawMessage = { rawJson ->
            handleWebSocketMessage(rawJson)
        }
    }

    private fun startSendingLoop() {
        if (sendJob?.isActive == true) return
        sendJob = scope.launch {
            while (isActive) {
                val loc = LocationCache.get()
                loc?.let { location ->
                    try {
                        val geoRegion = RegionSender(this@ForegroundLocationService)
                            .fetchRegion(location.longitude, location.latitude)

                        val region = RegionParser.parse(
                            geoRegion?.province ?: "",
                            geoRegion?.city
                        )

                        BackendApi.requestSyncWithRefresh(
                            url = "/location/region",
                            method = "POST",
                            body = BackendApi.createJsonRequestBody(
                                mapOf(
                                    "province" to region.province,
                                    "city" to region.city
                                )
                            )
                        )?.let { resp ->
                            if (!resp.isSuccessful)
                                Logger.e("ForegroundLocationService", "REST 전송 실패: ${resp.code}")
                        }

                    } catch (e: Exception) {
                        Logger.e("ForegroundLocationService", "REST 위치 전송 오류", e)
                    }

                    try {
                        wsManager?.volunteerId?.let { vid ->
                            wsManager?.locationWS?.sendLocation(
                                vid,
                                location.latitude,
                                location.longitude
                            )
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
        val readyData = wsManager?.trackingWS?.lastReadyData
        when (event) {
            is TrackingWebSocketClient.TrackingEvent.Ready -> {
                showVolunteerNotification("출석 준비", "출석 준비가 시작되었습니다.")
            }
            is TrackingWebSocketClient.TrackingEvent.Started -> {
                readyData?.let {
                    showVolunteerNotification("출석 시작", "출석이 시작되었습니다.")
                }
            }
            is TrackingWebSocketClient.TrackingEvent.Ended -> {
                readyData?.let {
                    showVolunteerNotification("출석 종료", "출석이 종료되었습니다.")
                }
            }
            else -> {}
        }
    }

    private fun handleWebSocketMessage(json: String) {
        try {
            Logger.d("WebSocket", "수신 메시지: $json") // 수신 로그

            val msg = Json.parseToJsonElement(json).jsonObject
            val type = msg["type"]?.jsonPrimitive?.content
            val data = msg["data"]?.jsonObject

            if (type == "attendance_status") {
                val isPresent = data?.get("Present")?.jsonPrimitive?.content?.toBoolean() ?: false
                showVolunteerNotification(
                    if (isPresent) "출석 시작" else "출석 상태 변경",
                    "출석이 ${if (isPresent) "시작" else "변경"}되었습니다."
                )
            }
        } catch (e: Exception) {
            Logger.e("WebSocket", "메시지 처리 실패", e)
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID, "Foreground Service Channel",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                setSound(null, null)
                enableVibration(false)
            }
            getSystemService(NotificationManager::class.java)
                ?.createNotificationChannel(channel)
        }
    }

    private fun buildForegroundNotification(message: String): Notification =
        NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Disaster Aid Platform")
            .setContentText("📍 $message")
            .setSmallIcon(R.drawable.b4b4)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .build()

    private fun updateForegroundNotification(message: String) {
        NotificationManagerCompat.from(this)
            .notify(FOREGROUND_NOTIFICATION_ID, buildForegroundNotification(message))
    }

    private fun showVolunteerNotification(title: String, content: String) {
        val intent = Intent(this, ForegroundLocationService::class.java).apply {
            action = ACTION_CLEAR_VOLUNTEER_NOTIFICATION
        }

        val pendingIntent = PendingIntent.getService(
            this,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // 메시지 누적
        volunteerMessages.add(
            NotificationCompat.MessagingStyle.Message(
                content.ifEmpty { title },
                System.currentTimeMillis(),
                "봉사 출석"
            )
        )
        if (volunteerMessages.size > 10) volunteerMessages.removeAt(0)

        val messagingStyle = NotificationCompat.MessagingStyle("시스템")
            .setConversationTitle("봉사 출석 알림")
        volunteerMessages.forEach { messagingStyle.addMessage(it) }

        val builder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.b4b4)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setStyle(messagingStyle)
            .setContentTitle("봉사 출석 알림")
            .setContentText(content.ifEmpty { title })

        if (isFirstVolunteerNotification) {
            builder.setPriority(NotificationCompat.PRIORITY_HIGH)
            isFirstVolunteerNotification = false
        } else {
            builder.setPriority(NotificationCompat.PRIORITY_LOW)
            builder.setOnlyAlertOnce(true)
            builder.setSilent(true)
        }

        NotificationManagerCompat.from(this)
            .notify(VOLUNTEER_NOTIFICATION_ID, builder.build())
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
