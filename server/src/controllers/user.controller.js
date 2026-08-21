import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase.js';

export const getAllUsers = async (req, res, next) => {
  try {
    const { role } = req.query;

    let query = supabase.from('users').select('id, nom, email, role, created_at, updated_at');
    if (role) {
      query = query.eq('role', role);
    }

    const { data: users, error } = await query.order('nom', { ascending: true });

    if (error) {
      return res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs', details: error.message });
    }

    res.json({ users });
  } catch (err) {
    next(err);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: user, error } = await supabase
      .from('users')
      .select('id, nom, email, role, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({ user });
  } catch (err) {
    next(err);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { nom, email, mot_de_passe, role } = req.body;

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'Un utilisateur existe déjà avec cet email.' });
    }

    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

    const { data: newUser, error } = await supabase
      .from('users')
      .insert([{ nom, email, mot_de_passe: hashedPassword, role }])
      .select('id, nom, email, role, created_at')
      .single();

    if (error) {
      return res.status(500).json({ error: 'Échec de la création de l\'utilisateur', details: error.message });
    }

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: newUser,
    });
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nom, email, mot_de_passe, role } = req.body;

    const updateFields = {};
    if (nom) updateFields.nom = nom;
    if (email) updateFields.email = email;
    if (role) updateFields.role = role;
    if (mot_de_passe) {
      updateFields.mot_de_passe = await bcrypt.hash(mot_de_passe, 10);
    }

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateFields)
      .eq('id', id)
      .select('id, nom, email, role, updated_at')
      .single();

    if (error) {
      return res.status(500).json({ error: 'Erreur de mise à jour', details: error.message });
    }

    res.json({
      message: 'Utilisateur mis à jour avec succès',
      user: updatedUser,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte.' });
    }

    const { error } = await supabase.from('users').delete().eq('id', id);

    if (error) {
      return res.status(500).json({ error: 'Erreur lors de la suppression', details: error.message });
    }

    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (err) {
    next(err);
  }
};
