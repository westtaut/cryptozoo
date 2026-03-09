const THEMES = {
  iosLight: {
    '--bg': 'radial-gradient(circle at top, #f4f7ff, #dfe8ff 70%)',
    '--panel': 'rgba(255,255,255,0.82)',
    '--panel-border': 'rgba(255,255,255,0.85)',
    '--text': '#172038', '--text-soft': '#607198', '--accent': '#4b83ff', '--accent-2': '#67d8ff',
  },
  iosDark: {
    '--bg': 'radial-gradient(circle at top, #2f3f73, #121a2f 60%)', '--panel': 'rgba(255,255,255,0.12)',
    '--panel-border': 'rgba(255,255,255,0.25)', '--text': '#f4f7ff', '--text-soft': '#cad3ec', '--accent': '#4ea3ff', '--accent-2': '#7ce7ff',
  },
  neonCyber: {
    '--bg': 'radial-gradient(circle at top, #201047, #090314 66%)', '--panel': 'rgba(45, 19, 93, 0.55)',
    '--panel-border': 'rgba(112, 90, 255, 0.5)', '--text': '#e8dbff', '--text-soft': '#b69bf1', '--accent': '#00d2ff', '--accent-2': '#ff48c4',
  },
  jungleGreen: {
    '--bg': 'radial-gradient(circle at top, #1f5331, #10261a 65%)', '--panel': 'rgba(30,80,54,0.5)',
    '--panel-border': 'rgba(118, 191, 156, .5)', '--text': '#ecfff2', '--text-soft': '#b8e4c6', '--accent': '#50d98a', '--accent-2': '#96f2b5',
  },
  goldenPremium: {
    '--bg': 'radial-gradient(circle at top, #6e4f1f, #23170a 65%)', '--panel': 'rgba(97,75,34,.55)',
    '--panel-border': 'rgba(255, 219, 116, .45)', '--text': '#fff8e5', '--text-soft': '#f0d8a1', '--accent': '#ffc43a', '--accent-2': '#ffea9c',
  },
};

export class ThemeSystem {
  constructor(storage) {
    this.storage = storage;
    this.key = 'theme';
  }

  apply(themeName) {
    const vars = THEMES[themeName] || THEMES.iosDark;
    Object.entries(vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
    this.storage.set(this.key, themeName);
  }

  init() { this.apply(this.storage.get(this.key, 'iosDark')); }
  all() { return Object.keys(THEMES); }
}
