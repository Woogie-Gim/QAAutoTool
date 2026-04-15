package com.qaautotool

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import rikka.shizuku.Shizuku
import java.io.BufferedReader
import java.io.InputStreamReader

class QAAutoModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    // 리액트 네이티브에서 호출할 모듈 이름 반환
    override fun getName(): String {
        return "QAAutoModule"
    }

    // Shizuku 앱 설치 및 권한 부여 상태 확인
    @ReactMethod
    fun checkPermission(promise: Promise) {
        try {
            if (Shizuku.checkSelfPermission() == android.content.pm.PackageManager.PERMISSION_GRANTED) {
                promise.resolve(true)
            } else if (Shizuku.shouldShowRequestPermissionRationale()) {
                promise.resolve(false)
            } else {
                Shizuku.requestPermission(0)
                promise.resolve(false)
            }
        } catch (e: Exception) {
            promise.reject("SHIZUKU_ERROR", "Shizuku 프로세스 접근 불가")
        }
    }

    // 대상 패키지의 dumpsys meminfo 명령어 실행
    @ReactMethod
    fun runDumpsys(packageName: String, promise: Promise) {
        try {
            // 실행 전 Shizuku 권한 재검증
            if (Shizuku.checkSelfPermission() != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                promise.reject("PERMISSION_DENIED", "Shizuku 권한 없음")
                return
            }

            // Shizuku 권한으로 쉘 명령어 프로세스 생성
            val process = Shizuku.newProcess(arrayOf("dumpsys", "meminfo", packageName), null, null)
            val reader = BufferedReader(InputStreamReader(process.inputStream))
            val output = StringBuilder()
            var line: String?

            // 터미널 출력 결과물 문자열 결합
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