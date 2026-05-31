package com.ohmegle.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final int PERMISSION_REQUEST_CODE = 1001;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Request camera + mic permissions at the native level on first launch
        requestMediaPermissions();

        // Configure WebView for WebRTC
        configureWebView();
    }

    private void requestMediaPermissions() {
        String[] permissions = {
            Manifest.permission.CAMERA,
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.MODIFY_AUDIO_SETTINGS
        };

        boolean allGranted = true;
        for (String perm : permissions) {
            if (ContextCompat.checkSelfPermission(this, perm) != PackageManager.PERMISSION_GRANTED) {
                allGranted = false;
                break;
            }
        }

        if (!allGranted) {
            ActivityCompat.requestPermissions(this, permissions, PERMISSION_REQUEST_CODE);
        }
    }

    private void configureWebView() {
        WebView webView = this.bridge.getWebView();
        if (webView == null) return;

        WebSettings settings = webView.getSettings();

        // Core settings for WebRTC
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);

        // Allow mixed content (needed for WebRTC on https scheme)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }

        // Override WebChromeClient to auto-grant WebRTC permission requests from JS
        // We extend the existing client set by Capacitor's bridge to avoid breaking it
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                // Grant all requested resources (camera, microphone, etc.)
                runOnUiThread(() -> request.grant(request.getResources()));
            }
        });

        // Enable hardware acceleration
        webView.setLayerType(WebView.LAYER_TYPE_HARDWARE, null);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSION_REQUEST_CODE) {
            // Re-configure WebView after permissions are granted
            configureWebView();
        }
    }
}
