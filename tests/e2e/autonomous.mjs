import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const ARTIFACTS = path.join(ROOT, 'tests', 'artifacts');
fs.mkdirSync(ARTIFACTS, {recursive: true});

async function freePort(start) {
  for (let p = start; p < start + 50; p++) {
    const ok = await new Promise(resolve => {
      const s = createServer();
      s.once('error', () => resolve(false));
      s.once('listening', () => s.close(() => resolve(true)));
      s.listen(p, '127.0.0.1');
    });
    if (ok) return p;
  }
  throw new Error(`No free port near ${start}`);
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

class CDP {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.pending = new Map();
    this.events = new Map();
  }
  async open() {
    await new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, {once: true});
      this.ws.addEventListener('error', reject, {once: true});
      this.ws.addEventListener('message', e => this.onMessage(JSON.parse(e.data)));
    });
  }
  onMessage(msg) {
    if (msg.id && this.pending.has(msg.id)) {
      const {resolve, reject} = this.pending.get(msg.id);
      this.pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message)); else resolve(msg.result);
      return;
    }
    for (const fn of this.events.get(msg.method) || []) fn(msg.params);
  }
  on(method, fn) {
    if (!this.events.has(method)) this.events.set(method, []);
    this.events.get(method).push(fn);
  }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({id, method, params}));
    return new Promise((resolve, reject) => this.pending.set(id, {resolve, reject}));
  }
  close() { try { this.ws.close(); } catch {} }
}

