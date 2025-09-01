package com.disasteraidplatform.websocket

import com.disasteraidplatform.util.Logger
import kotlinx.serialization.json.*
import okhttp3.*

class LocationWebSocketClient(private val url: String) {

    var volunteerId: String? = null
    private var webSocket: WebSocket? = null
    private val client = OkHttpClient()
    private var isConnected = false

    fun connect() {
        val request = Request.Builder().url(url).build()
        webSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(ws: WebSocket, response: Response) {
                isConnected = true
                Logger.d("LocationWS", "✅ Connected")
            }

            override fun onFailure(ws: WebSocket, t: Throwable, response: Response?) {
                isConnected = false
                Logger.e("LocationWS", "WebSocket 실패", t)
            }

            override fun onClosed(ws: WebSocket, code: Int, reason: String) {
                isConnected = false
            }
        })
    }

    fun sendLocation(volunteerId: String, lat: Double, lng: Double) {
        if (!isConnected) {
            Logger.w("LocationWS", "Send failed: WebSocket not connected")
            return
        }

        val msg = buildJsonObject {
            put("type", "location_update")
            putJsonObject("data") {
                put("volunteerId", volunteerId)
                put("latitude", lat)
                put("longitude", lng)
            }
        }.toString()

        webSocket?.send(msg)
    }

    fun disconnect() {
        webSocket?.close(1000, "Closing")
        webSocket = null
        isConnected = false
    }
}
