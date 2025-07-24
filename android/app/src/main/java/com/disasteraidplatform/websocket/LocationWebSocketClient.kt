package com.disasteraidplatform.websocket

import android.os.Handler
import android.os.Looper
import android.util.Log
import okhttp3.*
import java.util.concurrent.TimeUnit

class LocationWebSocketClient(private var socketUrl: String) {
    private var webSocket: WebSocket? = null
    private val client = OkHttpClient.Builder()
        .readTimeout(0, TimeUnit.MILLISECONDS)
        .build()

    private var isConnected = false
    private var reconnectAttempts = 0
    private val maxReconnectAttempts = 3
    private val reconnectDelayMillis = 2000L
    private val handler = Handler(Looper.getMainLooper())

    fun setUrl(url: String) {
        socketUrl = url
    }

    fun connect() {
        if (isConnected || webSocket != null) {
            Log.d("LocationWebSocketClient", "Already connected or connecting")
            return
        }
        val request = Request.Builder().url(socketUrl).build()
        webSocket = client.newWebSocket(request, LocationWebSocketListener())
        Log.d("LocationWebSocketClient", "Connecting to $socketUrl")
    }

    fun disconnect() {
        isConnected = false
        webSocket?.close(1000, "Client disconnect")
        webSocket = null
        Log.d("LocationWebSocketClient", "WebSocket disconnected")
    }

    fun sendMessage(message: String) {
        if (isConnected && webSocket != null) {
            val success = webSocket!!.send(message)
            if (!success) {
                Log.w("LocationWebSocketClient", "Failed to send message, socket may be closing")
            }
        } else {
            Log.w("LocationWebSocketClient", "WebSocket not connected, cannot send message")
        }
    }

    fun sendLocation(volunteerId: String, latitude: Double, longitude: Double) {
        val jsonMessage = """
            {
                "volunteerId": "$volunteerId",
                "latitude": $latitude,
                "longitude": $longitude
            }
        """.trimIndent()
        sendMessage(jsonMessage)
    }

    private fun attemptReconnect() {
        if (reconnectAttempts >= maxReconnectAttempts) {
            Log.w("LocationWebSocketClient", "Max reconnect attempts reached")
            return
        }
        reconnectAttempts++
        Log.d("LocationWebSocketClient", "Attempting reconnect #$reconnectAttempts in $reconnectDelayMillis ms")
        handler.postDelayed({
            Log.d("LocationWebSocketClient", "Reconnecting...")
            connect()
        }, reconnectDelayMillis)
    }

    private inner class LocationWebSocketListener : WebSocketListener() {
        override fun onOpen(webSocket: WebSocket, response: Response) {
            Log.d("LocationWebSocketClient", "WebSocket opened")
            isConnected = true
            reconnectAttempts = 0
        }

        override fun onMessage(webSocket: WebSocket, text: String) {
            Log.d("LocationWebSocketClient", "Received message: $text")
        }

        override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
            Log.d("LocationWebSocketClient", "WebSocket closing: $code / $reason")
            isConnected = false
            webSocket.close(code, reason)
            this@LocationWebSocketClient.webSocket = null
        }

        override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
            Log.e("LocationWebSocketClient", "WebSocket failure", t)
            isConnected = false
            this@LocationWebSocketClient.webSocket = null
            attemptReconnect()
        }
    }
}
