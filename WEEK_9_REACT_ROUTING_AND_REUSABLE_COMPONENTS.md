# 🌸 Vivahanam Wedding Portal — Week 9 Learning Material
> **Target Audience:** Junior Frontend Developers & Interns  
> **Topic:** Dynamic Routing using React Router & Designing Reusable UI Components (Headers, Footers, Buttons, Modals)  
> **Repository:** `VIVAHANAM_ANORG_WEDDING`

---

## 📑 Table of Contents
1. [Week 9 Learning Objectives](#1-week-9-learning-objectives)
2. [Understanding Dynamic Routing & Component Reusability in Vivahanam](#2-understanding-dynamic-routing--component-reusability-in-vivahanam)
3. [React Core Concepts (Theory + Isolated Sample Codes)](#3-react-core-concepts-theory--isolated-sample-codes)
   - [3.1 React Router Setup & Route Configuration](#31-react-router-setup--route-configuration)
   - [3.2 Dynamic Route Parameters with `useParams()`](#32-dynamic-route-parameters-with-useparams)
   - [3.3 Programmatic & Declarative Navigation (`useNavigate`, `<Link>`, `<NavLink>`)](#33-programmatic--declarative-navigation-usenavigate-link-navlink)
   - [3.4 Query Parameters with `useSearchParams()`](#34-query-parameters-with-usesearchparams)
   - [3.5 Designing Reusable UI Components (Buttons, Badges, Modals)](#35-designing-reusable-ui-components-buttons-badges-modals)
4. [Real Application Deep Dive: Vivahanam Routing & Reusable Components](#4-real-application-deep-dive-vivahanam-routing--reusable-components)
   - [4.1 Global Route Architecture (`src/App.jsx`)](#41-global-route-architecture-srcappjsx)
   - [4.2 Dynamic Route Page (`src/pages/VendorDetails.jsx`)](#42-dynamic-route-page-srcpagesvendordetailsjsx)
   - [4.3 Reusable Layout Shell: Header & Footer (`Navbar.jsx` & `Footer.jsx`)](#43-reusable-layout-shell-header--footer-navbarjsx--footerjsx)
   - [4.4 Reusable UI Elements in Action (`VendorCard.jsx` & `EnquiryModal.jsx`)](#44-reusable-ui-elements-in-action-vendorcardjsx--enquirymodaljsx)
5. [Summary Matrix: Routing & UI Reusability](#5-summary-matrix-routing--ui-reusability)
6. [Junior Developer Gotchas & Best Practices](#6-junior-developer-gotchas--best-practices)
7. [Week 9 Hands-On Practice Challenge](#7-week-9-hands-on-practice-challenge)

---

## 1. Week 9 Learning Objectives

By the end of this guide, you will be able to:
- [x] **Master React Router (v6+):** Configure `<Routes>`, `<Route>`, `<BrowserRouter>`, and wildcard/fallback routes.
- [x] **Implement Dynamic URLs:** Define and consume dynamic route parameters (e.g. `/vendors/:id`) using `useParams()`.
- [x] **Seamless SPA Navigation:** Navigate without full browser reloads using `<Link>`, `<NavLink>`, and the `useNavigate()` hook.
- [x] **Read & Update URL Query Strings:** Manage filter states like `/vendors?category=venues&city=mumbai` with `useSearchParams()`.
- [x] **Design Reusable UI Components:** Build modular, maintainable UI components (Header, Footer, Buttons, Modals, Badges) utilizing props and `children`.
- [x] **Understand Layout Shells:** Wrap views inside consistent global shells so common headers and footers persist seamlessly across route changes.

---

## 2. Understanding Dynamic Routing & Component Reusability in Vivahanam

In a single-page application (SPA) like **Vivahanam**, we don't load separate HTML files from a web server when a user clicks a link. Instead:
1. **React Router** intercepts the URL in the browser address bar.
2. It matches the path against defined route patterns.
3. It mounts the corresponding component into the view without reloading the entire webpage.

```
┌────────────────────────────────────────────────────────────────────────┐
│                      VIVAHANAM ROUTING ARCHITECTURE                    │
└────────────────────────────────────────────────────────────────────────┘
                    [ Browser Address Bar: "/vendors/65f1a2b" ]
                                      │
                                      ▼
                        [ React Router <Routes> ]
                                      │
               ┌──────────────────────┴──────────────────────┐
               ▼                                             ▼
        Route: "/vendors"                          Route: "/vendors/:id"
    Mounts: <VendorList />                        Mounts: <VendorDetails />
  (Catalog of all vendors)                       (Reads id="65f1a2b" from URL)
```

### Why Reusable Components Matter:
Instead of rewriting HTML and CSS for buttons, headers, footers, and modal windows on every page, we write **one flexible component** that accepts props for customization (colors, sizes, click handlers, variants).

---

## 3. React Core Concepts (Theory + Isolated Sample Codes)

### 3.1 React Router Setup & Route Configuration
To enable routing in a React app, the root application is wrapped in `<BrowserRouter>`, and routes are mapped using `<Routes>` and `<Route>`.

#### 💡 Sample Code:
```jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import VendorList from "./pages/VendorList";
import VendorDetails from "./pages/VendorDetails";
import NotFoundPage from "./pages/NotFoundPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Static Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/vendors" element={<VendorList />} />

        {/* Dynamic Route with URL parameter :id */}
        <Route path="/vendors/:id" element={<VendorDetails />} />

        {/* Catch-all 404 Route */}
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

---

### 3.2 Dynamic Route Parameters with `useParams()`
Dynamic routes allow you to use placeholder segments in your URL path (prefixed with a colon, e.g. `:id`, `:slug`).  
Inside the rendered component, the `useParams()` hook extracts the actual value from the URL.

#### 💡 Sample Code:
```jsx
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

function VendorDetails() {
  // 🔹 Extract 'id' from the URL (e.g. /vendors/65f9a12b -> id = "65f9a12b")
  const { id } = useParams();
  const [vendor, setVendor] = useState(null);

  useEffect(() => {
    // Fetch data specifically for this vendor ID
    fetch(`https://api.vivahanam.com/vendors/${id}`)
      .then(res => res.json())
      .then(data => setVendor(data));
  }, [id]); // Re-run if ID in URL changes

  if (!vendor) return <div>Loading vendor details...</div>;

  return (
    <div>
      <h2>{vendor.name}</h2>
      <p>Vendor ID: {id}</p>
    </div>
  );
}

export default VendorDetails;
```

---

### 3.3 Programmatic & Declarative Navigation (`useNavigate`, `<Link>`, `<NavLink>`)

| Tool | Type | When to Use |
| :--- | :--- | :--- |
| `<Link to="...">` | Declarative | Standard in-app links (replaces `<a href="...">`) |
| `<NavLink to="...">` | Declarative | Navigation menus where you need an `.active` class |
| `useNavigate()` | Programmatic | Navigating via code after an action (e.g., after form submission or button click) |

#### 💡 Sample Code:
```jsx
import { Link, NavLink, useNavigate } from "react-router-dom";

function Header() {
  const navigate = useNavigate();

  const handleBookNow = () => {
    // 🔹 Programmatic Navigation
    navigate("/checkout?service=photography");
  };

  return (
    <nav>
      {/* 🔹 NavLink automatically knows if it matches current URL */}
      <NavLink 
        to="/vendors" 
        className={({ isActive }) => isActive ? "text-red-600 font-bold" : "text-gray-600"}
      >
        All Vendors
      </NavLink>

      {/* 🔹 Standard Declarative Link */}
      <Link to="/about">About Us</Link>

      {/* 🔹 Button triggering programmatic navigation */}
      <button onClick={handleBookNow}>Book Now</button>
    </nav>
  );
}
```

---

### 3.4 Query Parameters with `useSearchParams()`
Query parameters look like `/vendors?category=candid-photography&city=Hyderabad`. They are used for filtering, sorting, and pagination without changing the page route.

#### 💡 Sample Code:
```jsx
import { useSearchParams } from "react-router-dom";

function FilterableVendorList() {
  // 🔹 Reads and modifies URL query parameters
  const [searchParams, setSearchParams] = useSearchParams();

  // Read current query values
  const currentCategory = searchParams.get("category") || "all";
  const currentCity = searchParams.get("city") || "all";

  const handleCityChange = (newCity) => {
    // Update the query param in the URL without reloading
    setSearchParams({ category: currentCategory, city: newCity });
  };

  return (
    <div>
      <p>Current Filter: {currentCategory} in {currentCity}</p>
      <button onClick={() => handleCityChange("Delhi")}>Filter Delhi</button>
      <button onClick={() => handleCityChange("Mumbai")}>Filter Mumbai</button>
    </div>
  );
}
```

---

### 3.5 Designing Reusable UI Components (Buttons, Badges, Modals)

A great reusable component:
1. Accepts customizable props (`variant`, `size`, `onClick`, `disabled`).
2. Uses the `children` prop to render nested text, icons, or elements.
3. Provides sensible defaults.

#### 💡 Sample Code: Reusable Button Component (`Button.jsx`)
```jsx
function Button({ 
  children, 
  variant = "primary", // "primary" | "secondary" | "outline" | "danger"
  size = "md",         // "sm" | "md" | "lg"
  onClick, 
  disabled = false,
  fullWidth = false,
  className = ""
}) {
  const baseStyles = "rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer";
  
  const variants = {
    primary: "bg-[#D4426A] text-white hover:bg-[#A8274A] shadow-md",
    secondary: "bg-[#F5E9D0] text-[#2C2420] hover:bg-[#EDE0D8]",
    outline: "border-2 border-[#D4426A] text-[#D4426A] hover:bg-[#FDF8F3]",
    danger: "bg-red-600 text-white hover:bg-red-700"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-8 py-3.5 text-base"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseStyles} 
        ${variants[variant] || variants.primary} 
        ${sizes[size] || sizes.md} 
        ${fullWidth ? "w-full" : "w-auto"} 
        ${disabled ? "opacity-50 cursor-not-allowed" : ""} 
        ${className}
      `}
    >
      {children}
    </button>
  );
}

// 💡 Using the Reusable Button anywhere in your app:
function ExampleUsage() {
  return (
    <div className="flex gap-4">
      <Button variant="primary" size="md" onClick={() => alert("Submitted!")}>
        Send Enquiry
      </Button>
      <Button variant="outline" size="sm" onClick={() => alert("Shortlisted!")}>
        ⭐ Shortlist
      </Button>
    </div>
  );
}
```

---

## 4. Real Application Deep Dive: Vivahanam Routing & Reusable Components

Let's now inspect our project's actual production code from `VIVAHANAM_ANORG_WEDDING` to see how routing and common reusable components are structured.

---

### 4.1 Global Route Architecture (`src/App.jsx`)
📍 *File: `src/App.jsx`*

This is the central routing registry of the Vivahanam Wedding Portal. Notice how:
1. The **`<Navbar />` (Header)** is placed at the top and the **`<Footer />`** is placed at the bottom.
2. The `<main>` wrapper contains `<Routes>`, allowing the page content to swap dynamically while the header and footer remain persistent.
3. Both static routes (`/vendors`, `/plans`) and dynamic routes (`/vendors/:id`) are registered.

```jsx
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import VendorList from "./pages/VendorList";
import VendorDetails from "./pages/VendorDetails";
import VendorRegister from "./pages/VendorRegister";
import VendorAuth from "./pages/VendorAuth";
import VendorDashboard from "./pages/VendorDashboard";
import MyEnquiries from "./pages/MyEnquiries";
import MyShortlist from "./pages/MyShortlist";
import MyBookingHistory from "./pages/MyBookingHistory";
import SignUp from "./pages/SignUp";
import Plans from "./pages/Plans";

function App() {
  return (
    <>
      {/* 🔹 REUSABLE COMMON COMPONENT: HEADER / NAVBAR */}
      <Navbar />

      {/* 🔹 MAIN ROUTED CONTENT CONTAINER */}
      <main className="min-h-screen pt-24 pb-8 bg-gray-50">
        <Routes>
          {/* Static Route: Homepage */}
          <Route path="/" element={<Home />} />

          {/* Static Route: Vendor Discovery Catalog */}
          <Route path="/vendors" element={<VendorList />} />

          {/* ================================================================ */}
          {/* 🔹 CONCEPT: DYNAMIC ROUTE WITH :id PARAMETER                      */}
          {/* Matches URLs like /vendors/65f1a2b89c or /vendors/royal-palace   */}
          {/* ================================================================ */}
          <Route path="/vendors/:id" element={<VendorDetails />} />

          {/* Authenticated / Vendor Management Routes */}
          <Route path="/vendor-auth" element={<VendorAuth />} />
          <Route path="/vendor-register" element={<VendorRegister />} />
          <Route path="/vendor/dashboard" element={<VendorDashboard />} />

          {/* User Account Routes */}
          <Route path="/my-enquiries" element={<MyEnquiries />} />
          <Route path="/my-shortlist" element={<MyShortlist />} />
          <Route path="/my-booking-history" element={<MyBookingHistory />} />
          
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/plans" element={<Plans />} />
        </Routes>
      </main>

      {/* 🔹 REUSABLE COMMON COMPONENT: FOOTER */}
      <Footer />
    </>
  );
}

export default App;
```

---

### 4.2 Dynamic Route Page (`src/pages/VendorDetails.jsx`)
📍 *File: `src/pages/VendorDetails.jsx`*

This page demonstrates extracting dynamic parameters, handling loading/empty states, performing programmatic navigation, and embedding reusable modals.

```jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import EnquiryModal from "../components/EnquiryModal";
import VendorBookingModal from "../components/VendorBookingModal";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const VendorDetails = () => {
  // ==========================================================================
  // 🔹 CONCEPT: EXTRACTING DYNAMIC ROUTE PARAMETERS
  // 'id' contains whatever value was passed in the URL (/vendors/:id)
  // ==========================================================================
  const { id } = useParams();

  // ==========================================================================
  // 🔹 CONCEPT: PROGRAMMATIC NAVIGATION HOOK
  // Used to redirect users back to the list or to login
  // ==========================================================================
  const navigate = useNavigate();

  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Fetch vendor data whenever the dynamic :id changes
  useEffect(() => {
    const fetchVendor = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/vendors/${id}`);
        const result = await res.json();
        if (result.success) {
          setVendor(result.data);
        }
      } catch (err) {
        console.error("Failed to load vendor details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchVendor();
  }, [id]); // 🔹 Effect triggers when dynamic 'id' updates!

  // 🔹 1. LOADING STATE
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <p className="text-gray-600">Loading vendor details for ID: {id}...</p>
      </div>
    );
  }

  // 🔹 2. NOT FOUND / FALLBACK STATE WITH BACK NAVIGATION
  if (!vendor) {
    return (
      <div className="text-center py-24">
        <h2 className="text-2xl font-bold text-gray-800">Vendor Not Found</h2>
        <p className="text-gray-500 mt-2 mb-6">The requested vendor profile does not exist.</p>
        
        {/* 🔹 PROGRAMMATIC NAVIGATION: Go back to catalog */}
        <button
          onClick={() => navigate("/vendors")}
          className="bg-[#D4426A] text-white px-6 py-2.5 rounded-full font-semibold"
        >
          ← Back to All Vendors
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Breadcrumb Navigation */}
      <nav className="text-sm text-gray-500 mb-6 flex gap-2">
        <span className="cursor-pointer hover:underline" onClick={() => navigate("/")}>Home</span>
        <span>/</span>
        <span className="cursor-pointer hover:underline" onClick={() => navigate("/vendors")}>Vendors</span>
        <span>/</span>
        <span className="text-gray-800 font-semibold">{vendor.name}</span>
      </nav>

      {/* Profile Header */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs uppercase bg-[#FDE8EE] text-[#D4426A] font-bold px-3 py-1 rounded-full">
            {vendor.category || "Wedding Vendor"}
          </span>
          <h1 className="text-3xl font-bold text-gray-900 mt-2 font-serif">{vendor.name}</h1>
          <p className="text-gray-500 mt-1">📍 {vendor.city || "Location on request"}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button 
            onClick={() => setShowEnquiry(true)}
            className="bg-[#D4426A] text-white px-6 py-3 rounded-xl font-semibold shadow hover:bg-[#A8274A]"
          >
            Send Enquiry
          </button>
          <button 
            onClick={() => setShowBookingModal(true)}
            className="bg-amber-600 text-white px-6 py-3 rounded-xl font-semibold shadow hover:bg-amber-700"
          >
            Book Now
          </button>
        </div>
      </div>

      {/* 🔹 REUSABLE MODALS: Rendered conditionally based on state */}
      {showEnquiry && (
        <EnquiryModal vendor={vendor} onClose={() => setShowEnquiry(false)} />
      )}
      {showBookingModal && (
        <VendorBookingModal vendor={vendor} onClose={() => setShowBookingModal(false)} />
      )}
    </div>
  );
};

export default VendorDetails;
```

---

### 4.3 Reusable Layout Shell: Header & Footer (`Navbar.jsx` & `Footer.jsx`)
📍 *File: `src/components/footer.jsx`*

The **Footer** is a shared component used across every single page. It accepts dynamic contact data and provides clean links:

```jsx
import React from "react";
import { Mail, Phone, MapPin } from "lucide-react";
import { FaFacebook, FaInstagram, FaTwitter, FaLinkedin, FaYoutube } from "react-icons/fa";

// ============================================================================
// 🔹 CONCEPT: REUSABLE COMMON COMPONENT (FOOTER)
// Encapsulates branding, links, contact info, and copyright in one place.
// ============================================================================
const Footer = () => {
  const quickLinks = [
    { name: "All Vendors", href: "/vendors" },
    { name: "Wedding Plans", href: "/plans" },
    { name: "My Shortlist", href: "/my-shortlist" },
    { name: "My Enquiries", href: "/my-enquiries" },
  ];

  return (
    <footer className="bg-gradient-to-br from-amber-900 via-amber-800 to-amber-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 1. Brand Column */}
          <div>
            <h3 className="text-2xl font-serif font-bold text-amber-200">Vivahanam</h3>
            <p className="text-amber-100 text-sm mt-2">
              Your premier marketplace for unforgettable Indian weddings.
            </p>
          </div>

          {/* 2. Navigation Column */}
          <div>
            <h4 className="font-semibold text-lg mb-3 text-amber-200">Quick Links</h4>
            <ul className="space-y-2 text-sm text-amber-100">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="hover:text-white transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. Contact Column */}
          <div>
            <h4 className="font-semibold text-lg mb-3 text-amber-200">Contact Us</h4>
            <p className="text-sm text-amber-100 flex items-center gap-2">
              <Mail size={16} /> support@vivahanam.com
            </p>
          </div>
        </div>

        {/* Copyright divider */}
        <div className="border-t border-amber-700/50 mt-8 pt-6 text-center text-xs text-amber-200">
          © {new Date().getFullYear()} Vivahanam. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
```

---

### 4.4 Reusable UI Elements in Action (`VendorCard.jsx` & `EnquiryModal.jsx`)

When a user clicks on any card in `VendorCard.jsx`, notice how it performs **programmatic routing**:
```jsx
// 🔹 Navigating to the dynamic route when the card is clicked:
onClick={() => navigate(`/vendors/${vendor._id || vendor.id}`)}
```
This triggers React Router to transition to `/vendors/:id`, loading `VendorDetails.jsx` for that specific vendor seamlessly!

---

## 5. Summary Matrix: Routing & UI Reusability

| Concept | React Router / UI Feature | Production Example in Vivahanam |
| :--- | :--- | :--- |
| **Route Registry** | `<Routes>`, `<Route>` | `src/App.jsx` mapping paths to pages |
| **Dynamic Params** | `:id` in path + `useParams()` | `/vendors/:id` in `VendorDetails.jsx` |
| **Programmatic Nav**| `useNavigate()` | `navigate('/vendors/' + id)` in `VendorCard.jsx` |
| **Query Parameters**| `useSearchParams()` | Reading `category` and `location` in search |
| **Layout Shell** | Persistent Header + Footer | `<Navbar />` and `<Footer />` in `App.jsx` |
| **Common UI Elements**| Props + Children Composition | `Button`, `RatingBadge`, `EnquiryModal` |

---

## 6. Junior Developer Gotchas & Best Practices

### ❌ Gotcha 1: Using `<a href>` for Internal Links
```jsx
// ❌ WRONG: Triggers a full page reload and wipes out in-memory React state!
<a href="/vendors">All Vendors</a>

// ✅ CORRECT: Intercepts URL client-side and maintains SPA state
<Link to="/vendors">All Vendors</Link>
```

### ❌ Gotcha 2: Forgetting Dependencies in `useEffect` with `useParams`
```javascript
// ❌ RISKY: If user switches from /vendors/1 to /vendors/2, data won't refresh!
useEffect(() => {
  fetchVendor(id);
}, []); // Empty array misses changes to 'id'

// ✅ CORRECT: Include 'id' in dependency array
useEffect(() => {
  fetchVendor(id);
}, [id]);
```

### ❌ Gotcha 3: Creating Non-Reusable Rigid Components
```jsx
// ❌ BAD: Hardcoded styles, text, and actions inside component
function RedButton() {
  return <button style={{ background: "red" }}>Submit Form</button>;
}

// ✅ GOOD: Flexible props and children
function Button({ children, variant = "primary", onClick }) {
  return <button className={`btn btn-${variant}`} onClick={onClick}>{children}</button>;
}
```

---

## 7. Week 9 Hands-On Practice Challenge

Test your knowledge with this quick two-part exercise:

### 🎯 Part 1: Build a Reusable `Badge` Component
1. Create a file `src/components/Badge.jsx`.
2. Support `variant` prop (`"success"` for green, `"warning"` for amber, `"danger"` for red, `"default"` for pink).
3. Use the `children` prop to display the badge text or icon (e.g. `<Badge variant="success">⭐ 4.9 Super Vendor</Badge>`).
4. Replace hardcoded category pills in `VendorCard.jsx` with your new `Badge` component!

### 🎯 Part 2: Dynamic Breadcrumb Navigation
1. In `VendorDetails.jsx`, create a breadcrumb navigation bar using `Link` or `useNavigate`.
2. Add a dynamic segment: `Home > Vendors > [Vendor Name]`.
3. Verify that clicking "Vendors" smoothly routes back to `/vendors` without reloading the page.

---

*Happy Coding! Reach out to your team mentors if you need any clarification.* 🚀
