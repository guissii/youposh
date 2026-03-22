import NodeCache from 'node-cache';
import { Request, Response, NextFunction } from 'express';

// Global cache instance: Default TTL 60 seconds
export const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

/**
 * Express Middleware to cache JSON responses.
 * Bypasses POST/PUT/DELETE commands automatically.
 */
export const cacheMiddleware = (durationSeconds: number) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        const key = req.originalUrl || req.url;
        const cachedResponse = cache.get(key);

        if (cachedResponse) {
            return res.json(cachedResponse);
        } else {
            // Intercept res.json to store the response in the cache before sending it
            const originalJson = res.json.bind(res);
            res.json = (body: any) => {
                // Ensure we don't cache Error responses like 404 or 500
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    cache.set(key, body, durationSeconds);
                }
                return originalJson(body);
            };
            next();
        }
    };
};

// Export a function to completely clear the cache when admin edits something
export const clearCache = () => cache.flushAll();
