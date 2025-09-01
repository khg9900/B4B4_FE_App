package com.disasteraidplatform.websocket

import com.disasteraidplatform.util.Logger

class WebSocketManager(locationUrl: String, trackingUrl: String) {

    val locationWS = LocationWebSocketClient(locationUrl)
    val trackingWS = TrackingWebSocketClient(trackingUrl)

    var volunteerId: String? = null
        private set

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
                    // ENDED 시 volunteerId 삭제
                    volunteerId = null
                }
                else -> {}
            }

            // 항상 호출
            onTrackingEvent?.invoke(event)
        }

        Logger.d("WebSocketManager", "Connecting Location & Tracking WebSocket")
        locationWS.connect()
        trackingWS.connect()
    }

    fun disconnectAll() {
        locationWS.disconnect()
        trackingWS.disconnect()
        Logger.d("WebSocketManager", "Disconnected Location & Tracking WebSocket")
    }
}
