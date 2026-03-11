import fs from 'fs';
import path from 'path';

async function test() {
    try {
        const formData = new FormData();
        const fileData = fs.readFileSync('../public/images/categories/beauty.jpg');
        const blob = new Blob([fileData], { type: 'image/jpeg' });
        formData.append('image', blob, 'beauty.jpg');

        const response = await fetch('http://localhost:5000/api/upload/product', {
            method: 'POST',
            body: formData
        });
        const text = await response.text();
        console.log('Status:', response.status);
        console.log('Body:', text);
    } catch (err) {
        console.error('Error:', err);
    }
}
test();
