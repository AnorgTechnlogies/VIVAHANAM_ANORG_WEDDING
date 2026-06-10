import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const isRegisteredVendor = (vendor = {}) => {
  const status = vendor.registrationStatus || null;
  const hasSubmittedData =
    (status === "submitted" || status === "payment_pending") &&
    vendor?.submission?.data &&
    Object.keys(vendor.submission.data).length > 0;

  return Boolean(vendor.isRegistered) || hasSubmittedData || status === "approved" || status === "rejected";
};

export default function useVendorNavigation() {
  const navigate = useNavigate();
  const [isVendorLoggedIn, setIsVendorLoggedIn] = useState(Boolean(localStorage.getItem("vendorToken")));
  const [isVendorRegistered, setIsVendorRegistered] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isCheckingVendorStatus, setIsCheckingVendorStatus] = useState(false);

  const getVendorRoute = useCallback(async ({ fromGatekeeper = false } = {}) => {
    const token = localStorage.getItem("vendorToken");
    if (!token) {
      setIsVendorLoggedIn(false);
      setIsVendorRegistered(false);
      setHasActiveSubscription(false);
      return "/vendor-auth";
    }

    setIsCheckingVendorStatus(true);
    setIsVendorLoggedIn(true);

    try {
      const response = await fetch(`${API_URL}/vendor/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.success) {
        localStorage.removeItem("vendorToken");
        localStorage.removeItem("vendorData");
        setIsVendorLoggedIn(false);
        setIsVendorRegistered(false);
        setHasActiveSubscription(false);
        return "/vendor-auth";
      }

      const vendor = data.data || {};
      localStorage.setItem("vendorData", JSON.stringify(vendor));
      const registered = isRegisteredVendor(vendor);
      setIsVendorRegistered(registered);

      // Step 1: Not registered → go to registration form
      if (!registered) return "/vendor-register";

      // Step 2: Registered but no active subscription or payment pending → go to plans
      const hasSub = Boolean(vendor.hasActiveSubscription);
      setHasActiveSubscription(hasSub);

      if (vendor.registrationStatus === "payment_pending" || !hasSub) return "/plans";

      // Step 3: Registered + active subscription → go to dashboard
      return fromGatekeeper ? "/vendor/dashboard" : "/vendor-auth";
    } catch (error) {
      setIsVendorLoggedIn(Boolean(localStorage.getItem("vendorToken")));
      setIsVendorRegistered(false);
      setHasActiveSubscription(false);
      return "/vendor-auth";
    } finally {
      setIsCheckingVendorStatus(false);
    }
  }, []);

  const handleVendorNavigation = useCallback(
    async ({ fromGatekeeper = false, ...navigateOptions } = {}) => {
      const route = await getVendorRoute({ fromGatekeeper });
      navigate(route, navigateOptions);
      return route;
    },
    [getVendorRoute, navigate]
  );

  useEffect(() => {
    const hasVendorToken = Boolean(localStorage.getItem("vendorToken"));
    setIsVendorLoggedIn(hasVendorToken);
    if (!hasVendorToken) {
      setIsVendorRegistered(false);
      setHasActiveSubscription(false);
    }
  }, []);

  return {
    isVendorLoggedIn,
    isVendorRegistered,
    hasActiveSubscription,
    isCheckingVendorStatus,
    getVendorRoute,
    handleVendorNavigation,
  };
}
