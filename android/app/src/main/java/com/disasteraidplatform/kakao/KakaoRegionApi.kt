package com.disasteraidplatform.kakao

import android.util.Log
import com.disasteraidplatform.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject

object KakaoRegionApi {
    private const val TAG = "KakaoRegionApi"
    private val client = OkHttpClient()

    suspend fun fetchRegion(longitude: Double, latitude: Double): Region = withContext(Dispatchers.IO) {
        try {
            val url = "https://dapi.kakao.com/v2/local/geo/coord2regioncode.json?x=$longitude&y=$latitude"
            val request = Request.Builder()
                .url(url)
                .addHeader("Authorization", "KakaoAK ${BuildConfig.KAKAO_REST_API_KEY}")
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    Log.e(TAG, "Kakao API failed: ${response.code}")
                    return@withContext Region("", null)
                }

                val body = response.body?.string() ?: return@withContext Region("", null)
                val json = JSONObject(body)
                val documents = json.optJSONArray("documents") ?: return@withContext Region("", null)

                if (documents.length() == 0) return@withContext Region("", null)

                val regionObj = documents.getJSONObject(0)
                val province = regionObj.optString("region_1depth_name", "")
                val city = regionObj.optString("region_2depth_name", "")

                return@withContext RegionParser.parse(province, city)
            }
        } catch (e: Exception) {
            Log.e(TAG, "fetchRegion failed", e)
            return@withContext Region("", null)
        }
    }
}
