export const THEMES = {
  iosLight:{'--bg':'#f5f7fb','--bg2':'#ffffff','--text':'#111827','--muted':'#6b7280','--panel':'rgba(255,255,255,.7)','--stroke':'rgba(255,255,255,.7)','--primary':'#3b82f6','--accent':'#8b5cf6'},
  iosDark:{'--bg':'#06080e','--bg2':'#111827','--text':'#e5e7eb','--muted':'#94a3b8','--panel':'rgba(15,23,42,.55)','--stroke':'rgba(148,163,184,.25)','--primary':'#60a5fa','--accent':'#a78bfa'},
  neonCyber:{'--bg':'#06060f','--bg2':'#0f172a','--text':'#e2e8f0','--muted':'#94a3b8','--panel':'rgba(10,15,30,.62)','--stroke':'rgba(56,189,248,.35)','--primary':'#22d3ee','--accent':'#8b5cf6'},
  jungle:{'--bg':'#0c1510','--bg2':'#1f3b2e','--text':'#ecfdf5','--muted':'#86efac','--panel':'rgba(20,50,35,.6)','--stroke':'rgba(134,239,172,.25)','--primary':'#22c55e','--accent':'#65a30d'},
  golden:{'--bg':'#1a1205','--bg2':'#3b2d0d','--text':'#fef3c7','--muted':'#fcd34d','--panel':'rgba(52,38,14,.65)','--stroke':'rgba(251,191,36,.35)','--primary':'#f59e0b','--accent':'#fbbf24'}
};

export function applyTheme(name){
  const theme = THEMES[name] || THEMES.iosLight;
  Object.entries(theme).forEach(([k,v])=>document.documentElement.style.setProperty(k,v));
  localStorage.setItem('zoo_theme', name);
}

export function getSavedTheme(){ return localStorage.getItem('zoo_theme') || 'iosLight'; }
