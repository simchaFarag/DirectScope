/**
 * Helpers for the store apps (Capacitor shell around this same site – see capacitor.config.ts).
 * In a normal browser they fall back to the web APIs, so the site behaves exactly as before.
 */
import { Capacitor } from '@capacitor/core';

export const isNativeApp = Capacitor.isNativePlatform();

/** Android back button: one screen back, and on the first screen send the app to the background like other apps do. */
export async function initNativeApp() {
  if (!isNativeApp) return;
  const { App } = await import('@capacitor/app');
  await App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) window.history.back();
    else void App.minimizeApp();
  });
}

/**
 * Opens an uploaded file (PDF, image…) for viewing. The app's web view can't show PDFs or leave the page,
 * so in the app files open in the in-app browser sheet, which has its own close button.
 */
export async function openFile(url: string) {
  const abs = new URL(url, window.location.href).href;
  if (!isNativeApp) {
    window.open(abs, '_blank', 'noopener');
    return;
  }
  const { Browser } = await import('@capacitor/browser');
  await Browser.open({ url: abs });
}

/** The OS share sheet. Returns false when there is none (desktop browsers), so the caller can fall back. */
export async function shareText(title: string, text: string) {
  if (isNativeApp) {
    const { Share } = await import('@capacitor/share');
    await Share.share({ title, text, dialogTitle: title }).catch(() => {});
    return true;
  }
  if (!navigator.share) return false;
  await navigator.share({ title, text }).catch(() => {});
  return true;
}
