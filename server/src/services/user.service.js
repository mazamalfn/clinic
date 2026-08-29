import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase.js';

export class UserService {
  /**
   * Récupère la liste de tous les utilisateurs (avec filtre optionnel par rôle)
   */
  static async getAllUsers(role = null) {
    let query = supabase.from('users').select('id, nom, email, role, created_at, updated_at');
    if (role) {
      query = query.eq('role', role);
    }

    const { data: users, error } = await query.order('nom', { ascending: true });

    if (error) {
      throw new Error(`Erreur lors de la récupération des utilisateurs: ${error.message}`);
    }

    return users;
  }

  /**
   * Récupère un utilisateur par son identifiant unique
   */
  static async getUserById(id) {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, nom, email, role, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error || !user) {
      return null;
    }

    return user;
  }

  /**
   * Crée un nouvel utilisateur en vérifiant l'unicité de l'email et en hachant le mot de passe
   */
  static async createUser({ nom, email, mot_de_passe, role }) {
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      const err = new Error('Un utilisateur existe déjà avec cet email.');
      err.statusCode = 400;
      throw err;
    }

    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

    const { data: newUser, error } = await supabase
      .from('users')
      .insert([{ nom, email, mot_de_passe: hashedPassword, role }])
      .select('id, nom, email, role, created_at')
      .single();

    if (error) {
      throw new Error(`Échec de la création de l'utilisateur: ${error.message}`);
    }

    return newUser;
  }

  /**
   * Met à jour les informations d'un utilisateur
   */
  static async updateUser(id, { nom, email, mot_de_passe, role }) {
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
      throw new Error(`Erreur de mise à jour: ${error.message}`);
    }

    return updatedUser;
  }

  /**
   * Supprime un utilisateur
   */
  static async deleteUser(id, requestingUserId) {
    if (id === requestingUserId) {
      const err = new Error('Vous ne pouvez pas supprimer votre propre compte.');
      err.statusCode = 400;
      throw err;
    }

    const { error } = await supabase.from('users').delete().eq('id', id);

    if (error) {
      throw new Error(`Erreur lors de la suppression: ${error.message}`);
    }

    return true;
  }
}
