export class AnimationEngine {
  async playRoulette(container, reel, winnerId) {
    container.innerHTML = '';
    const track = document.createElement('div');
    track.className = 'case-roulette';
    reel.forEach((item) => {
      const node = document.createElement('div');
      node.className = `roulette-item rarity-${item.rarity}`;
      node.innerHTML = `<div>${item.emoji}</div><small>${item.name}</small>`;
      track.appendChild(node);
    });
    container.appendChild(track);

    const width = 90;
    const winnerIndex = reel.findIndex((r) => r.id === winnerId);
    const target = winnerIndex * width;
    await this.animateValue(0, target, 2300, (v) => { track.style.transform = `translateX(${-v}px)`; });
  }

  animateValue(from, to, duration, onUpdate) {
    return new Promise((resolve) => {
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - (1 - t) ** 3;
        const value = from + (to - from) * eased;
        onUpdate(value);
        if (t < 1) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
  }

  playUltraRareBurst() {
    const flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;inset:0;background:radial-gradient(circle,#fff,#ff4f9a,#33e0ff);opacity:0.0;pointer-events:none;z-index:999;';
    document.body.appendChild(flash);
    this.animateValue(0, 1, 300, (v) => flash.style.opacity = `${Math.sin(v * Math.PI) * 0.7}`)
      .then(() => flash.remove());
  }
}
