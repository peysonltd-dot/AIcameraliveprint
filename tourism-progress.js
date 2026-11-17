(function(){
'use strict';
const C={
zh:{title:'稍等一下，專屬於你的可愛模樣即將登場',label:'AI 專屬角色製作進度',note:'圖片完成後將自動進入選擇畫面',steps:['上傳','排隊','生成','完成'],uploading:'正在上傳照片…',queued:'照片已收到，正在準備生成…',generating:'AI 正在製作您的專屬角色…',ready:'完成！準備看看您的專屬角色',failed:'生成未完成，請通知工作人員'},
jp:{title:'もうすぐ、かわいいあなたに会えます！',label:'AIキャラクター作成進捗',note:'完成後、自動的に選択画面へ移動します',steps:['送信','準備','生成','完成'],uploading:'写真を送信しています…',queued:'写真を受信しました。準備しています…',generating:'AIキャラクターを作成しています…',ready:'完成しました！',failed:'生成できませんでした。スタッフにお声がけください'},
en:{title:'Just a moment—your cute new look is on its way!',label:'AI character progress',note:'The choices will appear automatically when ready.',steps:['Upload','Queue','Create','Ready'],uploading:'Uploading your photo…',queued:'Photo received. Getting ready…',generating:'Creating your AI character…',ready:'Ready! Meet your AI character',failed:'Generation could not be completed. Please ask our staff.'}
};
const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number(n)||0));
function createDisplayProgress(){return{current:0,target:0,phase:'uploading'}}
function targetFor(p,n){if(p==='ready'||p==='completed')return 100;if(Number.isFinite(Number(n)))return clamp(n,0,98);if(p==='generating')return 58;if(p==='queued'||p==='pending')return 28;return 8}
function mount(host,lang,shared){
 if(!host)throw new Error('Missing progress host');
 const locale=C[lang]?lang:'zh',c=C[locale],d=shared||createDisplayProgress();
 host.innerHTML=`<section class="tourism-wait" data-phase="uploading" aria-live="polite">
<style>
.ai-cube-stage{position:relative;width:min(100%,480px);aspect-ratio:1.3;margin:0 auto 16px;isolation:isolate;overflow:hidden;background:radial-gradient(ellipse at center,#eaf8f5 0%,#fff 65%);border-radius:20px}
.ai-cube-orbits{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.ai-cube-orbits.rear{z-index:0}.ai-cube-orbits.front{z-index:2}
.ai-cube-scene{position:absolute;left:50%;top:47%;width:150px;height:150px;transform:translate(-50%,-50%);perspective:850px;z-index:1}
.ai-cube-spin,.ai-cube-layer,.ai-cubie{position:absolute;width:100%;height:100%;transform-style:preserve-3d}
.ai-cube-spin{animation:ai-cube-turn 14s linear infinite;transform:rotateX(-22deg) rotateY(-32deg)}
.ai-cube-layer.top{animation:ai-cube-twist 7s ease-in-out infinite}
.ai-cubie{width:72px;height:72px;left:39px;top:39px}
.ai-cube-face{position:absolute;inset:0;border:2px solid #90d5ac;box-sizing:border-box;backface-visibility:hidden;background:linear-gradient(125deg,#dcf42c 0%,#00aba9 44%,#143e75 73%,#241647 100%)}
.ai-cube-face:nth-child(1){transform:translateZ(36px)}
.ai-cube-face:nth-child(2){transform:rotateY(180deg) translateZ(36px)}
.ai-cube-face:nth-child(3){transform:rotateY(90deg) translateZ(36px);background:linear-gradient(150deg,#17244f,#0c9ca5 62%,#d9ed24)}
.ai-cube-face:nth-child(4){transform:rotateY(-90deg) translateZ(36px);background:linear-gradient(135deg,#1c3049,#363052)}
.ai-cube-face:nth-child(5){transform:rotateX(90deg) translateZ(36px)}
.ai-cube-face:nth-child(6){transform:rotateX(-90deg) translateZ(36px)}
.ai-cubie.pattern .ai-cube-face:nth-child(1),.ai-cubie.pattern .ai-cube-face:nth-child(5){background:repeating-radial-gradient(circle at 8% 8%,transparent 0 8px,#aed65e 9px 11px,transparent 12px 19px),linear-gradient(135deg,#006c72,#102942)}
.ai-cube-shadow{position:absolute;left:30%;right:30%;bottom:16%;height:5%;border-radius:50%;background:#148f9630;filter:blur(9px)}
.ai-orbit-dot{offset-path:path('M 55 260 C -20 140 340 25 420 100 C 510 200 150 340 55 260');animation:ai-orbit-travel 9s linear infinite;fill:#b9e741}
.ai-orbit-dot.second{animation-delay:-4.5s;fill:#58c4d4}
@keyframes ai-cube-turn{from{transform:rotateX(-22deg) rotateY(-32deg)}to{transform:rotateX(-22deg) rotateY(328deg)}}
@keyframes ai-cube-twist{0%,18%{transform:rotateY(0)}42%,68%{transform:rotateY(90deg)}92%,100%{transform:rotateY(180deg)}}
@keyframes ai-orbit-travel{to{offset-distance:100%}}
@media(max-width:380px){.ai-cube-scene{scale:.8}.ai-cube-stage{aspect-ratio:1.15}}
@media(prefers-reduced-motion:reduce){.ai-cube-spin,.ai-cube-layer.top,.ai-orbit-dot{animation:none!important}}
</style>
<div class="ai-cube-stage" aria-hidden="true">
<svg class="ai-cube-orbits rear" viewBox="0 0 480 370" fill="none"><ellipse cx="240" cy="190" rx="218" ry="92" transform="rotate(-25 240 190)" stroke="#52b8b2" stroke-width="1.5"/><ellipse cx="240" cy="190" rx="208" ry="95" transform="rotate(33 240 190)" stroke="#d7e788" stroke-width="1.5"/><path d="M98 285 C385 360 432 -5 265 58" stroke="#bbb5c6" stroke-width="2"/><circle cx="265" cy="58" r="5" fill="#cee44b"/></svg>
<div class="ai-cube-shadow"></div><div class="ai-cube-scene"><div class="ai-cube-spin"><div class="ai-cube-layer top"><div class="ai-cubie pattern" style="transform:translate3d(-38px,-38px,-38px)"><span class="ai-cube-face"></span><span class="ai-cube-face"></span><span class="ai-cube-face"></span><span class="ai-cube-face"></span><span class="ai-cube-face"></span><span class="ai-cube-face"></span></div><div class="ai-cubie " style="transform:translate3d(-38px,-38px,38px)"><span class="ai-cube-face"></span><span class="ai-cube-face"></span><span class="ai-cube-face"></span><span class="ai-cube-face"></span><span class="ai-cube-face"></span><span class="ai-cube-face"></span></div><div class="ai-cubie " style="transform:translate3d(38px,-38px,-38px)"><span class="ai-cube-face"></span><span class="ai-cube-face"></span><span class="ai-cube-face"></span><span class="ai-cube-face"></span><span class="ai-cube-face"></span><span class="ai-cube-face"></span></div><div class="ai-cubie pattern" style="transform:translate3d(38px,-38px,38px)"><span class="ai-cube-face"></span><span class="ai-cube-face"></span><span class="ai-cube-face"></span><span class="ai-cube-face"></span><span class="ai-cube-face"></span><span class="ai-cube-face"></span></div></div><div class="ai-cube-layer bottom"><div class="ai-cubie " style="transform:translate3d(-38px,38px,-38px)"><span class="ai-cube-face"></span><span class="ai-cube-face"></span><span class="ai-cube-face"></span><span class="ai-cube-face"></span><span class="ai-cube-face"></span><span class="ai-cube-face"></span></div><div class="ai-cubie " style="transform:translate3d(-38px,38px,38px)"><span class="ai-cube-face"></span><span class="ai-cube-face"></span><span class="ai-cube-face"></span><span class="ai-cube-face"></span><span class="ai-cube-face"></span><span class="ai-cube-face"></span></div><div class="ai-cubie pattern" style="transform:translate3d(38px,38px,-38px)"><span class="ai-cube-face"></span><span class="ai-cube-face"></span><span class="ai-cube-face"></span><span class="ai-cube-face"></span><span class="ai-cube-face"></span><span class="ai-cube-face"></span></div><div class="ai-cubie " style="transform:translate3d(38px,38px,38px)"><span class="ai-cube-face"></span><span class="ai-cube-face"></span><span class="ai-cube-face"></span><span class="ai-cube-face"></span><span class="ai-cube-face"></span><span class="ai-cube-face"></span></div></div></div></div>
<svg class="ai-cube-orbits front" viewBox="0 0 480 370" fill="none"><path d="M24 218 C32 321 256 294 405 202" stroke="#a5d794" stroke-width="2"/><path d="M98 285 C181 307 274 244 328 168" stroke="#d0c9da" stroke-width="2"/><circle cx="98" cy="285" r="6" fill="#6ac6d3"/><circle class="ai-orbit-dot" r="5"/><circle class="ai-orbit-dot second" r="4"/></svg>
</div>
<p class="tourism-wait-title" aria-live="off">${c.title}</p>
 <div class="tourism-progress-heading"><span class="tourism-progress-label">${c.label}</span><strong class="tourism-percent">0%</strong></div>
 <div class="tourism-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="tourism-fill"></div></div>
 <ol class="tourism-milestones">${c.steps.map(x=>`<li>${x}</li>`).join('')}</ol>
 <p class="tourism-status">${c.uploading}</p><p class="tourism-progress-note">${c.note}</p></section>`;
 const root=host.querySelector('.tourism-wait'),pct=host.querySelector('.tourism-percent'),fill=host.querySelector('.tourism-fill'),track=host.querySelector('.tourism-track'),status=host.querySelector('.tourism-status'),marks=[...host.querySelectorAll('.tourism-milestones li')];
 let dead=false;
 const copyStatus=p=>p==='ready'||p==='completed'?c.ready:p==='failed'?c.failed:p==='generating'?c.generating:p==='queued'||p==='pending'?c.queued:c.uploading;
 function paint(){const n=Math.round(clamp(d.current,0,100));pct.textContent=n+'%';fill.style.width=n+'%';track.setAttribute('aria-valuenow',String(n));status.textContent=copyStatus(d.phase);root.dataset.phase=d.phase;const reached=n>=100?4:n>=48?3:n>=20?2:1;marks.forEach((x,i)=>x.classList.toggle('is-done',i<reached))}
 const progressTimer=setInterval(()=>{if(dead)return;if(!['ready','completed','failed'].includes(d.phase))d.target=Math.min(96,Math.max(d.target,d.current+.08));const gap=d.target-d.current;d.current=Math.abs(gap)<.04?d.target:d.current+Math.max(.04,gap*.075);paint()},80);
 function update(p={}){d.phase=p.phase||p.status||d.phase;d.target=targetFor(d.phase,p.percent);paint()}
 function reset(){d.current=0;d.target=0;d.phase='uploading';paint()}
 paint();return{update,reset,dispose(){dead=true;clearInterval(progressTimer);host.innerHTML=''}}
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



