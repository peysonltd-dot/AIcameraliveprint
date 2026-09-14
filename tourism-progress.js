(function(){
'use strict';
const A={bear:'assets/ohbear.png',morning:'assets/morning.svg',night:'assets/night.svg',ai:'assets/ai-taiwan.svg',wifi:'assets/wifi.svg'};
const style=document.createElement('style');style.id='tourism-kv-animation-v18';style.textContent="\n.tourism-kv-stage{position:relative;width:min(100%,560px);aspect-ratio:860/622;margin:0 auto 16px;overflow:hidden;background:#ec3a0d;border:3px solid #130f44;border-radius:10px 30px 10px 30px;box-shadow:8px 8px 0 #f8e442,12px 12px 0 #087fbd;isolation:isolate}\n.tourism-kv-bear{position:absolute;z-index:2;left:50%;bottom:0;width:clamp(130px,34%,220px);height:auto;transform:translateX(-50%);filter:drop-shadow(0 7px 0 rgba(19,15,68,.18));animation:kvBear 1.8s ease-in-out infinite}\n.tourism-kv-accent{position:absolute;z-index:3;height:auto;opacity:0;transform:scale(.72) rotate(-4deg);transition:opacity .18s ease,transform .28s cubic-bezier(.2,.8,.2,1);filter:drop-shadow(2px 3px 0 rgba(19,15,68,.2));pointer-events:none}\n.tourism-kv-accent.is-visible{opacity:1;transform:scale(1) rotate(0)}\n.tourism-kv-accent--morning{left:7%;top:6%;width:17%}.tourism-kv-accent--night{right:9%;top:18%;width:17%}.tourism-kv-accent--ai{left:3%;top:36%;width:30%;transform:scale(.72) rotate(-18deg)}.tourism-kv-accent--ai.is-visible{transform:scale(1) rotate(-18deg)}.tourism-kv-accent--wifi{right:7%;top:41%;width:19%}\n.tourism-wait-event{display:flex;flex-direction:column;align-items:center;gap:2px;width:fit-content;max-width:100%;margin:0 auto 16px;padding:7px 16px;color:#fff;background:#211d80;border:2px solid #130f44;border-radius:6px 16px 6px 16px;font-weight:900;letter-spacing:.06em;line-height:1.25}\n.tourism-wait-event small{color:#fff128;font-size:.66rem;letter-spacing:.12em}.tourism-wait-title{margin:0 0 14px!important;font-size:clamp(1.1rem,2.7vw,1.45rem)!important;font-weight:900}.tourism-character-stage,.tourism-character--ohbear{display:none!important}.tourism-wait-event,.tourism-progress-label,.tourism-milestones,.tourism-status,.tourism-progress-note{display:none!important}.tourism-progress-heading{justify-content:flex-end!important;margin-bottom:4px}\n@keyframes kvBear{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(-7px)}}\n@media(max-width:600px){.tourism-kv-stage{width:min(100%,430px);margin-bottom:13px;box-shadow:6px 6px 0 #f8e442,9px 9px 0 #087fbd}.tourism-wait-event{padding:6px 12px;font-size:.82rem}.tourism-wait-event small{font-size:.56rem;letter-spacing:.08em}}\n@media(prefers-reduced-motion:reduce){.tourism-kv-bear{animation:none!important}.tourism-kv-accent{transition:none!important}}\n";document.head.appendChild(style);
const C={
zh:{title:'喔熊陪你，等一張驚喜',label:'AI 專屬角色製作進度',note:'圖片完成後將自動進入選擇畫面',steps:['上傳','排隊','生成','完成'],uploading:'正在上傳照片…',queued:'照片已收到，正在準備生成…',generating:'AI 正在製作您的專屬角色…',ready:'完成！準備看看您的專屬角色',failed:'生成未完成，請通知工作人員'},
jp:{title:'OhBearと一緒に、もう少しお待ちください',label:'AIキャラクター作成進捗',note:'完成後、自動的に選択画面へ移動します',steps:['送信','準備','生成','完成'],uploading:'写真を送信しています…',queued:'写真を受信しました。準備しています…',generating:'AIキャラクターを作成しています…',ready:'完成しました！',failed:'生成できませんでした。スタッフにお声がけください'},
en:{title:'OhBear is here while your surprise is made',label:'AI character progress',note:'The choices will appear automatically when ready.',steps:['Upload','Queue','Create','Ready'],uploading:'Uploading your photo…',queued:'Photo received. Getting ready…',generating:'Creating your AI character…',ready:'Ready! Meet your AI character',failed:'Generation could not be completed. Please ask our staff.'}
};
const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number(n)||0));
function createDisplayProgress(){return{current:0,target:0,phase:'uploading'}}
function targetFor(p,n){if(p==='ready'||p==='completed')return 100;if(Number.isFinite(Number(n)))return clamp(n,0,98);if(p==='generating')return 58;if(p==='queued'||p==='pending')return 28;return 8}
function mount(host,lang,shared){
 if(!host)throw new Error('Missing progress host');
 const c=C[C[lang]?lang:'zh'],d=shared||createDisplayProgress();
 host.innerHTML=`<section class="tourism-wait" data-phase="uploading" aria-live="polite">
 <div class="tourism-kv-stage">
  <img loading="eager" decoding="async" class="tourism-kv-bear" src="${A.bear}" alt="OhBear 喔熊">
  <img loading="eager" decoding="async" class="tourism-kv-accent tourism-kv-accent--morning is-visible" src="${A.morning}" alt="">
  <img loading="eager" decoding="async" class="tourism-kv-accent tourism-kv-accent--night" src="${A.night}" alt="">
  <img loading="eager" decoding="async" class="tourism-kv-accent tourism-kv-accent--ai" src="${A.ai}" alt="">
  <img loading="eager" decoding="async" class="tourism-kv-accent tourism-kv-accent--wifi" src="${A.wifi}" alt="">
 </div>
 <p class="tourism-wait-title">${c.title}</p>
 <div class="tourism-wait-event"><span>2026 觀光產業數位博覽會</span><small>TAIWAN TOUR TECH WONDERLAND</small></div>
 <div class="tourism-progress-heading"><span class="tourism-progress-label">${c.label}</span><strong class="tourism-percent">0%</strong></div>
 <div class="tourism-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="tourism-fill"></div></div>
 <ol class="tourism-milestones">${c.steps.map(x=>`<li>${x}</li>`).join('')}</ol>
 <p class="tourism-status">${c.uploading}</p><p class="tourism-progress-note">${c.note}</p></section>`;
 const root=host.querySelector('.tourism-wait'),pct=host.querySelector('.tourism-percent'),fill=host.querySelector('.tourism-fill'),track=host.querySelector('.tourism-track'),status=host.querySelector('.tourism-status'),marks=[...host.querySelectorAll('.tourism-milestones li')],accents=[...host.querySelectorAll('.tourism-kv-accent')];
 let accent=0,dead=false;
 const copyStatus=p=>p==='ready'||p==='completed'?c.ready:p==='failed'?c.failed:p==='generating'?c.generating:p==='queued'||p==='pending'?c.queued:c.uploading;
 function paint(){const n=Math.round(clamp(d.current,0,100));pct.textContent=n+'%';fill.style.width=n+'%';track.setAttribute('aria-valuenow',String(n));status.textContent=copyStatus(d.phase);root.dataset.phase=d.phase;const reached=n>=100?4:n>=48?3:n>=20?2:1;marks.forEach((x,i)=>x.classList.toggle('is-done',i<reached))}
 const progressTimer=setInterval(()=>{if(dead)return;if(!['ready','completed','failed'].includes(d.phase))d.target=Math.min(96,Math.max(d.target,d.current+.08));const gap=d.target-d.current;d.current=Math.abs(gap)<.04?d.target:d.current+Math.max(.04,gap*.075);paint()},80);
 const accentTimer=setInterval(()=>{if(dead||!accents.length)return;accents[accent].classList.remove('is-visible');accent=(accent+1)%accents.length;accents[accent].classList.add('is-visible')},1000);
 function update(p={}){d.phase=p.phase||p.status||d.phase;d.target=targetFor(d.phase,p.percent);paint()}
 function reset(){d.current=0;d.target=0;d.phase='uploading';accent=0;accents.forEach((x,i)=>x.classList.toggle('is-visible',i===0));paint()}
 paint();return{update,reset,dispose(){dead=true;clearInterval(progressTimer);clearInterval(accentTimer);host.innerHTML=''}}
}
function preload(url){return new Promise(resolve=>{if(!url)return resolve();const img=new Image(),done=()=>resolve();img.onload=done;img.onerror=done;img.src=url;setTimeout(done,10000)})}
function monitor(o){
 const base=String(o.apiBase||'').replace(/\/$/,''),id=encodeURIComponent(o.taskId),start=Date.now();let stopped=false,timer=null,errors=0,done=false;
 const emit=p=>{if(!stopped&&typeof o.onProgress==='function')o.onProgress(p)};
 async function poll(){if(stopped||done)return;try{const r=await fetch(`${base}/api/status/${id}`,{cache:'no-store'}),x=await r.json();if(!r.ok||x.success===false)throw new Error(x.error||'status error');errors=0;const elapsed=Date.now()-start;
  if(x.status==='failed'){emit({phase:'failed',percent:Math.min(96,55+elapsed/5000)});stopped=true;if(typeof o.onFailure==='function')o.onFailure(x);return}
  if(x.status==='completed'&&x.resultImageA&&x.resultImageB){done=true;emit({phase:'generating',percent:98});await Promise.all([preload(x.resultImageA),preload(x.resultImageB)]);if(stopped)return;emit({phase:'ready',percent:100});if(typeof o.onReady==='function')o.onReady(x);return}
  emit(x.status==='generating'?{phase:'generating',percent:Math.min(96,46+elapsed/3600)}:{phase:x.status||'queued',percent:Math.min(44,24+elapsed/7000)});
 }catch(e){errors++;emit({phase:'queued',percent:Math.min(44,22+(Date.now()-start)/8000)});if(errors>=20){stopped=true;if(typeof o.onFailure==='function')o.onFailure({error:e});return}}
 if(!stopped&&!done)timer=setTimeout(poll,1500)}
 emit({phase:'queued',percent:22});poll();return{stop(){stopped=true;if(timer)clearTimeout(timer)}}
}
window.TourismProgress={createDisplayProgress,mount,monitor};
})();

