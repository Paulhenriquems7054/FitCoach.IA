/**
 * Capacitor Configuration
 * 
 * Configuração do Capacitor para empacotamento do app como aplicativo nativo
 * Suporta: Android, iOS, Electron (Desktop)
 */

import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fitcoach.ia',
  appName: 'FitCoach.IA',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#1A4D2E',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      iosSpinnerStyle: 'small',
      spinnerColor: '#F5F1E8',
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#1A4D2E',
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
    allowMixedContent: true,
  },
  ios: {
    scheme: 'FitCoach.IA',
    contentInset: 'automatic',
  },
};

export default config;

