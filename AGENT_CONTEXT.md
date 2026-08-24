# GESTALT Autonomous Agent Context — v0.012

Product goal: create a premium, lightweight vocabulary trainer for German learning.

## Product foundation
1. Flashcards are the core product.
2. Pleasant learning loop: see word → recall → remember/forgot → next word.
3. Translation, pronunciation and example sentence are first-class features.
4. SRS must be understandable and persistent.
5. UI must feel premium, calm and fast.
6. Mobile-first, but responsive on desktop.
7. Telegram Mini App compatibility is required.

## Explicitly removed
Dice, battle, RPG combat and unrelated game systems are not part of the active foundation.

## Content rule
Structured vocabulary lives in `/data/words.json`. Existing content must be preserved. New vocabulary should be appended, not replace the old vocabulary.

## QA
Before each release:
- syntax check JS/server
- validate JSON
- test HTTP server and static assets
- check DOM references
- check offline cache
- verify Telegram fallbacks
- test SRS transitions
- verify ZIP integrity

## Design direction
Use the provided mobile screenshot as the primary visual reference: dark premium, electric violet/blue, large rounded flashcard, two primary answer buttons, floating bottom navigation, soft ambient glow, minimal motion.
