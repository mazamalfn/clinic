import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('V1 API Suite de Tests d\'Intégration', () => {
  let adminToken = '';
  let secToken = '';

  beforeAll(async () => {
    // Connexion Admin
    const resAdmin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@clinic.com', mot_de_passe: 'Secretaire123!' });
    
    if (resAdmin.status === 200) {
      adminToken = resAdmin.body.token;
    }

    // Connexion Secrétaire
    const resSec = await request(app)
      .post('/api/auth/login')
      .send({ email: 'secretaire@clinic.com', mot_de_passe: 'Secretaire123!' });
    
    if (resSec.status === 200) {
      secToken = resSec.body.token;
    }
  });

  it('GET /api/health - Devrait retourner 200 OK', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
  });

  it('GET /api/appointments/queue - Devrait retourner la file d attente', async () => {
    const res = await request(app)
      .get('/api/appointments/queue')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('queue');
  });

  it('GET /api/consultations - Secret Médical masqué pour rôle Secrétaire', async () => {
    const res = await request(app)
      .get('/api/consultations')
      .set('Authorization', `Bearer ${secToken}`);
    
    expect(res.status).toBe(200);
    if (res.body.consultations && res.body.consultations.length > 0) {
      const first = res.body.consultations[0];
      expect(first.diagnostic).toBe('[Masqué - Secret Médical]');
      expect(first.notes).toBe('[Masqué - Secret Médical]');
    }
  });

  it('GET /api/prescriptions/:id/pdf - Devrait générer un PDF', async () => {
    const prescId = 'fa000000-0000-0000-0000-000000000001';
    const res = await request(app)
      .get(`/api/prescriptions/${prescId}/pdf`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
  });
});
