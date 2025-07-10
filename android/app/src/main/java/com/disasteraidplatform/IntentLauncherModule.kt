package com.disasteraidplatform

import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class IntentLauncherModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val TAG = "IntentLauncherModule"

    override fun getName(): String = "IntentLauncher"

    @ReactMethod
    fun startService(serviceClassName: String, action: String) {
        Log.d(TAG, "startService 호출 - serviceClassName=$serviceClassName, action=$action")

        try {
            val clazz = Class.forName(serviceClassName)
            val intent = Intent(reactContext, clazz)
            intent.action = action

            // Android O 이상이라면 무조건 startForegroundService 호출
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Log.d(TAG, "startForegroundService 호출: $serviceClassName")
                reactContext.startForegroundService(intent)
            } else {
                Log.d(TAG, "startService 호출: $serviceClassName")
                reactContext.startService(intent)
            }

            Log.d(TAG, "서비스 시작 요청 성공: $serviceClassName")
        } catch (e: ClassNotFoundException) {
            Log.e(TAG, "서비스 클래스 못 찾음: $serviceClassName", e)
        } catch (e: Exception) {
            Log.e(TAG, "startService 호출 중 오류 발생", e)
        }
    }

    @ReactMethod
    fun addListener(eventName: String?) {
        // 이벤트 리스너 빈 구현
    }

    @ReactMethod
    fun removeListeners(count: Int?) {
        // 이벤트 리스너 빈 구현
    }
}
