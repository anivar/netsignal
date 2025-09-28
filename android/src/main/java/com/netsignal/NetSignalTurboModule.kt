package com.netsignal

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.turbomodule.core.interfaces.TurboModule
import java.util.concurrent.atomic.AtomicInteger
import android.util.Log

class NetSignalTurboModule(private val reactContext: ReactApplicationContext) :
    NativeNetSignalSpec(reactContext), TurboModule {

    private val connectivityManager: ConnectivityManager? = try {
        reactContext.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
    } catch (e: Exception) {
        Log.e(NAME, "Failed to get ConnectivityManager", e)
        null
    }

    private var networkCallback: ConnectivityManager.NetworkCallback? = null
    private val listenerCount = AtomicInteger(0)

    override fun getName() = NAME

    override fun isConnected(): Boolean {
        return try {
            val cm = connectivityManager ?: return false
            val network = cm.activeNetwork ?: return false
            val capabilities = cm.getNetworkCapabilities(network) ?: return false
            capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
        } catch (e: SecurityException) {
            Log.w(NAME, "Missing ACCESS_NETWORK_STATE permission", e)
            false
        } catch (e: Exception) {
            Log.e(NAME, "Error checking connection", e)
            false
        }
    }

    override fun getConnectionType(): String {
        return try {
            val cm = connectivityManager ?: return "none"
            val network = cm.activeNetwork ?: return "none"
            val capabilities = cm.getNetworkCapabilities(network) ?: return "none"

            when {
                capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) -> "ethernet"
                capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> "wifi"
                capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> "cellular"
                else -> "unknown"
            }
        } catch (e: SecurityException) {
            Log.w(NAME, "Missing ACCESS_NETWORK_STATE permission", e)
            "none"
        } catch (e: Exception) {
            Log.e(NAME, "Error getting connection type", e)
            "none"
        }
    }

    override fun getActiveConnectionCount(): Double {
        return try {
            val cm = connectivityManager ?: return 0.0
            cm.allNetworks.count { network ->
                val caps = cm.getNetworkCapabilities(network)
                caps?.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) == true
            }.toDouble()
        } catch (e: SecurityException) {
            Log.w(NAME, "Missing ACCESS_NETWORK_STATE permission", e)
            0.0
        } catch (e: Exception) {
            Log.e(NAME, "Error getting connection count", e)
            0.0
        }
    }

    override fun hasMultipleConnections(): Boolean {
        return getActiveConnectionCount() > 1
    }

    override fun getSimpleSummary(): WritableMap {
        val map = Arguments.createMap()
        val connected = isConnected()

        map.putBoolean("connected", connected)
        map.putString("type", if (connected) getConnectionType() else "none")
        map.putDouble("connectionCount", getActiveConnectionCount())
        map.putBoolean("multipleConnections", hasMultipleConnections())

        return map
    }

    override fun getAllActiveConnections(): WritableMap {
        val result = Arguments.createMap()
        val connections = Arguments.createArray()

        try {
            val cm = connectivityManager
            if (cm != null) {
                cm.allNetworks.forEach { network ->
                    val caps = cm.getNetworkCapabilities(network)
                    if (caps?.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) == true) {
                        val connection = Arguments.createMap()

                        val type = when {
                            caps.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) -> "ethernet"
                            caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> "wifi"
                            caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> "cellular"
                            else -> "unknown"
                        }

                        connection.putString("type", type)
                        connection.putBoolean("hasInternet", true)
                        connection.putBoolean("isMetered", !caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_NOT_METERED))

                        connections.pushMap(connection)
                    }
                }
            }
        } catch (e: SecurityException) {
            Log.w(NAME, "Missing ACCESS_NETWORK_STATE permission", e)
        } catch (e: Exception) {
            Log.e(NAME, "Error getting all connections", e)
        }

        result.putArray("connections", connections)
        return result
    }

    @Synchronized
    override fun addListener(eventType: String) {
        if (listenerCount.getAndIncrement() == 0 && networkCallback == null) {
            startListening()
        }
    }

    @Synchronized
    override fun removeListeners(count: Double) {
        val newCount = listenerCount.addAndGet(-count.toInt())
        if (newCount <= 0 && networkCallback != null) {
            listenerCount.set(0)
            stopListening()
        }
    }

    private fun startListening() {
        try {
            val cm = connectivityManager ?: return

            networkCallback = object : ConnectivityManager.NetworkCallback() {
                override fun onAvailable(network: Network) {
                    sendEvent()
                }

                override fun onLost(network: Network) {
                    sendEvent()
                }

                override fun onCapabilitiesChanged(network: Network, caps: NetworkCapabilities) {
                    sendEvent()
                }
            }

            val request = NetworkRequest.Builder()
                .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                .build()

            cm.registerNetworkCallback(request, networkCallback!!)
        } catch (e: SecurityException) {
            Log.w(NAME, "Missing ACCESS_NETWORK_STATE permission for callbacks", e)
            networkCallback = null
        } catch (e: Exception) {
            Log.e(NAME, "Error starting network listener", e)
            networkCallback = null
        }
    }

    private fun stopListening() {
        try {
            networkCallback?.let {
                connectivityManager?.unregisterNetworkCallback(it)
                networkCallback = null
            }
        } catch (e: Exception) {
            Log.e(NAME, "Error stopping network listener", e)
            networkCallback = null
        }
    }

    private fun sendEvent() {
        try {
            val params = Arguments.createMap()
            params.putBoolean("isConnected", isConnected())
            params.putString("type", getConnectionType())
            params.putDouble("connectionCount", getActiveConnectionCount())

            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                ?.emit("netSignalChange", params)
        } catch (e: Exception) {
            Log.e(NAME, "Error sending event", e)
        }
    }

    override fun onCatalystInstanceDestroy() {
        stopListening()
        listenerCount.set(0)
    }

    companion object {
        const val NAME = "NetSignal"
    }
}