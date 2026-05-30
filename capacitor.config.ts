import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.livetalk.likki',
  appName: 'LiveTalk by Likki',
  webDir: 'dist',
  server: {
    // Allow mixed content for development
    androidScheme: 'https',
  },
  android: {
    // Allow WebRTC and camera permissions
    allowMixedContent: true,
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
