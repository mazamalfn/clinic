import { DashboardService } from '../services/index.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const dashboardData = await DashboardService.getDashboardStats();
    res.json(dashboardData);
  } catch (err) {
    next(err);
  }
};
