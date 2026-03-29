import fs from 'node:fs/promises';
import path from 'node:path';

const IMAGE_EXT_RE = /\.(jpg|jpeg|png|webp)$/i;
const MIME_BY_EXT = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp'
};

const args = process.argv.slice(2);
const applyMode = args.includes('--apply');
const upsertMode = !args.includes('--no-upsert');

const configArgIndex = args.findIndex(a => a === '--config');
const configPath = configArgIndex >= 0 && args[configArgIndex + 1]
  ? path.resolve(args[configArgIndex + 1])
  : path.resolve('scripts/youposh-product-import.config.json');

const readJson = async (filePath) => JSON.parse(await fs.readFile(filePath, 'utf8'));

const walkFiles = async (dir) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walkFiles(full));
    } else if (entry.isFile() && IMAGE_EXT_RE.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
};

const parsePricesFromFolder = (folderName) => {
  const nums = (folderName.match(/\d+/g) || []).map(Number);
  if (nums.length >= 2) return { price: nums[nums.length - 2], originalPrice: nums[nums.length - 1] };
  if (nums.length === 1) return { price: nums[0], originalPrice: null };
  return { price: null, originalPrice: null };
};

const postImage = async (apiBaseUrl, imagePath) => {
  const data = await fs.readFile(imagePath);
  const ext = path.extname(imagePath).toLowerCase();
  const mimeType = MIME_BY_EXT[ext] || 'image/jpeg';
  const form = new FormData();
  form.append('image', new Blob([data], { type: mimeType }), path.basename(imagePath));
  const res = await fetch(`${apiBaseUrl}/upload/product`, { method: 'POST', body: form });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Upload échoué (${path.basename(imagePath)}): ${res.status} ${body}`);
  }
  const body = await res.json();
  if (!body?.url) throw new Error(`Upload sans URL retournée pour ${imagePath}`);
  return body.url;
};

const createProductPayload = (entry, imageUrls, defaults) => {
  const fallback = parsePricesFromFolder(entry.folder || '');
  const price = Number(entry.price ?? fallback.price ?? 0);
  const originalPrice = entry.originalPrice ?? fallback.originalPrice ?? null;
  return {
    name: entry.name,
    nameAr: entry.nameAr || '',
    description: entry.description || '',
    descriptionAr: entry.descriptionAr || '',
    price,
    originalPrice: originalPrice ? Number(originalPrice) : null,
    stock: Number(entry.stock ?? defaults.defaultStock ?? 99),
    sku: entry.sku || '',
    image: imageUrls[0] || '',
    images: imageUrls,
    categorySlug: entry.categorySlug || null,
    status: entry.status || defaults.defaultStatus || 'published',
    isVisible: entry.isVisible ?? defaults.defaultVisibility ?? true,
    inStock: entry.inStock ?? defaults.defaultInStock ?? true,
    isFeatured: Boolean(entry.isFeatured),
    tags: Array.isArray(entry.tags) ? entry.tags : [],
    features: Array.isArray(entry.features) ? entry.features : [],
    variants: Array.isArray(entry.variants) ? entry.variants : [],
    sortOrder: Number(entry.sortOrder ?? 0),
    cardZoom: Number(entry.cardZoom ?? 1),
    cardFocalX: Number(entry.cardFocalX ?? 50),
    cardFocalY: Number(entry.cardFocalY ?? 50)
  };
};

const main = async () => {
  const config = await readJson(configPath);
  const rootFolder = config.rootFolder;
  const apiBaseUrl = config.apiBaseUrl || 'https://api.youposhmaroc.com/api';
  const products = Array.isArray(config.products) ? config.products : [];

  if (!rootFolder || !products.length) {
    throw new Error('Config invalide: rootFolder ou products manquant');
  }

  console.log(`Config: ${configPath}`);
  console.log(`Mode: ${applyMode ? 'APPLY (écriture API)' : 'DRY-RUN (simulation)'}`);
  console.log(`Upsert: ${upsertMode ? 'ON' : 'OFF'}`);
  console.log(`Produits à traiter: ${products.length}`);

  const existingRes = await fetch(`${apiBaseUrl}/products?all=true&limit=500`);
  if (!existingRes.ok) {
    throw new Error(`Impossible de lire produits existants: ${existingRes.status}`);
  }
  const existingProducts = await existingRes.json();
  const existingByName = new Map(
    (Array.isArray(existingProducts) ? existingProducts : []).map((p) => [String(p.name || '').trim().toLowerCase(), p])
  );

  const report = [];
  for (const entry of products) {
    const folderPath = path.join(rootFolder, entry.folder);
    const images = (await walkFiles(folderPath)).sort((a, b) => a.localeCompare(b));
    if (!images.length) {
      report.push({ folder: entry.folder, name: entry.name, status: 'SKIP', reason: 'Aucune image trouvée' });
      continue;
    }

    const existing = existingByName.get(String(entry.name || '').trim().toLowerCase());
    const willUpdate = Boolean(existing && upsertMode);
    const willCreate = !existing;

    if (!applyMode) {
      report.push({
        folder: entry.folder,
        name: entry.name,
        status: willCreate ? 'CREATE' : (willUpdate ? 'UPDATE' : 'SKIP'),
        images: images.length
      });
      continue;
    }

    const uploadedUrls = [];
    for (const imagePath of images) {
      const url = await postImage(apiBaseUrl, imagePath);
      uploadedUrls.push(url);
    }

    const payload = createProductPayload(entry, uploadedUrls, config);

    if (willCreate) {
      const res = await fetch(`${apiBaseUrl}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const body = await res.text();
        report.push({ folder: entry.folder, name: entry.name, status: 'ERROR', reason: `POST ${res.status} ${body}` });
        continue;
      }
      const created = await res.json();
      report.push({ folder: entry.folder, name: entry.name, status: 'CREATED', id: created?.id, images: uploadedUrls.length });
      continue;
    }

    if (willUpdate) {
      const res = await fetch(`${apiBaseUrl}/products/${existing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const body = await res.text();
        report.push({ folder: entry.folder, name: entry.name, status: 'ERROR', reason: `PUT ${res.status} ${body}` });
        continue;
      }
      report.push({ folder: entry.folder, name: entry.name, status: 'UPDATED', id: existing.id, images: uploadedUrls.length });
      continue;
    }

    report.push({ folder: entry.folder, name: entry.name, status: 'SKIP', reason: 'Existe déjà (--no-upsert)' });
  }

  console.table(report);
  const outPath = path.resolve('scripts/product-import-report.json');
  await fs.writeFile(outPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`Rapport exporté: ${outPath}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
