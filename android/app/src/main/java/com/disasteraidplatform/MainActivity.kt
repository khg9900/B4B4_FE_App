package com.disasteraidplatform

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Intent
import android.os.Build
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.ReactApplication

class MainActivity : ReactActivity() {

    override fun getMainComponentName(): String = "DisasterAidPlatform"

    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Notification 클릭 시 전달된 extras 처리
        handleIntentExtras(intent)

        // Android O 이상 채널 생성
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                "default",
                "기본 채널",
                NotificationManager.IMPORTANCE_HIGH
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        intent?.let { handleIntentExtras(it) }
    }

    private fun handleIntentExtras(intent: Intent) {
        val extras = intent.extras ?: return

        val highlightPostId = extras.getLong("highlightPostId", -1L)
        val teamId = extras.getLong("teamId", -1L)
        val state = extras.getString("state")

        // 유효한 값만 React Native로 전달
        if (highlightPostId > 0 && teamId > 0 && !state.isNullOrEmpty()) {
            sendEventToReactNative(
                mapOf(
                    "highlightPostId" to highlightPostId,
                    "teamId" to teamId,
                    "state" to state
                )
            )
        }
    }

    private fun sendEventToReactNative(params: Map<String, Any>) {
        try {
            currentReactContext?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                ?.emit("NotificationClicked", params)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    // ReactContext를 안전하게 가져오기
    private val currentReactContext
        get() = (application as? ReactApplication)?.reactNativeHost
            ?.reactInstanceManager?.currentReactContext
}
