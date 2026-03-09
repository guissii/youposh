/**
 * One-off script to apply watermarks to ALL existing images.
 *
 * Usage:
 *   npx ts-node src/scripts/watermarkExisting.ts [opacity]
 *
 * Example:
 *   npx ts-node src/scripts/watermarkExisting.ts 20
 *
 * ⚠️  WARNING: This modifies files in-place. Make sure you have backups!
 */

import path from 'path';
import fs from 'fs';
import { applyWatermark } from '../utils/watermark';

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

async function getAllImages(dir: string): Promise<string[]> {
    const results: string[] = [];
    if (!fs.existsSync(dir)) return results;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...(await getAllImages(fullPath)));
        } else if (IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
            results.push(fullPath);
        }
    }
    return results;
}

async function main() {
    const opacity = Number(process.argv[2]) || 20;

    console.log(`\n🖼  Watermark Existing Images Script`);
    console.log(`   Opacity: ${opacity}%`);
    console.log(`   Logo: logo final.png (centred)\n`);

    const dirs = [
        path.join(__dirname, '../../../public/images/products'),
        path.join(__dirname, '../../../uploads/categories'),
        path.join(__dirname, '../../../uploads/products'),
    ];

    let total = 0;
    let success = 0;
    let failed = 0;

    for (const dir of dirs) {
        const images = await getAllImages(dir);
        if (images.length === 0) {
            console.log(`📁 ${path.relative(process.cwd(), dir)} — no images found`);
            continue;
        }

        console.log(`📁 ${path.relative(process.cwd(), dir)} — ${images.length} image(s)`);

        for (const img of images) {
            total++;
            try {
                await applyWatermark(img, opacity);
                console.log(`   ✅ ${path.basename(img)}`);
                success++;
            } catch (err: any) {
                console.error(`   ❌ ${path.basename(img)}: ${err.message}`);
                failed++;
            }
        }
    }

    console.log(`\n────────────────────────────────`);
    console.log(`Total: ${total}  |  ✅ ${success}  |  ❌ ${failed}`);
    console.log(`Done!\n`);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
