import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';
import { env } from '../config/env.js';

export class AuthService {
  /**
   * Authentifie un utilisateur et génère un jeton JWT
   */
  static async login({ email, mot_de_passe }) {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      const err = new Error('Adresse email ou mot de passe incorrect.');
      err.statusCode = 401;
      throw err;
    }

    const isValidPassword = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
    if (!isValidPassword) {
      const err = new Error('Adresse email ou mot de passe incorrect.');
      err.statusCode = 401;
      throw err;
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        nom: user.nom,
        role: user.role,
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    return {
      token,
      user: {
        id: user.id,
        nom: user.nom,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Récupère le profil de l'utilisateur connecté
   */
  static async getProfile(userId) {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, nom, email, role, created_at')
      .eq('id', userId)
      .single();

    if (error || !user) {
      const err = new Error('Utilisateur non trouvé');
      err.statusCode = 404;
      throw err;
    }

    return user;
  }
}
