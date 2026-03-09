const KEY='zoochain_save_v1';
export function saveState(state){ localStorage.setItem(KEY, JSON.stringify(state)); }
export function loadState(){ try{return JSON.parse(localStorage.getItem(KEY)||'null');}catch{return null;} }
