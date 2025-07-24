package com.disasteraidplatform.websocket

import android.os.Handler
import android.os.Looper
import android.util.Log
import okhttp3.*
import java.util.concurrent.TimeUnit

class TrackingWebSocketClient(private var socketUrl: String) {
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
            Log.d("TrackingWebSocketClient", "Already connected or connecting")
            return
        }
        val request = Request.Builder().url(socketUrl).build()
        webSocket = client.newWebSocket(request, TrackingWebSocketListener())
        Log.d("TrackingWebSocketClient", "Connecting to $socketUrl")
    }

    fun disconnect() {
        isConnected = false
        webSocket?.close(1000, "Client disconnect")
        webSocket = null
        Log.d("TrackingWebSocketClient", "WebSocket disconnected")
    }

    fun sendMessage(message: String) {
        if (isConnected && webSocket != null) {
            val success = webSocket!!.send(message)
            if (!success) {
                Log.w("TrackingWebSocketClient", "Failed to send message, socket may be closing")
            }
        } else {
            Log.w("TrackingWebSocketClient", "WebSocket not connected, cannot send message")
        }
    }

    // Tracking용 메시지 전송 예시 (필요에 따라 수정)
    fun sendTrackingData(volunteerId: String, data: String) {
        val jsonMessage = """
            {
                "volunteerId": "$volunteerId",
                "data": "$data"
            }
        """.trimIndent()
        sendMessage(jsonMessage)
    }

    private fun attemptReconnect() {
        if (reconnectAttempts >= maxReconnectAttempts) {
            Log.w("TrackingWebSocketClient", "Max reconnect attempts reached")
            return
        }
        reconnectAttempts++
        Log.d("TrackingWebSocketClient", "Attempting reconnect #$reconnectAttempts in $reconnectDelayMillis ms")
        handler.postDelayed({
            Log.d("TrackingWebSocketClient", "Reconnecting...")
            connect()
        }, reconnectDelayMillis)
    }

    private inner class TrackingWebSocketListener : WebSocketListener() {
        override fun onOpen(webSocket: WebSocket, response: Response) {
            Log.d("TrackingWebSocketClient", "WebSocket opened")
            isConnected = true
            reconnectAttempts = 0
        }

        override fun onMessage(webSocket: WebSocket, text: String) {
            Log.d("TrackingWebSocketClient", "Received message: $text")
        }

        override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
            Log.d("TrackingWebSocketClient", "WebSocket closing: $code / $reason")
            isConnected = false
            webSocket.close(code, reason)
            this@TrackingWebSocketClient.webSocket = null
        }

        override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
            Log.e("TrackingWebSocketClient", "WebSocket failure", t)
            isConnected = false
            this@TrackingWebSocketClient.webSocket = null
            attemptReconnect()
        }
    }
}
