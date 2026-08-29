import { supabase } from '../config/supabase.js';
import { NotificationService } from './notification.service.js';

export class VitalsService {
  /**
   * Calculer l'IMC et la classification
   */
  static calculateIMC(poids, tailleCm) {
    if (!poids || !tailleCm) return { imc: null, classification: null };
    const tailleM = tailleCm / 100;
    const imc = parseFloat((poids / (tailleM * tailleM)).toFixed(2));

    let classification = 'Normal';
    if (imc < 18.5) classification = 'Maigreur';
    else if (imc >= 18.5 && imc <= 24.9) classification = 'Normal';
    else if (imc >= 25 && imc <= 29.9) classification = 'Surpoids';
    else if (imc >= 30) classification = 'Obésité';

    return { imc, classification };
  }

  /**
   * Génère les alertes médicales sur les constantes
   */
  static getVitalAlerts(vitals) {
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
  }

  /**
   * Enregistre la prise de constantes d'un patient et déclenche d'éventuelles alertes
   */
  static async createVitals(vitalsData, user_id) {
    const { patient_id, consultation_id, ta_systolique, ta_diastolique, temperature, poids, taille, frequence_cardiaque, glycemie, notes } = vitalsData;

    const { imc, classification } = this.calculateIMC(poids, taille);

    const { data: vital, error } = await supabase
      .from('vitals')
      .insert({
        patient_id,
        consultation_id: consultation_id || null,
        taken_by_id: user_id,
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

    const alerts = this.getVitalAlerts(vital);

    // Déclencher une notification si des alertes critiques sont détectées
    if (alerts.length > 0) {
      try {
        const { data: patient } = await supabase.from('patients').select('id, nom, prenom').eq('id', patient_id).single();
        if (patient) {
          await NotificationService.notifyAbnormalVitals({
            patient,
            vitals: vital,
            alertReason: alerts.map(a => a.message).join('; ')
          });
        }
      } catch (notifErr) {
        console.warn('Erreur notification constantes anormales:', notifErr.message);
      }
    }

    return {
      ...vital,
      alerts,
    };
  }

  /**
   * Récupère l'historique des constantes d'un patient
   */
  static async getPatientVitals(patientId) {
    const { data: vitals, error } = await supabase
      .from('vitals')
      .select('*, users!vitals_taken_by_id_fkey(nom, role)')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (vitals || []).map((v) => ({
      ...v,
      alerts: this.getVitalAlerts(v),
    }));
  }

  /**
   * Récupère les constantes associées à une consultation
   */
  static async getConsultationVitals(consultationId) {
    const { data: vitals, error } = await supabase
      .from('vitals')
      .select('*, users!vitals_taken_by_id_fkey(nom, role)')
      .eq('consultation_id', consultationId);

    if (error) throw error;

    return (vitals || []).map((v) => ({
      ...v,
      alerts: this.getVitalAlerts(v),
    }));
  }
}
