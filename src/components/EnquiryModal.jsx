import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_KEY || "http://localhost:8000/api";
const EVENT_TYPES = ["wedding","engagement","reception","pre-wedding","birthday","anniversary","other"];
const GUEST_OPTIONS = ["< 50","50-100","100-200","200-500","500-1000","1000+"];

export default function EnquiryModal({ vendor, onClose }) {
  const token = localStorage.getItem("vivahanamToken");
  const user = (() => { try { return JSON.parse(localStorage.getItem("vivahanamUser")||"{}"); } catch { return {}; } })();
  const [form, setForm] = useState({ name: user.name||"", phone: "", email: user.email||"", eventDate: "", eventType: "", guestCount: "", message: "", budget: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!token) return setError("Please login to send enquiry");
    if (!form.name.trim()) return setError("Name is required");
    if (!form.phone.trim()) return setError("Phone number is required");
    setSubmitting(true); setError("");
    try {
      const res = await fetch(`${API_BASE}/vendors/${vendor._id}/enquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setDone(true);
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  const inputStyle = { width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #EDE0D8", fontSize: 14, color: "#2C2420", background: "#FDF8F3", boxSizing: "border-box", fontFamily: "inherit" };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", width: "100%", maxWidth: 520, borderRadius: 24, overflow: "hidden", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #D4426A, #e8637e)", padding: "24px 28px", color: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 12, opacity: .8, marginBottom: 2 }}>Send Enquiry to</div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Cormorant Garamond',serif" }}>{vendor.name}</div>
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,.2)", border: "none", color: "#fff", width: 36, height: 36, borderRadius: "50%", fontSize: 20, cursor: "pointer" }}>✕</button>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, opacity: .8, display: "flex", alignItems: "center", gap: 6 }}>🔥 High demand — 12 enquiries this week</div>
        </div>

        {done ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <h3 style={{ fontSize: 22, color: "#2C2420", marginBottom: 8 }}>Enquiry Sent!</h3>
            <p style={{ color: "#7A6E6A", fontSize: 14, marginBottom: 24 }}>The vendor will contact you shortly. You can track your enquiry in "My Enquiries".</p>
            <button onClick={onClose} style={{ background: "#D4426A", color: "#fff", border: "none", padding: "12px 32px", borderRadius: 50, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Done</button>
          </div>
        ) : (
          <div style={{ padding: 28, overflowY: "auto", flex: 1 }}>
            {!token && <div style={{ background: "#FDE8EE", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#D4426A", fontWeight: 500 }}>⚠️ Please <a href="/login" style={{ color: "#D4426A", fontWeight: 700 }}>login</a> to send an enquiry</div>}

            {error && <div style={{ background: "#FEE2E2", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#991B1B" }}>{error}</div>}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: "#7A6E6A", display: "block", marginBottom: 4 }}>Full Name *</label>
                <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Your name" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#7A6E6A", display: "block", marginBottom: 4 }}>Phone Number *</label>
                <input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+91 XXXXX XXXXX" style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: "#7A6E6A", display: "block", marginBottom: 4 }}>Email</label>
              <input value={form.email} onChange={e => set("email", e.target.value)} placeholder="your@email.com" style={inputStyle} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: "#7A6E6A", display: "block", marginBottom: 4 }}>Event Date</label>
                <input type="date" value={form.eventDate} onChange={e => set("eventDate", e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#7A6E6A", display: "block", marginBottom: 4 }}>Event Type</label>
                <select value={form.eventType} onChange={e => set("eventType", e.target.value)} style={inputStyle}>
                  <option value="">Select...</option>
                  {EVENT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: "#7A6E6A", display: "block", marginBottom: 4 }}>No. of Guests</label>
                <select value={form.guestCount} onChange={e => set("guestCount", e.target.value)} style={inputStyle}>
                  <option value="">Select...</option>
                  {GUEST_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#7A6E6A", display: "block", marginBottom: 4 }}>Budget</label>
                <input value={form.budget} onChange={e => set("budget", e.target.value)} placeholder="e.g. ₹2-5 Lakh" style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: "#7A6E6A", display: "block", marginBottom: 4 }}>Message</label>
              <textarea value={form.message} onChange={e => set("message", e.target.value)} placeholder="Tell the vendor about your requirements..." rows={3} maxLength={1000} style={{ ...inputStyle, resize: "vertical" }} />
            </div>

            <button onClick={handleSubmit} disabled={submitting || !token} style={{
              width: "100%", background: "#D4426A", color: "#fff", border: "none", padding: "15px",
              borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting || !token ? .6 : 1, transition: "all .2s",
            }}>
              {submitting ? "Sending..." : "Send Enquiry"}
            </button>

            <p style={{ textAlign: "center", fontSize: 11, color: "#B5A9A3", marginTop: 12 }}>Your contact details will be shared with the vendor</p>
          </div>
        )}
      </div>
    </div>
  );
}
