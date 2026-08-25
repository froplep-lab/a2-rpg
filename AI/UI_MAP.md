# UI MAP

## Layout
### Global
- top bar: page title/search/menu/profile.
- desktop rail: navigation and footer chips.
- mobile bottom nav: five actions, centered add action.
- modal: add-word dialog.

### Learn screen
- topic select + inline topic title.
- category status pills: all/new/learning/review/mastered.
- `flashcard` with front/back faces.
- primary answer buttons.
- stats subview.
- collection subview.

### Review screen
- review hero and start button.
- due/today/streak metrics.
- due word list.

### Collections
- search.
- topic filter.
- word list with mastery and due badge.

### Settings
- auto speak, transcription, rate, voice, reduced motion, theme.
- Telegram sync.
- export/import/reset.

## Card DOM contract
Important ids include `cardWrap`, `flashcard`, `wordGerman`, `wordMeaning`, `backGerman`, `backMeaning`, `backMeaningNote`, `sentenceToggle`, `sentencePanel`, `backSentence`, `backSentenceUa`, `rememberBtn`, `forgotBtn`, `favoriteBtn`, `speakWord`, `speakSentence`. Topic header also includes derived `topicWordCount`.

## Rendering contract
`renderCard()` writes directly into the card DOM. It disables answer controls if not flipped or while `answerLock` is active. The sentence panel starts collapsed and opens only after reveal.

## Responsive rules
- Mobile breakpoint: `max-width:640px`.
- Desktop rail breakpoint: `min-width:980px`.
- Tablet-related CSS includes `min-width:600px`.
- Safe-area variables cover browser/Telegram bottom insets.

## Card 3D invariant
`.flashcard.is-flipped { transform: rotateY(180deg) }`; `.flash-back { transform: rotateY(180deg) }`; faces use `backface-visibility:hidden` and `transform-style:flat`. No child flip override or face transform transition.
