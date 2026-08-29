import { BillingService } from '../services/index.js';

export const createInvoice = async (req, res, next) => {
  try {
    const invoice = await BillingService.createInvoice(req.body);
    res.status(201).json({
      message: 'Facture créée avec succès',
      data: invoice,
    });
  } catch (err) {
    next(err);
  }
};

export const getInvoices = async (req, res, next) => {
  try {
    const invoices = await BillingService.getInvoices(req.query);
    res.json({ data: invoices });
  } catch (err) {
    next(err);
  }
};

export const getInvoiceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const invoice = await BillingService.getInvoiceById(id);

    if (!invoice) {
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
    const paymentResult = await BillingService.createPayment({
      invoice_id,
      montant,
      mode_paiement,
      reference_transaction,
      user_id: req.user.id,
    });

    res.status(201).json({
      message: 'Paiement enregistré avec succès. Quittance générée.',
      data: paymentResult,
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    next(err);
  }
};
