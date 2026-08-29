/**
 * ==============================================================================
 * SERVICE DE GÉNÉRATION DE DOCUMENTS PDF (server/src/services/pdf.service.js)
 * ==============================================================================
 * Rôle : Génère des fichiers PDF à la volée pour l'impression des ordonnances et factures.
 * Utilise `pdfkit` si la librairie est disponible avec un moteur de fallback en Javascript pur (Pure JS PDF stream)
 * garantissant que la génération PDF ne plante jamais même sans binaire natif.
 */

import fs from 'fs';

/**
 * Moteur de génération PDF en Pure JS (Fallback universel sans dépendance externe)
 */
const generatePureJSPDF = (title, headerInfo, items, totals, stream) => {
  const sanitize = (str) => (str || '').replace(/[()\\]/g, '\\$&');

  let textCommands = [];
  textCommands.push('BT');
  textCommands.push('/F1 18 Tf');
  textCommands.push('50 750 Td');
  textCommands.push(`(${sanitize(title)}) Tj`);
  textCommands.push('0 -30 Td');
  textCommands.push('/F1 10 Tf');

  headerInfo.forEach((info) => {
    textCommands.push(`(${sanitize(info)}) Tj`);
    textCommands.push('0 -15 Td');
  });

  textCommands.push('0 -10 Td');
  textCommands.push('/F1 11 Tf');

  items.forEach((item) => {
    textCommands.push(`(${sanitize(item)}) Tj`);
    textCommands.push('0 -15 Td');
  });

  if (totals && totals.length > 0) {
    textCommands.push('0 -15 Td');
    totals.forEach((tot) => {
      textCommands.push(`(${sanitize(tot)}) Tj`);
      textCommands.push('0 -15 Td');
    });
  }

  textCommands.push('ET');

  const streamContent = textCommands.join('\n');
  const streamLength = Buffer.byteLength(streamContent);

  const pdfBody = [
    '%PDF-1.4',
    '1 0 obj',
    '<< /Type /Catalog /Pages 2 0 R >>',
    'endobj',
    '2 0 obj',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    'endobj',
    '3 0 obj',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    'endobj',
    '4 0 obj',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    'endobj',
    '5 0 obj',
    `<< /Length ${streamLength} >>`,
    'stream',
    streamContent,
    'endstream',
    'endobj',
    'xref',
    '0 6',
    '0000000000 65535 f ',
    '0000000009 00000 n ',
    '0000000058 00000 n ',
    '0000000115 00000 n ',
    '0000000246 00000 n ',
    '0000000319 00000 n ',
    'trailer',
    '<< /Size 6 /Root 1 0 R >>',
    'startxref',
    '400',
    '%%EOF'
  ].join('\n');

  stream.write(Buffer.from(pdfBody));
  stream.end();
};

/**
 * Générer le document PDF d'une Ordonnance Médicale
 */
export const generatePrescriptionPDF = async (prescriptionData, stream) => {
  try {
    const PDFDocumentModule = await import('pdfkit');
    const PDFDocument = PDFDocumentModule.default;

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    doc.pipe(stream);

    doc.fillColor('#1e40af').fontSize(20).text('CLINIQUE SAINT-LUC', { align: 'center' });
    doc.fillColor('#4b5563').fontSize(10).text('Centre Médical et de Soins Spécialisés', { align: 'center' });
    doc.text('123 Avenue de la Santé, Dakar, Sénégal | Tél: +221 33 800 00 00', { align: 'center' });
    doc.moveDown();
    doc.strokeColor('#3b82f6').lineWidth(1.5).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(1.5);

    doc.fillColor('#1e293b').fontSize(16).text('ORDONNANCE MÉDICALE', { align: 'center', underline: true });
    doc.moveDown(1.5);

    const dateStr = new Date(prescriptionData.date_creation || Date.now()).toLocaleDateString('fr-FR');
    const doctorName = prescriptionData.consultations?.users?.nom || 'Médecin Traitant';
    const doctorEmail = prescriptionData.consultations?.users?.email || '';
    const patientNom = `${prescriptionData.consultations?.patients?.prenom || ''} ${prescriptionData.consultations?.patients?.nom || ''}`;

    doc.fontSize(11).fillColor('#0f172a');
    doc.text(`Médecin: ${doctorName} (${doctorEmail})`);
    doc.text(`Patient: ${patientNom}`);
    doc.text(`Date de l'ordonnance: ${dateStr}`);
    doc.moveDown();

    doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();

    doc.fillColor('#1e40af').fontSize(13).text('Prescriptions & Posologies :');
    doc.moveDown(0.5);

    const items = prescriptionData.prescription_items || [];
    if (items.length === 0) {
      doc.fillColor('#64748b').fontSize(11).text('Aucun médicament répertorié.');
    } else {
      items.forEach((item, index) => {
        doc.fillColor('#0f172a').fontSize(11).text(`${index + 1}. ${item.medicament}`);
        doc.fillColor('#334155').fontSize(10).text(`   Dosage: ${item.dosage} | Fréquence: ${item.frequence} | Durée: ${item.duree}`);
        doc.moveDown(0.5);
      });
    }

    doc.moveDown(2);
    doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();
    doc.fillColor('#475569').fontSize(10).text('Signature & Cachet du Médecin :', { align: 'right' });
    doc.moveDown(3);
    doc.fillColor('#94a3b8').fontSize(9).text('Document généré électroniquement par le système de Gestion Clinique.', { align: 'center' });

    doc.end();
  } catch (err) {
    // Fallback Pure JS PDF
    const dateStr = new Date(prescriptionData.date_creation || Date.now()).toLocaleDateString('fr-FR');
    const doctorName = prescriptionData.consultations?.users?.nom || 'Médecin Traitant';
    const patientNom = `${prescriptionData.consultations?.patients?.prenom || ''} ${prescriptionData.consultations?.patients?.nom || ''}`;
    const items = (prescriptionData.prescription_items || []).map((it, idx) => `${idx + 1}. ${it.medicament} - Dosage: ${it.dosage} (${it.duree})`);

    generatePureJSPDF(
      'CLINIQUE SAINT-LUC - ORDONNANCE MEDICALE',
      [`Medecin: ${doctorName}`, `Patient: ${patientNom}`, `Date: ${dateStr}`],
      items,
      ['Document officiel genere par le serveur Gestion Clinique.'],
      stream
    );
  }
};

