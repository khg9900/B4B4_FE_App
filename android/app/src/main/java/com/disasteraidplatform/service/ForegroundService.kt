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
import com.disasteraidplatform.cache.LocationCache
import com.disasteraidplatform.location.LocationProvider
import com.disasteraidplatform.util.Logger
import com.disasteraidplatform.websocket.WebSocketManager
import com.disasteraidplatform.auth.JwtManager

class ForegroundService : Service() {

    companion object {
        private const val CHANNEL_ID = "foreground_service_channel"
        private const val NOTIFICATION_ID = 1
        private const val LOCATION_SEND_INTERVAL_MS = 30_000L
    }

    private val handler = Handler(Looper.getMainLooper())
    private lateinit var locationProvider: LocationProvider
    private var wsManager: WebSocketManager? = null
    private var isLocationSending = false

    private val sendLocationRunnable = object : Runnable {
        override fun run() {
            val location = LocationCache.get()
            if (location != null && isLocationSending) {
                wsManager?.sendLocation(location.latitude, location.longitude)
                Logger.d("ForegroundService", "위치 전송: lat=${location.latitude}, lng=${location.longitude}")
            } else if (location == null) {
                Logger.w("ForegroundService", "캐시된 위치 없음, 전송 생략")
            }
            handler.postDelayed(this, LOCATION_SEND_INTERVAL_MS)
        }
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildNotification())

        locationProvider = LocationProvider(this)
        locationProvider.startLocationUpdates()

        handler.post(sendLocationRunnable)
        Logger.d("ForegroundService", "서비스 시작, 위치 전송 주기 $LOCATION_SEND_INTERVAL_MS ms")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val token = JwtManager.getToken()

        if (token.isNullOrEmpty()) {
            Logger.w("ForegroundService", "토큰 없음, WebSocket 연결 안함")
        } else {
            val locationUrl = "ws://192.168.25.177:8080/api/location-tracking?token=$token"
            val trackingUrl = "ws://192.168.25.177:8080/api/tracking?token=$token"

            wsManager = WebSocketManager(locationUrl, trackingUrl)
            wsManager?.connectAll(
                onLocationReady = { id -> Logger.d("ForegroundService", "Location READY: $id") },
                onLocationStarted = {
                    Logger.d("ForegroundService", "Location STARTED")
                    isLocationSending = true
                },
                onLocationEnded = {
                    Logger.d("ForegroundService", "Location ENDED")
                    isLocationSending = false
                },
                onTrackingReady = { id -> Logger.d("ForegroundService", "Tracking READY: $id") },
                onTrackingStarted = {
                    Logger.d("ForegroundService", "Tracking STARTED")
                    isLocationSending = true
                },
                onTrackingEnded = {
                    Logger.d("ForegroundService", "Tracking ENDED")
                    isLocationSending = false
                }
            )
            Logger.d("ForegroundService", "WebSocket 연결 시도 중")
        }

        return START_STICKY
    }

    override fun onDestroy() {
        locationProvider.stopLocationUpdates()
        handler.removeCallbacks(sendLocationRunnable)
        wsManager?.disconnectAll()
        Logger.d("ForegroundService", "서비스 종료")
        super.onDestroy()
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
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, CHANNEL_ID)
                .setContentTitle("Disaster Aid Platform")
                .setContentText("Location tracking is running")
                .setSmallIcon(android.R.drawable.ic_menu_mylocation)
                .setOngoing(true)
                .build()
        } else {
            Notification.Builder(this)
                .setContentTitle("Disaster Aid Platform")
                .setContentText("Location tracking is running")
                .setSmallIcon(android.R.drawable.ic_menu_mylocation)
                .setOngoing(true)
                .build()
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
