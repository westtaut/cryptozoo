export const THEMES = {
  'iOS Light': { '--bg': '#eef3ff', '--bg2': '#ffffff', '--text': '#0f172a', '--muted': '#64748b', '--panel': 'rgba(255,255,255,.66)', '--stroke': 'rgba(255,255,255,.75)', '--primary': '#4f46e5', '--accent': '#0ea5e9' },
  'iOS Dark': { '--bg': '#040712', '--bg2': '#0b1224', '--text': '#e2e8f0', '--muted': '#94a3b8', '--panel': 'rgba(15,23,42,.64)', '--stroke': 'rgba(148,163,184,.25)', '--primary': '#60a5fa', '--accent': '#a78bfa' },
  'Neon Cyber': { '--bg': '#03050f', '--bg2': '#0a1026', '--text': '#e0f2fe', '--muted': '#67e8f9', '--panel': 'rgba(5,15,40,.62)', '--stroke': 'rgba(34,211,238,.35)', '--primary': '#22d3ee', '--accent': '#8b5cf6' },
  'Jungle Green': { '--bg': '#08180f', '--bg2': '#153427', '--text': '#ecfdf5', '--muted': '#86efac', '--panel': 'rgba(18,56,38,.58)', '--stroke': 'rgba(134,239,172,.3)', '--primary': '#22c55e', '--accent': '#65a30d' },
  'Golden Premium': { '--bg': '#181105', '--bg2': '#3a2d0d', '--text': '#fef3c7', '--muted': '#fcd34d', '--panel': 'rgba(56,40,12,.6)', '--stroke': 'rgba(251,191,36,.35)', '--primary': '#f59e0b', '--accent': '#fbbf24' }
};

export function applyTheme(name) {
  const theme = THEMES[name] || THEMES['iOS Light'];
  Object.entries(theme).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
  localStorage.setItem('zoo_theme', name);
}

export function getSavedTheme() { return localStorage.getItem('zoo_theme') || 'iOS Light'; }
