package com.qaautotool

import android.view.View
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ReactShadowNode
import com.facebook.react.uimanager.ViewManager

class QAAutoPackage : ReactPackage {
    // 작성한 커스텀 네이티브 모듈 리스트 반환
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(QAAutoModule(reactContext))
    }

    // 커스텀 UI 뷰 매니저 반환 (현재 미사용으로 빈 리스트 처리)
    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}