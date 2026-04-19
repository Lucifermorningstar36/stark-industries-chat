import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.starkindustries.chat',
  appName: 'Stark Industries Chat',
  webDir: '../frontend/dist',

  // Üretimde stark.net.tr'yi yükler
  // server: { url: 'https://stark.net.tr', cleartext: false },

  // Geliştirme modunda (emülatör) aşağıdaki satırı aktif et:
  // server: { url: 'http://10.0.2.2:5173', cleartext: true },

  android: {
    // APK imzalama için keystore bilgileri (build.gradle'da da ayarla)
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
    // Minimum Android 7.0 (API 24), hedef Android 14 (API 34)
    minWebViewVersion: 60,
    appendUserAgent: 'StarkIndustriesChat/1.0',
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
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0a0e17',
    },
  },
};

export default config;
