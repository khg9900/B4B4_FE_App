package com.disasteraidplatform.websocket

import com.disasteraidplatform.util.Logger
import kotlinx.serialization.json.*
import okhttp3.*

class TrackingWebSocketClient(private val url: String) {

    private var webSocket: WebSocket? = null
    private val client = OkHttpClient()
    private var reconnectHandler: Runnable? = null

    var volunteerId: String? = null
    var onReady: ((String) -> Unit)? = null
    var onStarted: (() -> Unit)? = null
    var onEnded: (() -> Unit)? = null
    var onTrackingResult: ((TrackingResult) -> Unit)? = null

    data class TrackingResult(val volunteerId: String, val present: Boolean)
    var isConnected = false

    fun connect() {
        val request = Request.Builder().url(url).build()
        webSocket = client.newWebSocket(request, object : WebSocketListener() {

            override fun onOpen(ws: WebSocket, response: Response) {
                isConnected = true
                Logger.d("TrackingWS", "✅ 출석 WebSocket 연결됨")
            }

            override fun onMessage(ws: WebSocket, text: String) {
                Logger.d("TrackingWS", "메시지 수신: $text")
                try {
                    val msg = Json.parseToJsonElement(text).jsonObject
                    val type = msg["type"]?.jsonPrimitive?.content
                    val data = msg["data"]

                    when (type) {
                        "READY" -> {
                            volunteerId = data?.jsonObject?.get("participantUserId")?.jsonPrimitive?.content
                            Logger.d("TrackingWS", "volunteerId 저장됨: $volunteerId")
                            onReady?.invoke(volunteerId ?: "")
                        }
                        "STARTED" -> { onStarted?.invoke() }
                        "ENDED" -> { onEnded?.invoke() }
                        "tracking_result" -> {
                            data?.jsonObject?.let { obj ->
                                val id = obj["volunteerId"]?.jsonPrimitive?.content ?: return
                                val present = obj["present"]?.jsonPrimitive?.boolean ?: false
                                onTrackingResult?.invoke(TrackingResult(id, present))
                            }
                        }
                        else -> Logger.d("TrackingWS", "알 수 없는 메시지 타입: $type")
                    }
                } catch (e: Exception) {
                    Logger.w("TrackingWS", "메시지 파싱 오류", e)
                }
            }

            override fun onClosed(ws: WebSocket, code: Int, reason: String) {
                isConnected = false
                Logger.w("TrackingWS", "WebSocket 종료: code=$code, reason=$reason")
                scheduleReconnect()
            }

            override fun onFailure(ws: WebSocket, t: Throwable, response: Response?) {
                isConnected = false
                Logger.e("TrackingWS", "WebSocket 실패", t)
                scheduleReconnect()
            }
        })
    }

    private fun scheduleReconnect() {
        reconnectHandler?.let { return }
        reconnectHandler = Runnable {
            Logger.d("TrackingWS", "재연결 시도")
            connect()
            reconnectHandler = null
        }
        android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(reconnectHandler!!, 5000)
    }

    fun sendTrackingUpdate(volunteerId: String, present: Boolean) {
        if (!isConnected) return
        val msg = buildJsonObject {
            put("type", "tracking_update")
            putJsonObject("data") {
                put("volunteerId", volunteerId)
                put("present", present)
            }
        }.toString()
        webSocket?.send(msg)
        Logger.d("TrackingWS", "출석 상태 전송: volunteerId=$volunteerId, present=$present")
    }

    fun disconnect() {
        webSocket?.close(1000, "앱 종료")
        webSocket = null
        isConnected = false
        Logger.d("TrackingWS", "WebSocket 연결 해제")
    }
}
