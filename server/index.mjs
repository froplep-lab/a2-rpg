import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const PORT=Number(process.env.PORT||8080);
const BOT_TOKEN=process.env.BOT_TOKEN||'';
const MINI_APP_URL=(process.env.MINI_APP_URL||'').replace(/\/$/,'');
const WEBHOOK_URL=(process.env.WEBHOOK_URL||'').replace(/\/$/,'');
const WEBHOOK_PATH='/telegram/webhook';
const WEBHOOK_SECRET=process.env.WEBHOOK_SECRET||'';
const VERSION='0.029';
if(MINI_APP_URL&& !/^https:\/\//i.test(MINI_APP_URL))console.warn('MINI_APP_URL should use HTTPS for Telegram Mini App deployment');
const jsonHeaders={'content-type':'application/json; charset=utf-8','cache-control':'no-store'};

const api=async(method,body={})=>{
  if(!BOT_TOKEN)throw new Error('BOT_TOKEN missing');
  const r=await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
  const data=await r.json();
  if(!data.ok)throw new Error(`${method}: ${data.description||'Telegram API error'}`);
  return data.result;
};

function contentType(file){const ext=path.extname(file).toLowerCase();return ({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon'})[ext]||'application/octet-stream'}
function sendJson(res,status,payload){res.writeHead(status,jsonHeaders);res.end(JSON.stringify(payload));}
function serveStatic(req,res){
  let rel=decodeURIComponent(new URL(req.url,`http://${req.headers.host||'localhost'}`).pathname);if(rel==='/'||rel==='')rel='/index.html';
  const file=path.resolve(ROOT,'.'+rel);
  if(!file.startsWith(ROOT+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){sendJson(res,404,{ok:false,error:'Not found'});return}
  const ext=path.extname(file).toLowerCase();const immutable=!['.html','.js','.css','.json','.webmanifest','.mjs'].includes(ext);res.writeHead(200,{'content-type':contentType(file),'cache-control':immutable?'public, max-age=31536000, immutable':'no-cache, must-revalidate'});if(req.method==='HEAD')res.end();else fs.createReadStream(file).pipe(res);
}
async function readJson(req){return await new Promise((resolve,reject)=>{let raw='';req.on('data',c=>{raw+=c;if(raw.length>500000)reject(new Error('payload too large'))});req.on('end',()=>{try{resolve(raw?JSON.parse(raw):{})}catch{reject(new Error('invalid json'))}});req.on('error',reject)})}

async function handleUpdate(update){
  const m=update?.message;
  if(!m)return;
  if(m.web_app_data){
    return api('sendMessage',{chat_id:m.chat.id,text:'✅ GESTALT отримав дані від Mini App.'});
  }
  const text=String(m.text||'');
  if(/^\/start(?:@[^\s]+)?(?:\s+(.+))?/i.test(text)){
    const deep=text.match(/^\/start(?:@[^\s]+)?(?:\s+(.+))?/i)?.[1]||'';
    const caption=deep?`Вітаю у GESTALT. Параметр запуску: ${deep}`:'Вітаю у GESTALT — вчи німецьку через картки, переклад та озвучку.';
    const reply=MINI_APP_URL?{inline_keyboard:[[{text:'📚 Відкрити GESTALT',web_app:{url:MINI_APP_URL}}]]}:undefined;
    return api('sendMessage',{chat_id:m.chat.id,text:caption,reply_markup:reply});
  }
  if(/^\/app(?:@[^\s]+)?/i.test(text)){
    const reply=MINI_APP_URL?{inline_keyboard:[[{text:'📚 Відкрити GESTALT',web_app:{url:MINI_APP_URL}}]]}:undefined;
    return api('sendMessage',{chat_id:m.chat.id,text:'Відкрий застосунок GESTALT у Telegram.',reply_markup:reply});
  }
  if(/^\/(help|settings)(?:@[^\s]+)?/i.test(text)){
    return api('sendMessage',{chat_id:m.chat.id,text:'/start — запустити GESTALT\n/app — відкрити гру\n/help — допомога\n/settings — налаштування\n\nУ GESTALT: Слова → Картки → Озвучка → SRS → Прогрес.'});
  }
  if(!text.startsWith('/'))return;
}

let pollRunning=false;
async function startPolling(){
  if(pollRunning)return;pollRunning=true;let offset=0;
  try{await api('deleteWebhook',{drop_pending_updates:false})}catch(e){console.error('deleteWebhook:',e.message)}
  while(true){
    try{
      const updates=await api('getUpdates',{offset,timeout:50,allowed_updates:['message']});
      for(const u of updates||[]){offset=Math.max(offset,u.update_id+1);try{await handleUpdate(u)}catch(e){console.error('update:',e.message)}}
    }catch(e){console.error('Telegram polling:',e.message);await new Promise(r=>setTimeout(r,3000))}
  }
}
async function setupWebhook(){
  const full=`${WEBHOOK_URL}${WEBHOOK_PATH}`;
  await api('setWebhook',{url:full,secret_token:WEBHOOK_SECRET||undefined,allowed_updates:['message'],drop_pending_updates:false});
  console.log(`Telegram webhook configured: ${full}`);
}
async function configureBot(){
  if(!BOT_TOKEN){console.log('Telegram bot disabled: BOT_TOKEN not set');return;}
  try{
    await api('setMyCommands',{commands:[
      {command:'start',description:'Відкрити GESTALT'},
      {command:'app',description:'Відкрити GESTALT'},
      {command:'help',description:'Допомога'},
      {command:'settings',description:'Налаштування'}
    ]});
    await api('setChatMenuButton',{menu_button:MINI_APP_URL?{type:'web_app',text:'📚 GESTALT',web_app:{url:MINI_APP_URL}}:{type:'commands'}});
    await api('setMyDescription',{description:'GESTALT — вчи німецьку через SRS, картки, переклад та озвучку.'}).catch(()=>{});
    await api('setMyShortDescription',{short_description:'Німецька мова через картки та повторення.'}).catch(()=>{});
    if(WEBHOOK_URL)await setupWebhook();else await startPolling();
  }catch(e){console.error('Telegram setup:',e.message)}
}

const server=http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,`http://${req.headers.host||'localhost'}`);
    if(req.method==='GET'&&url.pathname==='/health')return sendJson(res,200,{ok:true,version:VERSION,telegram:Boolean(BOT_TOKEN),miniApp:Boolean(MINI_APP_URL),webhook:Boolean(WEBHOOK_URL)});
    if(req.method==='GET'&&url.pathname==='/api/telegram/status')return sendJson(res,200,{ok:true,version:VERSION,telegram:Boolean(BOT_TOKEN),miniAppUrl:MINI_APP_URL||null,mode:WEBHOOK_URL?'webhook':'polling'});
    if(req.method==='POST'&&url.pathname===WEBHOOK_PATH){
      if(WEBHOOK_SECRET&&req.headers['x-telegram-bot-api-secret-token']!==WEBHOOK_SECRET)return sendJson(res,403,{ok:false,error:'forbidden'});
      const update=await readJson(req);await handleUpdate(update);return sendJson(res,200,{ok:true});
    }
    if(req.method!=='GET'&&req.method!=='HEAD')return sendJson(res,405,{ok:false,error:'method not allowed'});
    serveStatic(req,res);
  }catch(e){sendJson(res,500,{ok:false,error:e.message||'server error'})}
});
server.listen(PORT,()=>console.log(`GESTALT ${VERSION} on http://127.0.0.1:${PORT}`));
configureBot().catch(e=>console.error(e));
