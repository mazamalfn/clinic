/**
 * ==============================================================================
 * MIDDLEWARE DE JOURNALISATION ET D'AUDIT DE SÉCURITÉ (server/src/middleware/audit.middleware.js)
 * ==============================================================================
 * Rôle : Enregistre de manière asynchrone dans la table `audit_logs` toutes les actions
 * critiques effectuées par les utilisateurs (ex: modification de statut, création de paiement, etc.).
 * 
 * L'enregistrement s'effectue en arrière-plan sans ralentir la réponse HTTP envoyée au client.
 */

import { supabase } from '../config/supabase.js';

export const logAudit = (action, resource) => {
  return async (req, res, next) => {
    // Intercepte la méthode res.json pour capturer l'ID de la ressource créée/modifiée
    const originalJson = res.json;

    res.json = function (body) {
      res.json = originalJson; // Restaure la méthode d'origine

      // Traitement asynchrone en arrière-plan
      (async () => {
        try {
          const userId = req.user?.id || null;
          const userRole = req.user?.role || 'anonymous';
          const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

          let resourceId = req.params?.id || body?.id || body?.data?.id || null;

          await supabase.from('audit_logs').insert({
            user_id: userId,
            user_role: userRole,
            action,
            resource,
            resource_id: resourceId,
            details: {
              method: req.method,
              path: req.originalUrl,
              statusCode: res.statusCode,
            },
            ip_address: typeof ipAddress === 'string' ? ipAddress : String(ipAddress),
          });
        } catch (err) {
          console.error('Audit Log Error:', err);
        }
      })();

      return res.json(body);
    };

    next();
  };
};
