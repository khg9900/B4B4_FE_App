package com.disasteraidplatform.websocket

import com.disasteraidplatform.util.Logger
import kotlinx.serialization.json.*
import okhttp3.*

class TrackingWebSocketClient(var url: String) {

    sealed class TrackingEvent {
        data class Ready(val volunteerId: String) : TrackingEvent()
        object Started : TrackingEvent()
        object Ended : TrackingEvent()
        object Unknown : TrackingEvent()
    }

    var volunteerId: String? = null
    var onEvent: ((TrackingEvent) -> Unit)? = null

    private var webSocket: WebSocket? = null
    private val client = OkHttpClient()
    private var connected = false

    // ✅ 토큰 필드 추가
    var token: String? = null
        private set

    fun connect() {
        val request = Request.Builder().url(url).build()
        webSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(ws: WebSocket, response: Response) {
                connected = true
                Logger.d("TrackingWS", "✅ Connected")
            }

            override fun onMessage(ws: WebSocket, text: String) {
                try {
                    val msg = Json.parseToJsonElement(text).jsonObject
                    val type = msg["type"]?.jsonPrimitive?.content
                    val data = msg["data"]

                    when (type) {
                        "READY" -> {
                            volunteerId = data?.jsonObject?.get("participantUserId")?.jsonPrimitive?.content
                            onEvent?.invoke(TrackingEvent.Ready(volunteerId ?: ""))
                        }
                        "STARTED" -> onEvent?.invoke(TrackingEvent.Started)
                        "ENDED" -> onEvent?.invoke(TrackingEvent.Ended)
                        else -> onEvent?.invoke(TrackingEvent.Unknown)
                    }
                } catch (e: Exception) {
                    Logger.w("TrackingWS", "Parse error", e)
                }
            }

            override fun onClosed(ws: WebSocket, code: Int, reason: String) {
                connected = false
            }

            override fun onFailure(ws: WebSocket, t: Throwable, response: Response?) {
                connected = false
                Logger.e("TrackingWS", "WebSocket 실패", t)
            }
        })
    }

    fun isConnected(): Boolean = connected

    // ✅ 토큰 갱신 시 재연결
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

    fun disconnect() {
        webSocket?.close(1000, "Closing")
        webSocket = null
        connected = false
    }
}
