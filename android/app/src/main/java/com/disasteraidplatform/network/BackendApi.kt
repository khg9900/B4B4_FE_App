package com.disasteraidplatform.network

import android.util.Log
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

object BackendApi {

    private const val TAG = "📡BackendApi"
    private val client = OkHttpClient()

    fun sendRegion(jwtToken: String, province: String, city: String?): Boolean {
        return try {
            val json = JSONObject().apply {
                put("province", province)
                put("city", city ?: JSONObject.NULL)
            }

            val requestBody = json.toString()
                .toRequestBody("application/json; charset=utf-8".toMediaTypeOrNull())

            val request = Request.Builder()

                .url("http://192.168.0.22:8080/api/location/region") // 환경에 맞게 변경

                .addHeader("Authorization", "Bearer $jwtToken")
                .post(requestBody)
                .build()

            client.newCall(request).execute().use { response ->
                if (response.isSuccessful) {
                    Log.d(TAG, "✅ 위치 전송 성공: ${response.code}")
                    true
                } else {
                    Log.w(TAG, "⚠️ 위치 전송 실패: ${response.code} ${response.message}")
                    false
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ 위치 전송 중 예외 발생", e)
            false
        }
    }
}
