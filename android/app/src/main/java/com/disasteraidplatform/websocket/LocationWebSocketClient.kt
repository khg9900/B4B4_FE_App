package com.disasteraidplatform.websocket

import com.disasteraidplatform.util.Logger
import kotlinx.serialization.json.*
import okhttp3.*

class LocationWebSocketClient(private val url: String) {

    private var webSocket: WebSocket? = null
    private val client = OkHttpClient()
    private var reconnectHandler: Runnable? = null

    var volunteerId: String? = null
    var onReady: ((String) -> Unit)? = null
    var onStarted: (() -> Unit)? = null
    var onEnded: (() -> Unit)? = null

    var isConnected = false

    fun connect() {
        val request = Request.Builder().url(url).build()
        webSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(ws: WebSocket, response: Response) {
                isConnected = true
                Logger.d("LocationWS", "✅ 위치 WebSocket 연결됨")
            }

            override fun onMessage(ws: WebSocket, text: String) {
                Logger.d("LocationWS", "메시지 수신: $text")
                try {
                    val msg = Json.parseToJsonElement(text).jsonObject
                    val type = msg["type"]?.jsonPrimitive?.content
                    val data = msg["data"]

                    when (type) {
                        "READY" -> {
                            volunteerId = data?.jsonObject?.get("participantUserId")?.jsonPrimitive?.content
                            Logger.d("LocationWS", "volunteerId 저장됨: $volunteerId")
                            onReady?.invoke(volunteerId ?: "")
                        }
                        "STARTED" -> {
                            Logger.d("LocationWS", "▶️ 위치 전송 시작")
                            onStarted?.invoke()
                        }
                        "ENDED" -> {
                            Logger.d("LocationWS", "⏹️ 위치 전송 종료")
                            onEnded?.invoke()
                        }
                        else -> Logger.d("LocationWS", "알 수 없는 메시지 타입: $type")
                    }
                } catch (e: Exception) {
                    Logger.w("LocationWS", "메시지 파싱 오류", e)
                }
            }

            override fun onClosed(ws: WebSocket, code: Int, reason: String) {
                isConnected = false
                Logger.w("LocationWS", "WebSocket 종료: code=$code, reason=$reason")
                scheduleReconnect()
            }

            override fun onFailure(ws: WebSocket, t: Throwable, response: Response?) {
                isConnected = false
                Logger.e("LocationWS", "WebSocket 실패", t)
                scheduleReconnect()
            }
        })
    }

    private fun scheduleReconnect() {
        reconnectHandler?.let { return } // 이미 등록되어 있으면 중복 방지
        reconnectHandler = Runnable {
            Logger.d("LocationWS", "재연결 시도")
            connect()
            reconnectHandler = null
        }
        // 5초 후 재연결
        android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(reconnectHandler!!, 5000)
    }

    fun sendLocation(volunteerId: String, latitude: Double, longitude: Double) {
        val msg = buildJsonObject {
            put("type", "location_update")
            putJsonObject("data") {
                put("volunteerId", volunteerId)
                put("latitude", latitude)
                put("longitude", longitude)
            }
        }.toString()
        if (isConnected) webSocket?.send(msg)
        Logger.d("LocationWS", "위치 전송: lat=$latitude, lng=$longitude")
    }

    fun disconnect() {
        webSocket?.close(1000, "앱 종료")
        webSocket = null
        isConnected = false
        Logger.d("LocationWS", "WebSocket 연결 해제")
    }
}
