package com.disasteraidplatform.websocket

import android.os.Handler
import android.os.Looper
import android.util.Log
import com.google.gson.Gson
import okhttp3.*
import okhttp3.WebSocketListener
import java.util.concurrent.TimeUnit

data class LocationUpdateMessage(
    val type: String = "location_update",
    val data: LocationData
)

data class LocationData(
    val volunteerId: String,
    val latitude: Double,
    val longitude: Double
)

class WebSocketManager(private val url: String) {

    private val client: OkHttpClient = OkHttpClient.Builder()
        .readTimeout(0, TimeUnit.MILLISECONDS)
        .build()

    private var webSocket: WebSocket? = null
    private var isConnected = false
    private val gson = Gson()

    private var reconnectAttempts = 0
    private val maxReconnectAttempts = 3
    private val reconnectDelayMillis = 2000L

    private val handler = Handler(Looper.getMainLooper())

    // 서버에서 받은 volunteerId 저장
    var volunteerId: String? = null
        private set

    private val listener = object : WebSocketListener() {
        override fun onOpen(ws: WebSocket, response: Response) {
            Log.d("WebSocketManager", "✅ WebSocket opened")
            webSocket = ws
            isConnected = true
            reconnectAttempts = 0
        }

        override fun onMessage(ws: WebSocket, text: String) {
            Log.d("WebSocketManager", "📩 Received message: $text")
            try {
                val wrapper = gson.fromJson(text, MessageWrapper::class.java)
                if (wrapper.type == "volunteer_info") {
                    volunteerId = wrapper.data?.volunteerId
                    Log.d("WebSocketManager", "✅ volunteerId updated: $volunteerId")
                }
                // 필요시 다른 메시지 타입도 처리 가능
            } catch (e: Exception) {
                Log.e("WebSocketManager", "Error parsing message", e)
            }
        }

        override fun onClosing(ws: WebSocket, code: Int, reason: String) {
            Log.d("WebSocketManager", "🔌 Closing WebSocket: $code / $reason")
            isConnected = false
            ws.close(code, reason)
            webSocket = null
        }

        override fun onFailure(ws: WebSocket, t: Throwable, response: Response?) {
            Log.e("WebSocketManager", "❌ WebSocket failure", t)
            isConnected = false
            webSocket = null
            attemptReconnect()
        }
    }

    fun connect() {
        if (isConnected || webSocket != null) {
            Log.d("WebSocketManager", "Already connected or connecting")
            return
        }
        val request = Request.Builder()
            .url(url)
            .build()
        webSocket = client.newWebSocket(request, listener)
        Log.d("WebSocketManager", "🔗 Connecting to $url")
    }

    fun sendLocation(latitude: Double, longitude: Double) {
        val id = volunteerId
        if (isConnected && webSocket != null && id != null) {
            val message = LocationUpdateMessage(
                data = LocationData(id, latitude, longitude)
            )
            val jsonMsg = gson.toJson(message)
            val success = webSocket!!.send(jsonMsg)
            if (success) {
                Log.d("WebSocketManager", "📡 Sent location: $jsonMsg")
            } else {
                Log.w("WebSocketManager", "⚠️ Failed to send message, socket may be closing")
            }
        } else {
            Log.w("WebSocketManager", "⚠️ WebSocket not open or volunteerId missing; cannot send location")
        }
    }

    fun disconnect() {
        isConnected = false
        webSocket?.close(1000, "Client disconnect")
        webSocket = null
        Log.d("WebSocketManager", "🔌 WebSocket disconnected")
    }

    private fun attemptReconnect() {
        if (reconnectAttempts >= maxReconnectAttempts) {
            Log.w("WebSocketManager", "❌ Max reconnect attempts reached")
            return
        }
        reconnectAttempts++
        Log.d("WebSocketManager", "🔄 Attempting reconnect #$reconnectAttempts in $reconnectDelayMillis ms")
        handler.postDelayed({
            Log.d("WebSocketManager", "🔗 Reconnecting...")
            connect()
        }, reconnectDelayMillis)
    }

    // 메시지 래퍼 데이터 클래스
    data class MessageWrapper(
        val type: String,
        val data: VolunteerInfoData?
    )

    data class VolunteerInfoData(
        val volunteerId: String?
    )
}
