package com.disasteraidplatform.websocket

import android.os.Handler
import android.os.Looper
import com.disasteraidplatform.util.Logger
import kotlinx.serialization.json.*
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

    var volunteerId: String? = null
    var onReady: ((String) -> Unit)? = null
    var onStarted: (() -> Unit)? = null
    var onEnded: (() -> Unit)? = null
    var onTrackingResult: ((TrackingResult) -> Unit)? = null

    data class TrackingResult(val volunteerId: String, val present: Boolean)

    fun setUrl(url: String) {
        socketUrl = url
    }

    fun connect() {
        if (isConnected || webSocket != null) {
            Logger.d("TrackingWS", "이미 연결 중이거나 연결됨")
            return
        }
        val request = Request.Builder().url(socketUrl).build()
        webSocket = client.newWebSocket(request, TrackingWebSocketListener())
        Logger.d("TrackingWS", "서버 연결 시도: $socketUrl")
    }

    fun disconnect() {
        isConnected = false
        webSocket?.close(1000, "Client disconnect")
        webSocket = null
        Logger.d("TrackingWS", "WebSocket 연결 해제")
    }

    fun sendTrackingUpdate(volunteerId: String, present: Boolean) {
        if (!isConnected) {
            Logger.w("TrackingWS", "연결 안 됨 → 메시지 전송 불가")
            return
        }
        val msg = buildJsonObject {
            put("type", "tracking_update")
            putJsonObject("data") {
                put("volunteerId", volunteerId)
                put("present", present)
            }
        }.toString()
        val success = webSocket?.send(msg) ?: false
        if (success) {
            Logger.d("TrackingWS", "출석 상태 전송: volunteerId=$volunteerId, present=$present")
        } else {
            Logger.w("TrackingWS", "출석 메시지 전송 실패")
        }
    }

    private fun attemptReconnect() {
        if (reconnectAttempts >= maxReconnectAttempts) {
            Logger.w("TrackingWS", "최대 재연결 횟수 초과 → 중단")
            return
        }
        reconnectAttempts++
        Logger.d("TrackingWS", "재연결 시도 #$reconnectAttempts (딜레이: $reconnectDelayMillis ms)")
        handler.postDelayed({
            Logger.d("TrackingWS", "재연결 실행")
            connect()
        }, reconnectDelayMillis)
    }

    private inner class TrackingWebSocketListener : WebSocketListener() {

        override fun onOpen(webSocket: WebSocket, response: Response) {
            Logger.d("TrackingWS", "✅ WebSocket 연결됨")
            isConnected = true
            reconnectAttempts = 0
        }

        override fun onMessage(webSocket: WebSocket, text: String) {
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
                    "STARTED" -> {
                        Logger.d("TrackingWS", "▶️ 출석 체크 시작")
                        onStarted?.invoke()
                    }
                    "ENDED" -> {
                        Logger.d("TrackingWS", "⏹️ 출석 체크 종료")
                        onEnded?.invoke()
                    }
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

        override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
            Logger.w("TrackingWS", "WebSocket 종료 중: code=$code, reason=$reason")
            isConnected = false
            this@TrackingWebSocketClient.webSocket = null
        }

        override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
            Logger.e("TrackingWS", "WebSocket 실패", t)
            isConnected = false
            this@TrackingWebSocketClient.webSocket = null
            attemptReconnect()
        }
    }
}
