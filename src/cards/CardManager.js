export class CardManager{
 static getRarityTier(level){return level>=50?'legendary':level>=25?'epic':level>=10?'rare':level>=5?'uncommon':'common'}
 static getXPForNextLevel(level){return Math.max(100,level*100)}
 static addXP(state,id,amount){if(!state.cards[id])state.cards[id]={level:1,xp:0,mastery:0,bookmarked:false};const c=state.cards[id];c.xp+=amount;let req=this.getXPForNextLevel(c.level);while(c.xp>=req){c.xp-=req;c.level++;c.mastery=Math.min(100,c.mastery+10);req=this.getXPForNextLevel(c.level)}return c}
}