// yha API call ho rhi hai vendor ki plans se related or payment se related 

import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("vendorToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
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
  },

  // Apply Special Offer/Coupon
  applyOffer: async (planId, couponCode, vendorId) => {
    try {
      const response = await api.post("/plans/apply-offer", { planId, couponCode, vendorId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Mark Offer as Used
  markOfferUsed: async (planId, couponCode) => {
    try {
      const response = await api.post("/plans/mark-offer-used", { planId, couponCode });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create PayPal Order for Vendor
  createVendorOrder: async (planId, couponCode) => {
    try {
      const response = await api.post("/vendor-billing/create-order", { planId, couponCode });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Capture PayPal Order for Vendor
  captureVendorOrder: async (orderId) => {
    try {
      const response = await api.post("/vendor-billing/capture-order", { orderId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};
