import { Capacitor } from "@capacitor/core";

/**
 * Inicializações específicas do app nativo (iOS/Android via Capacitor).
 * Em ambiente web (navegador/PWA) nada disso roda.
 */
export async function initNative() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Dark });
  } catch {
    // StatusBar indisponível nesta plataforma — ignora.
  }

  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide();
  } catch {
    // SplashScreen indisponível — ignora.
  }
}
