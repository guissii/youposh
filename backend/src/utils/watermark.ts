import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

// Path to the watermark logo
const LOGO_PATH = path.join(__dirname, '../../../public/images/categories/logo final.png');

/**
 * Apply a watermark (logo) to an image file.
 * If a backup doesn't exist yet, the original is saved first so the watermark
 * can be re-applied later with different settings without stacking.
 *
 * @param inputPath - Absolute path to the image to watermark
 * @param opacity   - Opacity percentage (0-100). Example: 20 means the logo is 20% visible.
 * @param sizePct   - Size percentage (10-80). The logo will be this % of the image's smaller dimension.
 * @param posX      - Custom X position percentage (0-100)
 * @param posY      - Custom Y position percentage (0-100)
 */
export async function applyWatermark(inputPath: string, opacity: number, sizePct: number = 30, posX: number = 50, posY: number = 50): Promise<void> {
    if (!fs.existsSync(LOGO_PATH)) {
        console.warn('[watermark] Logo file not found at', LOGO_PATH, '— skipping watermark.');
        return;
    }

    if (!fs.existsSync(inputPath)) {
        console.warn('[watermark] Target image not found at', inputPath, '— skipping watermark.');
        return;
    }

    // ── Backup original ────────────────────────────────────────
    const dir = path.dirname(inputPath);
    const backupDir = path.join(dir, '.originals');
    const backupPath = path.join(backupDir, path.basename(inputPath));

    // If a backup already exists, use IT as the source (to avoid stacking watermarks)
    let sourceBuffer: Buffer;
    if (fs.existsSync(backupPath)) {
        sourceBuffer = fs.readFileSync(backupPath);
    } else {
        // First time: save the original as backup
        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
        fs.copyFileSync(inputPath, backupPath);
        sourceBuffer = fs.readFileSync(inputPath);
    }

    // Clamp opacity between 0 and 100, then convert to 0-1 range
    const clampedOpacity = Math.max(0, Math.min(100, opacity)) / 100;

    // Read the source image metadata
    const targetMeta = await sharp(sourceBuffer).metadata();
    const targetWidth = targetMeta.width || 800;
    const targetHeight = targetMeta.height || 800;

    // Desired logo size based on sizePct
    const clampedSize = Math.max(10, Math.min(80, sizePct)) / 100;
    const desiredLogoSize = Math.round(Math.min(targetWidth, targetHeight) * clampedSize);
    const maxLogoWidth = Math.floor(targetWidth * 0.9);
    const maxLogoHeight = Math.floor(targetHeight * 0.9);
    const logoSize = Math.min(desiredLogoSize, maxLogoWidth, maxLogoHeight, 500);

    // Resize the logo and get its actual dimensions
    const logoBuffer = await sharp(LOGO_PATH)
        .resize(logoSize, logoSize, { fit: 'inside' })
        .ensureAlpha()
        .png()
        .toBuffer();
    const logoMeta = await sharp(logoBuffer).metadata();
    const logoW = logoMeta.width || logoSize;
    const logoH = logoMeta.height || logoSize;

    // Create an opacity mask SVG matching the exact logo dimensions
    const opacitySvg = Buffer.from(
        `<svg width="${logoW}" height="${logoH}">
            <rect x="0" y="0" width="${logoW}" height="${logoH}" fill="white" opacity="${clampedOpacity}" />
        </svg>`
    );

    // Apply the opacity mask to the logo
    const watermarkBuffer = await sharp(logoBuffer)
        .composite([{ input: opacitySvg, blend: 'dest-in' }])
        .png()
        .toBuffer();

    // Ensure bounds
    const clampX = Math.max(0, Math.min(100, posX));
    const clampY = Math.max(0, Math.min(100, posY));

    // Calculate precise coordinates, aligning the *center* of the logo to the chosen percentage
    let left = Math.round((targetWidth * (clampX / 100)) - (logoW / 2));
    let top = Math.round((targetHeight * (clampY / 100)) - (logoH / 2));

    // Constrain so logo doesn't overflow
    left = Math.max(0, Math.min(targetWidth - logoW, left));
    top = Math.max(0, Math.min(targetHeight - logoH, top));

    // Composite the watermark onto the source image at coordinates
    const outputBuffer = await sharp(sourceBuffer)
        .composite([{
            input: watermarkBuffer,
            top: top,
            left: left,
        }])
        .toBuffer();

    // Determine the output format from the original file extension
    const ext = path.extname(inputPath).toLowerCase();
    let finalBuffer: Buffer;
    if (ext === '.png') {
        finalBuffer = await sharp(outputBuffer).png().toBuffer();
    } else if (ext === '.webp') {
        finalBuffer = await sharp(outputBuffer).webp().toBuffer();
    } else {
        finalBuffer = await sharp(outputBuffer).jpeg({ quality: 90 }).toBuffer();
    }

    // Overwrite the output file
    fs.writeFileSync(inputPath, finalBuffer);
}

// ─── Batch utility ──────────────────────────────────────────────
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

export async function getAllImages(dir: string): Promise<string[]> {
    const results: string[] = [];
    if (!fs.existsSync(dir)) return results;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        // Skip the .originals backup folder
        if (entry.name === '.originals') continue;
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...(await getAllImages(fullPath)));
        } else if (IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
            results.push(fullPath);
        }
    }
    return results;
}

/**
 * Apply watermark to ALL images in the standard directories.
 * Returns { total, success, failed } counts.
 */
export async function applyWatermarkToAll(opacity: number, sizePct: number, posX: number = 50, posY: number = 50): Promise<{ total: number; success: number; failed: number }> {
    const dirs = [
        path.join(__dirname, '../../../public/images/products'),
        path.join(__dirname, '../../../uploads/categories'),
        path.join(__dirname, '../../../uploads/products'),
    ];

    let total = 0, success = 0, failed = 0;

    for (const dir of dirs) {
        const images = await getAllImages(dir);
        for (const img of images) {
            total++;
            try {
                await applyWatermark(img, opacity, sizePct, posX, posY);
                success++;
            } catch (err: any) {
                console.error(`[watermark] ❌ ${path.basename(img)}: ${err.message}`);
                failed++;
            }
        }
    }

    return { total, success, failed };
}

/**
 * Remove watermarks by restoring ALL original images from their backups.
 * Returns { total, success, failed } counts.
 */
export async function restoreAllOriginals(): Promise<{ total: number; success: number; failed: number }> {
    const dirs = [
        path.join(__dirname, '../../../public/images/products'),
        path.join(__dirname, '../../../uploads/categories'),
        path.join(__dirname, '../../../uploads/products'),
    ];

    let total = 0, success = 0, failed = 0;

    for (const dir of dirs) {
        const backupDir = path.join(dir, '.originals');
        if (!fs.existsSync(backupDir)) continue;

        const entries = fs.readdirSync(backupDir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
                total++;
                const backupPath = path.join(backupDir, entry.name);
                const targetPath = path.join(dir, entry.name);

                try {
                    // Copy backup over the watermarked image
                    fs.copyFileSync(backupPath, targetPath);
                    success++;
                } catch (err: any) {
                    console.error(`[watermark-restore] ❌ ${entry.name}: ${err.message}`);
                    failed++;
                }
            }
        }
    }

    return { total, success, failed };
}
