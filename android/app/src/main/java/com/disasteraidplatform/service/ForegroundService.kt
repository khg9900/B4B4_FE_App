package com.disasteraidplatform.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat
import com.disasteraidplatform.cache.LocationCache
import com.disasteraidplatform.location.LocationProvider
import com.disasteraidplatform.util.Logger
import com.disasteraidplatform.websocket.LocationWebSocketClient
import com.disasteraidplatform.websocket.TrackingWebSocketClient

class ForegroundService : Service() {

    companion object {
        private const val CHANNEL_ID = "foreground_service_channel"
        private const val NOTIFICATION_ID = 1
        private const val LOCATION_SEND_INTERVAL_MS = 30_000L
    }

    private var volunteerId: String? = null
    private var token: String? = null
    private val handler = Handler(Looper.getMainLooper())

    private var locationWS: LocationWebSocketClient? = null
    private var trackingWS: TrackingWebSocketClient? = null

    private lateinit var locationProvider: LocationProvider

    private val sendLocationRunnable = object : Runnable {
        override fun run() {
            val id = volunteerId
            val location = LocationCache.get()

            if (location == null) {
                Logger.w("ForegroundService", "캐시된 위치가 없습니다. 위치 전송 생략")
            } else {
                Logger.d("ForegroundService", "전송할 위치: 위도=${location.latitude}, 경도=${location.longitude}")
            }

            if (id != null && location != null) {
                locationWS?.sendLocation(id, location.latitude, location.longitude)
            } else {
                Logger.w("ForegroundService", "volunteerId 또는 위치 정보 없음, 위치 전송 생략")
            }
            handler.postDelayed(this, LOCATION_SEND_INTERVAL_MS)
        }
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildNotification())

        // 직접 위치 구독 시작 - 반드시 권한 확보 상태여야 함
        locationProvider = LocationProvider(this)
        locationProvider.startLocationUpdates()

        handler.post(sendLocationRunnable)
        Logger.d("ForegroundService", "서비스 시작, 위치 전송 주기 $LOCATION_SEND_INTERVAL_MS ms")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val isForeground = intent?.getBooleanExtra("isForeground", true) ?: true
        if (!isForeground) {
            stopForeground(true)
        }

        intent?.getStringExtra("volunteerId")?.let {
            volunteerId = it
            Logger.d("ForegroundService", "volunteerId=$volunteerId")
        }

        val newToken = intent?.getStringExtra("token")
        if (newToken != null && newToken != token) {
            token = newToken
            Logger.d("ForegroundService", "토큰 갱신, WebSocket 재연결 시도")
            reconnectWebSockets()
        }
        return START_STICKY
    }

    private fun reconnectWebSockets() {
        locationWS?.disconnect()
        trackingWS?.disconnect()

        if (token == null) {
            Logger.w("ForegroundService", "토큰이 없어 WebSocket 연결 안함")
            return
        }

        val locationUrl = "ws://192.168.25.177:8080/api/location-tracking?token=$token"
        val trackingUrl = "ws://192.168.25.177:8080/api/tracking?token=$token"

        locationWS = LocationWebSocketClient(locationUrl)
        trackingWS = TrackingWebSocketClient(trackingUrl)

        locationWS?.connect()
        trackingWS?.connect()
    }

    override fun onDestroy() {
        locationProvider.stopLocationUpdates()
        super.onDestroy()
        handler.removeCallbacks(sendLocationRunnable)
        locationWS?.disconnect()
        trackingWS?.disconnect()
        Logger.d("ForegroundService", "서비스 종료")
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Foreground Service Channel",
                NotificationManager.IMPORTANCE_DEFAULT
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Disaster Aid Platform")
            .setContentText("Location tracking is running")
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setOngoing(true)
            .build()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
