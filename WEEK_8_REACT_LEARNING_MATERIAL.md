# 🌸 Vivahanam Wedding Portal — Week 8 React Learning Material
> **Target Audience:** Junior Frontend Developers & Interns  
> **Topic:** Project Requirements, React Fundamentals (Components, JSX, State, Props), UI Layout & Wireframing  
> **Repository:** `VIVAHANAM_ANORG_WEDDING`

---

## 📑 Table of Contents
1. [Week 8 Learning Objectives](#1-week-8-learning-objectives)
2. [Understanding Frontend Project Requirements](#2-understanding-frontend-project-requirements)
3. [React Core Concepts (Theory + Quick Samples)](#3-react-core-concepts-theory--quick-samples)
   - [3.1 Components (The Building Blocks)](#31-components-the-building-blocks)
   - [3.2 JSX (JavaScript XML)](#32-jsx-javascript-xml)
   - [3.3 State (`useState` Hook)](#33-state-usestate-hook)
   - [3.4 Props (Passing Data & Callbacks)](#34-props-passing-data--callbacks)
   - [3.5 Building UI Layouts & Wireframes](#35-building-ui-layouts--wireframes)
4. [Real Application Module Deep Dive: The Vendor Discovery Module](#4-real-application-module-deep-dive-the-vendor-discovery-module)
   - [Module Architecture & Wireframe](#module-architecture--wireframe)
   - [Code Walkthrough 1: `VendorCard.jsx` (Props & JSX Focus)](#code-walkthrough-1-vendorcardjsx-props--jsx-focus)
   - [Code Walkthrough 2: `SearchBar.jsx` (State & Events Focus)](#code-walkthrough-2-searchbarjsx-state--events-focus)
   - [Code Walkthrough 3: `EnquiryModal.jsx` (Form State & Conditional Rendering Focus)](#code-walkthrough-3-enquirymodaljsx-form-state--conditional-rendering-focus)
   - [Code Walkthrough 4: `VendorList.jsx` (Parent Layout & Composition Focus)](#code-walkthrough-4-vendorlistjsx-parent-layout--composition-focus)
5. [Summary Matrix: Concepts in Action](#5-summary-matrix-concepts-in-action)
6. [Junior Developer Gotchas & Best Practices](#6-junior-developer-gotchas--best-practices)
7. [Week 8 Practice Challenge](#7-week-8-practice-challenge)

---

## 1. Week 8 Learning Objectives

By the end of this guide, you will be able to:
- [x] **Understand Frontend Requirements:** Know what the Vivahanam Wedding Portal solves and how user flows translate into UI requirements.
- [x] **Think in React Components:** Break complex screens into small, reusable, isolated functional components.
- [x] **Write Clean JSX:** Use curly brace JavaScript expressions `{ }`, conditional rendering (`&&`, ternary), and render lists with `.map()` and unique `key`s.
- [x] **Manage Local State (`useState`):** Handle form inputs, toggle modals, manage dropdown selections, and trigger re-renders.
- [x] **Pass Data via Props:** Feed data from parent pages down to child components and send events back up using callback functions.
- [x] **Wireframe to Layout:** Transform a visual wireframe/mockup into responsive Flexbox/Grid layouts in React.

---

## 2. Understanding Frontend Project Requirements

### What is Vivahanam?
**Vivahanam** is a comprehensive wedding services marketplace. It connects couples planning their wedding with verified vendors (Venues, Photographers, Caterers, Makeup Artists, Decorators, Priests, etc.).

```
  ┌────────────────────────────────────────────────────────────────────────┐
  │                           USER JOURNEY FLOW                            │
  └────────────────────────────────────────────────────────────────────────┘
     [ 1. Discovery ]       →      [ 2. Filter & Browse ]    →   [ 3. Vendor Profile ]   →   [ 4. Action ]
   Landing page / Search          Search by Category/City        View Pricing & Work        Send Enquiry / Book
```

### Core Frontend Requirements:
1. **Dynamic Vendor Catalog:** Users must be able to search and filter vendors by category (e.g., "Photographer") and city (e.g., "Mumbai", "Delhi").
2. **Interactive Cards:** Each vendor displays image portfolios, rating badges, starting prices, and category tags.
3. **Interactive Modals:** Users can open an **Enquiry Modal** or **Booking Modal** without navigating away from the page.
4. **Responsive Layout:** The UI must work smoothly across mobile phones, tablets, and desktop screens.
5. **State Synchronization:** When a user selects a filter in the Search Bar, the vendor list must immediately update.

---

## 3. React Core Concepts (Theory + Quick Samples)

### 3.1 Components (The Building Blocks)
A **Component** in React is an independent, reusable JavaScript function that returns UI elements (JSX).

- Components allow us to split the UI into independent, reusable pieces.
- Component names **MUST ALWAYS** start with a Capital Letter (e.g., `VendorCard`, not `vendorCard`).

#### 💡 Minimal Sample Code:
```jsx
// 1. Defining a Component
function RatingBadge({ rating }) {
  return (
    <div className="badge">
      <span>⭐ {rating > 0 ? rating : "New"}</span>
    </div>
  );
}

// 2. Using the Component in another component
function App() {
  return (
    <div>
      <h1>Featured Vendor</h1>
      <RatingBadge rating={4.8} />
    </div>
  );
}

export default App;
```

---

### 3.2 JSX (JavaScript XML)
**JSX** is a syntax extension for JavaScript that looks like HTML. It allows you to write HTML structure directly inside your JavaScript code.

#### Key Rules of JSX:
1. **Return a single root element:** Wrap sibling elements in a `<div>` or a Fragment `<>...</>`.
2. **JavaScript inside `{}`:** Any valid JS variable, math expression, or function call goes inside curly braces.
3. **Use `className` instead of `class`** (since `class` is a reserved keyword in JavaScript).
4. **Conditional Rendering:** Use ternary `condition ? <A/> : <B/>` or `&&` for inline conditions.
5. **List Rendering:** Use `.map()` to render lists, and always provide a unique `key` prop.

#### 💡 Minimal Sample Code:
```jsx
function CategoryList() {
  const categories = ["Venues", "Photographers", "Catering", "Decorators"];
  const isAvailable = true;

  return (
    <div className="category-container">
      {/* 1. JavaScript variable inside curly braces */}
      <h3>Available Categories ({categories.length})</h3>

      {/* 2. Conditional Rendering using && */}
      {isAvailable && <p className="status-open">Open for Bookings Today</p>}

      {/* 3. List rendering using .map() with unique key */}
      <ul className="category-list">
        {categories.map((cat, index) => (
          <li key={index} className="category-item">
            {cat}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

### 3.3 State (`useState` Hook)
**State** is the component's private "memory". When state changes, React automatically re-renders the component to update the UI.

- We declare state using the `useState` hook: `const [value, setValue] = useState(initialValue);`
- **Never mutate state directly!** (e.g., ❌ `count = count + 1`). Always use the setter function (e.g., ✅ `setCount(count + 1)`).

#### 💡 Minimal Sample Code:
```jsx
import { useState } from "react";

function GuestCounter() {
  // Declare state variable 'guests' with initial value 100
  const [guests, setGuests] = useState(100);

  return (
    <div className="counter-box">
      <h4>Estimated Guest Count: {guests}</h4>
      
      {/* Updating state on button clicks */}
      <button onClick={() => setGuests(guests - 25)} disabled={guests <= 25}>
        - 25 Guests
      </button>
      <button onClick={() => setGuests(guests + 25)}>
        + 25 Guests
      </button>
      <button onClick={() => setGuests(100)}>
        Reset
      </button>
    </div>
  );
}
```

---

### 3.4 Props (Passing Data & Callbacks)
**Props** (short for *properties*) are inputs passed from a **Parent component** to a **Child component**.

- **Props are Read-Only (Immutable):** A child component must never modify the props it receives.
- **Top-Down Data Flow:** Data moves down from Parent to Child.
- **Child-to-Parent Communication:** Parents pass *callback functions* as props; children call those functions to notify the parent of events.

#### 💡 Minimal Sample Code:
```jsx
// CHILD COMPONENT (Receives props: title, price, onSelect)
function ServiceCard({ title, price, onSelect }) {
  return (
    <div className="service-card">
      <h4>{title}</h4>
      <p>Starting at: ₹{price}</p>
      {/* Child calls the parent's function when button is clicked */}
      <button onClick={() => onSelect(title)}>Select Service</button>
    </div>
  );
}

// PARENT COMPONENT (Passes data & callback function down)
function ServicesPage() {
  const [selectedService, setSelectedService] = useState("");

  const handleServiceSelect = (serviceName) => {
    setSelectedService(serviceName);
    alert(`You picked: ${serviceName}`);
  };

  return (
    <div>
      <h2>Selected: {selectedService || "None"}</h2>
      
      {/* Passing props and callbacks */}
      <ServiceCard 
        title="Royal Mandap Decoration" 
        price={45000} 
        onSelect={handleServiceSelect} 
      />
      <ServiceCard 
        title="Candid Wedding Photography" 
        price={60000} 
        onSelect={handleServiceSelect} 
      />
    </div>
  );
}
```

---

### 3.5 Building UI Layouts & Wireframes
In modern web applications, UI wireframes are built by composing container components with Flexbox/Grid CSS.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        WIREFRAME COMPOSITION                           │
├────────────────────────────────────────────────────────────────────────┤
│  [ Header / Navbar Component ]                                         │
├────────────────────────────────────────────────────────────────────────┤
│  [ SearchBar Component ] (Category Dropdown | Location Dropdown | CTA) │
├────────────────────────────────────────────────────────────────────────┤
│  [ Main Grid Layout ]                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │
│  │ VendorCard       │  │ VendorCard       │  │ VendorCard       │      │
│  │ - Image & Badge  │  │ - Image & Badge  │  │ - Image & Badge  │      │
│  │ - Title & City   │  │ - Title & City   │  │ - Title & City   │      │
│  │ - Price Info     │  │ - Price Info     │  │ - Price Info     │      │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘      │
├────────────────────────────────────────────────────────────────────────┤
│  [ Footer Component ]                                                  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Real Application Module Deep Dive: The Vendor Discovery Module

Let's now inspect our project's actual production code from `VIVAHANAM_ANORG_WEDDING` to see how all these concepts come together.

### Module Architecture:
- **`VendorList.jsx` (Page / Parent Layout):** Fetches vendor data from API, stores search filters, and orchestrates children.
- **`SearchBar.jsx` (Filter Component):** Manages dropdown states and passes chosen filters to parent.
- **`VendorCard.jsx` (Presentational Card):** Receives a vendor object as props, renders dynamic pricing and image cards.
- **`EnquiryModal.jsx` (Interactive Modal):** Manages multi-field form state, validation, and submission.

---

### Code Walkthrough 1: `VendorCard.jsx` (Props & JSX Focus)
📍 *File: `src/components/VendorCard.jsx`*

This component showcases **Props destructuring**, **dynamic JSX rendering**, **conditional fallback styling**, and **hover micro-interactions**.

```jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const ROOT_API_BASE = API_BASE ? API_BASE.replace(/\/admin\/?$/, "") : "";

// Helper to resolve dynamic image paths
const getImageUrl = (img) => {
  if (!img) return null;
  if (img.startsWith("http")) return img;
  return `${ROOT_API_BASE.replace("/api", "")}${img}`;
};

// ============================================================================
// 🔹 CONCEPT: FUNCTIONAL COMPONENT WITH PROPS
// VendorCard receives a single prop object called { vendor } from its parent.
// ============================================================================
const VendorCard = ({ vendor }) => {
  const navigate = useNavigate();

  // 🔹 CONCEPT: JAVASCRIPT LOGIC BEFORE JSX RETURN
  const imageUrl = getImageUrl(vendor.image || (vendor.gallery && vendor.gallery[0])) 
    || "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop";

  const data = vendor?.data || {};
  const cat = (vendor?.categories && vendor?.categories[0]) || data?.category || vendor?.vendorType || "Vendor";

  // 🔹 CONCEPT: HELPER FUNCTION RETURNING DYNAMIC JSX
  const renderDynamicData = () => {
    const hiddenKeys = ["brand_name", "email", "mobile", "city", "category", "image", "slug"];
    if (!data || typeof data !== "object") return null;

    const dynamicFields = Object.entries(data).filter(([key, value]) => {
      if (hiddenKeys.includes(key)) return false;
      return value !== null && value !== undefined && value !== "";
    });

    // 🔹 CONCEPT: CONDITIONAL RENDERING (EMPTY STATE)
    if (dynamicFields.length === 0 && !vendor?.price) {
      return (
        <div style={{ color: "#2C2420", fontWeight: 700, fontSize: 16 }}>
          Contact for Price
        </div>
      );
    }

    const formatKey = (str) =>
      str.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {/* 🔹 CONCEPT: CONDITIONAL RENDERING (PRICE CHIP) */}
        {vendor?.price && (
          <div style={{
            background: "#FDF8F3", border: "1px solid #F5E9D0", 
            padding: "6px 10px", borderRadius: 8, display: "flex", flexDirection: "column"
          }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: "#A89F9C" }}>Starting Price</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#2C2420" }}>
              ${Number(vendor.price).toLocaleString()}
            </span>
          </div>
        )}

        {/* 🔹 CONCEPT: LIST RENDERING WITH .map() AND UNIQUE KEY */}
        {dynamicFields.slice(0, 4).map(([key, value]) => (
          <div key={key} style={{
            background: "#FDF8F3", border: "1px solid #F5E9D0", 
            padding: "6px 10px", borderRadius: 8, display: "flex", flexDirection: "column"
          }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: "#A89F9C" }}>{formatKey(key)}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#2C2420" }}>
              {Array.isArray(value) ? value.join(", ") : value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // 🔹 CONCEPT: JSX STRUCTURE (CARD WIREFRAME LAYOUT)
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 20,
        overflow: "hidden",
        border: "1px solid #EDE0D8",
        transition: "all 0.3s ease",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        boxShadow: "0 4px 12px rgba(44,36,32,0.04)"
      }}
      onClick={() => navigate(`/vendors/${vendor._id || vendor.id}`)}
    >
      {/* 1. CARD MEDIA / IMAGE HEADER */}
      <div style={{ height: 180, position: "relative", overflow: "hidden" }}>
        <img
          src={imageUrl}
          alt={vendor.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        
        {/* 🔹 CONCEPT: CONDITIONAL RENDERING (RATING BADGE) */}
        {vendor.rating > 0 && (
          <div style={{
            position: "absolute", top: 12, right: 12,
            background: "rgba(255,255,255,0.9)", padding: "4px 10px", borderRadius: 50,
            fontSize: 12, fontWeight: 600, color: "#D4426A"
          }}>
            ⭐ {vendor.rating}
          </div>
        )}

        {/* Category Pill */}
        <div style={{ position: "absolute", bottom: 10, left: 16 }}>
          <span style={{ background: "#D4426A", color: "#fff", fontSize: 10, padding: "3px 10px", borderRadius: 4 }}>
            {cat}
          </span>
        </div>
      </div>

      {/* 2. CARD CONTENT / BODY */}
      <div style={{ padding: 16, flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          {/* 🔹 CONCEPT: EXPRESSION IN JSX */}
          <h3 style={{ fontSize: 22, color: "#2C2420", margin: 0 }}>
            {vendor.name || vendor.brandName || "Untitled Vendor"}
          </h3>
          <span style={{ fontSize: 13, color: "#7A6E6A" }}>
            📍 {vendor.city || "Location"}
          </span>
        </div>

        {/* Render dynamic attributes */}
        <div style={{ paddingTop: 16, borderTop: "1px solid #F5E9D0" }}>
          {renderDynamicData()}
        </div>
      </div>
    </div>
  );
};

export default VendorCard;
```

---

### Code Walkthrough 2: `SearchBar.jsx` (State & Events Focus)
📍 *File: `src/components/SearchBar.jsx`*

This component highlights **State Management (`useState`)**, **Controlled Form Elements (`value` + `onChange`)**, and **Parent Callback Communication via Props (`onSearch`)**.

```jsx
import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// ============================================================================
// 🔹 CONCEPT: PROPS WITH CALLBACK FUNCTION
// SearchBar receives 'onSearch' from its parent (VendorList.jsx).
// ============================================================================
const SearchBar = ({ onSearch }) => {
  // ==========================================================================
  // 🔹 CONCEPT: COMPONENT LOCAL STATE
  // Each input field has a corresponding state variable.
  // ==========================================================================
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");

  // Fetch categories & cities on mount
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const catRes = await fetch(`${API_BASE}/categories`);
        const catData = await catRes.json();
        setCategories(catData?.data || []);
      } catch (err) {
        console.error("Filter load error", err);
      }
    };
    fetchOptions();
  }, []);

  // 🔹 CONCEPT: EVENT HANDLER FUNCTION
  const handleSubmit = (e) => {
    e.preventDefault(); // Prevents full browser page reload
    // Trigger callback function passed down as a prop
    onSearch({ category, location });
  };

  return (
    // 🔹 CONCEPT: FORM SUBMISSION EVENT IN JSX
    <form 
      onSubmit={handleSubmit} 
      className="bg-white shadow-xl p-3 flex flex-col md:flex-row items-center gap-3 w-full max-w-4xl mx-auto rounded-2xl border border-gray-100"
    >
      <div className="w-full flex-1 flex flex-col md:flex-row gap-3">
        {/* 🔹 CONCEPT: CONTROLLED INPUT (Category Select) */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)} // Updates 'category' state on change
          className="w-full p-3 border rounded-xl text-gray-700 font-medium"
        >
          <option value="">All Vendor Types</option>
          {categories.map((item) => (
            <option key={item.value || item._id} value={item.value}>
              {item.label || item.name}
            </option>
          ))}
        </select>

        {/* 🔹 CONCEPT: CONTROLLED INPUT (Location Select) */}
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)} // Updates 'location' state on change
          className="w-full p-3 border rounded-xl text-gray-700 font-medium"
        >
          <option value="">All Locations</option>
          {locations.map((item) => (
            <option key={item.value || item._id} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      {/* Submit Button */}
      <button 
        type="submit" 
        className="w-full md:w-auto bg-red-600 text-white rounded-xl px-8 py-3 font-semibold hover:bg-red-700 transition-all"
      >
        Search Vendors
      </button>
    </form>
  );
};

export default SearchBar;
```

---

### Code Walkthrough 3: `EnquiryModal.jsx` (Form State & Conditional Rendering Focus)
📍 *File: `src/components/EnquiryModal.jsx`*

This component shows how to manage **an object state with multiple fields**, **conditional rendering of success screens**, and **controlled form inputs**.

```jsx
import { useState } from "react";
import { toast } from "react-toastify";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const EVENT_TYPES = ["wedding", "engagement", "reception", "pre-wedding", "anniversary"];
const GUEST_OPTIONS = ["< 50", "50-100", "100-200", "200-500", "500+"];

// 🔹 PROPS: vendor object (data to display) and onClose callback (to dismiss modal)
export default function EnquiryModal({ vendor, onClose }) {
  // 🔹 STATE: Complex Form Object State
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    eventDate: "",
    eventType: "",
    guestCount: "",
    budget: "",
    message: ""
  });
  
  // 🔹 STATE: UI Status flags
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Helper to update individual keys in state object immutably
  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      return toast.warn("Name and phone are required!");
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/vendors/${vendor._id}/enquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to send enquiry");
      setDone(true); // 🔹 Triggers conditional render to show success message!
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    // 🔹 MODAL BACKDROP (Wireframe Overlay)
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* Prevent clicks inside modal dialog from closing the modal */}
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", width: "100%", maxWidth: 520, borderRadius: 24, overflow: "hidden" }}>
        
        {/* HEADER */}
        <div style={{ background: "linear-gradient(135deg, #D4426A, #e8637e)", padding: 24, color: "#fff", display: "flex", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Send Enquiry to</div>
            <h3 style={{ margin: 0, fontSize: 22 }}>{vendor.name}</h3>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: "50%", width: 32, height: 32, cursor: "pointer" }}>✕</button>
        </div>

        {/* 🔹 CONCEPT: CONDITIONAL RENDERING (SUCCESS SCREEN vs FORM) */}
        {done ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <div style={{ fontSize: 50 }}>🎉</div>
            <h3>Enquiry Sent Successfully!</h3>
            <p>The vendor will contact you shortly.</p>
            <button onClick={onClose} style={{ background: "#D4426A", color: "#fff", border: "none", padding: "10px 24px", borderRadius: 50, cursor: "pointer" }}>Done</button>
          </div>
        ) : (
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <input 
                placeholder="Full Name *" 
                value={form.name} 
                onChange={e => set("name", e.target.value)} 
                style={{ padding: 10, borderRadius: 8, border: "1px solid #EDE0D8" }}
              />
              <input 
                placeholder="Phone Number *" 
                value={form.phone} 
                onChange={e => set("phone", e.target.value)} 
                style={{ padding: 10, borderRadius: 8, border: "1px solid #EDE0D8" }}
              />
            </div>

            <select 
              value={form.eventType} 
              onChange={e => set("eventType", e.target.value)}
              style={{ padding: 10, borderRadius: 8, border: "1px solid #EDE0D8" }}
            >
              <option value="">Select Event Type</option>
              {EVENT_TYPES.map(t => (
                <option key={t} value={t}>{t.toUpperCase()}</option>
              ))}
            </select>

            <button 
              onClick={handleSubmit} 
              disabled={submitting} 
              style={{ background: "#D4426A", color: "#fff", border: "none", padding: 14, borderRadius: 12, fontWeight: 600, cursor: "pointer" }}
            >
              {submitting ? "Sending..." : "Send Enquiry Now"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

### Code Walkthrough 4: `VendorList.jsx` (Parent Layout & Composition Focus)
📍 *File: `src/pages/VendorList.jsx`*

This is the main **Page Component** where everything connects. It demonstrates:
- Holding the master list of vendors in state (`vendors`).
- Passing callbacks (`onSearch`) to the child `SearchBar`.
- Iterating over vendors to render multiple `VendorCard` components inside a responsive grid layout.

```jsx
import { useEffect, useState } from "react";
import SearchBar from "../components/SearchBar";
import VendorCard from "../components/VendorCard";

export default function VendorList() {
  // 🔹 STATE: Master vendor list, loading status, and active filters
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: "", location: "" });

  // Fetch vendors whenever filters change
  useEffect(() => {
    const fetchVendors = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams(filters).toString();
        const res = await fetch(`/api/vendors?${query}`);
        const data = await res.json();
        setVendors(data?.vendors || []);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchVendors();
  }, [filters]); // 🔹 Effect runs when 'filters' state changes

  // 🔹 HANDLER: Passed down to SearchBar as a prop
  const handleSearch = (newFilters) => {
    setFilters(newFilters);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 max-w-7xl mx-auto">
      {/* 1. HEADER SECTION */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 font-serif">
          Find Wedding Vendors
        </h1>
        <p className="text-gray-600 mt-2">
          Discover the best venues, photographers, and caterers for your big day.
        </p>
      </div>

      {/* 2. SEARCH BAR (Child Component receiving callback prop) */}
      <div className="mb-10">
        <SearchBar onSearch={handleSearch} />
      </div>

      {/* 3. VENDOR GRID / WIREFRAME LAYOUT */}
      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading vendors...</div>
      ) : vendors.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 p-8">
          <p className="text-xl font-semibold text-gray-700">No vendors found</p>
          <p className="text-gray-500 text-sm mt-1">Try clearing your filters.</p>
        </div>
      ) : (
        /* 🔹 RESPONSIVE GRID LAYOUT (1 col on mobile, 2 on tablet, 3 on desktop) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {vendors.map((vendor) => (
            /* 🔹 Child Component receiving vendor data via prop */
            <VendorCard key={vendor._id} vendor={vendor} />
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 5. Summary Matrix: Concepts in Action

| Concept | What It Is | How We Used It in Vivahanam |
| :--- | :--- | :--- |
| **Component** | Modular, reusable UI chunk | `VendorCard`, `SearchBar`, `EnquiryModal`, `RatingBadge` |
| **JSX** | HTML structure inside JavaScript | Dynamic headings `{vendor.name}`, inline styles, semantic tags |
| **State (`useState`)** | Dynamic data that triggers re-renders | Form values in `EnquiryModal`, selected filters in `SearchBar` |
| **Props** | Read-only input values passed to children | Passing `vendor` object to `VendorCard`, `onClose` callback to modal |
| **List & Keys** | Rendering arrays dynamically | `vendors.map(v => <VendorCard key={v._id} .../>)` |
| **Conditional UI** | Showing different UI based on state | Showing success screen when `done === true`, showing rating badge only if `rating > 0` |
| **Layout & Grid** | Structural wireframe organization | Responsive 3-column CSS Grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`) |

---

## 6. Junior Developer Gotchas & Best Practices

### ❌ Gotcha 1: Direct State Mutation
```javascript
// ❌ WRONG: React will NOT know state changed, so UI won't update!
form.name = "John";

// ✅ CORRECT: Always use the state setter function
setForm(prev => ({ ...prev, name: "John" }));
```

### ❌ Gotcha 2: Missing or Array Index as `key` Prop
```jsx
// ❌ RISKY: Array index as key can cause rendering bugs when sorting/filtering
{vendors.map((v, index) => <VendorCard key={index} vendor={v} />)}

// ✅ CORRECT: Always use a unique, persistent identifier (e.g. database ID)
{vendors.map((v) => <VendorCard key={v._id} vendor={v} />)}
```

### ❌ Gotcha 3: Forgetting Event Default on Forms
```javascript
// ❌ WRONG: Page will refresh and lose all React state
const handleSubmit = () => { ... };

// ✅ CORRECT: Prevent native browser form reload
const handleSubmit = (e) => {
  e.preventDefault();
  // your custom logic
};
```

---

## 7. Week 8 Practice Challenge

Try building this mini-feature inside your local environment to test your understanding:

### 🎯 Task: "Shortlist / Favorite Heart Button"
1. **Create a Component:** Inside `VendorCard.jsx`, add a floating heart button `FavoriteButton` in the top-left corner of the image.
2. **Add State:** Create a boolean state `isFavorite` (initial value `false`).
3. **Handle Click:** When clicked, toggle `isFavorite` between `true` and `false` (`setIsFavorite(!isFavorite)`).
4. **Use JSX Conditional Styling:** 
   - If `isFavorite` is true, render a filled red heart `❤️`.
   - If false, render an outline heart `🤍`.
5. **Bonus (Props):** Pass an `onToggleFavorite(vendorId, isFavorite)` prop callback up to `VendorList` to display a toast notification!

---

*Happy Coding! If you have questions, reach out to your team lead or senior mentors on the project.* 🚀
