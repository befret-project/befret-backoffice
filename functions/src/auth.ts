import { Request, Response } from 'express';
import { getAuth } from 'firebase-admin/auth';
import * as logger from "firebase-functions/logger";

// Interface pour les credentials
interface AuthCredentials {
  email: string;
  password: string;
}

// Interface pour la réponse d'authentification
interface AuthResponse {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    permissions: string[];
    accessToken: string;
  };
  error?: string;
}

// Mapping des rôles utilisateurs
const USER_ROLES: Record<string, { role: string; permissions: string[] }> = {
  'admin@befret.com': {
    role: 'SUPER_ADMIN',
    permissions: ['dashboard.read', 'commercial.read', 'commercial.write', 'finance.read', 'finance.write', 'logistic.read', 'logistic.write', 'support.read', 'support.write', 'admin.read', 'admin.write']
  },
  'operator@befret.com': {
    role: 'LOGISTIC_OPERATOR',
    permissions: ['dashboard.read', 'logistic.read', 'logistic.write']
  }
};

export const authHandler = async (req: Request, res: Response) => {
  const { method } = req;
  const path = req.path || req.url?.split('?')[0] || '';

  logger.info(`Auth handler: ${method} ${path}`);

  try {
    // Handle different auth endpoints
    // Note: path includes /api prefix: /api/auth/session, /api/auth/signin, etc.
    if ((path === '/api/auth/signin' || path === '/auth/signin') && method === 'POST') {
      return await handleSignIn(req, res);
    }
    
    if ((path === '/api/auth/session' || path === '/auth/session') && method === 'GET') {
      return await handleSession(req, res);
    }
    
    if ((path === '/api/auth/signout' || path === '/auth/signout') && method === 'POST') {
      return await handleSignOut(req, res);
    }
    
    if ((path === '/api/auth/error' || path === '/auth/error') && method === 'GET') {
      return await handleError(req, res);
    }
    
    if ((path === '/api/auth/providers' || path === '/auth/providers') && method === 'GET') {
      return await handleProviders(req, res);
    }
    
    if ((path === '/api/auth/callback/credentials' || path === '/auth/callback/credentials') && method === 'POST') {
      return await handleCallback(req, res);
    }
    
    if ((path === '/api/auth/csrf' || path === '/auth/csrf') && method === 'GET') {
      return await handleCSRF(req, res);
    }

    // Default response for unsupported endpoints
    logger.error(`Auth endpoint not found: ${method} ${path}`);
    res.status(404).json({ error: `Auth endpoint not found: ${method} ${path}` });
  } catch (error) {
    logger.error('Auth handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

async function handleSignIn(req: Request, res: Response): Promise<void> {
  try {
    const { email, password }: AuthCredentials = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Vérifier les credentials via Firebase Auth REST API
    try {
      const apiKey = process.env.WEB_API_KEY;
      if (!apiKey) {
        throw new Error('Firebase API key not configured');
      }

      // Vérifier les credentials avec Firebase Auth REST API
      const authResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true
        })
      });

      if (!authResponse.ok) {
        const error = await authResponse.json();
        logger.error('Firebase auth error:', error);
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      await authResponse.json();
      const auth = getAuth();
      const userRecord = await auth.getUserByEmail(email);
      
      const roleInfo = USER_ROLES[email] || {
        role: 'LOGISTIC_OPERATOR',
        permissions: ['dashboard.read', 'logistic.read']
      };

      const simpleToken = `simple_${userRecord.uid}_${Date.now()}`;

      const response: AuthResponse = {
        user: {
          id: userRecord.uid,
          email: userRecord.email!,
          name: userRecord.displayName || 'Utilisateur',
          role: roleInfo.role,
          permissions: roleInfo.permissions,
          accessToken: simpleToken
        }
      };

      // Pour contourner le problème de cookies cross-domain avec Firebase Functions,
      // on renvoie juste les données utilisateur sans cookie
      logger.info('Authentication successful for user:', response.user?.email);
      
      res.json(response);
    } catch (authError) {
      logger.error('Firebase auth error:', authError);
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    logger.error('Sign in error:', error);
    res.status(500).json({ error: 'Sign in failed' });
  }
}

async function handleSession(req: Request, res: Response): Promise<void> {
  try {
    // Pas de vérification de session côté serveur à cause des problèmes de cookies cross-domain
    // Le client gère la session via localStorage
    logger.info('Session check requested - delegating to client-side storage');
    res.json({ user: null });
  } catch (error) {
    logger.error('Session error:', error);
    res.json({ user: null });
  }
}

async function handleSignOut(_req: Request, res: Response): Promise<void> {
  try {
    // Pas de cookies à effacer, le client gère via localStorage
    logger.info('Sign out requested - client will handle localStorage cleanup');
    res.json({ success: true });
  } catch (error) {
    logger.error('Sign out error:', error);
    res.status(500).json({ error: 'Sign out failed' });
  }
}

async function handleError(req: Request, res: Response): Promise<void> {
  try {
    const error = req.query.error as string;
    const errorDescription = req.query.error_description as string;
    
    // Only log if there are actual error parameters
    if (error && error !== 'undefined') {
      logger.info(`Auth error: ${error} - ${errorDescription || 'No description'}`);
    }
    
    // Return error details for debugging
    res.json({
      error: error || 'Unknown error',
      error_description: errorDescription || 'No description provided',
      message: 'Authentication error occurred'
    });
  } catch (error) {
    logger.error('Error handler error:', error);
    res.status(500).json({ error: 'Error handler failed' });
  }
}

async function handleProviders(_req: Request, res: Response): Promise<void> {
  try {
    // Return available auth providers
    const providers = {
      credentials: {
        id: 'credentials',
        name: 'Email/Password',
        type: 'credentials',
        signinUrl: '/api/auth/signin',
        callbackUrl: '/api/auth/callback/credentials'
      }
    };
    
    res.json(providers);
  } catch (error) {
    logger.error('Providers handler error:', error);
    res.status(500).json({ error: 'Providers handler failed' });
  }
}

async function handleCallback(req: Request, res: Response): Promise<void> {
  try {
    // This endpoint is called after authentication
    // For now, redirect to success or handle the callback appropriately
    const { email } = req.body;
    
    logger.info(`Callback received for: ${email}`);
    
    // This should behave similarly to signin but handle the callback flow
    await handleSignIn(req, res);
  } catch (error) {
    logger.error('Callback handler error:', error);
    res.status(500).json({ error: 'Callback handler failed' });
  }
}

async function handleCSRF(_req: Request, res: Response): Promise<void> {
  try {
    // Generate a simple CSRF token for NextAuth.js compatibility
    const csrfToken = `csrf_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    res.json({ 
      csrfToken: csrfToken
    });
  } catch (error) {
    logger.error('CSRF handler error:', error);
    res.status(500).json({ error: 'CSRF handler failed' });
  }
}