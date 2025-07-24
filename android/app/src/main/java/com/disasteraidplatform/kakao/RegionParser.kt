package com.disasteraidplatform.kakao

object RegionParser {
    fun parse(province: String, city: String?): Region {
        if (province.isBlank()) {
            return Region("", null)
        }
        return if (province.contains("세종", ignoreCase = true)) {
            Region(province, null)
        } else {
            Region(province, city)
        }
    }
}
