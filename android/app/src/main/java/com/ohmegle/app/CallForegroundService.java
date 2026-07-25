package com.ohmegle.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.widget.RemoteViews;

import androidx.core.app.NotificationCompat;

public class CallForegroundService extends Service {

    public static final String CHANNEL_ID = "livetalk_active_call_channel";
    public static final String INCOMING_CHANNEL_ID = "livetalk_incoming_call_channel";
    public static final int NOTIFICATION_ID = 8888;
    public static final int INCOMING_NOTIFICATION_ID = 8889;

    public static final String ACTION_CALL_MUTE = "com.ohmegle.app.ACTION_CALL_MUTE";
    public static final String ACTION_CALL_CAMERA = "com.ohmegle.app.ACTION_CALL_CAMERA";
    public static final String ACTION_CALL_END = "com.ohmegle.app.ACTION_CALL_END";
    public static final String ACTION_CALL_ACCEPT = "com.ohmegle.app.ACTION_CALL_ACCEPT";
    public static final String ACTION_CALL_DECLINE = "com.ohmegle.app.ACTION_CALL_DECLINE";

    private PowerManager.WakeLock wakeLock;
    private BroadcastReceiver notificationActionReceiver;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();

        // Acquire WakeLock to keep CPU & audio stream active when app is minimized
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (pm != null) {
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "LiveTalk:ActiveCallWakeLock");
            wakeLock.acquire(60 * 60 * 1000L); // 1 hour max
        }

        registerNotificationReceiver();
    }

    private void registerNotificationReceiver() {
        notificationActionReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (intent == null || intent.getAction() == null) return;
                String action = intent.getAction();

                if (CallServicePlugin.getInstance() != null) {
                    if (ACTION_CALL_MUTE.equals(action)) {
                        CallServicePlugin.getInstance().notifyCallAction("toggleMute");
                    } else if (ACTION_CALL_CAMERA.equals(action)) {
                        CallServicePlugin.getInstance().notifyCallAction("toggleCamera");
                    } else if (ACTION_CALL_END.equals(action)) {
                        CallServicePlugin.getInstance().notifyCallAction("endCall");
                        stopSelf();
                    } else if (ACTION_CALL_ACCEPT.equals(action)) {
                        CallServicePlugin.getInstance().notifyCallAction("acceptCall");
                        // Bring app to foreground
                        Intent openApp = new Intent(context, MainActivity.class);
                        openApp.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                        context.startActivity(openApp);
                    } else if (ACTION_CALL_DECLINE.equals(action)) {
                        CallServicePlugin.getInstance().notifyCallAction("declineCall");
                        stopSelf();
                    }
                }
            }
        };

        IntentFilter filter = new IntentFilter();
        filter.addAction(ACTION_CALL_MUTE);
        filter.addAction(ACTION_CALL_CAMERA);
        filter.addAction(ACTION_CALL_END);
        filter.addAction(ACTION_CALL_ACCEPT);
        filter.addAction(ACTION_CALL_DECLINE);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(notificationActionReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(notificationActionReceiver, filter);
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String strangerName = "Stranger";
        boolean isIncoming = false;

        if (intent != null) {
            if (intent.hasExtra("strangerName")) {
                strangerName = intent.getStringExtra("strangerName");
            }
            isIncoming = intent.getBooleanExtra("isIncoming", false);
        }

        // Open MainActivity when tapping notification
        Intent openAppIntent = new Intent(this, MainActivity.class);
        openAppIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pOpenApp = PendingIntent.getActivity(
            this, 0, openAppIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        if (isIncoming) {
            // ──── INCOMING CALL HEADS-UP NOTIFICATION ────
            PendingIntent pAccept = PendingIntent.getBroadcast(
                this, 4, new Intent(ACTION_CALL_ACCEPT).setPackage(getPackageName()),
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            PendingIntent pDecline = PendingIntent.getBroadcast(
                this, 5, new Intent(ACTION_CALL_DECLINE).setPackage(getPackageName()),
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            RemoteViews incomingView = new RemoteViews(getPackageName(), R.layout.incoming_call_notification);
            incomingView.setTextViewText(R.id.notification_incoming_caller_name, strangerName);
            incomingView.setOnClickPendingIntent(R.id.btn_notification_accept, pAccept);
            incomingView.setOnClickPendingIntent(R.id.btn_notification_decline, pDecline);

            Notification incomingNotification = new NotificationCompat.Builder(this, INCOMING_CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setCustomContentView(incomingView)
                .setCustomBigContentView(incomingView)
                .setStyle(new NotificationCompat.DecoratedCustomViewStyle())
                .setContentIntent(pOpenApp)
                .setFullScreenIntent(pOpenApp, true) // High Priority Heads-up Banner
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_CALL)
                .setOngoing(true)
                .setVibrate(new long[]{0, 500, 200, 500})
                .build();

            startForeground(INCOMING_NOTIFICATION_ID, incomingNotification);
            return START_NOT_STICKY;
        }

        // ──── ACTIVE ONGOING CALL CARD ────
        PendingIntent pMute = PendingIntent.getBroadcast(
            this, 1, new Intent(ACTION_CALL_MUTE).setPackage(getPackageName()),
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        PendingIntent pCamera = PendingIntent.getBroadcast(
            this, 2, new Intent(ACTION_CALL_CAMERA).setPackage(getPackageName()),
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        PendingIntent pEndCall = PendingIntent.getBroadcast(
            this, 3, new Intent(ACTION_CALL_END).setPackage(getPackageName()),
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        RemoteViews customView = new RemoteViews(getPackageName(), R.layout.custom_call_notification);
        customView.setTextViewText(R.id.notification_caller_name, strangerName);
        customView.setTextViewText(R.id.notification_call_duration, "LiveTalk by Likki • Call Active");

        customView.setOnClickPendingIntent(R.id.btn_notification_mute, pMute);
        customView.setOnClickPendingIntent(R.id.btn_notification_camera, pCamera);
        customView.setOnClickPendingIntent(R.id.btn_notification_open, pOpenApp);
        customView.setOnClickPendingIntent(R.id.btn_notification_end_call, pEndCall);

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setCustomContentView(customView)
            .setCustomBigContentView(customView)
            .setStyle(new NotificationCompat.DecoratedCustomViewStyle())
            .setContentIntent(pOpenApp)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setOngoing(true)
            .build();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            int serviceType = ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                serviceType |= ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA;
            }
            try {
                startForeground(NOTIFICATION_ID, notification, serviceType);
            } catch (Exception e) {
                startForeground(NOTIFICATION_ID, notification);
            }
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }

        return START_NOT_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager == null) return;

            // Active call channel
            NotificationChannel activeChannel = new NotificationChannel(
                CHANNEL_ID,
                "LiveTalk by Likki Calls",
                NotificationManager.IMPORTANCE_LOW
            );
            activeChannel.setDescription("Shows ongoing call control card when app is in background");
            manager.createNotificationChannel(activeChannel);

            // Incoming call channel (HIGH IMPORTANCE for Heads-up Banner)
            NotificationChannel incomingChannel = new NotificationChannel(
                INCOMING_CHANNEL_ID,
                "LiveTalk by Likki Incoming Calls",
                NotificationManager.IMPORTANCE_HIGH
            );
            incomingChannel.setDescription("Shows heads-up banner with Accept/Decline for incoming calls");
            incomingChannel.enableVibration(true);
            incomingChannel.setVibrationPattern(new long[]{0, 500, 200, 500});
            manager.createNotificationChannel(incomingChannel);
        }
    }

    @Override
    public void onDestroy() {
        if (notificationActionReceiver != null) {
            try {
                unregisterReceiver(notificationActionReceiver);
            } catch (Exception e) {}
            notificationActionReceiver = null;
        }
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
            wakeLock = null;
        }
        stopForeground(true);
        super.onDestroy();
    }
}
