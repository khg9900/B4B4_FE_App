package com.disasteraidplatform.service

import android.content.Context
import com.disasteraidplatform.kakao.KakaoRegionApi
import com.disasteraidplatform.util.Logger
import com.disasteraidplatform.kakao.Region
class RegionSender(private val context: Context) {

    suspend fun fetchRegion(longitude: Double, latitude: Double): Region? {
        return try {
            KakaoRegionApi.fetchRegion(longitude, latitude)
        } catch (e: Exception) {
            Logger.e("RegionSender", "Error fetching region", e)
            null
        }
    }
}
