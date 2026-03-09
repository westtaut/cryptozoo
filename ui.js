export class UISystem {
  constructor(themeSystem) {
    this.themeSystem = themeSystem;
    this.container = document.getElementById('screen-container');
    this.tabsNode = document.getElementById('tab-nav');
    this.activeTab = 'Map';
    this.tabs = ['Map','Cases','Animals','Market','Auction','PvP','Leaderboard','Daily','Settings'];
    this.onTab = () => {};
  }

  mountTabs() {
    this.tabsNode.innerHTML = '';
    this.tabs.forEach((tab) => {
      const b = document.createElement('button');
      b.className = `tab-btn ${tab === this.activeTab ? 'active': ''}`;
      b.textContent = tab;
      b.addEventListener('click', () => {
        this.activeTab = tab;
        this.mountTabs();
        this.onTab(tab);
      });
      this.tabsNode.appendChild(b);
    });
  }

  setTop(player) {
    document.getElementById('player-level').textContent = `Level ${player.level}`;
    document.getElementById('coins').textContent = Math.floor(player.coins).toLocaleString();
    document.getElementById('tokens').textContent = Math.floor(player.tokens).toLocaleString();
  }

  renderMap(playerAnimals, incomeFn) {
    this.container.innerHTML = `<section class="panel glass"><h2>Zoo Map</h2><div class="zoo-grid" id="zoo-grid"></div></section>`;
    const grid = this.container.querySelector('#zoo-grid');
    for (let i = 0; i < 12; i += 1) {
      const cell = document.createElement('div');
      cell.className = 'zoo-cell';
      const animal = playerAnimals[i];
      if (animal) {
        cell.innerHTML = `<div class="animal-card rarity-${animal.rarity}"><div class="emoji">${animal.emoji}</div><div><h3>${animal.name}</h3><p>Lv.${animal.level}</p><p>+${Math.round(incomeFn(animal))}/s</p></div></div>`;
      }
      grid.appendChild(cell);
    }
  }

  renderCases(casePrice, onOpen) {
    this.container.innerHTML = `<section class="panel glass"><h2>Cases</h2><p>Price: ${casePrice} coins</p><button class="btn" id="open-case">Open Case</button><div id="roulette"></div></section>`;
    this.container.querySelector('#open-case').addEventListener('click', onOpen);
    return this.container.querySelector('#roulette');
  }

  renderAnimals(list) {
    this.container.innerHTML = '<section class="panel glass"><h2>Animals</h2><div id="animals-list"></div></section>';
    const wrap = this.container.querySelector('#animals-list');
    list.forEach((a) => {
      const row = document.createElement('div');
      row.className = `animal-card rarity-${a.rarity}`;
      row.innerHTML = `<div class="emoji">${a.emoji}</div><div><h3>${a.name}</h3><p>${a.rarity} • ${a.mutation}</p></div>`;
      wrap.appendChild(row);
    });
  }

  renderSimple(title, body) { this.container.innerHTML = `<section class="panel glass"><h2>${title}</h2>${body}</section>`; }

  renderSettings(onThemeChange) {
    this.container.innerHTML = '<section class="panel glass"><h2>Settings</h2><div id="theme-grid"></div></section>';
    const grid = this.container.querySelector('#theme-grid');
    this.themeSystem.all().forEach((theme) => {
      const b = document.createElement('button');
      b.className = 'btn-secondary';
      b.textContent = theme;
      b.addEventListener('click', () => onThemeChange(theme));
      grid.appendChild(b);
    });
  }
}
