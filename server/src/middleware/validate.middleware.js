/**
 * ==============================================================================
 * MIDDLEWARE DE VALIDATION DE SCHÉMAS ZOD (server/src/middleware/validate.middleware.js)
 * ==============================================================================
 * Rôle : Valide le corps des requêtes HTTP (`req.body`) à l'aide d'un schéma Zod.
 * Si des champs sont invalides ou manquants, retourne immédiatement une réponse 400 Bad Request
 * détaillée sans exécuter le reste du code.
 */

export const validateBody = (schema) => {
  return (req, res, next) => {
    // Validation sécurisée avec Zod
    const result = schema.safeParse(req.body);

    if (!result.success) {
      // Formate les erreurs par champ pour le client HTTP
      const formattedErrors = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return res.status(400).json({
        error: 'Erreur de validation',
        details: formattedErrors,
      });
    }

    // Remplace req.body par les données assainies et nettoyées par Zod
    req.body = result.data;
    next();
  };
};
