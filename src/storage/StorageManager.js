export class StorageManager {
  static STORAGE_KEY = 'rdc_save_v1';
  static defaultState() {
    return {
      playerLevel: 1, playerXP: 0, coins: 150,
      cards: {
        heimat: { level: 1, xp: 0, mastery: 0, bookmarked: true },
        mann: { level: 1, xp: 0, mastery: 0, bookmarked: false },
        unterhalten: { level: 1, xp: 0, mastery: 0, bookmarked: false },
        wirken: { level: 1, xp: 0, mastery: 0, bookmarked: false },
        buch: { level: 1, xp: 0, mastery: 0, bookmarked: true },
        arbeit: { level: 1, xp: 0, mastery: 0, bookmarked: false },
        sprechen: { level: 1, xp: 0, mastery: 0, bookmarked: false },
        lernen: { level: 1, xp: 0, mastery: 0, bookmarked: false },
        freund: { level: 1, xp: 0, mastery: 0, bookmarked: false },
        zeit: { level: 1, xp: 0, mastery: 0, bookmarked: false }
      },
      settings: { quality: 'HIGH', sound: true }
    };
  }
  static load() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return this.save(this.defaultState());
      return JSON.parse(data);
    } catch (e) { return this.defaultState(); }
  }
  static save(state) {
    try { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state)); return state; }
    catch (e) { return state; }
  }
}