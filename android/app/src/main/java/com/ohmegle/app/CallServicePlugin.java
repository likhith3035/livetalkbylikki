package com.ohmegle.app;

import android.content.Intent;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "CallService")
public class CallServicePlugin extends Plugin {

    private static CallServicePlugin instance;

    public static CallServicePlugin getInstance() {
        return instance;
    }

    @Override
    public void load() {
        super.load();
        instance = this;
    }

    public void notifyCallAction(String action) {
        JSObject ret = new JSObject();
        ret.put("action", action);
        notifyListeners("callAction", ret);
    }

    @PluginMethod
    public void startCallService(PluginCall call) {
        try {
            String strangerName = call.getString("strangerName", "Stranger");
            Intent serviceIntent = new Intent(getContext(), CallForegroundService.class);
            serviceIntent.putExtra("strangerName", strangerName);
            serviceIntent.putExtra("isIncoming", false);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                getContext().startForegroundService(serviceIntent);
            } else {
                getContext().startService(serviceIntent);
            }
            JSObject ret = new JSObject();
            ret.put("started", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to start call foreground service: " + e.getMessage());
        }
    }

    @PluginMethod
    public void startIncomingCallService(PluginCall call) {
        try {
            String strangerName = call.getString("strangerName", "Stranger");
            Intent serviceIntent = new Intent(getContext(), CallForegroundService.class);
            serviceIntent.putExtra("strangerName", strangerName);
            serviceIntent.putExtra("isIncoming", true);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                getContext().startForegroundService(serviceIntent);
            } else {
                getContext().startService(serviceIntent);
            }
            JSObject ret = new JSObject();
            ret.put("started", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to start incoming call service: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopCallService(PluginCall call) {
        try {
            Intent serviceIntent = new Intent(getContext(), CallForegroundService.class);
            getContext().stopService(serviceIntent);
            JSObject ret = new JSObject();
            ret.put("stopped", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to stop call foreground service: " + e.getMessage());
        }
    }
}
