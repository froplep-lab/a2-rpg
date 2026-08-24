export class TelegramBridge {
  static init() {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      try {
        tg.setHeaderColor('#0f111a');
        tg.setBackgroundColor('#0f111a');
      } catch (e) {
        console.warn('Telegram theme color not supported');
      }
    }
  }
  static haptic(type = 'light') {
    const tg = window.Telegram?.WebApp;
    if (tg?.HapticFeedback) {
      if (type === 'success') tg.HapticFeedback.notificationOccurred('success');
      else if (type === 'error') tg.HapticFeedback.notificationOccurred('error');
      else tg.HapticFeedback.impactOccurred(type);
    }
  }
}