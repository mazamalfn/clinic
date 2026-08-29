/**
 * ==============================================================================
 * CONTRÔLEUR DE GÉNÉRATION ET TÉLÉCHARGEMENT PDF (server/src/controllers/pdf.controller.js)
 * ==============================================================================
 * Rôle : Gère le flux HTTP pour l'export en direct des documents PDF (Ordonnances médicales et Factures/Quittances).
 * Définit les en-têtes HTTP de type `application/pdf` pour l'ouverture en ligne (`inline`) ou l'impression.
 */

import { supabase } from '../config/supabase.js';
import { generatePrescriptionPDF, generateInvoicePDF } from '../services/pdf.service.js';

/**
 * Endpoint de téléversement/visualisation du PDF d'ordonnance
 */
export const downloadPrescriptionPDF = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: prescription, error } = await supabase
      .from('prescriptions')
      .select('*, consultations(*, patients(nom, prenom), users!consultations_medecin_id_fkey(nom, email)), prescription_items(*)')
      .eq('id', id)
      .single();

    if (error || !prescription) {
      return res.status(404).json({ error: 'Ordonnance non trouvée' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="ordonnance_${id.slice(0, 8)}.pdf"`);

    await generatePrescriptionPDF(prescription, res);
  } catch (err) {
    next(err);
  }
};

/**
 * Endpoint de téléversement/visualisation du PDF de facture ou reçu
 */
export const downloadInvoicePDF = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*, patients(nom, prenom, telephone, adresse), invoice_items(*), payments(*)')
      .eq('id', id)
      .single();

    if (error || !invoice) {
      return res.status(404).json({ error: 'Facture non trouvée' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="facture_${invoice.numero_facture}.pdf"`);

    await generateInvoicePDF(invoice, res);
  } catch (err) {
    next(err);
  }
};
