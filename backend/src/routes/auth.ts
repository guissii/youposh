import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this';

// ── Login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email et mot de passe requis' });
        }

        // Find user
        const user = await prisma.adminUser.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Identifiants invalides' });
        }

        // Check password
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            return res.status(401).json({ error: 'Identifiants invalides' });
        }

        // Generate token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' } // Token valid for 7 days
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la connexion' });
    }
});

// ── Register (First time setup only - protected in production) ──
router.post('/register', async (req, res) => {
    // 🛑 Registration disabled for security.
    // Use 'npm run seed' to create initial admin accounts.
    return res.status(403).json({ error: 'L\'inscription publique est désactivée.' });

    /*
    try {
        const { email, password, name } = req.body;

        // Simple check: if any user exists, block public registration
        // (In a real app, you'd protect this route with a master key or existing admin token)
        const count = await prisma.adminUser.count();
        if (count > 0) {
            // Check if request has a valid admin token to allow creating more users
            // For now, we'll just block it to keep it simple and secure
            return res.status(403).json({ error: 'L\'inscription est désactivée. Contactez l\'administrateur.' });
        }

        if (!email || !password) {
            return res.status(400).json({ error: 'Email et mot de passe requis' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.adminUser.create({
            data: {
                email,
                passwordHash: hashedPassword,
                name,
                role: 'admin'
            }
        });

        // Auto login after register
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Erreur lors de la création du compte' });
    }
    */
});

// ── Me (Verify token) ─────────────────────────────────────────
router.get('/me', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Token manquant' });

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        const user = await prisma.adminUser.findUnique({ where: { id: decoded.id } });
        
        if (!user) return res.status(401).json({ error: 'Utilisateur introuvable' });

        res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        });
    } catch (error) {
        res.status(401).json({ error: 'Token invalide' });
    }
});

export default router;
