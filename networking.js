export class WebSocketNetworkSystem {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.handlers = new Map();
    this.backoff = 1200;
  }

  connect() {
    if (!this.url) return;
    this.ws = new WebSocket(this.url);
    this.ws.onopen = () => { this.backoff = 1200; this.emit('open'); };
    this.ws.onmessage = (ev) => {
      try { const msg = JSON.parse(ev.data); this.emit(msg.type, msg.payload); } catch { /* ignore invalid packet */ }
    };
    this.ws.onclose = () => setTimeout(() => this.connect(), this.backoff = Math.min(this.backoff * 1.6, 12000));
    this.ws.onerror = () => this.ws?.close();
  }

  send(type, payload = {}) {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type, payload }));
  }

  on(event, handler) {
    (this.handlers.get(event) ?? this.handlers.set(event, []).get(event)).push(handler);
  }

  emit(event, payload = {}) {
    (this.handlers.get(event) || []).forEach((h) => h(payload));
  }
}
