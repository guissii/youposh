# YOU POSH — README Global (Ops & Architecture)

## Vue d’ensemble
- Frontend (React/Vite) hébergé sur Vercel
  - Domaine: `youposhmaroc.com` (apex) et `www.youposhmaroc.com`
  - Variable d’environnement frontend: `VITE_API_URL = https://api.youposhmaroc.com/api`
- Backend (Node/Express) sur VPS Contabo
  - Gestion de processus: PM2, nom du service: `youshop-api`
  - Reverse proxy: Nginx (HTTPS Let’s Encrypt)
  - Domaine API: `api.youposhmaroc.com`
- Base de données: PostgreSQL local au VPS
  - Nom: `youposh_db`
  - Utilisateur applicatif: `youshop`
- DNS via Cloudflare (Proxied)
  - `@` (A) → `76.76.21.21` (Vercel)
  - `www` (CNAME) → `cname.vercel-dns.com` (Vercel)
  - `api` (A) → `84.247.184.208` (VPS)
  - SSL/TLS Cloudflare: mode “Full”

## Emplacements importants (VPS)
- Backend: `/var/www/youposh/backend`
- Fichier env backend (secrets): `/var/www/youposh/backend/.env` (chmod 600)
- Nginx site: `/etc/nginx/sites-available/youshop-api` (lien dans `sites-enabled/`)
- PM2: config runtime dans `/root/.pm2/`
- Backups Postgres: `/opt/backups` (gzip, rétention 7 jours)
- Script backup: `/usr/local/bin/pg_backup_youshop.sh` (cron 02:00)
- Script de test (smoke test): `/usr/local/bin/youshop_smoketest.sh`

## Inventaire des variables sensibles (sans valeurs)
> Ne jamais stocker de secrets en clair dans un README. Les valeurs sont dans `.env` (VPS) et/ou dans un coffre chiffré.

- Base de données / Prisma
  - `DATABASE_URL`
  - `DIRECT_URL`
- Authentification
  - `JWT_SECRET`
- Supabase (uploads)
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Intégrations Google (optionnel)
  - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
  - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_BASE64`
  - `GOOGLE_SHEETS_SPREADSHEET_ID`

### Gestion sécurisée des secrets (recommandée)
- Secrets applicatifs: `/var/www/youposh/backend/.env` (protégé: `chmod 600`)
- Coffre chiffré (optionnel): `/root/secrets.d/secrets.env.gpg` (AES256)
  - Déchiffrer pour consultation ponctuelle:  
    `gpg --decrypt /root/secrets.d/secrets.env.gpg > /root/secrets.d/secrets.tmp && chmod 600 /root/secrets.d/secrets.tmp`  
    (penser à supprimer ensuite: `shred -u /root/secrets.d/secrets.tmp`)

## Commandes d’exploitation (VPS)
- Santé API:  
  `curl -I https://api.youposhmaroc.com/api/health`
- Logs backend:  
  `pm2 logs youshop-api --lines 120`
- Redémarrer backend (recharger `.env`):  
  `pm2 restart youshop-api --update-env`
- Nginx (vérifier & recharger):  
  `nginx -t && systemctl reload nginx`
- Certificats Let’s Encrypt (vérification):  
  `certbot renew --dry-run`
- Backups manuels:  
  `/usr/local/bin/pg_backup_youshop.sh`

## Tests rapides (smoke test)
- Script global:  
  `/usr/local/bin/youshop_smoketest.sh`
- Endpoints clés (public):
  - `GET https://api.youposhmaroc.com/api/health` (attendu: HTTP 200 JSON `{status:"ok"}`)
  - `GET https://api.youposhmaroc.com/api/products` (attendu: HTTP 200 + liste JSON)
  - `GET https://api.youposhmaroc.com/api/categories`
  - `GET https://api.youposhmaroc.com/api/settings/store`
  - `GET https://api.youposhmaroc.com/api/settings/hero`

## Déploiements
- Backend (redémarrage avec rechargement des variables):  
  `pm2 restart youshop-api --update-env`
- Frontend (Vercel):
  - S’assurer que `VITE_API_URL = https://api.youposhmaroc.com/api`
  - Redeploy (si nécessaire: “Clear build cache”)

## Procédures incidents — recettes rapides
1. “Failed to fetch products”
   - Vérifier DB: `sudo -u postgres psql -d youposh_db -tAc 'SELECT COUNT(*) FROM "Product";'`
   - Vérifier `DATABASE_URL`/`DIRECT_URL` dans `.env` (utilisateur/mot de passe corrects)
   - `pm2 restart youshop-api --update-env` puis `pm2 logs youshop-api --lines 120`
2. Erreurs TLS ou 502 Cloudflare
   - `nginx -t && systemctl reload nginx`
   - `certbot renew --dry-run`
   - Vérifier DNS Cloudflare (`api` → IP VPS) et SSL/TLS sur “Full”
3. Upload Supabase KO
   - Confirmer `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` dans `.env`
   - Regarder les logs au démarrage: “Supabase initialized for uploads”

## DNS (résumé)
- `@` → `76.76.21.21` (Vercel, Proxied)
- `www` → `cname.vercel-dns.com` (Vercel, Proxied)
- `api` → `84.247.184.208` (VPS, Proxied)

## Bonnes pratiques
- Ne jamais committer `.env` ni stocker des secrets en clair dans le code.
- Protéger les fichiers sensibles (`chmod 600`).
- Restreindre CORS aux domaines autorisés (youposhmaroc.com et le domaine Vercel).

---
Ce document ne contient pas de mots de passe ni de clés. Les emplacements et procédures ci‑dessus indiquent comment gérer les secrets en toute sécurité.

## Index des secrets (pointeurs)
- Admin application:
  - Clés à remplir dans `infoo\secrets.env` puis chiffrer: `ADMIN_EMAIL`, `ADMIN_PASSWORD`
  - Copie active côté VPS dans `/var/www/youposh/backend/.env` (variables selon implémentation)
- Accès VPS:
  - Clés à stocker dans le coffre: `VPS_ROOT_USER`, `VPS_ROOT_PASSWORD`
- Base de données:
  - `DATABASE_URL`, `DIRECT_URL` (mettre à jour dans `.env` backend et recharger PM2)
- Supabase:
  - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- Guide de chiffrement et procédures: `infoo\SECRETS_GUIDE.md`


root   vps


Abc12345!  mot pass vps 


