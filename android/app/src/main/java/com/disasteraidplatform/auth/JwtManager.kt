package com.disasteraidplatform.auth

import android.util.Base64
import com.disasteraidplatform.network.BackendApi
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.nio.charset.StandardCharsets

object JwtManager {
    private var accessToken: String? = null
    private var refreshToken: String? = null
    private val gson = Gson()

    // --- 토큰 갱신 콜백 ---
    private var tokenRefreshedCallback: ((newAccessToken: String, newRefreshToken: String) -> Unit)? = null
    fun setOnTokenRefreshedCallback(callback: (String, String) -> Unit) {
        tokenRefreshedCallback = callback
    }

    // --- 서버 공통 응답 DTO ---
    data class ApiResponse<T>(
        val isSuccess: Boolean,
        val code: String,
        val message: String,
        val payload: T?
    )

    data class TokenPayload(
        val accessToken: String,
        val refreshToken: String
    )

    // --- 토큰 접근 / 저장 ---
    fun setToken(token: String) { accessToken = token }
    fun getToken(): String? = accessToken
    fun setRefreshToken(token: String) { refreshToken = token }
    fun getRefreshToken(): String? = refreshToken


     fun saveToken(newAccessToken: String?, newRefreshToken: String?) {
        var changed = false
        if (!newAccessToken.isNullOrEmpty()) {
            accessToken = newAccessToken
            changed = true
        }
        if (!newRefreshToken.isNullOrEmpty()) {
            refreshToken = newRefreshToken
            changed = true
        }
        // --- 토큰 갱신 콜백 호출 ---
        if (changed && accessToken != null && refreshToken != null) {
            tokenRefreshedCallback?.invoke(accessToken!!, refreshToken!!)
        }
    }

    // --- 토큰 만료 확인 ---
    fun isAccessTokenExpired(token: String? = accessToken): Boolean {
        if (token.isNullOrEmpty()) return true
        return try {
            val parts = token.split(".")
            if (parts.size != 3) return true
            val payload = String(Base64.decode(parts[1], Base64.URL_SAFE), StandardCharsets.UTF_8)
            val type = object : TypeToken<Map<String, Any>>() {}.type
            val map: Map<String, Any> = gson.fromJson(payload, type)
            val exp = (map["exp"] as? Double)?.toLong() ?: return true
            val nowSec = System.currentTimeMillis() / 1000
            nowSec >= exp
        } catch (e: Exception) {
            true
        }
    }

    // --- 동기 토큰 재발급 ---
    fun refreshTokenSync(): String? {
        val currentRefresh = refreshToken ?: return null
        return try {
            val body = BackendApi.createJsonRequestBody(mapOf("refreshToken" to currentRefresh))
            val resp = BackendApi.requestSync("/auth/reissue", "POST", body, includeAuth = false)
            if (resp.isSuccessful) {
                val json = resp.body?.string()
                val type = object : TypeToken<ApiResponse<TokenPayload>>() {}.type
                val apiResponse: ApiResponse<TokenPayload> = gson.fromJson(json, type)

                val newAccess = apiResponse.payload?.accessToken
                val newRefresh = apiResponse.payload?.refreshToken

                if (!newAccess.isNullOrEmpty() && !newRefresh.isNullOrEmpty()) {
                    saveToken(newAccess, newRefresh)
                }
                newAccess
            } else {
                null
            }
        } catch (e: Exception) {
            android.util.Log.e("JwtManager", "Exception during token refresh", e)
            null
        }
    }

    // --- 토큰 만료 시간(ms 단위) ---
    fun getExpirationTime(token: String? = accessToken): Long {
        if (token.isNullOrEmpty()) return 0L
        return try {
            val parts = token.split(".")
            if (parts.size != 3) return 0L
            val payload = String(Base64.decode(parts[1], Base64.URL_SAFE), StandardCharsets.UTF_8)
            val type = object : TypeToken<Map<String, Any>>() {}.type
            val map: Map<String, Any> = gson.fromJson(payload, type)
            val exp = (map["exp"] as? Double)?.toLong() ?: return 0L
            exp * 1000
        } catch (e: Exception) {
            0L
        }
    }

    // --- 비동기 토큰 재발급 ---
    suspend fun refreshTokenAsync(): String? = withContext(Dispatchers.IO) {
        refreshTokenSync()
    }
}
