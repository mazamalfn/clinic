/**
 * ==============================================================================
 * GESTIONNAIRE D'ERREURS CENTRALISÉ (server/src/middleware/error.middleware.js)
 * ==============================================================================
 * Rôle : Attrape toutes les erreurs transmises par `next(err)` dans l'application Express.
 * Formate la réponse HTTP au format JSON et masque la trace d'exécution (`stack`)
 * en mode production pour éviter la fuite d'informations sensibles.
 */

export const errorHandler = (err, req, res, next) => {
  // Journalise l'erreur complète dans la console du serveur
  console.error('❌ Erreur serveur non capturée :', err);

  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  res.status(statusCode).json({
    error: 'Erreur serveur',
    message: err.message || 'Une erreur inattendue est survenue.',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
