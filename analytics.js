export class AnalyticsSystem {
  constructor(storage) {
    this.storage = storage;
    this.events = [];
    this.maxEvents = 4000;
  }

  track(type, payload = {}) {
    this.events.push({ type, payload, ts: Date.now() });
    if (this.events.length > this.maxEvents) this.events.shift();
  }

  summarizeEconomy() {
    const oneHourAgo = Date.now() - 3_600_000;
    const recent = this.events.filter((e) => e.ts > oneHourAgo);
    const incomeEvents = recent.filter((e) => e.type === "income_tick");
    const caseOpens = recent.filter((e) => e.type === "case_open").length;
    const sinkEvents = recent.filter((e) => ["upgrade_pay", "market_fee"].includes(e.type));

    const avgIncome = incomeEvents.length
      ? incomeEvents.reduce((s, e) => s + (e.payload.amount ?? 0), 0) / incomeEvents.length
      : 0;
    const sinkRate = incomeEvents.length ? sinkEvents.length / incomeEvents.length : 0;

    return { avgIncome, caseOpens, sinkRate, targetIncome: 800 };
  }

  flush() { this.storage.set("analytics_events", this.events); }
  load() { this.events = this.storage.get("analytics_events", []); }
}
