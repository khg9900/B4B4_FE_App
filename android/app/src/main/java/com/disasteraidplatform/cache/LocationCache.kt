package com.disasteraidplatform.cache

import com.disasteraidplatform.location.LocationData

object LocationCache {
    @Volatile
    private var latestLocation: LocationData? = null

    fun save(locationData: LocationData) {
        latestLocation = locationData
        // 저장 시점 로그
        println("LocationCache save() called with: $locationData")
    }

    fun get(): LocationData? {
        // 조회 시점 로그
        println("LocationCache get() called, returning: $latestLocation")
        return latestLocation
    }

    fun clear() {
        latestLocation = null
        println("LocationCache cleared")
    }

    fun set(latitude: Double, longitude: Double) {
        save(LocationData(latitude, longitude))
    }
}