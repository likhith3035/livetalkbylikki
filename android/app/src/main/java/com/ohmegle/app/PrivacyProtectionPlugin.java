package com.ohmegle.app;

import android.app.Activity;
import android.database.ContentObserver;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.provider.MediaStore;
import android.view.WindowManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "PrivacyProtection")
public class PrivacyProtectionPlugin extends Plugin {

    private Activity.ScreenCaptureCallback screenCaptureCallback;
    private ContentObserver contentObserver;
    private boolean isObserving = false;
    private long lastScreenshotTimestamp = 0;

    @PluginMethod
    public void setSecure(PluginCall call) {
        final boolean enabled = call.getBoolean("enabled", true);
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity is null");
            return;
        }

        activity.runOnUiThread(() -> {
            try {
                if (enabled) {
                    activity.getWindow().setFlags(
                        WindowManager.LayoutParams.FLAG_SECURE,
                        WindowManager.LayoutParams.FLAG_SECURE
                    );
                } else {
                    activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE);
                }
                JSObject ret = new JSObject();
                ret.put("secure", enabled);
                call.resolve(ret);
            } catch (Exception e) {
                call.reject("Failed to set secure flag: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void isSecure(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity is null");
            return;
        }

        boolean isSecured = (activity.getWindow().getAttributes().flags & WindowManager.LayoutParams.FLAG_SECURE) != 0;
        JSObject ret = new JSObject();
        ret.put("secure", isSecured);
        call.resolve(ret);
    }

    @PluginMethod
    public void startScreenshotDetection(PluginCall call) {
        if (isObserving) {
            JSObject ret = new JSObject();
            ret.put("listening", true);
            call.resolve(ret);
            return;
        }

        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity is null");
            return;
        }

        // Method 1: Android 14+ (API 34+) Official ScreenCaptureCallback
        if (Build.VERSION.SDK_INT >= 34) { // Build.VERSION_CODES.UPSIDE_DOWN_CAKE
            try {
                screenCaptureCallback = new Activity.ScreenCaptureCallback() {
                    @Override
                    public void onScreenCaptured() {
                        handleScreenshotDetected("native_callback");
                    }
                };
                activity.registerScreenCaptureCallback(activity.getMainExecutor(), screenCaptureCallback);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        // Method 2: MediaStore ContentObserver (universal fallback)
        try {
            contentObserver = new ContentObserver(new Handler(Looper.getMainLooper())) {
                @Override
                public void onChange(boolean selfChange, Uri uri) {
                    super.onChange(selfChange, uri);
                    if (uri != null) {
                        checkUriForScreenshot(uri);
                    }
                }
            };

            getContext().getContentResolver().registerContentObserver(
                MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
                true,
                contentObserver
            );
        } catch (Exception e) {
            e.printStackTrace();
        }

        isObserving = true;
        JSObject ret = new JSObject();
        ret.put("listening", true);
        call.resolve(ret);
    }

    private void checkUriForScreenshot(Uri uri) {
        // Prevent duplicate trigger within 1.5 seconds
        long now = System.currentTimeMillis();
        if (now - lastScreenshotTimestamp < 1500) return;

        try {
            String[] projection = {
                MediaStore.Images.Media.DATA,
                MediaStore.Images.Media.DATE_ADDED
            };
            Cursor cursor = getContext().getContentResolver().query(
                uri,
                projection,
                null,
                null,
                null
            );

            if (cursor != null) {
                if (cursor.moveToFirst()) {
                    int dataIndex = cursor.getColumnIndex(MediaStore.Images.Media.DATA);
                    if (dataIndex >= 0) {
                        String path = cursor.getString(dataIndex);
                        if (path != null) {
                            String lowerPath = path.toLowerCase();
                            if (lowerPath.contains("screenshot") || lowerPath.contains("screen_shot") || lowerPath.contains("screencap")) {
                                handleScreenshotDetected("media_store");
                            }
                        }
                    }
                }
                cursor.close();
            }
        } catch (Exception ignored) {
        }
    }

    private void handleScreenshotDetected(String source) {
        long now = System.currentTimeMillis();
        if (now - lastScreenshotTimestamp < 1500) return;
        lastScreenshotTimestamp = now;

        JSObject data = new JSObject();
        data.put("timestamp", now);
        data.put("source", source);
        notifyListeners("screenshotTaken", data);
    }

    @PluginMethod
    public void stopScreenshotDetection(PluginCall call) {
        cleanup();
        JSObject ret = new JSObject();
        ret.put("listening", false);
        call.resolve(ret);
    }

    private void cleanup() {
        if (!isObserving) return;
        isObserving = false;

        Activity activity = getActivity();
        if (Build.VERSION.SDK_INT >= 34 && screenCaptureCallback != null && activity != null) {
            try {
                activity.unregisterScreenCaptureCallback(screenCaptureCallback);
                screenCaptureCallback = null;
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        if (contentObserver != null) {
            try {
                getContext().getContentResolver().unregisterContentObserver(contentObserver);
                contentObserver = null;
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    @Override
    protected void handleOnDestroy() {
        cleanup();
        super.handleOnDestroy();
    }
}
