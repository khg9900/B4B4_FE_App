package com.disasteraidplatform

import android.content.Context
import com.facebook.react.bridge.*

class LocationCacheModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "LocationCache"

    @ReactMethod
    fun getLastLocation(promise: Promise) {
        try {
            val prefs = reactContext.getSharedPreferences("location_cache", Context.MODE_PRIVATE)
            val lat = prefs.getFloat("lat", Float.NaN)
            val lng = prefs.getFloat("lng", Float.NaN)

            if (!lat.isNaN() && !lng.isNaN()) {
                val result = Arguments.createMap().apply {
                    putDouble("latitude", lat.toDouble())
                    putDouble("longitude", lng.toDouble())
                }
                promise.resolve(result)
            } else {
                promise.reject("NO_LOCATION", "위치 정보가 없습니다.")
            }
        } catch (e: Exception) {
            promise.reject("ERROR", "위치 조회 중 오류 발생", e)
        }
    }
}
