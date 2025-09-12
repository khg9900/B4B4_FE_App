package com.disasteraidplatform.websocket

import com.disasteraidplatform.util.Logger
import com.disasteraidplatform.auth.JwtManager
import kotlinx.coroutines.*

class WebSocketManager(private var locationUrl: String, private var trackingUrl: String) {

    val locationWS = LocationWebSocketClient(locationUrl)
    val trackingWS = TrackingWebSocketClient(trackingUrl)

    var volunteerId: String? = null
        private set

    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    fun connectAll(
        onTrackingEvent: ((TrackingWebSocketClient.TrackingEvent) -> Unit)? = null,
        onReady: (() -> Unit)? = null
    ) {
        trackingWS.onEvent = { event ->
            when (event) {
                is TrackingWebSocketClient.TrackingEvent.Ready -> {
                    volunteerId = event.volunteerId
                    Logger.d("WebSocketManager", "Tracking READY received, volunteerId=$volunteerId")
                    onReady?.invoke()
                }
                is TrackingWebSocketClient.TrackingEvent.Ended -> {
                    Logger.d("WebSocketManager", "Tracking ENDED received, clearing volunteerId")
                    volunteerId = null
                }
                else -> {}
            }
            onTrackingEvent?.invoke(event)
        }

        Logger.d("WebSocketManager", "Connecting Location & Tracking WebSocket")
        safeConnect()
    }

    private fun safeConnect() {
        scope.launch {
            ensureValidToken()
            locationWS.connect()
            trackingWS.connect()
        }
    }

    private suspend fun ensureValidToken() {
        val token = JwtManager.getToken()
        if (token == null || JwtManager.isAccessTokenExpired(token)) {
            Logger.d("WebSocketManager", "Access token expired or missing, refreshing...")
            val newToken = JwtManager.refreshTokenAsync()
            if (newToken != null) {
                Logger.d("WebSocketManager", "Token refreshed successfully")
                updateWebSocketUrls(newToken)
            } else {
                Logger.e("WebSocketManager", "Token refresh failed")
            }
        }
    }

    private fun updateWebSocketUrls(newToken: String) {
        locationUrl = locationUrl.substringBefore("?token=") + "?token=$newToken"
        trackingUrl = trackingUrl.substringBefore("?token=") + "?token=$newToken"

        locationWS.updateUrl(locationUrl)
        trackingWS.updateUrl(trackingUrl)
    }

    fun disconnectAll() {
        locationWS.disconnect()
        trackingWS.disconnect()
        Logger.d("WebSocketManager", "Disconnected Location & Tracking WebSocket")
        scope.cancel()
    }
}
