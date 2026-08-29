/**
 * ==============================================================================
 * APPLICATION EXPRESS BACKEND (server/src/app.js)
 * ==============================================================================
 * Rôle : Ce fichier configure le serveur Express.js.
 * Il associe :
 *  1. Les middlewares globaux (sécurité, gestion CORS, parsing du JSON, logs HTTP)
 *  2. Le dossier statique pour les pièces jointes (GED)
 *  3. Les modules de routage (/api/auth, /api/patients, /api/appointments, etc.)
 *  4. La gestion globale des erreurs (404 Not Found et erreurs 500)
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';

// Import des routes de l'application
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import patientRoutes from './routes/patient.routes.js';
import appointmentRoutes from './routes/appointment.routes.js';
import consultationRoutes from './routes/consultation.routes.js';
import prescriptionRoutes from './routes/prescription.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import vitalsRoutes from './routes/vitals.routes.js';
import billingRoutes from './routes/billing.routes.js';
import attachmentRoutes from './routes/attachment.routes.js';

// Import du gestionnaire d'erreurs centralisé
import { errorHandler } from './middleware/error.middleware.js';

const app = express();

// ------------------------------------------------------------------------------
// MIDDLEWARES GLOBAUX
// ------------------------------------------------------------------------------
// Helmet : Sécurise les en-têtes HTTP contre les attaques XSS et d'injection
app.use(helmet());
// CORS : Autorise les requêtes cross-origin depuis le client Web (Vite/React)
app.use(cors());
// Express JSON : Analyse le corps des requêtes entrantes au format JSON
app.use(express.json());
// URL-encoded : Analyse les données transmises par formulaires HTML
app.use(express.urlencoded({ extended: true }));
// Morgan : Journalise toutes les requêtes HTTP reçues dans la console de débug
app.use(morgan('dev'));

// ------------------------------------------------------------------------------
// DOSSIERS STATIQUES
// ------------------------------------------------------------------------------
// Sert le répertoire des fichiers téléversés (GED - pièces jointes médicales)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ------------------------------------------------------------------------------
// ROUTE DE SANTÉ DE L'API (Health Check)
// ------------------------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Backend Gestion Clinique V1 opérationnel (Supabase)',
    timestamp: new Date().toISOString(),
  });
});

// ------------------------------------------------------------------------------
// ENREGISTREMENT DES ROUTES D'API
// ------------------------------------------------------------------------------
app.use('/api/auth', authRoutes);           // Connexion, profil utilisateur
app.use('/api/users', userRoutes);           // Gestion des utilisateurs (Admin)
app.use('/api/patients', patientRoutes);     // Dossiers et historique patients
app.use('/api/appointments', appointmentRoutes); // Gestion des rendez-vous et file d'attente
app.use('/api/consultations', consultationRoutes); // Consultations médicales et secret médical
app.use('/api/prescriptions', prescriptionRoutes); // Ordonnances et médicaments
app.use('/api/dashboard', dashboardRoutes);   // Métriques et agrégations du tableau de bord
app.use('/api/vitals', vitalsRoutes);       // Prise de constantes et alerte IMC/Tension
app.use('/api', billingRoutes);              // Facturation et quittances (/invoices, /payments)
app.use('/api/attachments', attachmentRoutes); // Pièces jointes et GED médicale

// ------------------------------------------------------------------------------
// GESTION DES ROUTES INEXISTANTES (404) ET ERREURS CENTRALISÉES
// ------------------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({
    error: 'Non trouvé',
    message: `La route ${req.originalUrl} n'existe pas sur ce serveur backend.`,
  });
});

// Middleware d'erreur global (attrape toutes les erreurs passées à next(err))
app.use(errorHandler);

export default app;
