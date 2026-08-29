/**
 * ==============================================================================
 * MIDDLEWARE DE CONTRÔLE D'ACCÈS BASÉ SUR LES RÔLES (RBAC)
 * (server/src/middleware/rbac.middleware.js)
 * ==============================================================================
 * Rôle : Filtre les accès aux routes selon le rôle de l'utilisateur (admin, medecin, secretaire).
 * Exemple d'utilisation : `authorizeRoles('admin', 'medecin')`
 */

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // 1. Vérification que l'utilisateur est bien authentifié et possède un rôle
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        error: 'Accès interdit',
        message: 'Aucun rôle identifié pour cet utilisateur.',
      });
    }

    // 2. Vérification si le rôle de l'utilisateur fait partie des rôles autorisés
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Accès interdit',
        message: `Votre rôle (${req.user.role}) n'a pas la permission d'accéder à cette ressource. Rôles requis: ${allowedRoles.join(', ')}`,
      });
    }

    // 3. Rôle valide, autorisation accordée
    next();
  };
};
