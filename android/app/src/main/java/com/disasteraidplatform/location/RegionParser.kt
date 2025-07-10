// android/app/src/main/java/com/disasteraidplatform/location/RegionParser.kt
package com.disasteraidplatform.location
import com.disasteraidplatform.location.Region

object RegionParser {
    fun parse(region1: String, region2: String): Region {
        var province = region1
        var city: String? = region2

        // 세종시는 시/군/구가 없는 경우 있음 → null 처리
        if (region1.contains("세종")) {
            return Region(province, null)
        }

        return Region(province, city)
    }
}
