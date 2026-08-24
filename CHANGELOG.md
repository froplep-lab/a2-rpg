# Changelog

## v0.012 — Premium Vocabulary Foundation

### Added
- Next-generation Anki-style mobile UI matching the provided reference.
- Progress card with circular daily progress and 7-day activity bars.
- 24-card learning sessions.
- Two primary actions: Remembered / Forgot.
- Smooth flashcard flip for contextual example view.
- Favorite words.
- German voice controls and automatic pronunciation option.
- Collection search and custom-word modal.
- Statistics: totals, mastery levels, due reviews, accuracy, seven-day activity.
- Kursbuch 8 “Am Wochenende” vocabulary appended to the structured word database.
- Emoji attached to every newly added course word.

### Removed
- Dice.
- Battle systems.
- RPG combat.
- Enemy/wave/game mechanics.

### Fixed
- Simplified navigation to reduce accidental actions.
- Improved SRS flow and daily history tracking.
- Improved Telegram/back navigation and safe-area handling.
- Service worker cache version updated to v0.012.

### Design
Dark premium, violet/blue electric accent, lightweight glassmorphism, mobile-first responsive layout, reduced-motion support.

## v0.013 — Content & Reliability

### Added
- Full 123-item Kursbuch 8 `Am Wochenende` vocabulary set, including the `die Diskothek` variant and `halb-`.
- Natural German example sentences and Ukrainian example translations for the complete course set.

### Fixed
- Unseen cards were incorrectly reported as overdue in the Review section.
- Several course example sentences were grammatically invalid or placeholder text.
- Local-date calculations could shift the daily progress/streak around UTC midnight.
- Auto pronunciation could fire repeatedly after routine UI updates.
- Review start navigation now opens the study surface consistently.
- Telegram CloudStorage writes are debounced after user actions.
- Telegram theme/viewport callbacks are kept in sync.
- Added desktop keyboard shortcuts for fast study.
