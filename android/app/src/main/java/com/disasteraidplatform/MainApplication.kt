package com.disasteraidplatform

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.disasteraidplatform.auth.JwtPackage
import com.disasteraidplatform.reactnative.IntentLauncherPackage
import com.disasteraidplatform.reactnative.LocationCachePackage
import com.facebook.soloader.SoLoader

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost =
    object : DefaultReactNativeHost(this) {
      override fun getPackages(): List<ReactPackage> {
        return PackageList(this).packages.toMutableList().apply {
          add(JwtPackage())                     // ✅ JWT Native Module
          add(IntentLauncherPackage())          // ✅ ForegroundService 제어 Module
          add(LocationCachePackage())           // ✅ 위치 캐시 Module
        }
      }

      override fun getJSMainModuleName(): String = "index"
      override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG
      // BuildConfig.IS_NEW_ARCHITECTURE_ENABLED 대신 직접 true 또는 false 명시
      override val isNewArchEnabled: Boolean =BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
      override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
    }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()

    // Android 8.0+ 이상을 위한 Foreground Service 알림 채널 생성
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(
        "foreground_channel",
        "Foreground Location",
        NotificationManager.IMPORTANCE_HIGH
      )
      val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      manager.createNotificationChannel(channel)
    }
    // React Native 초기화
    com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative(this)
  }
}
