/* Progress is completed milestones, never elapsed-time or an invented AI percentage.
 * 25: task accepted; 50: server completed both styles; 75/100: each image decoded.
 * No backend mutation is made by the monitor. Retries only re-read the same task.
 */
(function (root) {
    'use strict';
    const copy = {
        zh: { title:'黑熊陪你，等一張驚喜', label:'流程進度', note:'依實際完成步驟更新，非剩餘時間估算', uploading:'正在傳送照片…', queued:'照片已收到，排隊等候中…', pending:'照片已收到，準備生成…', generating:'AI 正在製作兩款肖像…', loading:'肖像已生成，正在載入圖片…', ready:'100% 完成！準備選擇喜歡的款式', reconnecting:'連線暫時不穩，正在查詢原任務，請勿重複送出。', imageRetry:'圖片尚未載入成功，正在重試…', failed:'生成未完成，請通知工作人員。', slow:'等待較久，仍在查詢原任務，請勿重複送出。', steps:['照片送達','AI 完成','款式 A','款式 B'] },
        en: { title:'A little Taiwan, a little wonder', label:'Workflow progress', note:'Completed steps, not an estimate of time remaining', uploading:'Sending your photo…', queued:'Photo received. Waiting in the queue…', pending:'Preparing your portrait…', generating:'AI is creating two portraits…', loading:'Portraits generated. Loading images…', ready:'100% ready! Choose your favorite.', reconnecting:'Reconnecting to the same task. Please do not submit again.', imageRetry:'Images are not ready to display. Retrying…', failed:'Generation could not finish. Please ask our staff.', slow:'This is taking longer. Still checking the same task.', steps:['Received','Generated','Style A','Style B'] },
        jp: { title:'台湾のクマと、わくわく待ち時間', label:'処理の進み具合', note:'実際に完了した工程を表示しています', uploading:'写真を送信中…', queued:'写真を受信しました。順番待ちです…', pending:'生成の準備中…', generating:'2つの肖像画を生成中…', loading:'生成完了。画像を読み込み中…', ready:'100% 完了！好きなスタイルを選びましょう', reconnecting:'同じ受付番号に再接続中です。再送信しないでください。', imageRetry:'画像を読み込めません。再試行中…', failed:'生成できませんでした。スタッフにお声がけください。', slow:'時間がかかっています。同じ受付番号を確認中です。', steps:['写真受信','生成完了','画像 A','画像 B'] }
    };
    function mount(element, lang = 'zh') {
        const t = copy[lang] || copy.zh;
        element.innerHTML = '<div class="tourism-wait"><div class="tourism-progress-heading"><span class="tourism-progress-label"></span><strong class="tourism-percent">0%</strong></div><div class="tourism-track" role="progressbar" aria-valuemin="0" aria-valuemax="100"><div class="tourism-fill"></div></div><ol class="tourism-milestones"></ol><p class="tourism-status" role="status" aria-live="polite"></p><p class="tourism-progress-note"></p><div class="tourism-character-stage" aria-hidden="true"><img class="tourism-character" src="assets/taiwan-bear-boba.png" alt="" width="360" height="360"></div><p class="tourism-wait-title"></p></div>';
        element.querySelector('.tourism-progress-label').textContent = t.label;
        element.querySelector('.tourism-progress-note').textContent = t.note;
        element.querySelector('.tourism-wait-title').textContent = t.title;
        element.querySelector('.tourism-track').setAttribute('aria-label', t.label);
        for (const step of t.steps) { const li = document.createElement('li'); li.textContent = step; element.querySelector('ol').appendChild(li); }
        function update({phase = 'uploading', percent = 0}) {
            const value = Math.max(0, Math.min(100, percent));
            element.querySelector('.tourism-percent').textContent = value + '%';
            element.querySelector('.tourism-fill').style.width = value + '%';
            element.querySelector('.tourism-track').setAttribute('aria-valuenow', String(value));
            element.querySelector('.tourism-status').textContent = t[phase] || t.generating;
            element.querySelector('.tourism-wait').dataset.phase = phase;
            element.querySelectorAll('li').forEach((li, i) => li.classList.toggle('is-done', value >= (i + 1) * 25));
        }
        update({});
        return {update, dispose: () => element.replaceChildren()};
    }
    function decodeImage(src, signal) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const timer = setTimeout(() => finish(new Error('image timeout')), 25000);
            function finish(error) { clearTimeout(timer); signal.removeEventListener('abort', aborted); img.onload = img.onerror = null; error ? reject(error) : resolve(img); }
            function aborted() { finish(new DOMException('Cancelled', 'AbortError')); img.src = ''; }
            if (signal.aborted) return aborted();
            signal.addEventListener('abort', aborted, {once:true});
            img.onerror = () => finish(new Error('image unavailable'));
            img.onload = async () => {
                try { if (img.decode) await img.decode(); if (!img.naturalWidth) throw new Error('empty image'); finish(); } catch (error) { finish(error); }
            };
            img.src = src;
        });
    }
    function monitor({apiBase, taskId, onProgress, onReady, onFailure, interval = 2500}) {
        const lifetime = new AbortController();
        let timer, doneTimer, stopped = false, percent = 25;
        const started = Date.now();
        const loaded = new Map();
        const emit = (phase, value = percent) => { if (!stopped) { percent = value; onProgress({phase, percent}); } };
        const schedule = () => { if (!stopped) timer = setTimeout(poll, interval); };
        async function poll() {
            const request = new AbortController();
            const abortRequest = () => request.abort();
            lifetime.signal.addEventListener('abort', abortRequest, {once:true});
            const timeout = setTimeout(abortRequest, 15000);
            try {
                const response = await fetch(apiBase + '/api/status/' + encodeURIComponent(taskId), {cache:'no-store', signal:request.signal});
                if (!response.ok) throw new Error('status unavailable');
                const data = await response.json();
                if (stopped) return;
                if (['failed','error','cancelled','canceled','expired'].includes(data.status)) {
                    emit('failed'); stopped = true; onFailure(data); return;
                }
                if (data.status !== 'completed' || !data.resultImageA || !data.resultImageB) {
                    emit(Date.now() - started > 180000 ? 'slow' : (['queued','pending'].includes(data.status) ? data.status : 'generating'));
                    schedule(); return;
                }
                const sources = [data.resultImageA, data.resultImageB];
                // Recalculate if the server replaces an unavailable image; never retain false completion.
                emit('loading', 50 + sources.filter((src, i) => loaded.get(i)?.src === src).length * 25);
                // Sequential decoding keeps milestones A/B truthful and holds decoded images in memory.
                for (let i = 0; i < sources.length; i++) {
                    if (loaded.get(i)?.src !== sources[i]) {
                        const img = await decodeImage(sources[i], lifetime.signal);
                        if (stopped) return;
                        loaded.set(i, {src:sources[i], img});
                    }
                    if (i === 0) emit('loading', 75);
                }
                emit('ready', 100);
                doneTimer = setTimeout(() => { if (!stopped) { stopped = true; onReady(data); } }, 700);
            } catch (error) {
                if (!stopped) { emit(percent >= 50 ? 'imageRetry' : 'reconnecting'); schedule(); }
            } finally {
                clearTimeout(timeout);
                lifetime.signal.removeEventListener('abort', abortRequest);
            }
        }
        emit('pending'); poll();
        return { stop() { stopped = true; clearTimeout(timer); clearTimeout(doneTimer); lifetime.abort(); loaded.clear(); } };
    }
    root.TourismProgress = {mount, monitor, copy};
})(typeof window !== 'undefined' ? window : globalThis);
