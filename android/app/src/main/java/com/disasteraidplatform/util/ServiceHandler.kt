package com.disasteraidplatform.util

import android.os.Handler
import android.os.Looper

object ServiceHandler {
    val mainHandler = Handler(Looper.getMainLooper())

    fun runOnMainThread(runnable: Runnable) {
        mainHandler.post(runnable)
    }
}
