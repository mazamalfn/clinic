export const errorHandler = (err, req, res, next) => {
  console.error('❌ Erreur serveur non capturée :', err);

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    error: 'Erreur interne du serveur',
    message: err.message || 'Une erreur inattendue est survenue.',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
