import app from './src/app.js';
import { env } from './src/config/env.js';

const PORT = env.PORT;

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
