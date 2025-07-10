package com.disasteraidplatform

import android.app.*
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.IBinder
import android.os.Looper
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.android.gms.location.*

class TrackingService : Service() {

    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private var locationCallback: LocationCallback? = null
    private val TAG = "📍TrackingService"

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "✅ TrackingService created")
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action
        Log.d(TAG, "onStartCommand 진입, action: $action")

        when (action) {
            "START_TRACKING" -> {
                Log.d(TAG, "START_TRACKING action received")
                createNotificationChannel()
                Log.d(TAG, "Notification 채널 생성 완료 후 startForeground 호출 직전")
                startForeground(1000, buildNotification())
                Log.d(TAG, "startForeground 호출 완료")

                startLocationTracking()
                Log.d(TAG, "startLocationTracking 호출 완료")
            }
            "STOP_TRACKING" -> {
                Log.d(TAG, "STOP_TRACKING action received")
                stopLocationTracking()
                stopSelf()
                Log.d(TAG, "stopLocationTracking 및 stopSelf 호출 완료")
            }
            else -> {
                Log.w(TAG, "알 수 없는 액션 또는 액션 없음: $action")
            }
        }
        return START_STICKY
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Log.d(TAG, "Notification channel 생성 중...")
            val channel = NotificationChannel(
                "tracking_channel",
                "위치 추적 서비스",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
            Log.d(TAG, "Notification channel 생성 완료")
        } else {
            Log.d(TAG, "Notification channel 생성 불필요 (SDK < O)")
        }
    }

    private fun buildNotification(): Notification {
        Log.d(TAG, "Notification 빌드 중...")
        return NotificationCompat.Builder(this, "tracking_channel")
            .setContentTitle("위치 추적 중")
            .setContentText("기기의 위치를 감지하고 있습니다.")
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun startLocationTracking() {
        Log.d(TAG, "위치 추적 시작 시도")

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (checkSelfPermission(android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                Log.e(TAG, "위치 권한이 없습니다! 위치 추적을 시작할 수 없습니다.")
                return
            }
        }

        val locationRequest = LocationRequest.Builder(
            Priority.PRIORITY_HIGH_ACCURACY,
            5_000L // 5초 간격
        ).build()

        locationCallback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                val location = result.lastLocation
                if (location == null) {
                    Log.w(TAG, "onLocationResult: 위치 정보가 null입니다.")
                    return
                }
                Log.d(TAG, "위치 수신됨: 위도=${location.latitude}, 경도=${location.longitude}")

                cacheLocation(location.latitude, location.longitude)
            }

            override fun onLocationAvailability(availability: LocationAvailability) {
                Log.d(TAG, "onLocationAvailability: 위치 사용 가능 여부=${availability.isLocationAvailable}")
            }
        }

        try {
            fusedLocationClient.requestLocationUpdates(
                locationRequest,
                locationCallback!!,
                Looper.getMainLooper()
            )
            Log.d(TAG, "requestLocationUpdates 성공적으로 호출됨")
        } catch (e: SecurityException) {
            Log.e(TAG, "SecurityException 발생: 위치 권한 확인 필요", e)
        } catch (e: Exception) {
            Log.e(TAG, "requestLocationUpdates 중 예외 발생", e)
        }
    }

    private fun stopLocationTracking() {
        Log.d(TAG, "위치 추적 중지 시도")
        locationCallback?.let {
            fusedLocationClient.removeLocationUpdates(it)
            Log.d(TAG, "removeLocationUpdates 호출됨")
        } ?: run {
            Log.d(TAG, "locationCallback이 null이라 제거할 위치 업데이트 없음")
        }
        locationCallback = null
    }

    private fun cacheLocation(latitude: Double, longitude: Double) {
        Log.d(TAG, "위치 캐시 저장 시도: 위도=$latitude, 경도=$longitude")
        val prefs = getSharedPreferences("location_cache", Context.MODE_PRIVATE)
        val success = prefs.edit()
            .putFloat("lat", latitude.toFloat())
            .putFloat("lng", longitude.toFloat())
            .commit()
        Log.d(TAG, "위치 캐시 저장 결과: ${if (success) "성공" else "실패"}")
    }

    override fun onDestroy() {
        Log.d(TAG, "TrackingService onDestroy 호출됨")
        stopLocationTracking()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
