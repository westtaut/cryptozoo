export class StorageSystem {
  constructor(prefix = "cryptozoo") { this.prefix = prefix; }
  key(k) { return `${this.prefix}:${k}`; }
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(this.key(key));
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }
  set(key, value) { localStorage.setItem(this.key(key), JSON.stringify(value)); }
  remove(key) { localStorage.removeItem(this.key(key)); }
}
