import { StorageSystem } from './storage.js';
import { ThemeSystem } from './themes.js';
import { UISystem } from './ui.js';
import { TelegramIntegration } from './telegram.js';
import { GameEngine } from './engine.js';

async function bootstrap() {
  const storage = new StorageSystem();
  const theme = new ThemeSystem(storage);
  theme.init();

  const telegram = new TelegramIntegration();
  telegram.init();

  const ui = new UISystem(theme);
  const animals = await fetch('./animals.json').then((r) => r.json());

  const game = new GameEngine({ db: animals, storage, ui, telegram });
  game.start();
  window.addEventListener('beforeunload', () => game.stop());
}

bootstrap();
