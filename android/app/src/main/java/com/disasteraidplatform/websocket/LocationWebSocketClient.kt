package com.disasteraidplatform.websocket

import com.disasteraidplatform.util.Logger
import kotlinx.serialization.json.*
import okhttp3.*

class LocationWebSocketClient(var url: String) {

    private var webSocket: WebSocket? = null
    private val client = OkHttpClient()
    private var connected = false

    var token: String? = null
        private set

    // --- 마지막 위치 저장 ---
    private var lastLocation: Pair<Double, Double>? = null
    fun getLastLocation(): Pair<Double, Double>? = lastLocation

    fun connect() {
        val request = Request.Builder().url(url).build()
        webSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(ws: WebSocket, response: Response) {
                connected = true
            }

            override fun onFailure(ws: WebSocket, t: Throwable, response: Response?) {
                connected = false
                Logger.e("LocationWS", "WebSocket 실패", t)
            }

            override fun onClosed(ws: WebSocket, code: Int, reason: String) {
                connected = false
            }
        })
    }

    fun isConnected(): Boolean = connected

    fun reconnect(newToken: String) {
        token = newToken
        url = url.substringBefore("?token=") + "?token=$newToken"
        disconnect()
        connect()
    }

    fun updateUrl(newUrl: String) {
        url = newUrl
        disconnect()
        connect()
    }

    fun sendLocation(volunteerId: String, lat: Double, lng: Double) {
        if (!connected) {
            Logger.w("LocationWS", "Send failed: WebSocket not connected")
            return
        }

        // --- 마지막 위치 저장 ---
        lastLocation = Pair(lat, lng)

        val msg = buildJsonObject {
            put("type", "location_update")
            putJsonObject("data") {
                put("volunteerId", volunteerId.toLong())
                put("latitude", lat)
                put("longitude", lng)
            }
        }.toString()

        webSocket?.send(msg)
    }

    fun disconnect() {
        webSocket?.close(1000, "Closing")
        webSocket = null
        connected = false
    }
}
