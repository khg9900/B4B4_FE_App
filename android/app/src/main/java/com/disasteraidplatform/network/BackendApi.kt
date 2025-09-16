package com.disasteraidplatform.network

import com.disasteraidplatform.auth.JwtManager
import okhttp3.*
import android.util.Log
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import com.google.gson.Gson
import com.google.gson.annotations.SerializedName
import java.io.IOException

object BackendApi {
    private const val TAG = "BackendApi"
    private const val BASE_URL = "http://192.168.1.100:8080/api"

    private val client = OkHttpClient()
    private val gson = Gson()

    // --- 서버 공통 응답 DTO ---
    data class ApiResponse<T>(
        @SerializedName("isSuccess") val isSuccess: Boolean,
        @SerializedName("code") val code: String,
        @SerializedName("message") val message: String,
        @SerializedName("payload") val payload: T?
    )

    data class TokenResponseDto(
        @SerializedName("accessToken") val accessToken: String,
        @SerializedName("refreshToken") val refreshToken: String
    )

    // --- JSON RequestBody 생성 ---
    fun createJsonRequestBody(data: Any): RequestBody {
        val json = gson.toJson(data)
        return json.toRequestBody("application/json; charset=utf-8".toMediaType())
    }

    // --- Request 빌드 ---
    private fun buildRequest(
        url: String,
        method: String = "GET",
        body: RequestBody? = null,
        includeAuth: Boolean = true
    ): Request {
        val builder = Request.Builder().url("$BASE_URL$url")
        if (includeAuth) {
            JwtManager.getToken()?.let { builder.addHeader("Authorization", "Bearer $it") }
        }

        when (method.uppercase()) {
            "POST" -> builder.post(body ?: FormBody.Builder().build())
            "PUT" -> builder.put(body ?: FormBody.Builder().build())
            "DELETE" -> builder.delete(body)
            else -> builder.get()
        }

        return builder.build()
    }

    // --- 동기 요청 ---
    @Throws(IOException::class)
    fun requestSync(
        url: String,
        method: String = "GET",
        body: RequestBody? = null,
        includeAuth: Boolean = true
    ): Response {
        val request = buildRequest(url, method, body, includeAuth)
        Log.d(TAG, "Sync Request: ${request.method} $url")
        return client.newCall(request).execute()
    }

    // --- 비동기 요청 ---
    fun requestAsync(
        url: String,
        method: String = "GET",
        body: RequestBody? = null,
        includeAuth: Boolean = true,
        callback: Callback
    ) {
        val request = buildRequest(url, method, body, includeAuth)
        Log.d(TAG, "Async Request: ${request.method} $url")
        client.newCall(request).enqueue(callback)
    }

    // --- 동기 요청 + 401 시 토큰 재발급 & 재시도 ---
    @Throws(IOException::class)
    fun requestSyncWithRefresh(
        url: String,
        method: String = "POST",
        body: RequestBody? = null
    ): Response {
        // 1️⃣ 원래 요청 (access token 포함)
        var request = buildRequest(url, method, body, includeAuth = true)
        var response = client.newCall(request).execute()
        Log.d(TAG, "Sync Request: ${request.method} $url -> ${response.code}")

        if (response.code == 401) {
            response.close()

            val refreshToken = JwtManager.getRefreshToken()
            if (refreshToken.isNullOrEmpty()) {
                Log.d(TAG, "Refresh token is missing, cannot reissue access token")
                return response
            }

            // 2️⃣ 재발급 요청은 access token 헤더 없이
            val reissueBody = createJsonRequestBody(mapOf("refreshToken" to refreshToken))
            val reissueRequest = buildRequest(
                url = "/auth/reissue",
                method = "POST",
                body = reissueBody,
                includeAuth = false
            )

            val reissueResponse = client.newCall(reissueRequest).execute()
            Log.d(TAG, "Reissue Request -> ${reissueResponse.code}")

            if (reissueResponse.isSuccessful) {
                val jsonResponse = reissueResponse.body?.string()
                Log.d(TAG, "Reissue Response Body: $jsonResponse")

                try {
                    val type = object : com.google.gson.reflect.TypeToken<ApiResponse<JwtManager.TokenPayload>>() {}.type
                    val apiResponse: ApiResponse<JwtManager.TokenPayload> = gson.fromJson(jsonResponse, type)

                    val newAccessToken = apiResponse.payload?.accessToken
                    val newRefreshToken = apiResponse.payload?.refreshToken

                    if (!newAccessToken.isNullOrEmpty() && !newRefreshToken.isNullOrEmpty()) {
                        JwtManager.saveToken(newAccessToken, newRefreshToken)
                        Log.d(TAG, "Token refreshed successfully")

                        // 3️⃣ 새 토큰으로 원래 요청 재시도
                        request = buildRequest(url, method, body, includeAuth = true)
                        response = client.newCall(request).execute()
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to parse reissue response", e)
                }
            } else {
                Log.d(TAG, "Refresh token failed")
            }
        }

        return response
    }
}
