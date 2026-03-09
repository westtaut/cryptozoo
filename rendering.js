export class RenderingSystem {
  constructor() {
    this.queue = new Set();
    this.scheduled = false;
  }

  invalidate(fn) {
    this.queue.add(fn);
    if (!this.scheduled) {
      this.scheduled = true;
      requestAnimationFrame(() => this.flush());
    }
  }

  flush() {
    this.queue.forEach((fn) => fn());
    this.queue.clear();
    this.scheduled = false;
  }
}