async function waitFor(url, timeoutMs = 8000) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    try { const r = await fetch(url); if (r.ok) return; } catch {}
    await sleep(100);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function main() {
  const appPort = await freePort(8790);
  const chromePort = await freePort(9220);
  const server = spawn(process.execPath, ['server/index.mjs'], {
    cwd: ROOT,
    env: {...process.env, PORT: String(appPort), BOT_TOKEN: ''},
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let serverLog = '';
  server.stdout.on('data', d => { serverLog += d.toString(); });
  server.stderr.on('data', d => { serverLog += d.toString(); });

  let chrome;
  try {
    await waitFor(`http://127.0.0.1:${appPort}/health`);
    chrome = spawn('chromium', [
      '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--no-proxy-server',
      `--remote-debugging-port=${chromePort}`,
      `--user-data-dir=${path.join(ARTIFACTS, 'chrome-profile')}`,
      `http://127.0.0.1:${appPort}/?debug=1`
    ], {stdio: ['ignore', 'ignore', 'pipe']});
    let chromeErr = '';
    chrome.stderr.on('data', d => { chromeErr += d.toString(); });

    let wsUrl = null;
    const end = Date.now() + 10000;
    while (Date.now() < end) {
      try {
        const r = await fetch(`http://127.0.0.1:${chromePort}/json/list`);
        const targets = await r.json();
        const page = targets.find(t => t.type === 'page');
        if (page) { wsUrl = page.webSocketDebuggerUrl; break; }
      } catch {}
      await sleep(100);
    }
    if (!wsUrl) throw new Error('Chromium CDP page unavailable');

    const cdp = new CDP(wsUrl);
    await cdp.open();
    const errors = [], warnings = [], networkFailures = [];
    cdp.on('Runtime.consoleAPICalled', p => {
      const text = p.args?.map(a => a.value ?? a.description ?? '').join(' ') || '';
      (p.type === 'error' ? errors : warnings).push({type: p.type, text});
    });
    cdp.on('Runtime.exceptionThrown', p => errors.push({
      type: 'exception', text: p.exceptionDetails?.text || p.exceptionDetails?.exception?.description || 'exception'
    }));
    cdp.on('Network.loadingFailed', p => networkFailures.push({url: p.url, errorText: p.errorText, type: p.type, canceled: p.canceled}));
    cdp.on('Network.responseReceived', p => {
      if (p.response.status >= 400) networkFailures.push({url: p.response.url, status: p.response.status, type: p.type});
    });
    await cdp.send('Runtime.enable');
    await cdp.send('Network.enable');
    await cdp.send('Page.enable');
    await cdp.send('Page.navigate', {url:`http://127.0.0.1:${appPort}/?debug=1`});
    await sleep(2200);

    const evaluate = async expression => {
      const r = await cdp.send('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true});
      return r.result?.value;
    };

    const dev = await evaluate('({enabled:Boolean(window.__GESTALT_DEV__?.isEnabled),ready:document.readyState,url:location.href})');
    if (!dev?.enabled) {
      fs.writeFileSync(path.join(ARTIFACTS, 'e2e-result.json'), JSON.stringify({ok:false,error:'Development bridge missing',dev,errors,warnings,networkFailures:networkFailures.filter(x=>!x.canceled),serverLog,chromeErr}, null, 2));
      throw new Error('Development bridge missing');
    }

    const fixture = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests', 'fixtures', 'long-card.json'), 'utf8'));
    await evaluate(`window.__GESTALT_DEV__.setSave(${JSON.stringify(fixture)})`);
    const topicCount = await evaluate("document.querySelector('#topicWordCount')?.textContent || ''");
    const frontText = await evaluate("document.querySelector('#wordGerman')?.textContent || ''");
    const stateBefore = await evaluate('window.__GESTALT_DEV__.getState()');
    const frontShot = await cdp.send('Page.captureScreenshot', {format: 'png'});
    fs.writeFileSync(path.join(ARTIFACTS, 'startup.png'), Buffer.from(frontShot.data, 'base64'));

    await evaluate('window.__GESTALT_DEV__.unflip()');
    await evaluate("document.querySelector('#cardWrap')?.click()");
    await sleep(700);
    const flipResult = await evaluate('window.__GESTALT_DEV__.getState()');
    const backInfo = await evaluate(`({
      text: document.querySelector('#backMeaning')?.textContent || '',
      visual: window.__GESTALT_DEV__.getComputedCard(),
      state: window.__GESTALT_DEV__.getState()
    })`);
    const backShot = await cdp.send('Page.captureScreenshot', {format: 'png'});
    fs.writeFileSync(path.join(ARTIFACTS, 'card-back.png'), Buffer.from(backShot.data, 'base64'));

    const answerBefore = await evaluate('window.__GESTALT_DEV__.getState()');
    await evaluate("document.querySelector('#rememberBtn')?.click()");
    await sleep(700);
    const answerAfter = await evaluate('window.__GESTALT_DEV__.getState()');
    const savedAfterAnswer = await evaluate('window.__GESTALT_DEV__.getSave()');
    await cdp.send('Page.navigate', {url:`http://127.0.0.1:${appPort}/?debug=1`});
    await sleep(1200);
    const restored = await evaluate('window.__GESTALT_DEV__.getState()');

    const desktop = await evaluate(`({
      width: innerWidth, height: innerHeight,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
      backVisible: getComputedStyle(document.querySelector('.flash-back')).visibility,
      backTransform: getComputedStyle(document.querySelector('.flash-back')).transform
    })`);

    await cdp.send('Emulation.setDeviceMetricsOverride', {width: 390, height: 844, deviceScaleFactor: 1, mobile: true});
    await sleep(500);
    const mobile = await evaluate(`({
      width: innerWidth, height: innerHeight,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
      cardWidth: document.querySelector('#flashcard')?.getBoundingClientRect().width || 0,
      backMeaningWidth: document.querySelector('#backMeaning')?.getBoundingClientRect().width || 0
    })`);
    const mobileShot = await cdp.send('Page.captureScreenshot', {format: 'png'});
    fs.writeFileSync(path.join(ARTIFACTS, 'mobile.png'), Buffer.from(mobileShot.data, 'base64'));
    await cdp.send('Emulation.clearDeviceMetricsOverride');

    const result = {
      ok: errors.length === 0 && networkFailures.filter(x => !x.canceled).length === 0 && topicCount.includes('1') && backInfo.visual.netBackIdentity === true && flipResult.flipped === true && answerAfter.answers === answerBefore.answers + 1 && savedAfterAnswer.xp > 0 && restored.xp === savedAfterAnswer.xp,
      appPort, chromePort, stateBefore, topicCount, frontText, flipResult, answerBefore, answerAfter, savedAfterAnswer, restored, backInfo, desktop, mobile,
      errors, warnings, networkFailures: networkFailures.filter(x => !x.canceled),
      artifacts: 'tests/artifacts/', serverLog, chromeErr
    };
    fs.writeFileSync(path.join(ARTIFACTS, 'e2e-result.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
    cdp.close();
    chrome.kill('SIGTERM');
    process.exitCode = result.ok ? 0 : 2;
  } finally {
    if (chrome && !chrome.killed) chrome.kill('SIGTERM');
    if (!server.killed) server.kill('SIGTERM');
  }
}

main().catch(err => {
  const result={ok:false,error:String(err?.stack||err)};
  try{fs.writeFileSync(path.join(ARTIFACTS,'e2e-result.json'),JSON.stringify(result,null,2));}catch{}
  console.error(err.stack || err); process.exitCode = 1;
});
