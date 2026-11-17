/* Original photos are requested only after deliberate hover or keyboard focus. */
window.createSourcePhotoPreview = function ({ apiBase, identity }) {
    const cache = new Map();
    const MAX_ITEMS = 60, MAX_BYTES = 8 * 1024 * 1024;
    let cacheBytes = 0, active = null, timer = null, serial = Promise.resolve(), disposed = false;
    const popup = document.createElement('div');
    popup.id = 'source-photo-preview';
    popup.setAttribute('role', 'tooltip');
    popup.hidden = true;
    popup.style.cssText = 'position:fixed;z-index:10000;pointer-events:none;box-sizing:border-box;width:220px;max-width:calc(100vw - 16px);padding:10px;border:1px solid #475569;border-radius:12px;background:#0f172a;color:#e2e8f0;box-shadow:0 12px 36px #0008;text-align:center;font-size:12px';
    document.body.appendChild(popup);
    function hide() {
        clearTimeout(timer);
        if (active) active.button.removeAttribute('aria-describedby');
        active = null; popup.hidden = true; popup.replaceChildren();
    }
    function current(item) { return !disposed && active === item && item.button.isConnected && !document.hidden; }
    function position(item) {
        const rect = item.button.getBoundingClientRect();
        const width = popup.offsetWidth || 220, height = popup.offsetHeight || 240;
        const right = rect.right + 12;
        popup.style.left = Math.max(8, Math.min(right + width <= innerWidth - 8 ? right : rect.left - width - 12, innerWidth - width - 8)) + 'px';
        popup.style.top = Math.max(8, Math.min(rect.top, innerHeight - height - 8)) + 'px';
    }
    function show(item, entry) {
        if (!current(item)) return;
        popup.replaceChildren();
        if (entry) {
            const img = document.createElement('img');
            img.alt = '原照小預覽'; img.src = entry.url;
            img.style.cssText = 'display:block;width:100%;height:200px;object-fit:contain;border-radius:6px';
            popup.appendChild(img);
        } else popup.textContent = '正在取得小預覽…';
        popup.hidden = false; item.button.setAttribute('aria-describedby', popup.id); position(item);
    }
    function getCached(key) {
        const entry = cache.get(key);
        if (entry) { cache.delete(key); cache.set(key, entry); }
        return entry;
    }
    function remember(key, blob) {
        const entry = { url: URL.createObjectURL(blob), size: blob.size };
        cache.set(key, entry); cacheBytes += entry.size;
        while (cache.size > MAX_ITEMS || cacheBytes > MAX_BYTES) {
            const oldest = cache.keys().next().value, removed = cache.get(oldest);
            cache.delete(oldest); cacheBytes -= removed.size; URL.revokeObjectURL(removed.url);
        }
        return cache.get(key);
    }
    async function load(item) {
        if (!current(item)) return;
        const cached = getCached(item.key);
        if (cached) { show(item, cached); return; }
        show(item);
        // One request at a time. Finish an already-started request for reuse;
        // skip queued requests when the pointer has already left their button.
        serial = serial.catch(() => {}).then(async () => {
            if (!current(item)) return;
            const existing = getCached(item.key);
            if (existing) { show(item, existing); return; }
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 20000);
            try {
                const response = await fetch(apiBase + '/api/preview/' + encodeURIComponent(item.id) + '/source?size=240', { signal: controller.signal, cache: 'no-cache' });
                if (!response.ok) throw new Error('Preview unavailable');
                const blob = await response.blob();
                if (!blob.type.startsWith('image/') || blob.size > MAX_BYTES) throw new Error('Invalid preview');
                if (disposed) return;
                const entry = remember(item.key, blob);
                if (entry) show(item, entry);
            } catch (_) {
                if (current(item)) { popup.textContent = '小預覽暫時無法載入，仍可下載原照'; position(item); }
            } finally { clearTimeout(timeout); }
        });
    }
    function start(button) {
        if (!button || (active && active.button === button)) return;
        hide();
        const id = button.dataset.sourcePreview;
        const item = { button, id, key: identity(id) };
        active = item;
        timer = setTimeout(() => load(item), 300);
    }
    function target(event) { return event.target.closest?.('[data-source-preview]'); }
    document.addEventListener('pointerover', event => { if (event.pointerType !== 'touch') start(target(event)); });
    document.addEventListener('pointerout', event => {
        const button = target(event);
        if (button && !button.contains(event.relatedTarget) && active?.button === button) hide();
    });
    document.addEventListener('focusin', event => start(target(event)));
    document.addEventListener('focusout', event => { if (target(event) === active?.button) hide(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') hide(); });
    document.addEventListener('click', event => { if (target(event)) hide(); });
    document.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);
    document.addEventListener('visibilitychange', () => { if (document.hidden) hide(); });
    window.addEventListener('pagehide', event => {
        hide();
        if (event.persisted) return;
        disposed = true;
        for (const entry of cache.values()) URL.revokeObjectURL(entry.url);
        cache.clear(); cacheBytes = 0;
    });
    return { hide };
};
