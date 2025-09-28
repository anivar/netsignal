package com.netsignal

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.WritableMap

abstract class NativeNetSignalSpec(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    abstract fun isConnected(): Boolean
    abstract fun getConnectionType(): String
    abstract fun getActiveConnectionCount(): Double
    abstract fun hasMultipleConnections(): Boolean
    abstract fun getSimpleSummary(): WritableMap
    abstract fun getAllActiveConnections(): WritableMap
    abstract fun addListener(eventType: String)
    abstract fun removeListeners(count: Double)
}