import fs from 'node:fs';
import vm from 'node:vm';

const root=new URL('..',import.meta.url);
const appPath=new URL('js/app.js',root);
let code=fs.readFileSync(appPath,'utf8').replace(/boot\(\)\.catch\([^\n]+\);?\s*$/,'');
const elements=new Map();
const makeEl=()=>({textContent:'',innerHTML:'',value:'',classList:{add(){},remove(){},toggle(){}}});
const document={
  getElementById:id=>{if(!elements.has(id))elements.set(id,makeEl());return elements.get(id)},
  querySelectorAll:()=>[],addEventListener(){},
  createElement:()=>({style:{},classList:{add(){},remove(){}},appendChild(){},remove(){}}),
  head:{appendChild(){}},
  documentElement:{style:{setProperty(){}},dataset:{},classList:{toggle(){}}}
};
const store=new Map();
const localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const context={console,window:{Telegram:undefined,speechSynthesis:{cancel(){},speak(){}} ,SpeechSynthesisUtterance:class{}},document,localStorage,URL,Blob,Intl,Date,Math,JSON,Number,String,Array,Object,Promise,Set,Map,RegExp,setTimeout,clearTimeout,fetch:async()=>({ok:true,json:async()=>[]}),navigator:{}};
vm.createContext(context);
vm.runInContext(code+'\nthis.__api={normalizeSave,defaultSave,setReview,reviewBox,cloudLoad,levelFromXp,wordKey};this.__setTg=v=>tg=v;this.__setSave=v=>save=v;',context);
const s=context.__api.normalizeSave({xp:500,mastery:{w:1},reviews:{w:{next:new Date(Date.now()-1000).toISOString(),q:4}},customWords:[{id:'w',german:'Haus',ukrainian:'будинок'}]});
if(s.saveVersion!==10)throw new Error('save version migration failed');
if(context.__api.levelFromXp(0).lvl!==1)throw new Error('level baseline failed');
context.__setSave(s);
const w=s.customWords[0];
context.__api.setReview(w,5,2);
if(s.reviews.w.box!==2)throw new Error('SRS quality progression failed');
const fakeTg={CloudStorage:{getItem(k,cb){cb(null,k==='gst9_meta'?JSON.stringify({count:2}):'')},getItems(keys,cb){cb(null,{gst9_c_0:'{\"xp\":12,',gst9_c_1:'\"level\":1}'})}}};
context.__setTg(fakeTg);
const remote=await context.__api.cloudLoad();
if(!remote||remote.xp!==12)throw new Error('Telegram CloudStorage object-map load failed');
const html=fs.readFileSync(new URL('index.html',root),'utf8');
const ids=[...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);
if(new Set(ids).size!==ids.length)throw new Error('duplicate DOM ids');
const words=JSON.parse(fs.readFileSync(new URL('data/words.json',root),'utf8'));
if(!Array.isArray(words)||words.length<1)throw new Error('words data invalid');
console.log('GESTALT smoke tests: OK');
