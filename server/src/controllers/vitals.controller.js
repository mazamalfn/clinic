import { supabase } from '../config/supabase.js';

/**
 * Calculer l'IMC et la classification
 */
const calculateIMC = (poids, tailleCm) => {
  if (!poids || !tailleCm) return { imc: null, classification: null };
  const tailleM = tailleCm / 100;
  const imc = parseFloat((poids / (tailleM * tailleM)).toFixed(2));

  let classification = 'Normal';
  if (imc < 18.5) classification = 'Maigreur';
  else if (imc >= 18.5 && imc <= 24.9) classification = 'Normal';
  else if (imc >= 25 && imc <= 29.9) classification = 'Surpoids';
  else if (imc >= 30) classification = 'Obésité';

  return { imc, classification };
};

/**
 * Générer les alertes visuelles sur les constantes vitales
 */
const getVitalAlerts = (vitals) => {
  const alerts = [];
  if (vitals.ta_systolique && vitals.ta_systolique >= 140) {
    alerts.push({ type: 'TA_HAUTE', message: `Hypertension artérielle (Systolique: ${vitals.ta_systolique} mmHg)` });
  }
  if (vitals.ta_diastolique && vitals.ta_diastolique >= 90) {
    alerts.push({ type: 'TA_HAUTE', message: `Hypertension artérielle (Diastolique: ${vitals.ta_diastolique} mmHg)` });
  }
  if (vitals.temperature && vitals.temperature >= 38.0) {
    alerts.push({ type: 'FIEVRE', message: `Fièvre détectée (${vitals.temperature} °C)` });
  }
  if (vitals.frequence_cardiaque && (vitals.frequence_cardiaque > 100 || vitals.frequence_cardiaque < 50)) {
    alerts.push({ type: 'POULS_ANORMAL', message: `Fréquence cardiaque anormale (${vitals.frequence_cardiaque} bpm)` });
  }
  return alerts;
};

export const createVitals = async (req, res, next) => {
  try {
    const { patient_id, consultation_id, ta_systolique, ta_diastolique, temperature, poids, taille, frequence_cardiaque, glycemie, notes } = req.body;

    const { imc, classification } = calculateIMC(poids, taille);

    const { data: vital, error } = await supabase
      .from('vitals')
      .insert({
        patient_id,
        consultation_id: consultation_id || null,
        taken_by_id: req.user.id,
        ta_systolique: ta_systolique || null,
        ta_diastolique: ta_diastolique || null,
        temperature: temperature || null,
        poids: poids || null,
        taille: taille || null,
        frequence_cardiaque: frequence_cardiaque || null,
        glycemie: glycemie || null,
        imc,
        imc_classification: classification,
        notes: notes || null,
      })
      .select('*, users!vitals_taken_by_id_fkey(nom, role)')
      .single();

    if (error) throw error;

    const alerts = getVitalAlerts(vital);

    res.status(201).json({
      message: 'Constantes vitales enregistrées avec succès',
      data: {
        ...vital,
        alerts,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getPatientVitals = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    const { data: vitals, error } = await supabase
      .from('vitals')
      .select('*, users!vitals_taken_by_id_fkey(nom, role)')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = (vitals || []).map((v) => ({
      ...v,
      alerts: getVitalAlerts(v),
    }));

    res.json({ data: formatted });
  } catch (err) {
    next(err);
  }
};

export const getConsultationVitals = async (req, res, next) => {
  try {
    const { consultationId } = req.params;

    const { data: vitals, error } = await supabase
      .from('vitals')
      .select('*, users!vitals_taken_by_id_fkey(nom, role)')
      .eq('consultation_id', consultationId);

    if (error) throw error;

    const formatted = (vitals || []).map((v) => ({
      ...v,
      alerts: getVitalAlerts(v),
    }));

    res.json({ data: formatted });
  } catch (err) {
    next(err);
  }
};
