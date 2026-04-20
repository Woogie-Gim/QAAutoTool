package com.qaautotool

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import rikka.shizuku.Shizuku
import java.io.BufferedReader
import java.io.InputStreamReader

class QAAutoModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "QAAutoModule"

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
            promise.reject("SHIZUKU_ERROR", e.message)
        }
    }

    // 공통 쉘 명령어 실행 함수 (메모리, CPU, 배터리 등 통합 처리)
    @ReactMethod
    fun runShellCommand(command: String, promise: Promise) {
        try {
            if (Shizuku.checkSelfPermission() != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                promise.reject("PERMISSION_DENIED", "권한 없음")
                return
            }

            // 명령어 인자 분리 (예: "dumpsys meminfo" -> ["dumpsys", "meminfo"])
            val cmdArgs = command.split(" ").toTypedArray()
            val process = Shizuku.newProcess(cmdArgs, null, null)
            val reader = BufferedReader(InputStreamReader(process.inputStream))
            val output = StringBuilder()
            var line: String?

            while (reader.readLine().also { line = it } != null) {
                output.append(line).append("\n")
            }

            process.waitFor()
            promise.resolve(output.toString())
        } catch (e: Exception) {
            promise.reject("EXECUTION_ERROR", e.message)
        }
    }

    // 클립보드 복사 기능
    @ReactMethod
    fun copyToClipboard(text: String, promise: Promise) {
        try {
            // 안드로이드 시스템의 클립보드 관리자를 불러옵니다.
            val clipboard = reactApplicationContext.getSystemService(android.content.Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
            val clip = android.content.ClipData.newPlainText("QA_Data", text)
            clipboard.setPrimaryClip(clip)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("CLIPBOARD_ERROR", "복사 실패: " + e.message)
        }
    }
}