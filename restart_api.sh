#!/bin/bash
echo "--- REDEMARRAGE DE LA BASE DE DONNEES ---"
systemctl restart postgresql

echo "--- REDEMARRAGE DE L'API NODE.JS (PM2) ---"
pm2 restart all

echo "--- REDEMARRAGE DU REVERSE PROXY NGINX ---"
systemctl restart nginx

echo "--- TERMINE ! LE SITE DOIT ETRE RAPIDE ---"
