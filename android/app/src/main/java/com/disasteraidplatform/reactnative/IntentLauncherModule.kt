package com.disasteraidplatform.reactnative

import android.content.Intent
import android.os.Build
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class IntentLauncherModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "IntentLauncher"

    private fun createIntent(className: String): Intent? {
        return when (className) {
            "com.disasteraidplatform.service.TrackingService" ->
                Intent(reactContext, com.disasteraidplatform.service.TrackingService::class.java)
            "com.disasteraidplatform.service.LocationSenderService" ->
                Intent(reactContext, com.disasteraidplatform.service.LocationSenderService::class.java)
            "com.disasteraidplatform.service.ForegroundService" ->
                Intent(reactContext, com.disasteraidplatform.service.ForegroundService::class.java)
            else -> null
        }
    }

    @ReactMethod
    fun startService(className: String, action: String) {
        val intent = createIntent(className)
        intent?.let {
            it.action = action
            it.putExtra("isForeground", false) // 포그라운드 아닌 일반 서비스

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactContext.startForegroundService(it) // Android O 이상도 그냥 startForegroundService 사용해도 무방
            } else {
                reactContext.startService(it)
            }
        }
    }

    @ReactMethod
    fun startForegroundService(className: String, action: String) {
        val intent = createIntent(className)
        intent?.let {
            it.action = action
            it.putExtra("isForeground", true) // 포그라운드 서비스임을 표시

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactContext.startForegroundService(it)
            } else {
                reactContext.startService(it)
            }
        }
    }

    @ReactMethod
    fun stopService(className: String) {
        val intent = createIntent(className)
        intent?.let {
            reactContext.stopService(it)
        }
    }
}