/**
 * Générer le document PDF d'une Facture / Quittance de Paiement
 */
export const generateInvoicePDF = async (invoiceData, stream) => {
  try {
    const PDFDocumentModule = await import('pdfkit');
    const PDFDocument = PDFDocumentModule.default;

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    doc.pipe(stream);

    doc.fillColor('#065f46').fontSize(20).text('CLINIQUE SAINT-LUC', { align: 'center' });
    doc.fillColor('#4b5563').fontSize(10).text('Facturation & Comptabilité', { align: 'center' });
    doc.text('123 Avenue de la Santé, Dakar, Sénégal | Tél: +221 33 800 00 00', { align: 'center' });
    doc.moveDown();
    doc.strokeColor('#10b981').lineWidth(1.5).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(1.5);

    doc.fillColor('#064e3b').fontSize(16).text(`FACTURE N° ${invoiceData.numero_facture}`, { align: 'center', underline: true });
    doc.moveDown(1.5);

    const patientNom = `${invoiceData.patients?.prenom || ''} ${invoiceData.patients?.nom || ''}`;
    const dateStr = new Date(invoiceData.date_emission || Date.now()).toLocaleDateString('fr-FR');

    doc.fontSize(11).fillColor('#0f172a');
    doc.text(`Patient: ${patientNom}`);
    doc.text(`Téléphone: ${invoiceData.patients?.telephone || 'N/A'}`);
    doc.text(`Date d'émission: ${dateStr}`);
    doc.text(`Statut de la facture: ${invoiceData.statut?.toUpperCase()}`);
    doc.moveDown();

    doc.fillColor('#065f46').fontSize(12).text('Détails des prestations :');
    doc.moveDown(0.5);

    const items = invoiceData.invoice_items || [];
    items.forEach((item) => {
      doc.fillColor('#0f172a').fontSize(10).text(`- ${item.description} (x${item.quantite}) : ${item.montant_total} FCFA`);
    });

    doc.moveDown();
    doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();

    doc.fontSize(12).fillColor('#0f172a').text(`Montant Total: ${invoiceData.montant_total} FCFA`, { align: 'right' });
    doc.text(`Montant Régler: ${invoiceData.montant_paye} FCFA`, { align: 'right' });
    const solde = Math.max(0, parseFloat(invoiceData.montant_total) - parseFloat(invoiceData.montant_paye));
    doc.fillColor(solde > 0 ? '#dc2626' : '#16a34a').text(`Solde Restant: ${solde} FCFA`, { align: 'right' });

    doc.moveDown(2);
    doc.fillColor('#94a3b8').fontSize(9).text('Merci pour votre confiance. Reçu officiel de la Clinique Saint-Luc.', { align: 'center' });

    doc.end();
  } catch (err) {
    // Fallback Pure JS PDF
    const patientNom = `${invoiceData.patients?.prenom || ''} ${invoiceData.patients?.nom || ''}`;
    const dateStr = new Date(invoiceData.date_emission || Date.now()).toLocaleDateString('fr-FR');
    const items = (invoiceData.invoice_items || []).map((it) => `- ${it.description} (x${it.quantite}) : ${it.montant_total} FCFA`);
    const solde = Math.max(0, parseFloat(invoiceData.montant_total) - parseFloat(invoiceData.montant_paye));

    generatePureJSPDF(
      `CLINIQUE SAINT-LUC - FACTURE N ${invoiceData.numero_facture}`,
      [`Patient: ${patientNom}`, `Date: ${dateStr}`, `Statut: ${invoiceData.statut?.toUpperCase()}`],
      items,
      [`Montant Total: ${invoiceData.montant_total} FCFA`, `Montant Paye: ${invoiceData.montant_paye} FCFA`, `Solde Restant: ${solde} FCFA`],
      stream
    );
  }
};
