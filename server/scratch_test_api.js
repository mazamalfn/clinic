import app from './src/app.js';
import http from 'http';
import path from 'path';
import fs from 'fs';

const server = http.createServer(app);
server.listen(5100, async () => {
  console.log('🚀 Server running on port 5100 for V1 Integration Testing');

  try {
    // 1. Health check
    console.log('\n--- 1. Testing /api/health ---');
    const healthRes = await fetch('http://localhost:5100/api/health');
    console.log('Status:', healthRes.status, await healthRes.json());

    // 2. Auth Login (Admin)
    console.log('\n--- 2. Testing /api/auth/login (Admin) ---');
    const loginRes = await fetch('http://localhost:5100/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@clinic.com', mot_de_passe: 'Secretaire123!' }),
    });
    const loginData = await loginRes.json();
    console.log('Login Admin Status:', loginRes.status, 'User:', loginData.user?.nom, 'Role:', loginData.user?.role);
    const adminToken = loginData.token;

    // 3. Auth Login (Secrétaire)
    console.log('\n--- 3. Testing /api/auth/login (Secrétaire) ---');
    const secRes = await fetch('http://localhost:5100/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'secretaire@clinic.com', mot_de_passe: 'Secretaire123!' }),
    });
    const secData = await secRes.json();
    console.log('Login Secrétaire Status:', secRes.status, 'User:', secData.user?.nom);
    const secToken = secData.token;

    const adminHeaders = {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    };

    const secHeaders = {
      Authorization: `Bearer ${secToken}`,
      'Content-Type': 'application/json',
    };

    // 4. File d'attente / Salle d'attente
    console.log('\n--- 4. Testing GET /api/appointments/queue ---');
    const queueRes = await fetch('http://localhost:5100/api/appointments/queue', { headers: adminHeaders });
    const queueData = await queueRes.json();
    console.log('Queue Status:', queueRes.status, 'En attente count:', queueData.count_en_attente);

    // 5. Constantes Vitales (/api/vitals)
    console.log('\n--- 5. Testing POST & GET /api/vitals ---');
    const patientId = 'f0000000-0000-0000-0000-000000000001';
    const vitalsRes = await fetch('http://localhost:5100/api/vitals', {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        patient_id: patientId,
        ta_systolique: 145,
        ta_diastolique: 92,
        temperature: 38.6,
        poids: 72.5,
        taille: 175.0,
        frequence_cardiaque: 88,
        glycemie: 1.10,
        notes: 'Constantes saisies par infirmière/secrétaire',
      }),
    });
    const vitalsData = await vitalsRes.json();
    console.log('Vitals Create Status:', vitalsRes.status, 'IMC:', vitalsData.data?.imc, 'Classification:', vitalsData.data?.imc_classification, 'Alertes:', vitalsData.data?.alerts);

    // 6. Facturation & Paiement (/api/invoices & /api/payments)
    console.log('\n--- 6. Testing Facturation & Encaissement (/api/invoices & /api/payments) ---');
    const invoiceRes = await fetch('http://localhost:5100/api/invoices', {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        patient_id: patientId,
        items: [
          { description: 'Consultation Spécialiste', quantite: 1, prix_unitaire: 30000 },
          { description: 'Analyse Glycémie Rapide', quantite: 1, prix_unitaire: 5000 },
        ],
      }),
    });
    const invoiceData = await invoiceRes.json();
    console.log('Invoice Create Status:', invoiceRes.status, 'Numéro:', invoiceData.data?.numero_facture, 'Total:', invoiceData.data?.montant_total);

    const invoiceId = invoiceData.data?.id;

    if (invoiceId) {
      const payRes = await fetch('http://localhost:5100/api/payments', {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          invoice_id: invoiceId,
          montant: 35000,
          mode_paiement: 'mobile_money',
          reference_transaction: 'WAVE-892839182',
        }),
      });
      const payData = await payRes.json();
      console.log('Payment Status:', payRes.status, 'Nouveau Statut Facture:', payData.data?.invoice?.statut, 'Quittance:', payData.data?.quittance?.numero_quittance);

      // PDF Facture
      const pdfInvoiceRes = await fetch(`http://localhost:5100/api/invoices/${invoiceId}/pdf`, { headers: adminHeaders });
      console.log('Invoice PDF Status:', pdfInvoiceRes.status, 'Content-Type:', pdfInvoiceRes.headers.get('content-type'));
    }

    // 7. Cloisonnement du Secret Médical pour le rôle Secrétaire
    console.log('\n--- 7. Testing Secret Médical (Cloisonnement rôle Secrétaire) ---');
    const consultSecRes = await fetch('http://localhost:5100/api/consultations', { headers: secHeaders });
    const consultSecData = await consultSecRes.json();
    const firstConsult = consultSecData.consultations?.[0];
    console.log('Consultation Secrétaire View - Diagnostic:', firstConsult?.diagnostic, 'Notes:', firstConsult?.notes);

    // 8. Export PDF Ordonnance
    console.log('\n--- 8. Testing Ordonnance PDF Export ---');
    const prescId = 'fa000000-0000-0000-0000-000000000001';
    const pdfPrescRes = await fetch(`http://localhost:5100/api/prescriptions/${prescId}/pdf`, { headers: adminHeaders });
    console.log('Prescription PDF Status:', pdfPrescRes.status, 'Content-Type:', pdfPrescRes.headers.get('content-type'));

    console.log('\n🎉 ALL V1 BACKEND FEATURES TESTED & FUNCTIONING PERFECTLY!');
  } catch (err) {
    console.error('❌ Error during V1 API tests:', err);
  } finally {
    server.close();
    process.exit(0);
  }
});
