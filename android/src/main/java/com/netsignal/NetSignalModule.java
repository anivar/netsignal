package com.netsignal;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkRequest;
import android.os.Build;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.*;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.turbomodule.core.interfaces.TurboModule;

import java.net.HttpURLConnection;
import java.net.URL;

/**
 * NetSignal Android Implementation
 * 
 * @author Anivar A Aravind <ping@anivar.net>
 * @copyright 2025 Anivar A Aravind
 * @license MIT
 */
@ReactModule(name = "NetSignal")
public class NetSignalModule extends ReactContextBaseJavaModule implements TurboModule {
    private final ConnectivityManager cm;
    private volatile boolean connected = false;
    private volatile String type = "none";
    
    public NetSignalModule(ReactApplicationContext context) {
        super(context);
        this.cm = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
        updateState();
        registerCallback();
    }
    
    @Override
    public String getName() {
        return "NetSignal";
    }
    
    // ============ CORE API ============
    
    @ReactMethod(isBlockingSynchronousMethod = true)
    public boolean isConnected() {
        return connected;
    }
    
    @ReactMethod(isBlockingSynchronousMethod = true)
    public String getConnectionType() {
        return type;
    }
    
    @ReactMethod
    public void probe(String url, int timeout, Promise promise) {
        new Thread(() -> {
            long start = System.currentTimeMillis();
            try {
                HttpURLConnection conn = (HttpURLConnection) new URL(url).openConnection();
                conn.setRequestMethod("HEAD");
                conn.setConnectTimeout(timeout);
                conn.setReadTimeout(timeout);
                
                boolean reachable = conn.getResponseCode() < 400;
                conn.disconnect();
                
                WritableMap result = Arguments.createMap();
                result.putBoolean("reachable", reachable);
                result.putDouble("responseTime", System.currentTimeMillis() - start);
                promise.resolve(result);
            } catch (Exception e) {
                WritableMap result = Arguments.createMap();
                result.putBoolean("reachable", false);
                result.putDouble("responseTime", -1);
                result.putString("error", e.getMessage());
                promise.resolve(result);
            }
        }).start();
    }
    
    // ============ INTERNALS ============
    
    private void updateState() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Network network = cm.getActiveNetwork();
            NetworkCapabilities caps = cm.getNetworkCapabilities(network);
            
            if (caps != null && caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)) {
                connected = true;
                if (caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) {
                    type = "wifi";
                } else if (caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)) {
                    type = "cellular";
                } else if (caps.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)) {
                    type = "ethernet";
                } else {
                    type = "unknown";
                }
            } else {
                connected = false;
                type = "none";
            }
        }
    }
    
    private void registerCallback() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            cm.registerNetworkCallback(
                new NetworkRequest.Builder()
                    .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                    .build(),
                new ConnectivityManager.NetworkCallback() {
                    @Override
                    public void onAvailable(@NonNull Network network) {
                        updateState();
                        emit();
                    }
                    
                    @Override
                    public void onLost(@NonNull Network network) {
                        updateState();
                        emit();
                    }
                    
                    @Override
                    public void onCapabilitiesChanged(@NonNull Network network, @NonNull NetworkCapabilities caps) {
                        updateState();
                        emit();
                    }
                }
            );
        }
    }
    
    private void emit() {
        WritableMap params = Arguments.createMap();
        params.putBoolean("isConnected", connected);
        params.putString("type", type);
        
        getReactApplicationContext()
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit("connectionChange", params);
    }
    
    // Required for events
    @ReactMethod
    public void addListener(String eventName) {}
    
    @ReactMethod
    public void removeListeners(int count) {}
}