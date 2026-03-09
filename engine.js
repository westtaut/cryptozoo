import { AnimalRegistry } from './animals.js';
import { EconomyEngine } from './economy.js';
import { CaseEngine } from './cases.js';
import { MarketplaceSystem } from './market.js';
import { AuctionSystem } from './auction.js';
import { PvPSystem } from './pvp.js';
import { LeaderboardSystem } from './leaderboard.js';
import { QuestSystem } from './quests.js';
import { DailyRewardSystem } from './rewards.js';
import { ProgressionSystem } from './progression.js';
import { EventSystem } from './events.js';
import { AnalyticsSystem } from './analytics.js';
import { AnimationEngine } from './animations.js';

export class GameEngine {
  constructor({ db, storage, ui, telegram }) {
    this.storage = storage;
    this.ui = ui;
    this.telegram = telegram;

    this.registry = new AnimalRegistry(db);
    this.economy = new EconomyEngine();
    this.animation = new AnimationEngine();
    this.cases = new CaseEngine(this.registry, this.economy, this.animation);
    this.market = new MarketplaceSystem(this.economy);
    this.auction = new AuctionSystem(this.economy);
    this.pvp = new PvPSystem(this.economy);
    this.leaderboard = new LeaderboardSystem();
    this.quests = new QuestSystem(this.economy);
    this.rewards = new DailyRewardSystem(this.economy);
    this.progression = new ProgressionSystem();
    this.events = new EventSystem(this.economy);
    this.analytics = new AnalyticsSystem(storage);

    this.player = this.loadPlayer();
    this.tickHandle = null;
  }

  loadPlayer() {
    const tgUser = this.telegram.getUser();
    return this.storage.get('player', {
      id: tgUser.id,
      name: tgUser.username || 'zookeeper',
      level: 1,
      xp: 0,
      zooLevel: 1,
      prestige: 0,
      coins: 800,
      tokens: 50,
      streak: 0,
      lastClaimDay: 0,
      quests: this.quests.generateDaily(1),
      animals: [],
      inventory: [],
      metrics: { income: 0, rareAnimals: 0, pvpWins: 0 },
    });
  }

  save() { this.storage.set('player', this.player); this.analytics.flush(); }

  start() {
    this.ui.mountTabs();
    this.ui.onTab = (tab) => this.renderTab(tab);
    this.renderTab(this.ui.activeTab);
    this.loop();
  }

  loop() {
    const tick = () => {
      const boosts = this.events.getBoosts();
      const income = this.economy.calculateZooIncome(this.player.animals, this.player, boosts) / 4;
      this.player.coins += income;
      this.player.metrics.income = income * 4;
      this.analytics.track('income_tick', { amount: income });
      this.events.tick(this.player.level);
      const unlocked = this.progression.apply(this.player, 2);
      if (unlocked.length) this.analytics.track('unlock', { unlocked });
      this.economy.analyzeAndBalance(this.analytics.summarizeEconomy());
      this.ui.setTop(this.player);
      this.tickHandle = setTimeout(tick, 250);
    };
    tick();
  }

  stop() { clearTimeout(this.tickHandle); this.save(); }

  renderTab(tab) {
    this.ui.setTop(this.player);
    if (tab === 'Map') {
      const animals = this.player.animals.map((inst) => {
        const base = this.registry.getById(inst.baseId);
        return { ...inst, name: base.name, emoji: base.emoji };
      });
      this.ui.renderMap(animals, (a) => this.economy.calculateAnimalIncome(a, this.player.zooLevel));
      return;
    }

    if (tab === 'Cases') {
      const price = this.economy.casePrice(120, this.player.level);
      const rouletteNode = this.ui.renderCases(price, async () => {
        if (this.player.coins < price) return;
        this.player.coins -= price;
        const result = await this.cases.openCaseWithRoulette(rouletteNode, this.player.id);
        this.player.animals.push(result.animal);
        this.analytics.track('case_open', { rarity: result.rarity });
        this.quests.update(this.player.quests, 'cases', 1);
      });
      return;
    }

    if (tab === 'Animals') {
      const animals = this.player.animals.map((inst) => ({ ...inst, ...this.registry.getById(inst.baseId) }));
      this.ui.renderAnimals(animals);
      return;
    }

    if (tab === 'Market') this.ui.renderSimple('Market', '<p>P2P listings, filters, and instant buy are active in core systems.</p>');
    else if (tab === 'Auction') this.ui.renderSimple('Auction', '<p>Timed auctions with anti-sniping extension are enabled.</p>');
    else if (tab === 'PvP') this.ui.renderSimple('PvP', '<p>Async battle ladder and rewards configured.</p>');
    else if (tab === 'Leaderboard') this.ui.renderSimple('Leaderboard', '<p>Income, rarity and PvP rankings available.</p>');
    else if (tab === 'Daily') {
      const day = Math.floor(Date.now() / 86_400_000);
      const claim = this.rewards.claim(this.player, day);
      this.ui.renderSimple('Daily Rewards', `<p>${claim.ok ? `Claimed ${claim.reward} coins (streak ${claim.streak})` : 'Already claimed today'}</p>`);
    } else if (tab === 'Settings') {
      this.ui.renderSettings((theme) => this.ui.themeSystem.apply(theme));
    }
  }
}
