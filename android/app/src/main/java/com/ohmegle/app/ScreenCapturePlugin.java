package com.ohmegle.app;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.PixelFormat;
import android.hardware.display.DisplayManager;
import android.hardware.display.VirtualDisplay;
import android.media.Image;
import android.media.ImageReader;
import android.media.projection.MediaProjection;
import android.media.projection.MediaProjectionManager;
import android.os.Build;
import android.os.Handler;
import android.os.HandlerThread;
import android.util.Base64;
import android.util.DisplayMetrics;
import android.view.WindowManager;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;

@CapacitorPlugin(name = "ScreenCapture")
public class ScreenCapturePlugin extends Plugin {

    private MediaProjectionManager projectionManager;
    private MediaProjection mediaProjection;
    private VirtualDisplay virtualDisplay;
    private ImageReader imageReader;
    private HandlerThread handlerThread;
    private Handler handler;
    private volatile boolean isCapturing = false;
    private int captureWidth;
    private int captureHeight;
    private int screenDensity;

    @PluginMethod
    public void startCapture(PluginCall call) {
        if (isCapturing) {
            call.reject("Screen capture already running");
            return;
        }

        projectionManager = (MediaProjectionManager)
            getContext().getSystemService(Context.MEDIA_PROJECTION_SERVICE);

        DisplayMetrics metrics = new DisplayMetrics();
        ((WindowManager) getContext().getSystemService(Context.WINDOW_SERVICE))
            .getDefaultDisplay().getMetrics(metrics);

        // Capture at reduced resolution for smooth WebRTC streaming
        float scale = Math.min(1.0f, 720.0f / Math.min(metrics.widthPixels, metrics.heightPixels));
        captureWidth = (int) (metrics.widthPixels * scale);
        captureHeight = (int) (metrics.heightPixels * scale);
        // Ensure even dimensions (required by some video encoders)
        captureWidth = captureWidth & ~1;
        captureHeight = captureHeight & ~1;
        screenDensity = metrics.densityDpi;

        // Start the foreground service BEFORE requesting MediaProjection (Android 10+ requirement)
        Intent serviceIntent = new Intent(getContext(), ScreenCaptureService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(serviceIntent);
        } else {
            getContext().startService(serviceIntent);
        }

        // Request screen capture permission from user
        Intent captureIntent = projectionManager.createScreenCaptureIntent();
        startActivityForResult(call, captureIntent, "handleCaptureResult");
    }

    @ActivityCallback
    private void handleCaptureResult(PluginCall call, ActivityResult result) {
        if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
            mediaProjection = projectionManager.getMediaProjection(
                result.getResultCode(), result.getData());

            startFrameCapture();

            JSObject ret = new JSObject();
            ret.put("started", true);
            ret.put("width", captureWidth);
            ret.put("height", captureHeight);
            call.resolve(ret);
        } else {
            // User denied — stop the foreground service
            getContext().stopService(new Intent(getContext(), ScreenCaptureService.class));
            call.reject("User denied screen capture permission");
        }
    }

    private void startFrameCapture() {
        handlerThread = new HandlerThread("ScreenCaptureThread");
        handlerThread.start();
        handler = new Handler(handlerThread.getLooper());

        imageReader = ImageReader.newInstance(
            captureWidth, captureHeight, PixelFormat.RGBA_8888, 2);

        virtualDisplay = mediaProjection.createVirtualDisplay(
            "LiveTalkScreenShare",
            captureWidth, captureHeight, screenDensity,
            DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
            imageReader.getSurface(),
            null, handler
        );

        isCapturing = true;

        // Capture at ~8 fps — good balance of quality vs bridge throughput
        handler.post(new Runnable() {
            @Override
            public void run() {
                if (!isCapturing) return;
                captureFrame();
                handler.postDelayed(this, 125); // ~8 fps
            }
        });
    }

    private void captureFrame() {
        if (imageReader == null) return;
        Image image = imageReader.acquireLatestImage();
        if (image == null) return;

        try {
            Image.Plane[] planes = image.getPlanes();
            ByteBuffer buffer = planes[0].getBuffer();
            int pixelStride = planes[0].getPixelStride();
            int rowStride = planes[0].getRowStride();
            int rowPadding = rowStride - pixelStride * captureWidth;

            Bitmap bitmap = Bitmap.createBitmap(
                captureWidth + rowPadding / pixelStride,
                captureHeight,
                Bitmap.Config.ARGB_8888
            );
            bitmap.copyPixelsFromBuffer(buffer);

            // Crop away row padding to get the actual screen content
            Bitmap cropped;
            if (rowPadding > 0) {
                cropped = Bitmap.createBitmap(bitmap, 0, 0, captureWidth, captureHeight);
                bitmap.recycle();
            } else {
                cropped = bitmap;
            }

            // Compress to JPEG (quality 55 — sharp enough for text, small enough for bridge)
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            cropped.compress(Bitmap.CompressFormat.JPEG, 55, baos);
            cropped.recycle();

            String base64Frame = Base64.encodeToString(baos.toByteArray(), Base64.NO_WRAP);

            JSObject data = new JSObject();
            data.put("frame", base64Frame);
            data.put("width", captureWidth);
            data.put("height", captureHeight);
            notifyListeners("frame", data);

        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            image.close();
        }
    }

    @PluginMethod
    public void stopCapture(PluginCall call) {
        cleanup();

        JSObject ret = new JSObject();
        ret.put("stopped", true);
        call.resolve(ret);
    }

    private void cleanup() {
        isCapturing = false;

        if (virtualDisplay != null) {
            virtualDisplay.release();
            virtualDisplay = null;
        }
        if (mediaProjection != null) {
            mediaProjection.stop();
            mediaProjection = null;
        }
        if (imageReader != null) {
            imageReader.close();
            imageReader = null;
        }
        if (handlerThread != null) {
            handlerThread.quitSafely();
            handlerThread = null;
            handler = null;
        }

        // Stop the foreground service
        try {
            getContext().stopService(new Intent(getContext(), ScreenCaptureService.class));
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    protected void handleOnDestroy() {
        cleanup();
        super.handleOnDestroy();
    }
}
