import { supabase } from '../config/supabase.js';

export class BillingService {
  /**
   * Génère un numéro de facture unique (ex: FAC-2026-0002)
   */
  static async generateInvoiceNumber() {
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true });

    const nextSeq = (count || 0) + 1;
    const formattedSeq = String(nextSeq).padStart(4, '0');
    return `FAC-${year}-${formattedSeq}`;
  }

  /**
   * Crée une nouvelle facture avec ses lignes
   */
  static async createInvoice({ patient_id, consultation_id, items }) {
    const numero_facture = await this.generateInvoiceNumber();

    let montant_total = 0;
    const formattedItems = (items || []).map((item) => {
      const totalItem = parseFloat((item.quantite * item.prix_unitaire).toFixed(2));
      montant_total += totalItem;
      return {
        description: item.description,
        quantite: item.quantite,
        prix_unitaire: item.prix_unitaire,
        montant_total: totalItem,
      };
    });

    const { data: invoice, error: invoiceErr } = await supabase
      .from('invoices')
      .insert({
        numero_facture,
        patient_id,
        consultation_id: consultation_id || null,
        montant_total,
        montant_paye: 0,
        statut: 'impayee',
      })
      .select('*, patients(nom, prenom, telephone, email:adresse)')
      .single();

    if (invoiceErr) throw invoiceErr;

    const invoiceItems = formattedItems.map((it) => ({
      ...it,
      invoice_id: invoice.id,
    }));

    const { data: createdItems, error: itemsErr } = await supabase
      .from('invoice_items')
      .insert(invoiceItems)
      .select('*');

    if (itemsErr) throw itemsErr;

    return {
      ...invoice,
      items: createdItems,
    };
  }

  /**
   * Récupère toutes les factures selon les filtres
   */
  static async getInvoices({ patient_id, statut }) {
    let query = supabase
      .from('invoices')
      .select('*, patients(nom, prenom, telephone), invoice_items(*), payments(*)')
      .order('created_at', { ascending: false });

    if (patient_id) query = query.eq('patient_id', patient_id);
    if (statut) query = query.eq('statut', statut);

    const { data: invoices, error } = await query;
    if (error) throw error;

    return invoices || [];
  }

  /**
   * Récupère une facture par son ID
   */
  static async getInvoiceById(id) {
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*, patients(nom, prenom, date_naissance, telephone, adresse), consultations(*), invoice_items(*), payments(*, users!payments_encaisse_par_id_fkey(nom))')
      .eq('id', id)
      .single();

    if (error || !invoice) {
      return null;
    }

    return invoice;
  }

  /**
   * Enregistre un paiement pour une facture
   */
  static async createPayment({ invoice_id, montant, mode_paiement, reference_transaction, user_id }) {
    const { data: invoice, error: fetchErr } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoice_id)
      .single();

    if (fetchErr || !invoice) {
      const err = new Error('Facture non trouvée');
      err.statusCode = 404;
      throw err;
    }

    if (invoice.statut === 'payee') {
      const err = new Error('Cette facture est déjà intégralement réglée.');
      err.statusCode = 400;
      throw err;
    }

    const { data: payment, error: payErr } = await supabase
      .from('payments')
      .insert({
        invoice_id,
        montant,
        mode_paiement,
        reference_transaction: reference_transaction || null,
        encaisse_par_id: user_id,
      })
      .select('*, users!payments_encaisse_par_id_fkey(nom)')
      .single();

    if (payErr) throw payErr;

    const nouveauMontantPaye = parseFloat((parseFloat(invoice.montant_paye) + parseFloat(montant)).toFixed(2));
    const montantTotal = parseFloat(invoice.montant_total);

    let nouveauStatut = 'partielle';
    if (nouveauMontantPaye >= montantTotal) {
      nouveauStatut = 'payee';
    }

    const { data: updatedInvoice, error: updateErr } = await supabase
      .from('invoices')
      .update({
        montant_paye: nouveauMontantPaye,
        statut: nouveauStatut,
      })
      .eq('id', invoice_id)
      .select('*')
      .single();

    if (updateErr) throw updateErr;

    return {
      payment,
      invoice: updatedInvoice,
      quittance: {
        numero_quittance: `RECU-${payment.id.slice(0, 8).toUpperCase()}`,
        date: payment.date_paiement,
        montant_regle: montant,
        mode_paiement,
        reference: reference_transaction || 'N/A',
        solde_restant: Math.max(0, montantTotal - nouveauMontantPaye),
      },
    };
  }
}
