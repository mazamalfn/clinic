import { supabase } from '../config/supabase.js';

export const logAudit = (action, resource) => {
  return async (req, res, next) => {
    // Intercepter la fin de la réponse pour capturer l'ID de la ressource ou les détails
    const originalJson = res.json;

    res.json = function (body) {
      res.json = originalJson; // Restore

      // Log async in background without blocking response
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
