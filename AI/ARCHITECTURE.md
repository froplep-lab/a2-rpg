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
The frontend is a single stateful ES module. `save` is the persistent learner model; `state` is transient UI/session state; `words` is the loaded bundled vocabulary; `save.customWords` extends that dataset.

## Important separation
- Persistent learner state: `save`.
- Transient UI state: `state`.
- Derived vocabulary views: `mergedWords()`, `topics()`, `filterTopic()`, `dueWords()`.
- Rendering side effects: `renderAll()` and its render helpers.

## DOM coupling
`app.js` directly addresses a fixed set of element ids (`$('...')`). Removing/renaming any referenced id is a breaking change unless the controller is updated at the same time.

## Card transform invariant
Only `.flashcard` receives the flipped state transform. Front face remains at its normal orientation; back face retains `rotateY(180deg)` and `backface-visibility:hidden`. Do not introduce a second child rotation.

## Server boundary
The Node server has no database. It serves files and, when `BOT_TOKEN` is set, talks to Telegram Bot API for bot commands/webhook/polling. Browser learner progress does not pass through the Node server; it is stored locally and/or in Telegram CloudStorage from the client.
