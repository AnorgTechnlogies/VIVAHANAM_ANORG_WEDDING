import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_KEY || "http://localhost:8000/api";

const isRegisteredVendor = (vendor = {}) => {
  const status = vendor.registrationStatus || null;
  const hasSubmittedData =
    status === "submitted" &&
    vendor?.submission?.data &&
    Object.keys(vendor.submission.data).length > 0;

  return Boolean(vendor.isRegistered) || hasSubmittedData || status === "approved" || status === "rejected";
};

export default function useVendorNavigation() {
  const navigate = useNavigate();
  const [isVendorLoggedIn, setIsVendorLoggedIn] = useState(Boolean(localStorage.getItem("vendorToken")));
  const [isVendorRegistered, setIsVendorRegistered] = useState(false);
  const [isCheckingVendorStatus, setIsCheckingVendorStatus] = useState(false);

  const getVendorRoute = useCallback(async ({ fromGatekeeper = false } = {}) => {
    const token = localStorage.getItem("vendorToken");
    if (!token) {
      setIsVendorLoggedIn(false);
      setIsVendorRegistered(false);
      return "/wedding-shop/vendor-auth";
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
        return "/wedding-shop/vendor-auth";
      }

      const vendor = data.data || {};
      localStorage.setItem("vendorData", JSON.stringify(vendor));
      const registered = isRegisteredVendor(vendor);
      setIsVendorRegistered(registered);

      if (!registered) return "/wedding-shop/vendor-register";
      return fromGatekeeper ? "/wedding-shop/vendor/dashboard" : "/wedding-shop/vendor-auth";
    } catch (error) {
      setIsVendorLoggedIn(Boolean(localStorage.getItem("vendorToken")));
      setIsVendorRegistered(false);
      return "/wedding-shop/vendor-auth";
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
    if (!hasVendorToken) setIsVendorRegistered(false);
  }, []);

  return {
    isVendorLoggedIn,
    isVendorRegistered,
    isCheckingVendorStatus,
    getVendorRoute,
    handleVendorNavigation,
  };
}
