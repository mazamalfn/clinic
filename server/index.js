/**
 * ==============================================================================
 * POINT D'ENTRÉE DU SERVEUR BACKEND (server/index.js)
 * ==============================================================================
 * Rôle : Ce fichier est le point de démarrage principal de l'application Node.js/Express.
 * Il importe l'application configurée depuis `src/app.js` et lance l'écoute des requêtes HTTP
 * sur le port configuré dans les variables d'environnement.
 */

import app from './src/app.js';
import { env } from './src/config/env.js';

// Récupération du port depuis les variables d'environnement (ex: 5000)
const PORT = env.PORT;

// Démarrage de l'écoute des connexions réseau
app.listen(PORT, () => {
  console.log(`
🚀 SERVEUR GESTION CLINIQUE DÉMARRÉ SUR LE PORT ${PORT}
------------------------------------------------------
🌐 URL Locale      : http://localhost:${PORT}
🏥 Santé API       : http://localhost:${PORT}/api/health
🔑 Authentification: http://localhost:${PORT}/api/auth/login
------------------------------------------------------
  `);
});
