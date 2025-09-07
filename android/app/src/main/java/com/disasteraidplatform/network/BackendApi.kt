package com.disasteraidplatform.network

import com.disasteraidplatform.auth.JwtManager
import okhttp3.*
import android.util.Log
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import com.google.gson.Gson
import java.io.IOException

object BackendApi {
    private const val TAG = "BackendApi"
    private const val BASE_URL = "http://192.168.25.177:8080/api"

    private val client = OkHttpClient()
    private val gson = Gson()

    fun createJsonRequestBody(data: Any): RequestBody {
        val json = gson.toJson(data)
        return json.toRequestBody("application/json; charset=utf-8".toMediaType())
    }

    private fun buildRequest(url: String, method: String = "GET", body: RequestBody? = null): Request {
        val builder = Request.Builder().url("$BASE_URL$url")
        JwtManager.getToken()?.let { builder.addHeader("Authorization", "Bearer $it") }

        when (method.uppercase()) {
            "POST" -> builder.post(body ?: FormBody.Builder().build())
            "PUT" -> builder.put(body ?: FormBody.Builder().build())
            "DELETE" -> builder.delete(body)
            else -> builder.get()
        }

        return builder.build()
    }

    @Throws(IOException::class)
    fun requestSync(url: String, method: String = "GET", body: RequestBody? = null): Response {
        val request = buildRequest(url, method, body)
        Log.d(TAG, "Sync Request: ${request.method} $url")
        return client.newCall(request).execute()
    }

    fun requestAsync(url: String, method: String = "GET", body: RequestBody? = null, callback: Callback) {
        val request = buildRequest(url, method, body)
        Log.d(TAG, "Async Request: ${request.method} $url")
        client.newCall(request).enqueue(callback)
    }

    @Throws(IOException::class)
    fun requestSyncWithRefresh(url: String, method: String = "GET", body: RequestBody? = null): Response {
        var request = buildRequest(url, method, body)
        var response = client.newCall(request).execute()
        Log.d(TAG, "Sync Request: ${request.method} $url -> ${response.code}")

        if (response.code == 401) {
            response.close()
            val newToken = JwtManager.refreshTokenSync()
            if (newToken != null) {
                Log.d(TAG, "Token refreshed, retry request")
                request = buildRequest(url, method, body)
                response = client.newCall(request).execute()
            } else {
                Log.d(TAG, "Refresh token failed")
            }
        }

        return response
    }
}
