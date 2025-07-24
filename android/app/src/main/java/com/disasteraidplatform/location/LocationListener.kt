package com.disasteraidplatform.location

import android.location.Location

interface LocationListener {
    fun onLocationChanged(location: Location)
}
