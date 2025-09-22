package com.disasteraidplatform.websocket

import com.disasteraidplatform.util.Logger
import kotlinx.serialization.json.*
import okhttp3.*

class TrackingWebSocketClient(private var url: String) {

    sealed class TrackingEvent {
        data class Ready(val volunteerId: String, val postId: Long, val teamId: Long, val state: String) : TrackingEvent()
        data class Started(val volunteerId: String, val postId: Long, val teamId: Long) : TrackingEvent()
        data class Ended(val volunteerId: String, val postId: Long, val teamId: Long) : TrackingEvent()
        object Unknown : TrackingEvent()
    }

    var volunteerId: String? = null
    var lastReadyData: TrackingEvent.Ready? = null
    var onEvent: ((TrackingEvent) -> Unit)? = null
    var onRawMessage: ((String) -> Unit)? = null
    private var webSocket: WebSocket? = null
    private val client = OkHttpClient()
    var token: String? = null
        private set
    private var connected = false

    fun connect() {
        val request = Request.Builder().url(url).build()
        webSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(ws: WebSocket, response: Response) { connected = true }

            override fun onMessage(ws: WebSocket, text: String) {
                try {
                    val msg = Json.parseToJsonElement(text).jsonObject
                    val type = msg["type"]?.jsonPrimitive?.content
                    val data = msg["data"]?.jsonObject

                    when (type) {
                        "READY" -> {
                            val vid = data?.get("participantUserId")?.jsonPrimitive?.content ?: ""
                            val postId = data?.get("postId")?.jsonPrimitive?.long ?: 0L
                            val teamId = data?.get("teamId")?.jsonPrimitive?.long ?: 0L
                            val state = data?.get("state")?.jsonPrimitive?.content ?: "READY"

                            lastReadyData = TrackingEvent.Ready(vid, postId, teamId, state)
                            volunteerId = vid
                            onEvent?.invoke(lastReadyData!!)
                        }
                        "STARTED" -> {
                            lastReadyData?.let {
                                onEvent?.invoke(TrackingEvent.Started(it.volunteerId, it.postId, it.teamId))
                            }
                        }
                        "ENDED" -> {
                            lastReadyData?.let {
                                onEvent?.invoke(TrackingEvent.Ended(it.volunteerId, it.postId, it.teamId))
                            }
                            lastReadyData = null
                        }
                        else -> onEvent?.invoke(TrackingEvent.Unknown)
                    }

                    // 서버 notify 메시지도 전달
                    onRawMessage?.invoke(text)

                } catch (e: Exception) {
                    Logger.w("TrackingWS", "Parse error", e)
                }
            }

            override fun onClosed(ws: WebSocket, code: Int, reason: String) { connected = false }
            override fun onFailure(ws: WebSocket, t: Throwable, response: Response?) { connected = false }
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

    fun disconnect() {
        webSocket?.close(1000, "Closing")
        webSocket = null
        connected = false
    }
}
