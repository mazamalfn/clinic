export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        error: 'Accès interdit',
        message: 'Aucun rôle identifié pour cet utilisateur.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Accès interdit',
        message: `Votre rôle (${req.user.role}) n'a pas la permission d'accéder à cette ressource. Rôles requis: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
};
