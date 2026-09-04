import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.incogtalk.likki',
  appName: 'IncogTalk',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Allow all origins for WebRTC signaling and Firebase
    allowNavigation: ['*'],
  },
  android: {
    allowMixedContent: true,
    // Enable remote debugging via chrome://inspect
    webContentsDebuggingEnabled: true,
    // Ensure the WebView captures focus for input
    initialFocus: true,
    // Use hardware-accelerated rendering
    backgroundColor: '#0f0f23',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0f0f23',
      showSpinner: false,
    },
  },
};

export default config;
