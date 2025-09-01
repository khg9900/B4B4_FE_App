package com.disasteraidplatform.reactnative

import android.content.Intent
import android.os.Build
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.disasteraidplatform.service.ForegroundLocationService // ✅ 단일 서비스만 import

class IntentLauncherModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "IntentLauncher"

    private fun createIntent(): Intent {
        return Intent(reactContext, ForegroundLocationService::class.java)
    }

    @ReactMethod
    fun startForegroundService(action: String) {
        val intent = createIntent()
        intent.action = action
        intent.putExtra("isForeground", true)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            reactContext.startForegroundService(intent)
        } else {
            reactContext.startService(intent)
        }
    }

    @ReactMethod
    fun stopService() {
        val intent = createIntent()
        reactContext.stopService(intent)
    }
}
