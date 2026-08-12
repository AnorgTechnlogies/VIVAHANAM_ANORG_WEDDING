# 🌸 Vivahanam Wedding Portal — Week 10 Learning Material
> **Target Audience:** Junior Frontend Developers & Interns  
> **Topic:** Fetching & Displaying Data using Axios | State Management (Context API & Redux)  
> **Repository:** `VIVAHANAM_ANORG_WEDDING`

---

## 📑 Table of Contents
1. [Week 10 Learning Objectives](#1-week-10-learning-objectives)
2. [Why Axios & Global State Management in Vivahanam?](#2-why-axios--global-state-management-in-vivahanam)
3. [React Core Concepts (Theory + Isolated Sample Codes)](#3-react-core-concepts-theory--isolated-sample-codes)
   - [3.1 Axios Fundamentals: Instances & Configuration](#31-axios-fundamentals-instances--configuration)
   - [3.2 Axios Interceptors: Auto JWT Injection & Global Error Handling](#32-axios-interceptors-auto-jwt-injection--global-error-handling)
   - [3.3 Handling Async UI States (Loading, Error, Success)](#33-handling-async-ui-states-loading-error-success)
   - [3.4 Context API: Global State without Prop Drilling](#34-context-api-global-state-without-prop-drilling)
   - [3.5 Redux Toolkit (RTK): Structured State Architecture](#35-redux-toolkit-rtk-structured-state-architecture)
4. [Real Application Deep Dive: Vivahanam Data & State Architecture](#4-real-application-deep-dive-vivahanam-data--state-architecture)
   - [4.1 The Production Axios Service Layer (`src/services/planService.js`)](#41-the-production-axios-service-layer-srcservicesplanservicejs)
   - [4.2 Consuming Axios in UI (`src/pages/Plans.jsx`)](#42-consuming-axios-in-ui-srcpagesplansjsx)
   - [4.3 Practical Global State: `AuthContext` & `ShortlistContext` Implementation](#43-practical-global-state-authcontext--shortlistcontext-implementation)
5. [Summary Matrix: Data Fetching & State Management](#5-summary-matrix-data-fetching--state-management)
6. [Junior Developer Gotchas & Best Practices](#6-junior-developer-gotchas--best-practices)
7. [Week 10 Hands-On Practice Challenge](#7-week-10-hands-on-practice-challenge)

---

## 1. Week 10 Learning Objectives

By the end of this guide, you will be able to:
- [x] **Master Axios for HTTP Requests:** Create modular Axios instances with base URLs, headers, and timeout configurations.
- [x] **Implement Axios Interceptors:** Automatically inject JWT bearer tokens on outgoing requests and catch 401 Unauthorized errors globally.
- [x] **Manage Async UI States Gracefully:** Display skeleton loaders, spinners, error alerts, and empty states based on API status.
- [x] **Implement React Context API:** Eliminate prop drilling by creating Context Providers and custom hooks (e.g., `useAuth()`, `useShortlist()`).
- [x] **Understand Redux Toolkit (RTK):** Understand Slices, Reducers, Actions, `useSelector`, and `useDispatch` for complex application state.
- [x] **Clean Service Architecture:** Separate API network calls into clean service modules (`planService.js`) rather than polluting React components with raw HTTP calls.

---

## 2. Why Axios & Global State Management in Vivahanam?

As **Vivahanam** grows into a large wedding marketplace, managing server communication and application state becomes crucial:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DATA & STATE ARCHITECTURE                       │
└────────────────────────────────────────────────────────────────────────┘
  [ React Components ] ──(Trigger Action)──► [ Global Context / Redux Store ]
         │                                               │
         ▼                                               ▼
  [ Service Layer (Axios) ] ──(Request Interceptor + JWT)─► [ Backend API ]
         ▲                                               ▲
         │                                               │
  [ Normalizes Data & Errors ] ◄─────────────── [ JSON Response (200/400/500) ]
```

1. **Why Axios over native `fetch()`?**
   - Automatic JSON data transformation (no need to call `await res.json()`).
   - Request and response interceptors for seamless JWT authentication.
   - Built-in request cancellation and timeout support.
   - Standardized error response objects (`error.response.data`).

2. **Why Global State Management (Context API / Redux)?**
   - Prevents **"Prop Drilling"** (passing props through 5 levels of intermediate components just to tell a navbar button the user is logged in).
   - Keeps user session, authentication tokens, and shortlisted vendors synchronized across every page.

---

## 3. React Core Concepts (Theory + Isolated Sample Codes)

### 3.1 Axios Fundamentals: Instances & Configuration
Instead of using raw `axios.get()`, in professional applications we create a **custom Axios instance** with a default `baseURL` and configuration.

#### 💡 Sample Code:
```javascript
import axios from "axios";

// 🔹 Create configured instance
const apiClient = axios.create({
  baseURL: "https://api.vivahanam.com/api",
  timeout: 10000, // 10 seconds timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Reusable Service Methods
export const vendorService = {
  getVendors: async (category, city) => {
    // Axios automatically parses JSON into response.data!
    const response = await apiClient.get("/vendors", {
      params: { category, city },
    });
    return response.data;
  },

  createBooking: async (bookingData) => {
    const response = await apiClient.post("/bookings", bookingData);
    return response.data;
  },
};
```

---

### 3.2 Axios Interceptors: Auto JWT Injection & Global Error Handling
Interceptors act like middleware for your HTTP requests.

- **Request Interceptor:** Injects `Authorization: Bearer <token>` before any request leaves the browser.
- **Response Interceptor:** Catches global errors like `401 Unauthorized` and logs out expired users automatically.

#### 💡 Sample Code:
```javascript
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// 🔹 1. REQUEST INTERCEPTOR: Inject JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("vivahanamToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 🔹 2. RESPONSE INTERCEPTOR: Catch Global Errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Session expired -> Clear storage and redirect to login
      localStorage.removeItem("vivahanamToken");
      window.location.href = "/login?expired=true";
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

### 3.3 Handling Async UI States (Loading, Error, Success)
Every API call has 3 distinct lifecycle states in the UI:
1. **`loading: true`** $\rightarrow$ Show Spinner / Skeleton
2. **`error: "..."`** $\rightarrow$ Show Alert Banner / Retry Button
3. **`data: [...]`** $\rightarrow$ Render the Data List

#### 💡 Sample Code:
```jsx
import { useEffect, useState } from "react";
import { vendorService } from "./services/vendorService";

function VendorCatalog() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await vendorService.getVendors("photographers", "Delhi");
      setVendors(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load vendors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 1. Loading UI State
  if (loading) {
    return <div className="spinner">🌀 Fetching top wedding vendors...</div>;
  }

  // 2. Error UI State
  if (error) {
    return (
      <div className="error-box">
        <p>⚠️ {error}</p>
        <button onClick={loadData}>Try Again</button>
      </div>
    );
  }

  // 3. Success / Data UI State
  return (
    <div>
      <h2>Photographers in Delhi ({vendors.length})</h2>
      {vendors.map((v) => (
        <div key={v._id}>{v.name} - ⭐ {v.rating}</div>
      ))}
    </div>
  );
}
```

---

### 3.4 Context API: Global State without Prop Drilling
The **Context API** is built into React. It consists of:
1. `createContext()`: Defines the context object.
2. `Provider`: Wraps components to supply values.
3. `useContext()`: Consumes the values from any child component.

#### 💡 Sample Code: Authentication Context (`AuthContext.jsx`)
```jsx
import { createContext, useContext, useState, useEffect } from "react";

// 1. Create the Context
const AuthContext = createContext(null);

// 2. Create the Provider Component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("vivahanamToken") || null);

  const login = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem("vivahanamToken", jwtToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("vivahanamToken");
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoggedIn: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// 3. Custom Hook for easy consumption
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
```

```jsx
// 💡 Consuming the AuthContext anywhere in the app:
function UserProfileWidget() {
  const { user, isLoggedIn, logout } = useAuth();

  if (!isLoggedIn) {
    return <a href="/login">Sign In</a>;
  }

  return (
    <div>
      <span>Welcome, {user?.name}!</span>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

---

### 3.5 Redux Toolkit (RTK): Structured State Architecture
When apps have high-frequency state transitions, complex data caching, or multi-step booking wizards, **Redux Toolkit** offers a predictable unidirectional state flow.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        REDUX DATA FLOW CYCLE                           │
└────────────────────────────────────────────────────────────────────────┘
       [ Component UI ] ──(useDispatch)──► [ Action: addToShortlist(vendor) ]
              ▲                                        │
              │                                        ▼
       (useSelector)                            [ Reducer Function ]
              │                                        │
              └──────── [ Updated Redux Store State ] ◄┘
```

#### 💡 Sample Code: Shortlist Slice (`shortlistSlice.js`)
```javascript
import { createSlice } from "@reduxjs/toolkit";

const shortlistSlice = createSlice({
  name: "shortlist",
  initialState: {
    items: [], // Array of vendor IDs
  },
  reducers: {
    addToShortlist: (state, action) => {
      if (!state.items.includes(action.payload)) {
        state.items.push(action.payload); // Immer allows direct mutation syntax!
      }
    },
    removeFromShortlist: (state, action) => {
      state.items = state.items.filter((id) => id !== action.payload);
    },
    clearShortlist: (state) => {
      state.items = [];
    },
  },
});

export const { addToShortlist, removeFromShortlist, clearShortlist } = shortlistSlice.actions;
export default shortlistSlice.reducer;
```

---

## 4. Real Application Deep Dive: Vivahanam Data & State Architecture

Let's inspect how **Axios** and **State Management** are implemented in the production codebase of `VIVAHANAM_ANORG_WEDDING`.

---

### 4.1 The Production Axios Service Layer (`src/services/planService.js`)
📍 *File: `src/services/planService.js`*

This file is our dedicated service for handling vendor subscription plans, applying coupon codes, and processing PayPal/Square payments.

```javascript
// yha API call ho rhi hai vendor ki plans se related or payment se related 
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// ============================================================================
// 🔹 CONCEPT 1: CONFIGURED AXIOS INSTANCE
// Base URL and credentials configured centrally.
// ============================================================================
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// ============================================================================
// 🔹 CONCEPT 2: REQUEST INTERCEPTOR FOR BEARER TOKEN INJECTION
// Automatically attaches the vendor's JWT token to every outgoing request.
// ============================================================================
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("vendorToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============================================================================
// 🔹 CONCEPT 3: REUSABLE ASYNC API SERVICE METHODS
// Clean methods that return promises and throw normalized errors.
// ============================================================================
export const planService = {
  // 1. GET ALL ACTIVE PLANS
  getAllPlans: async () => {
    try {
      const response = await api.get("/plans?isActive=true");
      return response.data; // Axios unwraps the response body
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // 2. GET SPECIFIC PLAN BY ID
  getPlanById: async (id) => {
    try {
      const response = await api.get(`/plans/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // 3. APPLY COUPON / OFFER CODE (POST REQUEST)
  applyOffer: async (planId, couponCode, vendorId) => {
    try {
      const response = await api.post("/plans/apply-offer", { planId, couponCode, vendorId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // 4. CREATE VENDOR ORDER
  createVendorOrder: async (planId, couponCode) => {
    try {
      const response = await api.post("/vendor-billing/create-order", { planId, couponCode });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // 5. CAPTURE ORDER AFTER PAYMENT
  captureVendorOrder: async (orderId) => {
    try {
      const response = await api.post("/vendor-billing/capture-order", { orderId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};
```

---

### 4.2 Consuming Axios in UI (`src/pages/Plans.jsx`)
📍 *File: `src/pages/Plans.jsx`*

Notice how `Plans.jsx` consumes `planService` cleanly with `useState`, `useEffect`, loading spinners, and toast alerts.

```jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { planService } from "../services/planService"; // 🔹 Import Axios Service
import { toast } from "react-toastify";

const Plans = () => {
  const navigate = useNavigate();

  // 🔹 STATE MANAGEMENT: Data, Loading, Modal & Coupon States
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // ==========================================================================
  // 🔹 CONCEPT: ASYNC DATA FETCHING ON COMPONENT MOUNT
  // ==========================================================================
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        // 🔹 Calling Axios service method
        const response = await planService.getAllPlans();
        if (response.success) {
          setPlans(response.data);
        }
      } catch (error) {
        toast.error("Failed to fetch subscription plans");
        console.error(error);
      } finally {
        setLoading(false); // Hide loading indicator
      }
    };

    fetchPlans();
  }, []);

  // ==========================================================================
  // 🔹 CONCEPT: ASYNC POST ACTION WITH OPTIMISTIC UI FEEDBACK
  // ==========================================================================
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return toast.error("Please enter a coupon code");
    setApplyingCoupon(true);
    try {
      // 🔹 Axios POST call via service
      const res = await planService.applyOffer(selectedPlan, couponCode);
      if (res.success) {
        setAppliedCoupon(res);
        toast.success("Coupon applied successfully!");
      }
    } catch (error) {
      toast.error(error.message || "Invalid or expired coupon");
    } finally {
      setApplyingCoupon(false);
    }
  };

  // 🔹 1. LOADING UI STATE
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4426A]"></div>
        <span className="ml-3 text-gray-600">Loading subscription plans...</span>
      </div>
    );
  }

  // 🔹 2. SUCCESS UI STATE WITH DYNAMIC DATA RENDERING
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 font-serif">Vendor Partner Plans</h1>
        <p className="text-gray-600 mt-2">Boost your visibility and book more weddings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div key={plan._id} className="bg-white border rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all">
            <h3 className="text-2xl font-bold text-gray-800">{plan.planName}</h3>
            <p className="text-3xl font-extrabold text-[#D4426A] my-4">
              ${plan.price} <span className="text-sm text-gray-400 font-normal">/ month</span>
            </p>
            <ul className="space-y-2 mb-6">
              {plan.features?.map((f, i) => (
                <li key={i} className="text-sm text-gray-600">✓ {f}</li>
              ))}
            </ul>
            <button
              onClick={() => setSelectedPlan(plan._id)}
              className="w-full bg-[#D4426A] text-white py-3 rounded-xl font-semibold hover:bg-[#A8274A]"
            >
              Choose {plan.planName}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Plans;
```

---

### 4.3 Practical Global State: `AuthContext` & `ShortlistContext` Implementation

In `VIVAHANAM_ANORG_WEDDING`, we can create a **Global Shortlist Context** so a user can bookmark vendors on any card and see their total shortlist badge update instantly in the Navbar!

#### `src/context/ShortlistContext.jsx`:
```jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const ShortlistContext = createContext(null);
const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const ShortlistProvider = ({ children }) => {
  const [shortlist, setShortlist] = useState([]);
  const token = localStorage.getItem("vivahanamToken");

  // Fetch initial shortlist from API on load
  useEffect(() => {
    if (!token) return;
    axios.get(`${API_BASE}/my-shortlist`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setShortlist(res.data.data || []))
    .catch(err => console.error("Shortlist fetch error", err));
  }, [token]);

  const isShortlisted = (vendorId) => shortlist.some(v => v._id === vendorId || v.id === vendorId);

  const toggleShortlist = async (vendor) => {
    const exists = isShortlisted(vendor._id || vendor.id);
    // Optimistic UI update
    if (exists) {
      setShortlist(prev => prev.filter(v => (v._id || v.id) !== (vendor._id || vendor.id)));
    } else {
      setShortlist(prev => [...prev, vendor]);
    }

    try {
      await axios.post(`${API_BASE}/vendors/${vendor._id || vendor.id}/shortlist`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Shortlist sync failed", err);
    }
  };

  return (
    <ShortlistContext.Provider value={{ shortlist, count: shortlist.length, isShortlisted, toggleShortlist }}>
      {children}
    </ShortlistContext.Provider>
  );
};

export const useShortlist = () => useContext(ShortlistContext);
```

---

## 5. Summary Matrix: Data Fetching & State Management

| Feature | Local State (`useState`) | Context API | Redux Toolkit |
| :--- | :--- | :--- | :--- |
| **Scope** | Single Component | Entire App / Sub-tree | Entire Application |
| **Best For** | Form inputs, modal open/close, tabs | Auth session, theme, shortlist | Complex cart, enterprise data caching |
| **Setup Boilerplate**| Zero | Low (1 file + Provider wrapper) | Medium (Slices, Store, Provider) |
| **Performance** | High (local re-render only) | High (when split well) | High (Selector memoization) |
| **Axios Integration** | Called inside `useEffect` | Called inside Provider functions | Called via `createAsyncThunk` |

---

## 6. Junior Developer Gotchas & Best Practices

### ❌ Gotcha 1: Making Raw `fetch()` Calls Inside Multiple Components
```javascript
// ❌ WRONG: Hardcoded URL, duplicated auth headers, no global interceptors
fetch("https://api.vivahanam.com/api/plans", { headers: { Authorization: token } });

// ✅ CORRECT: Centralize network logic in a service file
import { planService } from "../services/planService";
const data = await planService.getAllPlans();
```

### ❌ Gotcha 2: Updating State on Unmounted Components
```javascript
// ❌ RISKY: If user leaves page before API returns, memory leak warning triggers!
useEffect(() => {
  planService.getAllPlans().then(res => setPlans(res.data));
}, []);

// ✅ CORRECT: Use an active flag or AbortController
useEffect(() => {
  let isMounted = true;
  planService.getAllPlans().then(res => {
    if (isMounted) setPlans(res.data);
  });
  return () => { isMounted = false; };
}, []);
```

### ❌ Gotcha 3: Storing Every Single Variable in Redux / Context
```javascript
// ❌ BAD: Putting modal open/close boolean into global Redux store
dispatch(setEnquiryModalOpen(true));

// ✅ GOOD: Keep transient UI state local with useState()!
const [isModalOpen, setIsModalOpen] = useState(false);
```

---

## 7. Week 10 Hands-On Practice Challenge

### 🎯 Task 1: Create a Vendor Review Service with Axios
1. In `src/services/vendorService.js`, add a method `getVendorReviews(vendorId)`.
2. Add another method `submitReview(vendorId, reviewData)`.
3. Use the centralized `api` Axios instance so the token is sent automatically.

### 🎯 Task 2: Implement a Global Shortlist Badge
1. Wrap your application in `<ShortlistProvider>` in `src/App.jsx`.
2. Inside `Navbar.jsx`, consume `const { count } = useShortlist();` and display a dynamic badge next to "My Shortlist".
3. Inside `VendorCard.jsx`, wire up the Heart button to `toggleShortlist(vendor)`!

---

*Happy Coding! Feel free to ask your mentors if you have any questions on Axios or State Management.* 🚀
