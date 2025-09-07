package com.disasteraidplatform.auth

import android.util.Base64
import com.disasteraidplatform.network.BackendApi
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.runBlocking
import java.nio.charset.StandardCharsets

object JwtManager {
    private var accessToken: String? = null
    private var refreshToken: String? = null

    private val gson = Gson()

    fun setToken(token: String) { accessToken = token }
    fun getToken(): String? = accessToken

    fun setRefreshToken(token: String) { refreshToken = token }
    fun getRefreshToken(): String? = refreshToken

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

    fun refreshTokenSync(): String? {
        val currentRefresh = refreshToken ?: return null
        return try {
            val body = BackendApi.createJsonRequestBody(mapOf("refreshToken" to currentRefresh))
            val resp = BackendApi.requestSync("/auth/reissue", "POST", body)
            if (resp.isSuccessful) {
                val json = resp.body?.string()
                val type = object : TypeToken<Map<String, String>>() {}.type
                val map: Map<String, String> = gson.fromJson(json, type)
                val newAccess = map["accessToken"]
                val newRefresh = map["refreshToken"]

                if (!newAccess.isNullOrEmpty()) accessToken = newAccess
                if (!newRefresh.isNullOrEmpty()) refreshToken = newRefresh
                newAccess
            } else null
        } catch (e: Exception) {
            null
        }
    }

    suspend fun refreshTokenAsync(): String? {
        return runBlocking { refreshTokenSync() }
    }
}
