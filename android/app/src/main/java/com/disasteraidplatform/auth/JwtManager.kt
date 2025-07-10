package com.disasteraidplatform.auth

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

// 토큰 관리 객체
object JwtManager {
    private var jwtToken: String? = null

    fun setToken(token: String) {
        jwtToken = token
    }

    fun getToken(): String? = jwtToken
}

// React Native 브릿지 모듈 정의
class JwtModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "JwtModule"

    @ReactMethod
    fun setToken(token: String) {
        JwtManager.setToken(token)
    }
}
