import axios from "axios";

const API_BASE = import.meta.env.VITE_API_KEY || "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

export const planService = {
  // Get all active plans for vendors
  getAllPlans: async () => {
    try {
      // Only fetch active plans for public/vendor view
      const response = await api.get("/plans?isActive=true");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get a specific plan details
  getPlanById: async (id) => {
    try {
      const response = await api.get(`/plans/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};
