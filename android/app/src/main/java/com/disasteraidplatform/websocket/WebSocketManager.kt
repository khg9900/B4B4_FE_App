package com.disasteraidplatform.websocket

import com.disasteraidplatform.util.Logger

class WebSocketManager(
    private val locationUrl: String,
    private val trackingUrl: String
) {
    val locationWS = LocationWebSocketClient(locationUrl)
    val trackingWS = TrackingWebSocketClient(trackingUrl)
    var volunteerId: String? = null
        private set

    fun connectAll(
        onLocationReady: ((String) -> Unit)? = null,
        onLocationStarted: (() -> Unit)? = null,
        onLocationEnded: (() -> Unit)? = null,
        onTrackingReady: ((String) -> Unit)? = null,
        onTrackingStarted: (() -> Unit)? = null,
        onTrackingEnded: (() -> Unit)? = null
    ) {
        // Location WebSocket 콜백 연결
        locationWS.onReady = { id ->
            volunteerId = id
            onLocationReady?.invoke(id)
        }
        locationWS.onStarted = { onLocationStarted?.invoke() }
        locationWS.onEnded = { onLocationEnded?.invoke() }

        // Tracking WebSocket 콜백 연결
        trackingWS.onReady = { id ->
            volunteerId = id
            onTrackingReady?.invoke(id)
        }
        trackingWS.onStarted = { onTrackingStarted?.invoke() }
        trackingWS.onEnded = { onTrackingEnded?.invoke() }

        Logger.d("WebSocketManager", "🔗 Location 및 Tracking WebSocket 연결 시작")
        locationWS.connect()
        trackingWS.connect()
    }

    fun disconnectAll() {
        locationWS.disconnect()
        trackingWS.disconnect()
        Logger.d("WebSocketManager", "🔌 Location 및 Tracking WebSocket 연결 해제")
    }

    fun sendLocation(lat: Double, lng: Double) {
        volunteerId?.let { locationWS.sendLocation(it, lat, lng) }
            ?: Logger.w("WebSocketManager", "⚠️ volunteerId가 없어서 위치 전송 불가")
    }

    fun sendTrackingUpdate(volunteerId: String, present: Boolean) {
        trackingWS.sendTrackingUpdate(volunteerId, present)
    }
}
