package com.disasteraidplatform.auth

object JwtManager {
    private var jwtToken: String? = null

    fun setToken(token: String) {
        jwtToken = token
    }

    fun getToken(): String? = jwtToken
}
