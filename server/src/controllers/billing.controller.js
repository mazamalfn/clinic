import { supabase } from '../config/supabase.js';

/**
 * Générer un numéro de facture unique (ex: FAC-2026-0002)
 */
const generateInvoiceNumber = async () => {
  const year = new Date().getFullYear();
  const { count, error } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true });

  const nextSeq = (count || 0) + 1;
  const formattedSeq = String(nextSeq).padStart(4, '0');
  return `FAC-${year}-${formattedSeq}`;
};

export const createInvoice = async (req, res, next) => {
  try {
    const { patient_id, consultation_id, items } = req.body;

    const numero_facture = await generateInvoiceNumber();

    // Calcul du montant total
    let montant_total = 0;
    const formattedItems = items.map((item) => {
      const totalItem = parseFloat((item.quantite * item.prix_unitaire).toFixed(2));
      montant_total += totalItem;
      return {
        description: item.description,
        quantite: item.quantite,
        prix_unitaire: item.prix_unitaire,
        montant_total: totalItem,
      };
    });

    // 1. Insertion de la facture
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

    // 2. Insertion des lignes de facture
    const invoiceItems = formattedItems.map((it) => ({
      ...it,
      invoice_id: invoice.id,
    }));

    const { data: createdItems, error: itemsErr } = await supabase
      .from('invoice_items')
      .insert(invoiceItems)
      .select('*');

    if (itemsErr) throw itemsErr;

    res.status(201).json({
      message: 'Facture créée avec succès',
      data: {
        ...invoice,
        items: createdItems,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getInvoices = async (req, res, next) => {
  try {
    const { patient_id, statut } = req.query;

    let query = supabase
      .from('invoices')
      .select('*, patients(nom, prenom, telephone), invoice_items(*), payments(*)')
      .order('created_at', { ascending: false });

    if (patient_id) query = query.eq('patient_id', patient_id);
    if (statut) query = query.eq('statut', statut);

    const { data: invoices, error } = await query;
    if (error) throw error;

    res.json({ data: invoices });
  } catch (err) {
    next(err);
  }
};

export const getInvoiceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*, patients(nom, prenom, date_naissance, telephone, adresse), consultations(*), invoice_items(*), payments(*, users!payments_encaisse_par_id_fkey(nom))')
      .eq('id', id)
      .single();

    if (error || !invoice) {
      return res.status(404).json({ error: 'Facture non trouvée' });
    }

    res.json({ data: invoice });
  } catch (err) {
    next(err);
  }
};

export const createPayment = async (req, res, next) => {
  try {
    const { invoice_id, montant, mode_paiement, reference_transaction } = req.body;

    // 1. Récupérer la facture actuelle
    const { data: invoice, error: fetchErr } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoice_id)
      .single();

    if (fetchErr || !invoice) {
      return res.status(404).json({ error: 'Facture non trouvée' });
    }

    if (invoice.statut === 'payee') {
      return res.status(400).json({ error: 'Cette facture est déjà intégralement réglée.' });
    }

    // 2. Créer l'enregistrement de paiement
    const { data: payment, error: payErr } = await supabase
      .from('payments')
      .insert({
        invoice_id,
        montant,
        mode_paiement,
        reference_transaction: reference_transaction || null,
        encaisse_par_id: req.user.id,
      })
      .select('*, users!payments_encaisse_par_id_fkey(nom)')
      .single();

    if (payErr) throw payErr;

    // 3. Mettre à jour le montant payé et le statut de la facture
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

    res.status(201).json({
      message: 'Paiement enregistré avec succès. Quittance générée.',
      data: {
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
      },
    });
  } catch (err) {
    next(err);
  }
};
