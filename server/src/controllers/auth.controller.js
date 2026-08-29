import { AuthService } from '../services/index.js';

export const login = async (req, res, next) => {
  try {
    const { email, mot_de_passe } = req.body;
    const authData = await AuthService.login({ email, mot_de_passe });

    res.json({
      message: 'Connexion réussie',
      ...authData,
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        error: 'Identifiants invalides',
        message: err.message,
      });
    }
    next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await AuthService.getProfile(req.user.id);
    res.json({ user });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    next(err);
  }
};
