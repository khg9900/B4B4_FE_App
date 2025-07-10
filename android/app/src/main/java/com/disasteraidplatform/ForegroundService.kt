package com.disasteraidplatform

import android.app.*
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.disasteraidplatform.auth.JwtManager
import com.disasteraidplatform.LocationSenderService
import com.disasteraidplatform.TrackingService

class ForegroundService : Service() {

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        createNotificationChannel()
        startForeground(1, createNotification())

        // 위치 추적 서비스 시작 (액션 명시)
        val trackingIntent = Intent(this, TrackingService::class.java)
        trackingIntent.action = "START_TRACKING"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(trackingIntent)
        } else {
            startService(trackingIntent)
        }

        // 로그인 상태 확인 후 위치 전송 서비스 시작
        val jwt = JwtManager.getToken()
        if (jwt != null) {
            val senderIntent = Intent(this, LocationSenderService::class.java)
            senderIntent.action = "START_SENDER"
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(senderIntent)
            } else {
                startService(senderIntent)
            }
        }

        return START_STICKY
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                "foreground_channel",
                "Foreground Location",
                NotificationManager.IMPORTANCE_HIGH
            )
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    private fun createNotification(): Notification {
        val notificationIntent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, notificationIntent,
            PendingIntent.FLAG_MUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, "foreground_channel")
            .setContentTitle("위치 서비스 실행 중")
            .setContentText("위치를 추적 및 전송 중입니다.")
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setContentIntent(pendingIntent)
            .build()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
