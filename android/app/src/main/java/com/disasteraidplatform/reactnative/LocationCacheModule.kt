package com.disasteraidplatform.reactnative

import com.disasteraidplatform.cache.LocationCache
import com.disasteraidplatform.location.LocationData
import com.disasteraidplatform.util.Logger
import com.facebook.react.bridge.*

class LocationCacheModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "LocationCache"

    @ReactMethod
    fun getCachedLocation(promise: Promise) {
        val location = LocationCache.get()
        if (location != null) {
            val map = Arguments.createMap().apply {
                putDouble("latitude", location.latitude)
                putDouble("longitude", location.longitude)
            }
            promise.resolve(map)
        } else {
            Logger.w("LocationCacheModule", "getCachedLocation 호출, 캐시된 위치 없음")
            promise.reject("NO_LOCATION", "No cached location available")
        }
    }

    @ReactMethod
    fun saveCachedLocation(latitude: Double, longitude: Double) {
        LocationCache.save(LocationData(latitude, longitude))
    }
}
