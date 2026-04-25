import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.starkindustries.chat',
  appName: 'Stark Industries Chat',
  webDir: '../frontend/dist',

  // Canlı sunucuyu WebView içinde yükler (frontend build gerekmez)
  server: {
    url: 'https://stark.net.tr',
    cleartext: false,
    androidScheme: 'https',
  },

  android: {
    minWebViewVersion: 60,
    appendUserAgent: 'StarkIndustriesChat/1.0 Android',
    backgroundColor: '#0a0e17',
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2500,
      backgroundColor: '#0a0e17',
      showSpinner: true,
      spinnerColor: '#00b4c8',
      androidSpinnerStyle: 'large',
      launchFadeOutDuration: 500,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0a0e17',
      overlaysWebView: false,
    },
  },
};

export default config;
