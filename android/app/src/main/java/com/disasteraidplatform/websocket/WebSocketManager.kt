package com.disasteraidplatform.websocket

import com.disasteraidplatform.util.Logger
import com.disasteraidplatform.auth.JwtManager
import kotlinx.coroutines.*
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import java.util.concurrent.atomic.AtomicReference

class WebSocketManager(private var locationUrl: String, private var trackingUrl: String) {

    val locationWS = LocationWebSocketClient(locationUrl)
    val trackingWS = TrackingWebSocketClient(trackingUrl)

    // volunteerId를 atomic reference로 관리
    private val _volunteerId = AtomicReference<String?>(null)
    var volunteerId: String?
        get() = _volunteerId.get()
        private set(value) { _volunteerId.set(value) }

    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private val tokenRef = AtomicReference<String?>(null)
    private val mutex = Mutex()

    init {
        // 토큰 갱신 콜백 등록
        JwtManager.setOnTokenRefreshedCallback { newAccessToken, _ ->
            scope.launch { updateToken(newAccessToken) }
        }

        // 초기 토큰이 이미 있으면 WebSocket 바로 갱신
        JwtManager.getToken()?.let { existingToken ->
            scope.launch { updateToken(existingToken) }
        }

        // 초기 URL 업데이트
        locationWS.updateUrl(locationUrl)
        trackingWS.updateUrl(trackingUrl)
    }

    // --- 토큰 갱신 후 안전하게 재연결 ---
    suspend fun updateToken(newToken: String) {
        mutex.withLock {
            Logger.d("WebSocketManager", "updateToken 호출, 새로운 토큰 적용")
            tokenRef.set(newToken)
            updateWebSocketUrls(newToken)
            safeReconnect()
        }
    }

    // --- WebSocket 연결 ---
    fun connectAll(
        onTrackingEvent: ((TrackingWebSocketClient.TrackingEvent) -> Unit)? = null,
        onReady: (() -> Unit)? = null
    ) {
        trackingWS.onEvent = { event ->
            when (event) {
                is TrackingWebSocketClient.TrackingEvent.Ready -> {
                    // volunteerId 최초 세팅
                    _volunteerId.compareAndSet(null, event.volunteerId)
                    Logger.d("WebSocketManager", "Tracking READY received, volunteerId=${volunteerId}")
                    onReady?.invoke()
                }
                is TrackingWebSocketClient.TrackingEvent.Ended -> {
                    Logger.d("WebSocketManager", "Tracking ENDED received → 마지막 위치 전송 후 volunteerId 초기화")

                    // 마지막 위치 전송
                    val vid = _volunteerId.get()
                    if (vid != null) {
                        try {
                            val lastLoc = locationWS.getLastLocation() // LocationWebSocketClient에 last 위치 getter 추가 필요
                            if (lastLoc != null) {
                                locationWS.sendLocation(vid, lastLoc.first, lastLoc.second)
                            }
                        } catch (e: Exception) {
                            Logger.e("WebSocketManager", "ENDED 마지막 위치 전송 실패", e)
                        }
                    }

                    // volunteerId 초기화
                    _volunteerId.set(null)
                    trackingWS.volunteerId = null
                }
                else -> {}
            }
            onTrackingEvent?.invoke(event)
        }

        scope.launch {
            mutex.withLock {
                try {
                    ensureValidToken()
                    if (!locationWS.isConnected()) locationWS.connect()
                    if (!trackingWS.isConnected()) trackingWS.connect()
                    Logger.d("WebSocketManager", "WebSocket 연결 성공")
                } catch (e: Exception) {
                    Logger.e("WebSocketManager", "WebSocket 연결 실패", e)
                }
            }
        }
    }

    // --- 토큰 확인 & 필요 시 갱신 ---
    private suspend fun ensureValidToken() {
        val currentToken = JwtManager.getToken()
        if (currentToken == null || JwtManager.isAccessTokenExpired(currentToken)) {
            Logger.d("WebSocketManager", "Access token expired or missing, refreshing...")
            val newToken = JwtManager.refreshTokenAsync()
            if (newToken != null) {
                Logger.d("WebSocketManager", "Token refreshed successfully")
                tokenRef.set(newToken)
                updateWebSocketUrls(newToken)
            } else {
                Logger.e("WebSocketManager", "Token refresh failed, WebSocket 연결 불가")
                throw IllegalStateException("토큰 갱신 실패")
            }
        } else {
            tokenRef.set(currentToken)
            updateWebSocketUrls(currentToken)
        }
    }

    // --- 안전하게 재연결 ---
    private suspend fun safeReconnect() {
        val token = tokenRef.get() ?: return

        suspend fun reconnectLocationIfNeeded() {
            if (!locationWS.isConnected()) {
                Logger.d("WebSocketManager", "LocationWS 연결 안 되어 있음 → connect()")
                locationWS.connect()
                return
            }
            if (locationWS.token == token) {
                Logger.d("WebSocketManager", "LocationWS 동일 토큰 유지 중 → 재연결 안 함")
                return
            }

            Logger.d("WebSocketManager", "LocationWS 토큰 변경 감지 → 재연결 시작")
            locationWS.disconnect()
            delay(200)
            locationWS.reconnect(token)
        }

        suspend fun reconnectTrackingIfNeeded() {
            if (!trackingWS.isConnected()) {
                Logger.d("WebSocketManager", "TrackingWS 연결 안 되어 있음 → connect()")
                trackingWS.connect()
                return
            }
            if (trackingWS.token == token) {
                Logger.d("WebSocketManager", "TrackingWS 동일 토큰 유지 중 → 재연결 안 함")
                return
            }

            Logger.d("WebSocketManager", "TrackingWS 토큰 변경 감지 → 재연결 시작")
            trackingWS.disconnect()
            delay(200)
            trackingWS.reconnect(token)
        }

        reconnectLocationIfNeeded()
        reconnectTrackingIfNeeded()
    }

    // --- WebSocket URL 갱신 (URL만 업데이트, 재연결은 safeReconnect에서 처리) ---
    private fun updateWebSocketUrls(token: String) {
        locationUrl = locationUrl.substringBefore("?token=") + "?token=$token"
        trackingUrl = trackingUrl.substringBefore("?token=") + "?token=$token"

        locationWS.updateUrl(locationUrl)
        trackingWS.updateUrl(trackingUrl)
    }

    // --- WebSocket 종료 ---
    fun disconnectAll() {
        scope.launch {
            mutex.withLock {
                locationWS.disconnect()
                trackingWS.disconnect()
                Logger.d("WebSocketManager", "Disconnected Location & Tracking WebSocket")
            }
        }
    }
}
