package com.disasteraidplatform.websocket

import android.os.Handler
import android.os.Looper
import com.disasteraidplatform.util.Logger
import kotlinx.serialization.json.*
import okhttp3.*
import java.util.concurrent.TimeUnit

class LocationWebSocketClient(private val url: String) {

    private var webSocket: WebSocket? = null
    private val client = OkHttpClient.Builder()
        .readTimeout(0, TimeUnit.MILLISECONDS) // WebSocket은 타임아웃 없음
        .build()

    private val handler = Handler(Looper.getMainLooper())
    private var reconnectAttempts = 0
    private val maxReconnectAttempts = 3
    private val reconnectDelayMillis = 5000L

    var volunteerId: String? = null
        private set

    var onReady: ((String) -> Unit)? = null
    var onStarted: (() -> Unit)? = null
    var onEnded: (() -> Unit)? = null

    var isConnected = false
        private set

    fun connect() {
        if (isConnected || webSocket != null) {
            Logger.d("LocationWS", "이미 연결 중이거나 연결됨")
            return
        }
        val request = Request.Builder().url(url).build()
        webSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(ws: WebSocket, response: Response) {
                isConnected = true
                reconnectAttempts = 0
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
                attemptReconnect()
            }

            override fun onFailure(ws: WebSocket, t: Throwable, response: Response?) {
                isConnected = false
                Logger.e("LocationWS", "WebSocket 실패", t)
                attemptReconnect()
            }
        })
        Logger.d("LocationWS", "연결 시도: $url")
    }

    private fun attemptReconnect() {
        if (reconnectAttempts >= maxReconnectAttempts) {
            Logger.w("LocationWS", "최대 재연결 시도 횟수 초과")
            return
        }
        reconnectAttempts++
        Logger.d("LocationWS", "재연결 시도 #$reconnectAttempts (딜레이 ${reconnectDelayMillis}ms)")
        handler.postDelayed({
            Logger.d("LocationWS", "재연결 시도 중...")
            connect()
        }, reconnectDelayMillis)
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
        if (isConnected) {
            val success = webSocket?.send(msg) ?: false
            if (success) {
                Logger.d("LocationWS", "위치 전송 성공: lat=$latitude, lng=$longitude")
            } else {
                Logger.w("LocationWS", "위치 전송 실패 (소켓 상태 확인 필요)")
            }
        } else {
            Logger.w("LocationWS", "연결 안 됨, 위치 전송 불가")
        }
    }

    fun disconnect() {
        isConnected = false
        webSocket?.close(1000, "앱 종료")
        webSocket = null
        Logger.d("LocationWS", "WebSocket 연결 해제")
    }
}
