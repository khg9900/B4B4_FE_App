package com.disasteraidplatform.service

import android.app.*
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.disasteraidplatform.cache.LocationCache
import com.disasteraidplatform.network.BackendApi
import com.disasteraidplatform.util.Logger
import kotlinx.coroutines.*

class LocationSenderService : Service() {

    companion object {
        private const val CHANNEL_ID = "location_sender_service_channel"
        private const val NOTIFICATION_ID = 3
        private const val LOCATION_SEND_INTERVAL_MS = 30_000L
    }

    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var sendingJob: Job? = null
    private lateinit var regionSender: RegionSender

    override fun onCreate() {
        super.onCreate()
        regionSender = RegionSender(this)
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildNotification())
        Logger.d("LocationSenderService", "Service created")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (sendingJob?.isActive != true) {
            startSendingLoop()
        }
        return START_STICKY
    }

    private fun startSendingLoop() {
        sendingJob = scope.launch {
            while (isActive) {
                val location = LocationCache.get()
                if (location != null) {
                    try {
                        val region = regionSender.fetchRegion(location.longitude, location.latitude)
                        if (region != null) {
                            val response = BackendApi.requestSync(
                                url = "/location/region",
                                method = "POST",
                                body = BackendApi.createJsonRequestBody(region)
                            )
                            if (response.isSuccessful) {
                                Logger.d("LocationSenderService", "Region sent successfully: $region")
                                LocationCache.clear()
                            } else {
                                Logger.e("LocationSenderService", "Failed to send region: ${response.code}")
                            }
                        }
                    } catch (e: Exception) {
                        Logger.e("LocationSenderService", "Error sending region", e)
                    }
                } else {
                    Logger.w("LocationSenderService", "No cached location available")
                }
                delay(LOCATION_SEND_INTERVAL_MS)
            }
        }
    }

    override fun onDestroy() {
        sendingJob?.cancel()
        scope.cancel()
        Logger.d("LocationSenderService", "Service destroyed")
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Location Sender Service Channel",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Disaster Aid Platform")
            .setContentText("Sending location data...")
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setOngoing(true)
            .build()
    }
}
