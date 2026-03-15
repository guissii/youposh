# Stockage des secrets — Guide sécurisé

## Principe
- Ne jamais mettre de mots de passe/clé API en clair dans un README ou dans le dépôt.
- Conserver les secrets dans des fichiers non versionnés (ex: `.env`) ou chiffrés.

## Où placer les secrets (recommandé)
- Backend (VPS): `/var/www/youposh/backend/.env` (chmod 600)
- Copie locale Windows non versionnée: `C:\Users\MSI\Desktop\you shop\infoo\secrets.env` (à supprimer après chiffrement)

### Modèle à remplir
- Utilisez ce modèle: `infoo\secrets.env.template`
  - Dupliquez-le en `infoo\secrets.env` puis remplissez les valeurs.

## Chiffrement côté Windows (options)

### Option 1 — 7‑Zip (AES‑256)
1. Installez 7‑Zip.
2. Dans le dossier `infoo`, sélectionnez `secrets.env` → clic droit → 7‑Zip → “Ajouter à l’archive…”
3. Format: `7z`, Méthode de chiffrement: `AES‑256`, Mot de passe fort, “Chiffrer les noms de fichiers” activé.
4. Supprimez le fichier `secrets.env` en clair, conservez `secrets.7z`.

### Option 2 — Gpg4win (GPG)
1. Installez Gpg4win.
2. Ouvrez une invite PowerShell dans `infoo`:
   - `gpg --symmetric --cipher-algo AES256 secrets.env`
3. Supprimez `secrets.env`, conservez `secrets.env.gpg`.
4. Pour déchiffrer: `gpg --decrypt secrets.env.gpg > secrets.env`

### Option 3 — OpenSSL (si installé)
1. Chiffrer: `openssl enc -aes-256-cbc -salt -pbkdf2 -iter 200000 -in secrets.env -out secrets.env.enc`
2. Déchiffrer: `openssl enc -d -aes-256-cbc -salt -pbkdf2 -iter 200000 -in secrets.env.enc -out secrets.env`

## Variables à renseigner
```
DATABASE_URL=
DIRECT_URL=
JWT_SECRET=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_BASE64=
GOOGLE_SHEETS_SPREADSHEET_ID=
```

## Bonnes pratiques
- Utilisez un gestionnaire de mots de passe pour conserver la passphrase 7‑Zip/GPG/OpenSSL.
- Ne partagez jamais les fichiers en clair (`secrets.env`) par messagerie.
- Préférez un coffre chiffré (GPG/7z) + version non chiffrée uniquement sur les machines d’exploitation.

