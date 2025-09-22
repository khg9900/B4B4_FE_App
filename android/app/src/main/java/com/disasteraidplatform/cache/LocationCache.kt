package com.disasteraidplatform.cache

import com.disasteraidplatform.location.LocationData

object LocationCache {
    @Volatile
    private var latestLocation: LocationData? = null

    fun save(locationData: LocationData) {
        latestLocation = locationData
    }

    fun get(): LocationData? {
        return latestLocation
    }

    fun clear() {
        latestLocation = null
    }

    fun set(latitude: Double, longitude: Double) {
        save(LocationData(latitude, longitude))
    }
}