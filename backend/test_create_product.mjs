const payload = {
    "name": "Test",
    "nameAr": "",
    "price": 100,
    "originalPrice": null,
    "stock": 10,
    "categorySlug": "",
    "description": "Desc",
    "descriptionAr": "",
    "image": "/uploads/products/test.jpg",
    "images": [],
    "sku": "123",
    "inStock": true,
    "tags": ["test"],
    "features": ["feat1"],
    "variants": [],
    "status": "published",
    "isVisible": true,
    "isNew": false,
    "isPopular": false,
    "isBestSeller": false,
    "isFeatured": false,
    "publishedAt": "2026-03-09T00:00:00.000Z",
    "sortOrder": 0
};

fetch('http://localhost:5000/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
}).then(async r => {
    console.log(r.status, await r.text());
}).catch(console.error);
