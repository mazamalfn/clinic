import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import patientRoutes from './routes/patient.routes.js';
import appointmentRoutes from './routes/appointment.routes.js';
import consultationRoutes from './routes/consultation.routes.js';
import prescriptionRoutes from './routes/prescription.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

import { errorHandler } from './middleware/error.middleware.js';

const app = express();

// Middlewares de sécurité et de journalisation
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Route de santé API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Backend Gestion Clinique opérationnel (Supabase)',
    timestamp: new Date().toISOString(),
  });
});

// Enregistrement des routes d'API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Gestionnaire 404 (Route non trouvée)
app.use((req, res) => {
  res.status(404).json({
    error: 'Non trouvé',
    message: `La route ${req.originalUrl} n'existe pas sur ce serveur backend.`,
  });
});

// Middleware d'erreur global
app.use(errorHandler);

export default app;
