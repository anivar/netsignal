package com.netsignal

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class NetSignalTurboPackage : TurboReactPackage() {
    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
        return if (name == NetSignalTurboModule.NAME) {
            NetSignalTurboModule(reactContext)
        } else {
            null
        }
    }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        return ReactModuleInfoProvider {
            mapOf(
                NetSignalTurboModule.NAME to ReactModuleInfo(
                    NetSignalTurboModule.NAME,
                    NetSignalTurboModule::class.java.name,
                    false,
                    false,
                    false,
                    true
                )
            )
        }
    }
}