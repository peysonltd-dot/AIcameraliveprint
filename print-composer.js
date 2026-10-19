(function (root) {
    'use strict';

    const SPEC = Object.freeze({
        width: 2480,
        height: 3508,
        characterSize: 2463,
        characterTop: 108,
        dpi: 300,
        widthMm: 210,
        heightMm: 297,
        frameUrl: 'assets/medical-print-frame-v27.png'
    });

    function loadImageFromBlob(blob, label = '圖片') {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(blob);
            const image = new Image();
            let settled = false;
            const finish = error => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                image.onload = image.onerror = null;
                URL.revokeObjectURL(url);
                if (error) { image.src = ''; reject(error); }
                else resolve(image);
            };
            const timer = setTimeout(() => finish(new Error(`${label}讀取超過 15 秒，請重試`)), 15000);
            image.onload = () => finish();
            image.onerror = () => finish(new Error(`${label}載入失敗，請檢查連線後重試`));
            image.src = url;
        });
    }

    async function fetchImage(url, label = '圖片') {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 30000);
        let blob;
        try {
            const response = await fetch(url, { cache: 'no-store', signal: controller.signal });
            if (!response.ok) throw new Error(`${label}下載失敗（${response.status}）`);
            blob = await response.blob();
            if (!blob.size) throw new Error(`${label}內容為空，請重試`);
        } catch (error) {
            if (error.name === 'AbortError') throw new Error(`${label}下載超過 30 秒，請檢查連線後重試`);
            throw error;
        } finally { clearTimeout(timer); }
        return loadImageFromBlob(blob, label);
    }

    function removeConnectedWhiteBackground(image) {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth || image.width;
        canvas.height = image.naturalHeight || image.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(image, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        const width = canvas.width;
        const height = canvas.height;
        const count = width * height;
        const visited = new Uint8Array(count);
        const queue = new Int32Array(count);
        let head = 0;
        let tail = 0;

        function isWhiteBackground(index) {
            const offset = index * 4;
            const r = pixels[offset];
            const g = pixels[offset + 1];
            const b = pixels[offset + 2];
            const a = pixels[offset + 3];
            if (a === 0) return true;
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const distance = Math.hypot(255 - r, 255 - g, 255 - b);
            return distance <= 100 && max - min <= 38;
        }

        function enqueue(index) {
            if (visited[index] || !isWhiteBackground(index)) return;
            visited[index] = 1;
            queue[tail++] = index;
        }

        for (let x = 0; x < width; x++) {
            enqueue(x);
            enqueue((height - 1) * width + x);
        }
        for (let y = 1; y < height - 1; y++) {
            enqueue(y * width);
            enqueue(y * width + width - 1);
        }

        while (head < tail) {
            const index = queue[head++];
            const x = index % width;
            const y = (index / width) | 0;
            pixels[index * 4 + 3] = 0;
            if (x > 0) enqueue(index - 1);
            if (x + 1 < width) enqueue(index + 1);
            if (y > 0) enqueue(index - width);
            if (y + 1 < height) enqueue(index + width);
        }

        // Feather only the pale pixels touching the removed background. This keeps
        // enclosed white details while avoiding a JPEG-white halo around the figure.
        for (let pass = 0; pass < 2; pass++) {
            const newlyTransparent = [];
            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    const index = y * width + x;
                    const offset = index * 4;
                    if (pixels[offset + 3] === 0) continue;
                    const touchesBackground = pixels[(index - 1) * 4 + 3] === 0 ||
                        pixels[(index + 1) * 4 + 3] === 0 ||
                        pixels[(index - width) * 4 + 3] === 0 ||
                        pixels[(index + width) * 4 + 3] === 0;
                    if (!touchesBackground) continue;
                    const r = pixels[offset];
                    const g = pixels[offset + 1];
                    const b = pixels[offset + 2];
                    const max = Math.max(r, g, b);
                    const min = Math.min(r, g, b);
                    if (min < 185 || max - min > 42) continue;
                    const alpha = Math.max(0, Math.min(255, Math.round((255 - min) / 70 * 255)));
                    pixels[offset + 3] = Math.min(pixels[offset + 3], alpha);
                    if (alpha < 12) newlyTransparent.push(index);
                }
            }
            newlyTransparent.forEach(index => { pixels[index * 4 + 3] = 0; });
        }

        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }

    function crc32(bytes) {
        let crc = 0xffffffff;
        for (const byte of bytes) {
            crc ^= byte;
            for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
        }
        return (crc ^ 0xffffffff) >>> 0;
    }

    async function addPngResolution(blob, dpi = SPEC.dpi) {
        const source = new Uint8Array(await blob.arrayBuffer());
        const pixelsPerMeter = Math.round(dpi / 0.0254);
        const type = new TextEncoder().encode('pHYs');
        const data = new Uint8Array(9);
        const view = new DataView(data.buffer);
        view.setUint32(0, pixelsPerMeter);
        view.setUint32(4, pixelsPerMeter);
        data[8] = 1;
        const chunk = new Uint8Array(4 + 4 + 9 + 4);
        const chunkView = new DataView(chunk.buffer);
        chunkView.setUint32(0, 9);
        chunk.set(type, 4);
        chunk.set(data, 8);
        chunkView.setUint32(17, crc32(new Uint8Array([...type, ...data])));
        const parts = [source.subarray(0, 8)];
        let offset = 8;
        let inserted = false;
        let outputLength = 8;
        while (offset + 12 <= source.length) {
            const chunkLength = new DataView(source.buffer, source.byteOffset + offset, 4).getUint32(0);
            const end = offset + 12 + chunkLength;
            if (end > source.length) throw new Error('PNG 檔案損毀');
            const chunkType = String.fromCharCode(
                source[offset + 4], source[offset + 5], source[offset + 6], source[offset + 7]
            );
            const currentChunk = source.subarray(offset, end);
            if (chunkType !== 'pHYs') {
                parts.push(currentChunk);
                outputLength += currentChunk.length;
            }
            if (chunkType === 'IHDR' && !inserted) {
                parts.push(chunk);
                outputLength += chunk.length;
                inserted = true;
            }
            offset = end;
            if (chunkType === 'IEND') break;
        }
        const output = new Uint8Array(outputLength);
        let writeOffset = 0;
        for (const part of parts) {
            output.set(part, writeOffset);
            writeOffset += part.length;
        }
        return new Blob([output], { type: 'image/png' });
    }

    function canvasToBlob(canvas) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('PNG 輸出超過 45 秒，請稍後重試')), 45000);
            try {
                canvas.toBlob(blob => {
                    clearTimeout(timer);
                    if (blob) resolve(blob);
                    else reject(new Error('PNG 建立失敗'));
                }, 'image/png');
            } catch (error) { clearTimeout(timer); reject(error); }
        });
    }

    async function compose(imageUrl, options = {}) {
        const notify = typeof options.onProgress === 'function' ? options.onProgress : () => {};
        notify('取得原圖與邊框…');
        const [characterImage, frameImage] = await Promise.all([
            fetchImage(imageUrl, '角色原圖'),
            fetchImage(SPEC.frameUrl, '合成邊框')
        ]);
        notify('排版與合成中…');
        await new Promise(resolve => setTimeout(resolve, 0));
        // This edition has a white background. Preserve light clothing and all
        // original image details instead of applying white-background removal.
        const character = document.createElement('canvas');
        character.width = characterImage.naturalWidth || characterImage.width;
        character.height = characterImage.naturalHeight || characterImage.height;
        character.getContext('2d').drawImage(characterImage, 0, 0);
        const composite = document.createElement('canvas');
        composite.width = SPEC.width;
        composite.height = SPEC.height;
        const compositeCtx = composite.getContext('2d');
        compositeCtx.imageSmoothingEnabled = true;
        compositeCtx.imageSmoothingQuality = 'high';
        const characterX = Math.round((SPEC.width - SPEC.characterSize) / 2);
        const characterY = SPEC.characterTop;
        compositeCtx.fillStyle = '#ffffff';
        compositeCtx.fillRect(0, 0, SPEC.width, SPEC.height);
        if ((frameImage.naturalWidth || frameImage.width) !== SPEC.width ||
            (frameImage.naturalHeight || frameImage.height) !== SPEC.height) {
            throw new Error('底圖尺寸不符，請確認已上傳本場 A4 底圖');
        }
        compositeCtx.imageSmoothingEnabled = false;
        compositeCtx.drawImage(frameImage, 0, 0);
        compositeCtx.imageSmoothingEnabled = true;
        // Preserve the source aspect ratio inside the original AI artwork's portrait area.
        const scale = Math.min(SPEC.characterSize / character.width, SPEC.characterSize / character.height);
        const drawWidth = Math.round(character.width * scale);
        const drawHeight = Math.round(character.height * scale);
        compositeCtx.drawImage(character,
            characterX + Math.round((SPEC.characterSize - drawWidth) / 2),
            characterY + Math.round((SPEC.characterSize - drawHeight) / 2),
            drawWidth, drawHeight);

        notify('輸出高清 PNG…');
        await new Promise(resolve => setTimeout(resolve, 0));
        try { return await addPngResolution(await canvasToBlob(composite)); }
        finally {
            // Release temporary pixel buffers; stored originals/results are untouched.
            character.width = character.height = 0;
            composite.width = composite.height = 0;
        }
    }

    root.PrintComposer = { SPEC, compose, removeConnectedWhiteBackground, addPngResolution };
})(typeof window !== 'undefined' ? window : globalThis);



