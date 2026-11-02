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
.innoserve-loading-slides{width:min(100%,560px);aspect-ratio:1721/1244;margin:0 auto 24px;overflow:hidden;border-radius:20px;background:#1d343e}
.innoserve-loading-slides img{display:block;width:100%;height:100%;object-fit:contain}
</style>
<div class="innoserve-loading-slides" aria-hidden="true"></div>
<p class="tourism-wait-title" aria-live="off">${c.title}</p>
 <div class="tourism-progress-heading"><span class="tourism-progress-label">${c.label}</span><strong class="tourism-percent">0%</strong></div>
 <div class="tourism-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="tourism-fill"></div></div>
 <ol class="tourism-milestones">${c.steps.map(x=>`<li>${x}</li>`).join('')}</ol>
 <p class="tourism-status">${c.uploading}</p><p class="tourism-progress-note">${c.note}</p></section>`;
 const root=host.querySelector('.tourism-wait'),pct=host.querySelector('.tourism-percent'),fill=host.querySelector('.tourism-fill'),track=host.querySelector('.tourism-track'),status=host.querySelector('.tourism-status'),marks=[...host.querySelectorAll('.tourism-milestones li')],stage=host.querySelector('.innoserve-loading-slides');
 let dead=false,slideIndex=0,animationTimer=null;
 const copyStatus=p=>p==='ready'||p==='completed'?c.ready:p==='failed'?c.failed:p==='generating'?c.generating:p==='queued'||p==='pending'?c.queued:c.uploading;
 function paint(){const n=Math.round(clamp(d.current,0,100));pct.textContent=n+'%';fill.style.width=n+'%';track.setAttribute('aria-valuenow',String(n));status.textContent=copyStatus(d.phase);root.dataset.phase=d.phase;const reached=n>=100?4:n>=48?3:n>=20?2:1;marks.forEach((x,i)=>x.classList.toggle('is-done',i<reached))}
 const progressTimer=setInterval(()=>{if(dead)return;if(!['ready','completed','failed'].includes(d.phase))d.target=Math.min(96,Math.max(d.target,d.current+.08));const gap=d.target-d.current;d.current=Math.abs(gap)<.04?d.target:d.current+Math.max(.04,gap*.075);paint()},80);
 const pictures=[1,2,3].map(n=>{const img=new Image();img.src='assets/innoserve/loading-'+n+'.jpg';img.alt='';img.width=1721;img.height=1244;return img;});
 stage.append(pictures[0]);
 Promise.all(pictures.map(img=>img.decode())).then(()=>{
  if(dead)return;
  animationTimer=setInterval(()=>{if(dead)return;slideIndex=(slideIndex+1)%pictures.length;stage.replaceChildren(pictures[slideIndex]);},1000);
 }).catch(()=>{/* Keep first slide if another image cannot load. */});
 function update(p={}){d.phase=p.phase||p.status||d.phase;d.target=targetFor(d.phase,p.percent);paint()}
 function reset(){d.current=0;d.target=0;d.phase='uploading';slideIndex=0;stage.replaceChildren(pictures[0]);paint()}
 paint();return{update,reset,dispose(){dead=true;clearInterval(progressTimer);clearInterval(animationTimer);host.innerHTML=''}}
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



