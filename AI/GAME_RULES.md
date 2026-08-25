# GAME / LEARNING RULES — ACTUAL CODE

## Session selection
Maximum session length is 24.

Learn mode order:
1. Due cards sorted by `dueAt`.
2. Fresh/learning candidates sorted by mastery, then `frequency`.
3. If fewer than 8 cards are selected, remaining topic cards are added by mastery/frequency.

Review mode: due cards only.

Category filtering is applied before queue construction; the selected category is defined by `statusFromReview()` output (`new`, `learning`, `review`, `mastered`).

## Answer quality
Current buttons map to:
- `Знаю` → q=4.
- `Не знаю` → q=0.
- Right swipe after reveal → q=4.
- Left swipe after reveal → q=0.

Answers are impossible while `state.answerLock` is active and the UI keeps the two answer buttons disabled until the card is flipped.

## SRS
`BALANCE.srsIntervals = [0,1,3,7,14,30,60]` days indexed from the next box after a Remember answer.
Forgotten card interval is 10 minutes.
Remember increments box up to 6 and reps; Forgot decrements box (not below 0) and increments lapses.

## Mastery/status
Mastery percentage = `box / 6 * 100` rounded.
A review record is considered mastered when box >= 5 and interval >= 21 days.
Status presentation uses `new`, `learning`, `review`, `mastered`.

## Rewards
Remember: +5 XP. Forgot: +1 XP.
Each answer increments total answers, daily learned count and today's history bucket. Correct/errors are split by answer quality.

## Streak
`touchActivity()` updates streak once per calendar day. A consecutive previous-day activity increments streak; otherwise it restarts at 1.

## Level
Starts at level 1 with 120 XP requirement. After level-up the next requirement is `floor(120 * 1.17^(level-1))`, capped at level 99.

## Forgotten-card requeue
A forgotten card is reinserted once later in the same session via `sessionRequeued`, avoiding repeated immediate requeues of the same key.
