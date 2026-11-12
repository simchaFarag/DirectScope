import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Native app shell (Android + iOS) around the live web app.
 *
 * The app loads the production site directly (server.url), so the API, uploaded files and login all stay
 * same-origin, and every deploy to the server updates the app without a new store release.
 * Change APP_URL when the real domain is ready, then run `npm run cap:sync` and release a new version.
 * For testing against a dev server: APP_URL=http://10.0.2.2:5173 npx cap sync android (10.0.2.2 = this PC from the emulator).
 */
const APP_URL = process.env.APP_URL ?? 'https://directscope.212.150.53.124.nip.io';

const config: CapacitorConfig = {
  appId: 'il.co.directscope.app',
  appName: 'DirectScope',
  webDir: 'dist',
  server: {
    url: APP_URL,
    // shown when the server can't be reached (no internet) – its "try again" button opens data-app in that file
    errorPath: 'app-offline.html',
    androidScheme: 'https',
    cleartext: APP_URL.startsWith('http:'),
  },
  android: {
    allowMixedContent: false,
  },
  ios: {
    contentInset: 'never',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      backgroundColor: '#F7F9FC',
      showSpinner: false,
    },
    // the site draws under the status bar (viewport-fit=cover + safe-area insets); LIGHT = dark icons on the light background
    SystemBars: {
      style: 'LIGHT',
    },
  },
};

export default config;
