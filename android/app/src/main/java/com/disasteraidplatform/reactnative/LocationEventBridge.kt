package com.disasteraidplatform.reactnative

import android.content.Context
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.ReactApplication
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap

object LocationEventBridge {

    fun sendLocationToReactNative(context: Context, latitude: Double, longitude: Double) {
        val reactContext = (context.applicationContext as? ReactApplication)
            ?.reactNativeHost
            ?.reactInstanceManager
            ?.currentReactContext

        reactContext?.let {
            val params: WritableMap = Arguments.createMap().apply {
                putDouble("latitude", latitude)
                putDouble("longitude", longitude)
            }

            it.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("LocationUpdated", params)
        }
    }
}
