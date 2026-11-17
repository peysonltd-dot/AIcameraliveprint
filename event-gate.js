(function(){
'use strict';
const API='https://aicameraliveprint-back.onrender.com',STORE='peyson-tote-event-access-v1',rawFetch=window.fetch.bind(window);
let token='',pending=null;
try{token=localStorage.getItem(STORE)||'';}catch(_){}
const domReady=document.readyState==='loading'?new Promise(r=>document.addEventListener('DOMContentLoaded',r,{once:true})):Promise.resolve();
function save(t){token=t;try{if(t)localStorage.setItem(STORE,t);else localStorage.removeItem(STORE);}catch(_){}}
async function promptCode(message){
 await domReady;
 return new Promise(resolve=>{
  const oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
  const el=document.createElement('div');el.id='event-access-gate';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-labelledby','event-access-heading');
  el.innerHTML=`<style>
#event-access-gate{position:fixed;inset:0;z-index:2147483647;background:#133139;display:grid;place-items:center;overflow:auto;padding:20px;color:#133139;font-family:system-ui,sans-serif;box-sizing:border-box}
#event-access-gate .event-access-card{width:min(100%,440px);background:white;padding:28px;border-radius:24px;box-sizing:border-box;text-align:center}
#event-access-gate h2{font-size:26px;font-weight:700;margin:0 0 10px}#event-access-gate p{font-size:16px;margin:8px 0 18px}
#event-access-gate input{width:100%;box-sizing:border-box;font-size:28px;letter-spacing:4px;text-align:center;border:1px solid #a9bdb6;border-radius:12px;padding:12px;color:#133139;background:#fff}
#event-access-gate .event-access-keys{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0}
#event-access-gate button{cursor:pointer;touch-action:manipulation;border:1px solid #c8d5cc;border-radius:12px;background:#f4f8f6;color:#133139;padding:12px;font-size:24px;font-weight:600}
#event-access-gate button[type=submit]{background:#f5da69;width:100%;font-size:20px}#event-access-gate button:disabled{opacity:.5}
#event-access-gate .event-access-error{color:#a52a32;min-height:22px;font-size:14px;margin:10px 0}
</style><form class="event-access-card"><h2 id="event-access-heading">請輸入活動代碼</h2><p>Enter your event code</p><input aria-label="活動代碼 Event code" type="password" inputmode="numeric" maxlength="32" autocomplete="off"><div class="event-access-keys">${['1','2','3','4','5','6','7','8','9','清除','0','←'].map(n=>`<button type="button" data-key="${n}">${n}</button>`).join('')}</div><p class="event-access-error" role="status"></p><button type="submit">確認 / Continue</button></form>`;
  document.body.append(el);
  const input=el.querySelector('input'),error=el.querySelector('.event-access-error'),submit=el.querySelector('[type=submit]');error.textContent=message||'';
  el.querySelectorAll('[data-key]').forEach(b=>b.onclick=()=>{const k=b.dataset.key;input.value=k==='清除'?'':k==='←'?input.value.slice(0,-1):(input.value+k).slice(0,32)});
  el.querySelector('form').onsubmit=async e=>{e.preventDefault();if(!input.value.trim())return;submit.disabled=true;error.textContent='驗證中…';
   try{const r=await rawFetch(API+'/api/event-access/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:input.value.trim()})});const d=await r.json();if(!r.ok||!d.token)throw Error(d.error||'驗證失敗');save(d.token);el.remove();document.body.style.overflow=oldOverflow;resolve();}
   catch(e){error.textContent=e.message||'連線失敗，請再試一次';}finally{submit.disabled=false;}
  };
 });
}
function ensure(force=false){
 if(pending)return pending;
 pending=(async()=>{
  if(token&&!force){try{const r=await rawFetch(API+'/api/event-access/status',{headers:{'X-Event-Token':token},cache:'no-store'});if(r.ok)return;}catch(_){} }
  save('');await promptCode();
 })().finally(()=>{pending=null});return pending;
}
function protectedRequest(url,method){if(method!=='POST'||url.origin!==new URL(API).origin)return false;return /^\/api\/(upload|qr-session(?:\/[^/]+\/(?:photo|generate))?|admin\/retry\/[^/]+|admin\/printer-clear-queue)\/?$/.test(url.pathname);}
window.fetch=async function(input,init){const url=new URL(typeof input==='string'?input:input.url,location.href);const method=String(init?.method||(input instanceof Request?input.method:'GET')).toUpperCase();if(!protectedRequest(url,method))return rawFetch(input,init);
 await ensure();const send=()=>{const headers=new Headers(init?.headers||(input instanceof Request?input.headers:undefined));headers.set('X-Event-Token',token);return rawFetch(input,{...init,headers})};
 let r=await send();if(r.status===401){const d=await r.clone().json().catch(()=>({}));if(d.code==='EVENT_AUTH_REQUIRED'){await ensure(true);r=await send();}}return r;
};
// Staff admin pages retain read/download access; verification opens only on a retry.
if(!/\/admin(?:\.html)?\/?$/.test(location.pathname))void ensure();
})();
