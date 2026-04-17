package com.qaautotool

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import rikka.shizuku.Shizuku
import java.io.BufferedReader
import java.io.InputStreamReader

class QAAutoModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    // 모듈명 반환
    override fun getName(): String {
        return "QAAutoModule"
    }

    // Shizuku 권한 검증 및 요청
    @ReactMethod
    fun checkPermission(promise: Promise) {
        try {
            if (Shizuku.checkSelfPermission() == android.content.pm.PackageManager.PERMISSION_GRANTED) {
                promise.resolve(true)
            } else {
                Shizuku.requestPermission(0)
                promise.resolve(false)
            }
        } catch (e: Exception) {
            promise.reject("SHIZUKU_ERROR", "권한 요청 실패: " + e.message)
        }
    }

    // dumpsys meminfo 명령어 실행 및 결과 반환
    @ReactMethod
    fun runDumpsys(packageName: String, promise: Promise) {
        try {
            // 권한 미확보 시 예외 처리
            if (Shizuku.checkSelfPermission() != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                promise.reject("PERMISSION_DENIED", "Shizuku 권한 없음")
                return
            }

            // 쉘 프로세스 생성 및 명령어 실행
            val process = Shizuku.newProcess(arrayOf("dumpsys", "meminfo", packageName), null, null)
            val reader = BufferedReader(InputStreamReader(process.inputStream))
            val output = StringBuilder()
            var line: String?

            // 결과 문자열 파싱
            while (reader.readLine().also { line = it } != null) {
                output.append(line).append("\n")
            }

            process.waitFor()
            promise.resolve(output.toString())
        } catch (e: Exception) {
            promise.reject("EXECUTION_ERROR", e.message)
        }
    }
}