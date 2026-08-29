/**
 * ==============================================================================
 * MIDDLEWARE D'AUTHENTIFICATION JWT (server/src/middleware/auth.middleware.js)
 * ==============================================================================
 * Rôle : Intercepte les requêtes HTTP entrantes pour vérifier la présence et la
 * validité d'un jeton JWT (JSON Web Token) dans l'en-tête `Authorization: Bearer <token>`.
 * 
 * Si le jeton est valide, les informations de l'utilisateur décodé (id, email, rôle)
 * sont injectées dans `req.user` pour que la suite de la chaîne d'exécution puisse y accéder.
 */

import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 1. Vérification que l'en-tête Authorization commence bien par "Bearer "
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Non autorisé',
      message: 'Jeton d\'authentification manquant ou invalide.',
    });
  }

  // 2. Extraction de la clé de jeton après le mot-clé Bearer
  const token = authHeader.split(' ')[1];

  try {
    // 3. Décodage et vérification cryptographique avec la clé secrète
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded; // Attache le profil décodé à la requête Express
    next(); // Poursuit l'exécution vers la route ou le middleware suivant
  } catch (err) {
    return res.status(401).json({
      error: 'Non autorisé',
      message: 'Jeton expiré ou non valide.',
    });
  }
};
