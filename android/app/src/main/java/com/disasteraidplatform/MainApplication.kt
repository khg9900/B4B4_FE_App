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
import com.disasteraidplatform.IntentLauncherPackage

class MainApplication : Application(), ReactApplication {

  // React Native 호스트 정의
  override val reactNativeHost: ReactNativeHost =
    object : DefaultReactNativeHost(this) {
      override fun getPackages(): List<ReactPackage> {
        return PackageList(this).packages.toMutableList().apply {
          add(JwtPackage())               // ✅ JWT 관련 NativeModule 등록
          add(IntentLauncherPackage())    // ✅ ForegroundService 실행용 Intent Module 등록
          add(LocationCachePackage())
        }
      }

      override fun getJSMainModuleName(): String = "index"
      override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG
      override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
      override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
    }

  // ReactHost 설정
  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()

    // Android 8.0+ 알림 채널 등록 (포그라운드 서비스용)
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
