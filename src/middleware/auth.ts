import { Request, Response, NextFunction } from 'express';

/**
 * Optional auth middleware.
 * Currently passes through all requests (no JWT implemented yet).
 * Replace the body of this function with JWT verification when ready:
 *
 * import jwt from 'jsonwebtoken';
 * const token = req.headers.authorization?.split(' ')[1];
 * if (!token) return res.status(401).json({ error: 'Unauthorized' });
 * try {
 *   (req as any).user = jwt.verify(token, process.env.JWT_SECRET!);
 *   next();
 * } catch { res.status(401).json({ error: 'Invalid token' }); }
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // TODO: Add JWT verification here
  next();
}

/**
 * Role-based guard factory.
 * Usage: router.get('/admin', requireRole('teacher'), handler)
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (user && roles.includes(user.role)) return next();
    // For now just pass through (no user context yet after auth)
    next();
  };
}
