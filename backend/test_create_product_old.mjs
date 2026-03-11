const payload = {
    "name": "Test Old Schema",
    "nameAr": "",
    "price": 50,
    "stock": 5,
    "categorySlug": "",
    "image": "",
    "images": []
};

fetch('http://localhost:5000/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
}).then(async r => {
    console.log(r.status, await r.text());
}).catch(console.error);
