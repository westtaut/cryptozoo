// ═══════════════════════════════════════════════════════
//  telegram.js  —  Telegram Mini App API integration
// ═══════════════════════════════════════════════════════

const TG = {
  app:  null,
  user: null,

  init() {
    const tg = window.Telegram?.WebApp;
    if (!tg) {
      console.warn('[TG] Not running inside Telegram');
      return false;
    }

    this.app  = tg;
    this.user = tg.initDataUnsafe?.user || null;

    // Tell Telegram the app is ready
    tg.ready();

    // Expand to full screen
    tg.expand();

    // Set theme colors
    tg.setHeaderColor('#07080f');
    tg.setBackgroundColor('#07080f');

    // Listen for theme changes
    tg.onEvent('themeChanged', () => {
      document.documentElement.style.setProperty(
        '--tg-accent', tg.themeParams.button_color || '#4F8EF7'
      );
    });

    // Listen for viewport resize
    tg.onEvent('viewportChanged', () => {
      document.documentElement.style.setProperty(
        '--tg-viewport-height', tg.viewportHeight + 'px'
      );
    });

    // Back button
    tg.BackButton.onClick(() => {
      if (UI.currentPopup) {
        UI.closePopup();
        tg.BackButton.hide();
      }
    });

    return true;
  },

  // Get current user ID (string)
  getUserId() {
    return this.user?.id ? String(this.user.id) : null;
  },

  // Get display name
  getName() {
    if (!this.user) return 'Player';
    return this.user.first_name || this.user.username || 'Player';
  },

  // Get username
  getUsername() {
    return this.user?.username || null;
  },

  // Get start param (referral ID)
  getStartParam() {
    return this.app?.initDataUnsafe?.start_param || null;
  },

  // Get raw initData for server auth
  getInitData() {
    return this.app?.initData || '';
  },

  // Show Telegram native popup
  showAlert(message) {
    if (this.app) {
      this.app.showAlert(message);
    } else {
      alert(message);
    }
  },

  // Show confirm dialog
  showConfirm(message, callback) {
    if (this.app) {
      this.app.showConfirm(message, callback);
    } else {
      callback(confirm(message));
    }
  },

  // Trigger haptic feedback
  haptic(type = 'light') {
    // type: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'
    this.app?.HapticFeedback?.impactOccurred(type);
  },

  hapticNotification(type = 'success') {
    // type: 'success' | 'warning' | 'error'
    this.app?.HapticFeedback?.notificationOccurred(type);
  },

  // Show back button
  showBack() {
    this.app?.BackButton?.show();
  },

  hideBack() {
    this.app?.BackButton?.hide();
  },

  // Open share link
  shareReferralLink(link) {
    const text = encodeURIComponent(`🐾 Join CryptoZoo! Collect animals & earn coins!\n${link}`);
    if (this.app) {
      this.app.openTelegramLink(`https://t.me/share/url?url=${link}&text=${text}`);
    } else {
      window.open(`https://t.me/share/url?url=${link}&text=${text}`, '_blank');
    }
  },

  // Is running inside Telegram?
  isInTelegram() {
    return !!this.app;
  },

  // Main button (big bottom button)
  mainBtn: {
    show(text, color, callback) {
      const btn = window.Telegram?.WebApp?.MainButton;
      if (!btn) return;
      btn.setText(text);
      btn.color = color || '#4F8EF7';
      btn.onClick(callback);
      btn.show();
    },
    hide() {
      window.Telegram?.WebApp?.MainButton?.hide();
    },
  },
};