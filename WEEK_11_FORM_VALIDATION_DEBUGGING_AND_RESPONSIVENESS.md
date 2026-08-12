# 🌸 Vivahanam Wedding Portal — Week 11 Learning Material
> **Target Audience:** Junior Frontend Developers & Interns  
> **Topic:** Interactivity, Form Validation, Event Handling, Front-End Debugging & Responsiveness Checks  
> **Repository:** `VIVAHANAM_ANORG_WEDDING`

---

## 📑 Table of Contents
1. [Week 11 Learning Objectives](#1-week-11-learning-objectives)
2. [Why Interactivity, Validation & Responsive QA Matter](#2-why-interactivity-validation--responsive-qa-matter)
3. [React Core Concepts (Theory + Isolated Sample Codes)](#3-react-core-concepts-theory--isolated-sample-codes)
   - [3.1 React Event Handling Mastery (`onClick`, `onChange`, `onSubmit`, `onBlur`)](#31-react-event-handling-mastery-onclick-onchange-onsubmit-onblur)
   - [3.2 Form Validation Strategies (Real-Time vs Submit, Regex Checks)](#32-form-validation-strategies-real-time-vs-submit-regex-checks)
   - [3.3 Interactive UI Micro-interactions (Star Ratings, Dynamic Calculators)](#33-interactive-ui-micro-interactions-star-ratings-dynamic-calculators)
   - [3.4 Front-End Debugging Techniques (React DevTools, Console, Network Tab)](#34-front-end-debugging-techniques-react-devtools-console-network-tab)
   - [3.5 Responsive Layout Design & Mobile QA Checks](#35-responsive-layout-design--mobile-qa-checks)
4. [Real Application Deep Dive: Vivahanam Interactivity & Form Validation](#4-real-application-deep-dive-vivahanam-interactivity--form-validation)
   - [4.1 Interactive Multi-Category Star Rating & Form Validation (`VendorReviewSection.jsx`)](#41-interactive-multi-category-star-rating--form-validation-vendorreviewsectionjsx)
   - [4.2 Dynamic Pricing, Coupon Validation & Modal Events (`VendorBookingModal.jsx`)](#42-dynamic-pricing-coupon-validation--modal-events-vendorbookingmodaljsx)
   - [4.3 Production Debugging & Responsive QA Checklist for Vivahanam](#43-production-debugging--responsive-qa-checklist-for-vivahanam)
5. [Summary Matrix: Event Handling, Validation & Debugging](#5-summary-matrix-event-handling-validation--debugging)
6. [Junior Developer Gotchas & Best Practices](#6-junior-developer-gotchas--best-practices)
7. [Week 11 Hands-On Practice Challenge](#7-week-11-hands-on-practice-challenge)

---

## 1. Week 11 Learning Objectives

By the end of this guide, you will be able to:
- [x] **Master React Event Handling:** Utilize Synthetic Events (`onChange`, `onSubmit`, `onKeyDown`, `onMouseEnter`) and understand `e.preventDefault()` vs `e.stopPropagation()`.
- [x] **Implement Robust Form Validation:** Perform field-level validation, regex checks (email, 10-digit phone), error state mapping, and disable submit buttons during invalid states.
- [x] **Build Dynamic Micro-Interactions:** Build interactive star rating pickers, dynamic discount calculators, and live character count indicators.
- [x] **Debug Front-End Applications Like a Pro:** Use React Developer Tools (Component Tree & Profiler), Chrome/Edge DevTools Breakpoints, and Network Tab inspection.
- [x] **Conduct Mobile Responsiveness Audits:** Validate Tailwind responsive utilities (`sm:`, `md:`, `lg:`), prevent horizontal overflow, ensure 44px+ touch targets, and handle modal viewport height scrolling (`max-h-[90vh]`).

---

## 2. Why Interactivity, Validation & Responsive QA Matter

In an e-commerce & marketplace platform like **Vivahanam**, users interact with critical financial and booking workflows:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        INTERACTIVE FORM LIFECYCLE                      │
└────────────────────────────────────────────────────────────────────────┘
  [ User Types Input ] ──► [ onChange Handler ] ──► [ Regex / Field Validation ]
                                                               │
     ┌─────────────────────────◄───────────────────────────────┘
     │
     ▼ (Valid State)                      ▼ (Invalid State)
  [ Clear Error Banner ]               [ Display Specific Inline Error Message ]
  [ Enable Submit Button ]             [ Disable Submit Button / Shake Input ]
     │
     ▼ (onSubmit)
  [ e.preventDefault() ] ──► [ Trigger Async API Call ] ──► [ Toast Feedback ]
```

### The Three Pillars of Week 11:
1. **Interactivity & Event Handling:** UI elements should react smoothly to hover, clicks, keypresses, and touch gestures.
2. **Form Validation:** Catch invalid emails, short passwords, and missing dates **before** sending network requests to our backend.
3. **Responsive QA:** Over 70% of couples browse wedding vendors from mobile phones. If a modal overflows or a button is cut off on mobile, bookings will fail.

---

## 3. React Core Concepts (Theory + Isolated Sample Codes)

### 3.1 React Event Handling Mastery (`onClick`, `onChange`, `onSubmit`, `onBlur`)
React wraps native browser events in a cross-browser wrapper called **SyntheticEvent**.

- `e.preventDefault()`: Stops the default browser behavior (e.g. stops full page reload on `<form onSubmit>`).
- `e.stopPropagation()`: Stops an event from bubbling up to parent containers (e.g. clicking inside a modal dialog shouldn't trigger the backdrop's `onClose`).

#### 💡 Sample Code:
```jsx
function ModalDialog({ onClose }) {
  return (
    // 🔹 Backdrop overlay: Clicking here calls onClose
    <div className="modal-backdrop" onClick={onClose}>
      
      {/* 🔹 Modal Container: e.stopPropagation() prevents backdrop click from closing */}
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
      >
        <h3>Send Booking Request</h3>
        <button onClick={onClose}>✕</button>
      </div>
    </div>
  );
}
```

---

### 3.2 Form Validation Strategies (Real-Time vs Submit, Regex Checks)
Validation can happen in two places:
1. **On Blur / Change (Real-Time):** Gives instant feedback while typing.
2. **On Submit:** Validates the entire payload before dispatching the API request.

#### Common Regex Formats:
- **Email:** `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- **Indian 10-Digit Phone:** `/^[6-9]\d{9}$/`

#### 💡 Sample Code: Controlled Form with Field Errors
```jsx
import { useState } from "react";

function ContactVendorForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [errors, setErrors] = useState({});

  // 🔹 Field-Level Validation Logic
  const validateField = (name, value) => {
    let error = "";
    if (name === "name" && !value.trim()) {
      error = "Full Name is required";
    }
    if (name === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      error = "Please enter a valid email address";
    }
    if (name === "phone" && !/^[6-9]\d{9}$/.test(value)) {
      error = "Phone number must be a valid 10-digit number";
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    validateField(name, value); // Validate when user leaves the input field
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate all fields before sending
    if (!form.name || !form.email || !form.phone || Object.values(errors).some(Boolean)) {
      alert("Please fix the errors before submitting");
      return;
    }
    alert("Form submitted successfully! 🎉");
  };

  return (
    <form onSubmit={handleSubmit} className="form-box">
      <div>
        <label>Full Name *</label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          onBlur={handleBlur}
          className={errors.name ? "input-error" : "input-normal"}
        />
        {errors.name && <span className="error-text">{errors.name}</span>}
      </div>

      <div>
        <label>Email *</label>
        <input
          name="email"
          value={form.email}
          onChange={handleChange}
          onBlur={handleBlur}
          className={errors.email ? "input-error" : "input-normal"}
        />
        {errors.email && <span className="error-text">{errors.email}</span>}
      </div>

      <div>
        <label>Phone Number *</label>
        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="10-digit number"
          className={errors.phone ? "input-error" : "input-normal"}
        />
        {errors.phone && <span className="error-text">{errors.phone}</span>}
      </div>

      <button type="submit">Submit Enquiry</button>
    </form>
  );
}
```

---

### 3.3 Interactive UI Micro-interactions (Star Ratings, Dynamic Calculators)
Micro-interactions make your app feel alive and responsive to user actions.

#### 💡 Sample Code: Interactive 5-Star Rating Picker
```jsx
import { useState } from "react";

function StarRatingPicker({ rating, onChange }) {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((starIndex) => (
        <span
          key={starIndex}
          onClick={() => onChange(starIndex)}
          onMouseEnter={() => setHoverRating(starIndex)}
          onMouseLeave={() => setHoverRating(0)}
          className="text-2xl cursor-pointer transition-transform hover:scale-125"
        >
          {starIndex <= (hoverRating || rating) ? "⭐" : "☆"}
        </span>
      ))}
    </div>
  );
}
```

---

### 3.4 Front-End Debugging Techniques (React DevTools, Console, Network Tab)

| Tool | Where to Open | What to Inspect |
| :--- | :--- | :--- |
| **React DevTools: Components** | Browser DevTools $\rightarrow$ *Components* tab | Inspect live Props, State, Hooks, and Component hierarchy |
| **React DevTools: Profiler** | Browser DevTools $\rightarrow$ *Profiler* tab | Identify unnecessary re-renders and slow component trees |
| **Network Tab** | DevTools $\rightarrow$ *Network* $\rightarrow$ *Fetch/XHR* | Inspect HTTP Status (200, 400, 500), Request Payload, and Server JSON Response |
| **Console & Breakpoints** | DevTools $\rightarrow$ *Console* / *Sources* tab | `console.table()`, conditional breakpoints, error stack traces |

#### 💡 Pro Debugging Snippet:
```javascript
// 🔹 1. Clean Structured Table Logging for Arrays / Objects
console.table(vendorsList.map(v => ({ id: v._id, name: v.name, price: v.price })));

// 🔹 2. Triggering Programmatic Breakpoint in Code
debugger; // Browser will pause execution right here when DevTools is open!
```

---

### 3.5 Responsive Layout Design & Mobile QA Checks

To build a flawlessly responsive layout with Tailwind CSS:
1. **Mobile-First Breakpoint Philosophy:** Default styles target mobile devices; use `sm:`, `md:`, `lg:`, `xl:` for larger screens.
2. **Flexible Containers:** Avoid fixed pixel widths (`w-[600px]`); use fluid widths with constraints (`w-full max-w-lg`).
3. **Viewport Overflows:** Always check for accidental horizontal scrollbars caused by oversized fixed-width elements.
4. **Touch Target Size:** Interactive buttons and clickable icons must have at least **$44 \times 44\text{px}$** hit areas on mobile.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        RESPONSIVE GRID LAYOUT                          │
├────────────────────────────────────────────────────────────────────────┤
│  Mobile (<640px)    : 1 Column  (grid-cols-1)                          │
│  Tablet (640-1024px): 2 Columns (sm:grid-cols-2)                       │
│  Desktop (>1024px)  : 3 Columns (lg:grid-cols-3)                       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Real Application Deep Dive: Vivahanam Interactivity & Form Validation

Let's examine how interactivity, validation, and responsiveness are engineered in `VIVAHANAM_ANORG_WEDDING`.

---

### 4.1 Interactive Multi-Category Star Rating & Form Validation (`VendorReviewSection.jsx`)
📍 *File: `src/components/VendorReviewSection.jsx`*

This component showcases:
- Interactive star rating component with hover scaling micro-animations.
- Client-side validation before sending review payloads.
- Character limits and disabled states.

```jsx
import { useState } from "react";

const STAR_COLOR = "#D4426A";
const STAR_EMPTY = "#E5D6D0";

// ============================================================================
// 🔹 CONCEPT 1: INTERACTIVE SVG STAR RATING COMPONENT
// Handles mouseEnter, mouseLeave, and click scaling animations.
// ============================================================================
const Stars = ({ rating, size = 20, interactive = false, onRate }) => (
  <div style={{ display: "inline-flex", gap: 4 }}>
    {[1, 2, 3, 4, 5].map((i) => (
      <svg
        key={i}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        style={{
          cursor: interactive ? "pointer" : "default",
          transition: "transform 0.15s ease",
        }}
        onClick={() => interactive && onRate?.(i)}
        onMouseEnter={(e) => interactive && (e.currentTarget.style.transform = "scale(1.25)")}
        onMouseLeave={(e) => interactive && (e.currentTarget.style.transform = "scale(1)")}
      >
        <path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          fill={i <= rating ? STAR_COLOR : STAR_EMPTY}
        />
      </svg>
    ))}
  </div>
);

export default function VendorReviewSection({ vendorId }) {
  const [form, setForm] = useState({
    overallRating: 0,
    qualityRating: 0,
    valueForMoneyRating: 0,
    title: "",
    reviewText: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Helper to update form fields
  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errorMessage) setErrorMessage(""); // Clear error on edit
  };

  // ==========================================================================
  // 🔹 CONCEPT 2: CLIENT-SIDE SUBMISSION VALIDATION
  // ==========================================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Validate required star ratings
    if (form.overallRating === 0) {
      setErrorMessage("Please select an overall star rating!");
      return;
    }

    // 2. Validate review text length
    if (form.reviewText.trim().length < 10) {
      setErrorMessage("Review must be at least 10 characters long.");
      return;
    }

    setSubmitting(true);
    try {
      // API call to submit review
      const res = await fetch(`/api/vendors/${vendorId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit review");
      alert("Review submitted successfully! 🎉");
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 max-w-2xl mx-auto">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Write a Review</h3>

      {/* Error Alert Box */}
      {errorMessage && (
        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4 border border-red-100">
          ⚠️ {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Overall Rating Picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Overall Experience *
          </label>
          <Stars
            rating={form.overallRating}
            interactive={true}
            onRate={(val) => setField("overallRating", val)}
          />
        </div>

        {/* Review Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Review Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setField("title", e.target.value)}
            placeholder="e.g. Outstanding wedding photography team!"
            className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-[#D4426A]"
          />
        </div>

        {/* Detailed Review Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your Review *</label>
          <textarea
            rows={4}
            value={form.reviewText}
            onChange={(e) => setField("reviewText", e.target.value)}
            placeholder="Share details about your experience..."
            className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-[#D4426A]"
          />
          <div className="text-right text-xs text-gray-400 mt-1">
            {form.reviewText.length} characters
          </div>
        </div>

        {/* Submit Button with Loading State */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#D4426A] text-white py-3 rounded-xl font-semibold hover:bg-[#A8274A] disabled:opacity-50"
        >
          {submitting ? "Submitting Review..." : "Post Review"}
        </button>
      </form>
    </div>
  );
}
```

---

### 4.2 Dynamic Pricing, Coupon Validation & Modal Events (`VendorBookingModal.jsx`)
📍 *File: `src/components/VendorBookingModal.jsx`*

This component handles:
- Backdrop click event propagation (`e.stopPropagation()`).
- Instant client-side validation of booking date, time, and phone numbers.
- Dynamic coupon code validation and instant total amount calculation.

```jsx
import React, { useState } from "react";

export default function VendorBookingModal({ vendorId, vendorName, vendorPrice = 100, onClose, token }) {
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponValid, setCouponValid] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const baseAmount = vendorPrice;
  const finalAmount = Math.max(0, baseAmount - discountAmount);

  // ==========================================================================
  // 🔹 CONCEPT: DYNAMIC COUPON VALIDATION & PRICE RE-CALCULATION
  // ==========================================================================
  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      alert("Please enter a valid coupon code");
      return;
    }
    try {
      const res = await fetch(`/api/coupons/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: couponCode, vendorId }),
      });
      const data = await res.json();
      if (data.success) {
        const discount = (baseAmount * data.data.discountPercentage) / 100;
        setDiscountAmount(discount);
        setCouponValid(true);
        alert(`Coupon Applied! You saved $${discount.toFixed(2)}`);
      } else {
        alert(data.message || "Invalid coupon code");
      }
    } catch (err) {
      alert("Failed to validate coupon");
    }
  };

  // ==========================================================================
  // 🔹 CONCEPT: PRE-SUBMIT VALIDATION CHECK
  // ==========================================================================
  const handleBookingSubmit = () => {
    if (!bookingDate) return alert("Please select a booking date");
    if (!bookingTime) return alert("Please select a booking time");
    if (!/^[6-9]\d{9}$/.test(customerPhone)) return alert("Please enter a valid 10-digit phone number");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) return alert("Please enter a valid email address");

    setSubmitting(true);
    // Proceed to payment gateway or API booking...
  };

  return (
    // 🔹 1. MODAL BACKDROP (Clicking backdrop calls onClose)
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      {/* 🔹 2. MODAL DIALOG (e.stopPropagation prevents clicks inside from closing modal) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-lg rounded-3xl p-6 max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <div className="flex justify-between items-center pb-4 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 font-serif">Book {vendorName}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
        </div>

        {/* Interactive Form Fields */}
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Event Date *</label>
              <input
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full p-2.5 border rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Event Time *</label>
              <input
                type="time"
                value={bookingTime}
                onChange={(e) => setBookingTime(e.target.value)}
                className="w-full p-2.5 border rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number *</label>
            <input
              type="tel"
              placeholder="10-digit mobile number"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full p-2.5 border rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address *</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full p-2.5 border rounded-xl text-sm"
            />
          </div>

          {/* Coupon Code Section */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Promo / Coupon Code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              className="flex-1 p-2.5 border rounded-xl text-sm uppercase"
            />
            <button
              onClick={applyCoupon}
              className="bg-amber-600 text-white px-4 rounded-xl text-sm font-semibold hover:bg-amber-700"
            >
              Apply
            </button>
          </div>

          {/* Price Summary Breakdown */}
          <div className="bg-gray-50 p-4 rounded-2xl space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Base Price:</span>
              <span>${baseAmount.toFixed(2)}</span>
            </div>
            {couponValid && (
              <div className="flex justify-between text-green-600 font-medium">
                <span>Coupon Discount:</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-900 font-bold text-base pt-2 border-t">
              <span>Total to Pay:</span>
              <span>${finalAmount.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleBookingSubmit}
            disabled={submitting}
            className="w-full bg-[#D4426A] text-white py-3.5 rounded-xl font-semibold shadow hover:bg-[#A8274A]"
          >
            Confirm & Pay ${finalAmount.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

### 4.3 Production Debugging & Responsive QA Checklist for Vivahanam

Before pushing any feature to Git in `VIVAHANAM_ANORG_WEDDING`, juniors should run through this 5-step checklist:

| Step | Action | How to Verify |
| :---: | :--- | :--- |
| **1** | **Mobile Emulation** | Press `Ctrl + Shift + M` in Chrome DevTools. Test on iPhone SE ($375\text{px}$) and iPad ($768\text{px}$). |
| **2** | **No Horizontal Overflow** | Ensure horizontal scrollbar never appears (`body { overflow-x: hidden }`). |
| **3** | **Touch Target Size** | All clickable icons and buttons must be at least $44\text{px} \times 44\text{px}$. |
| **4** | **Network Error Inspection** | Open DevTools $\rightarrow$ Network tab $\rightarrow$ Throttling: *Slow 3G*. Verify loading indicators appear. |
| **5** | **Console Hygiene** | Check console for missing `key` warnings or unhandled Promise rejections. |

---

## 5. Summary Matrix: Event Handling, Validation & Debugging

| Concept | Technique | Vivahanam Implementation |
| :--- | :--- | :--- |
| **Event Propagation** | `e.stopPropagation()` | Prevents modal backdrop click from dismissing dialog |
| **Form Prevention** | `e.preventDefault()` | Stops browser reload on review and enquiry submissions |
| **Real-Time Validation**| `onChange` + Regex | Phone number and email validation in booking modal |
| **Interactive UI** | `onMouseEnter` / `scale` | SVG Star rating picker in `VendorReviewSection` |
| **Responsive Containers**| `max-h-[90vh] overflow-y-auto`| Modals adapt cleanly across small smartphone screens |
| **Front-End Debugging**| React DevTools + Network Tab| Inspecting JSON payloads and component re-renders |

---

## 6. Junior Developer Gotchas & Best Practices

### ❌ Gotcha 1: Overwriting State on Input Change
```javascript
// ❌ WRONG: Wipes out other form keys!
const handleChange = (e) => setForm({ name: e.target.value });

// ✅ CORRECT: Spread previous state
const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
```

### ❌ Gotcha 2: Validating Only on the Client Side
```javascript
// ⚠️ IMPORTANT: Client-side validation is for User Experience (UX),
// but Backend validation is for Security. Always validate on BOTH sides!
```

### ❌ Gotcha 3: Fixed Heights on Text Containers
```jsx
// ❌ BAD: Text overflows on mobile when translated or longer
<div className="h-10">This long wedding description gets clipped!</div>

// ✅ GOOD: Use min-height or padding
<div className="min-h-[40px] p-2">Flexible text container</div>
```

---

## 7. Week 11 Hands-On Practice Challenge

### 🎯 Task 1: Add Real-Time Inline Validation to `EnquiryModal.jsx`
1. Open `src/components/EnquiryModal.jsx`.
2. Add an `errors` state object: `const [errors, setErrors] = useState({});`.
3. Validate that the phone number is a valid 10-digit number whenever the user leaves the phone input (`onBlur`).
4. If invalid, display a red helper message `<p className="text-red-500 text-xs">Please enter a valid 10-digit number</p>` directly below the input.

### 🎯 Task 2: Responsiveness & Modal Viewport Audit
1. Open the browser DevTools mobile emulator.
2. Select **iPhone SE (375px width)**.
3. Open `VendorBookingModal.jsx` or `EnquiryModal.jsx`.
4. Verify that the form does not get cut off and scrolls vertically smoothly via `max-h-[90vh] overflow-y-auto`.

---

*Happy Coding! Reach out to your team lead or senior mentors if you encounter any debugging roadblocks.* 🚀
