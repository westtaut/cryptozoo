export class TelegramIntegration {
  constructor() {
    this.webApp = window.Telegram?.WebApp ?? null;
  }

  init() {
    if (!this.webApp) return;
    this.webApp.ready();
    this.webApp.expand();
    this.webApp.enableClosingConfirmation();
  }

  getUser() {
    return this.webApp?.initDataUnsafe?.user ?? { id: 'local-player', username: 'LocalTester' };
  }

  haptic(type = 'medium') {
    this.webApp?.HapticFeedback?.impactOccurred(type);
  }
}
