# ARCHITECTURE — ACTUAL IMPLEMENTATION

## Topology
```text
index.html
  ├─ external Telegram Web App SDK
  ├─ css/main.css
  └─ js/app.js
       ├─ localStorage save model
       ├─ vocabulary loader/validator
       ├─ SRS/session selection
       ├─ DOM rendering + event binding
       ├─ Web Speech API
       └─ Telegram WebApp/CloudStorage bridge

server/index.mjs
  ├─ static file server
  └─ optional Telegram Bot API/webhook/polling

sw.js
  ├─ app shell cache
  └─ network-first vocabulary cache fallback
```

## Architectural shape
The frontend is a single stateful ES module. Persistence normalization is centralized in `normalizeSave()`; nested `mastery`, `review`, `history`, and favorites are repaired there before use. `save` is the persistent learner model; `state` is transient UI/session state; `words` is the loaded bundled vocabulary; `save.customWords` extends that dataset.

## Important separation
- Persistent learner state: `save`.
- Transient UI state: `state`.
- Derived vocabulary views: `mergedWords()`, `topics()`, `filterTopic()`, `dueWords()`.
- Rendering side effects: `renderAll()` and its render helpers.

## DOM coupling
`app.js` directly addresses a fixed set of element ids (`$('...')`). Removing/renaming any referenced id is a breaking change unless the controller is updated at the same time.

## Card transform invariant
Only `.flashcard-inner` receives the flipped state transform. The 3D track contains the real card faces: `.flash-front` at `rotateY(0deg)` and `.flash-back` at `rotateY(180deg)`, both with `backface-visibility:hidden`. When flipped, `inner 180° + back 180° = identity`, so the Ukrainian content is readable. Do not add shell transforms or extra overlay transforms.

## Server boundary
The Node server has no database. It serves files and, when `BOT_TOKEN` is set, talks to Telegram Bot API for bot commands/webhook/polling. Browser learner progress does not pass through the Node server; it is stored locally and/or in Telegram CloudStorage from the client.


### Current flashcard DOM contract

```text
.flashcard
└── #flashcardInner  (sole 3D transform track)
    ├── .flash-front (rotateY(0deg))
    └── .flash-back  (rotateY(180deg), real Ukrainian content)
```

The back content is not an external overlay. This is intentional: the standard 180° + 180° arrangement keeps the translated text readable after the track flip.
