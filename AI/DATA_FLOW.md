# DATA FLOW

## Startup
```text
Browser loads index.html
  → JS module evaluates
  → boot()
  → loadSave()
  → syncTheme/buildNav/bind
  → pickSession('learn') using initially empty words[]
  → renderAll()
  → loadWordData()
       compact request → expand → validate
       fallback to full JSON
       retry unversioned compact/full URLs
  → repair/choose current topic
  → pickSession() again with real vocabulary
  → renderAll()
  → Telegram init / Service Worker register / storage persist request
```

## Learn card
```text
user tap / Enter / Space
 → toggleFlip()
 → state.flipped changes
 → renderCard()

user chooses Remember/Forgot or valid swipe after reveal
 → answerWord(q)
 → mutate review + mastery + counters + history + streak + XP
 → persist()
 → delayed session index advance
 → renderAll()
 → optional auto speech
```

## Topic selection
```text
select change
 → setTopic()
 → state.currentTopic + save.currentTopic
 → persist()
 → pickSession()
 → renderTopicSelectors() + renderAll()
```

## Persistence
```text
save mutation
 → persist()
 → localStorage
 → scheduleTelegramSave()
 → after 900ms → cloudSave() if Telegram CloudStorage exists
```

## Import
```text
file input
 → FileReader
 → JSON.parse
 → normalizeSave()
 → persist()
 → rebuild session if needed
 → renderAll()
```

## Telegram remote load
```text
initTelegram()
 → tgLoadSdk()
 → applyTelegram()
 → cloudLoad()
 → if remote.updatedAt > local.updatedAt then remote wins
 → persist()
 → renderAll()
```
