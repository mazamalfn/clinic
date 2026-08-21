import { supabase } from '../config/supabase.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    // 1. Nombre total de patients
    const { count: totalPatients } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true });

    // 2. Nombre total de médecins
    const { count: totalMedecins } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'medecin');

    // 3. Rendez-vous prévus aujourd'hui
    const { count: appointmentsToday } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .gte('date_heure', startOfDay)
      .lte('date_heure', endOfDay);

    // 4. Consultations réalisées aujourd'hui
    const { count: consultationsToday } = await supabase
      .from('consultations')
      .select('*', { count: 'exact', head: true })
      .gte('date', startOfDay)
      .lte('date', endOfDay);

    // 5. Prochains rendez-vous (Top 5)
    const { data: upcomingAppointments } = await supabase
      .from('appointments')
      .select(`
        id,
        date_heure,
        statut,
        patients (id, nom, prenom, telephone),
        users!appointments_medecin_id_fkey (id, nom)
      `)
      .gte('date_heure', new Date().toISOString())
      .order('date_heure', { ascending: true })
      .limit(5);

    res.json({
      stats: {
        totalPatients: totalPatients || 0,
        totalMedecins: totalMedecins || 0,
        appointmentsToday: appointmentsToday || 0,
        consultationsToday: consultationsToday || 0,
      },
      upcomingAppointments: upcomingAppointments || [],
    });
  } catch (err) {
    next(err);
  }
};
