export class CardManager {
  static getRarityTier(level) {
    if (level >= 50) return 'legendary'; 
    if (level >= 25) return 'epic';
    if (level >= 10) return 'rare'; 
    if (level >= 5) return 'uncommon'; 
    return 'common';
  }
  static getXPForNextLevel(level) { return level * 100; }
  static addXP(state, cardId, amount) {
    if (!state.cards[cardId]) state.cards[cardId] = { level: 1, xp: 0, mastery: 0, bookmarked: false };
    let card = state.cards[cardId];
    card.xp += amount;
    let requiredXP = this.getXPForNextLevel(card.level);
    while (card.xp >= requiredXP) {
      card.xp -= requiredXP; 
      card.level += 1; 
      card.mastery += 10;
      requiredXP = this.getXPForNextLevel(card.level);
    }
    return card;
  }
}