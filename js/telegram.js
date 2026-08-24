export const TelegramBridge = {
    init() {
        if (window.Telegram && window.Telegram.WebApp) {
            const tg = window.Telegram.WebApp;
            try {
                tg.ready();
                tg.expand();
                tg.setHeaderColor('#090d16');
                tg.setBackgroundColor('#090d16');
            } catch (e) {
                console.warn("[TelegramBridge] Init error:", e);
            }
        }
    }
};

export const Haptics = {
    trigger(type = 'medium') {
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
            const hf = window.Telegram.WebApp.HapticFeedback;
            if (type === 'success') hf.notificationOccurred('success');
            else if (type === 'error') hf.notificationOccurred('error');
            else if (type === 'light') hf.impactOccurred('light');
            else hf.impactOccurred('medium');
        } else if (navigator.vibrate) {
            if (type === 'success') navigator.vibrate([30, 50, 30]);
            else if (type === 'error') navigator.vibrate([100, 50, 100]);
            else navigator.vibrate(25);
        }
    }
};