package com.disasteraidplatform.auth

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class JwtModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "JwtModule"

    @ReactMethod
    fun setToken(access: String, refresh: String) {
        JwtManager.setToken(access)
        JwtManager.setRefreshToken(refresh)
    }

    @ReactMethod
    fun getToken(promise: Promise) {
        val token = JwtManager.getToken()
        if (token != null) promise.resolve(token)
        else promise.reject("NO_TOKEN", "JWT token is not set.")
    }

    @ReactMethod
    fun refreshToken(promise: Promise) {
        val newToken = JwtManager.refreshTokenSync()
        if (newToken != null) promise.resolve(newToken)
        else promise.reject("REFRESH_FAILED", "Failed to refresh access token.")
    }
}
