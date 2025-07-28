package com.disasteraidplatform.auth

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class JwtModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "JwtModule"

    @ReactMethod
    fun setToken(token: String) {
        JwtManager.setToken(token)
    }

    @ReactMethod
    fun getToken(promise: Promise) {
        val token = JwtManager.getToken()
        if (token != null) {
            promise.resolve(token)
        } else {
            promise.reject("NO_TOKEN", "JWT token is not set.")
        }
    }
}
