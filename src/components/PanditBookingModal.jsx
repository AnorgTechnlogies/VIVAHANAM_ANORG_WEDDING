import React, { useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || "test"; // Provide fallback

export default function PanditBookingModal({ vendorId, vendorName, vendorPrice = 100, onClose, token }) {
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [baseAmount, setBaseAmount] = useState(vendorPrice);
  const [couponCode, setCouponCode] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(vendorPrice);
  const [couponValid, setCouponValid] = useState(false);
  
  const [loadingMsg, setLoadingMsg] = useState("");
  const [success, setSuccess] = useState(false);

  const applyCoupon = async () => {
    if (!couponCode) return;
    try {
      const res = await fetch(`${API_BASE.replace('/api', '')}/api/coupons/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: couponCode, vendorId })
      });
      const data = await res.json();
      if (data.success) {
        let disc = (baseAmount * data.data.discountPercentage) / 100;
        if (data.data.maxDiscountAmount && disc > data.data.maxDiscountAmount) {
          disc = data.data.maxDiscountAmount;
        }
        setDiscountAmount(disc);
        setFinalAmount(Math.max(0, baseAmount - disc));
        setCouponValid(true);
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Failed to validate coupon");
    }
  };

  const handleFreeBooking = async () => {
    if (!bookingDate || !bookingTime || !customerPhone || !customerEmail) {
      alert("Please fill all required fields");
      return;
    }
    
    setLoadingMsg("Processing free booking...");
    try {
      const res = await fetch(`${API_BASE.replace('/api', '')}/api/book/create-paypal-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ vendorId, bookingDate, bookingTime, baseAmount, couponCode: couponValid ? couponCode : null, customerPhone, customerEmail })
      });
      const data = await res.json();
      if (data.success && data.bypassedGateway) {
        setSuccess(true);
      } else {
        alert(data.message || "Failed to process free booking");
      }
    } catch (err) {
      alert("Error initializing free booking");
    } finally {
      setLoadingMsg("");
    }
  };

  const createOrder = async () => {
    if (!bookingDate || !bookingTime || !customerPhone || !customerEmail) {
      alert("Please fill all required fields");
      return null;
    }
    
    try {
      const res = await fetch(`${API_BASE.replace('/api', '')}/api/book/create-paypal-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ vendorId, bookingDate, bookingTime, baseAmount, couponCode: couponValid ? couponCode : null, customerPhone, customerEmail })
      });
      const data = await res.json();
      if (data.success) {
        return data.orderId;
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Error initializing payment");
    }
    return null;
  };

  const onApprove = async (data, actions) => {
    setLoadingMsg("Capturing payment...");
    try {
      const res = await fetch(`${API_BASE.replace('/api', '')}/api/book/capture-paypal-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ paypalOrderId: data.orderID })
      });
      const resData = await res.json();
      if (resData.success) {
        setSuccess(true);
      } else {
        alert(resData.message);
      }
    } catch (err) {
      alert("Payment capture failed");
    } finally {
      setLoadingMsg("");
    }
  };

  if (success) {
    return (
      <div style={overlayStyle}>
        <div style={modalStyle}>
          <h2 style={{ color: "#16a34a", fontSize: 24, fontWeight: "bold" }}>Booking Confirmed!</h2>
          <p style={{ margin: "16px 0" }}>Your booking with {vendorName} has been successfully paid and confirmed.</p>
          <button onClick={onClose} style={btnStyle}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 20, fontWeight: "bold" }}>Book {vendorName}</h2>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 20 }}>×</button>
        </div>
        
        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={labelStyle}>Date *</label>
            <input type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Time *</label>
            <input type="time" value={bookingTime} onChange={e => setBookingTime(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Customer Phone *</label>
            <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} style={inputStyle} placeholder="Your phone number" />
          </div>
          <div>
            <label style={labelStyle}>Customer Email *</label>
            <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} style={inputStyle} placeholder="Your email address" />
          </div>
          <div>
            <label style={labelStyle}>Booking Amount ($)</label>
            <input type="number" value={baseAmount} readOnly style={{ ...inputStyle, background: "#f3f4f6", cursor: "not-allowed" }} />
          </div>
          
          <div style={{ display: "flex", gap: 8 }}>
            <input type="text" placeholder="Coupon Code" value={couponCode} onChange={e => setCouponCode(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
            <button onClick={applyCoupon} style={applyBtnStyle}>Apply</button>
          </div>
          
          {couponValid && (
            <div style={{ color: "#16a34a", fontSize: 13 }}>Coupon applied! Discount: ${discountAmount.toFixed(2)}</div>
          )}

          <div style={{ fontWeight: "bold", fontSize: 16, marginTop: 10, textAlign: "right" }}>
            Total to Pay: ${finalAmount.toFixed(2)}
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          {loadingMsg ? (
            <div style={{ textAlign: "center", color: "#666" }}>{loadingMsg}</div>
          ) : (
            <PayPalScriptProvider options={{ "client-id": PAYPAL_CLIENT_ID }}>
              {bookingDate && bookingTime ? (
                finalAmount === 0 ? (
                  <button onClick={handleFreeBooking} style={btnStyle}>Book for Free</button>
                ) : (
                  <PayPalButtons createOrder={createOrder} onApprove={onApprove} />
                )
              ) : (
                <div style={{ textAlign: "center", color: "#d97706", fontSize: 14 }}>Please select date and time to proceed to payment.</div>
              )}
            </PayPalScriptProvider>
          )}
        </div>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
  background: "rgba(0,0,0,0.5)", zIndex: 9999,
  display: "flex", alignItems: "center", justifyContent: "center"
};
const modalStyle = {
  background: "#fff", width: "90%", maxWidth: 450,
  borderRadius: 12, padding: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.15)"
};
const labelStyle = { display: "block", fontSize: 13, color: "#666", marginBottom: 4 };
const inputStyle = { width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc", boxSizing: "border-box" };
const applyBtnStyle = { background: "#1f2937", color: "#fff", border: "none", borderRadius: 6, padding: "0 16px", cursor: "pointer" };
const btnStyle = { background: "#D4426A", color: "#fff", border: "none", padding: "10px 24px", borderRadius: 8, cursor: "pointer", marginTop: 16, width: "100%" };
