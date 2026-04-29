import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_KEY || "http://localhost:8000/api";

const STATUS = {
  new: { label: "Sent", bg: "#DBEAFE", color: "#1E40AF" },
  viewed: { label: "Viewed", bg: "#FEF3C7", color: "#92400E" },
  responded: { label: "Responded", bg: "#D1FAE5", color: "#065F46" },
  booked: { label: "Booked", bg: "#EDE9FE", color: "#5B21B6" },
  closed: { label: "Closed", bg: "#F3F4F6", color: "#6B7280" },
};

export default function MyEnquiries() {
  const navigate = useNavigate();
  const token = localStorage.getItem("vivahanamToken");
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/vendors/my-enquiries`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.success) setEnquiries(d.data); })
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (!token) return (
    <div style={{ textAlign: "center", padding: "100px 24px", background: "#FDF8F3", minHeight: "80vh", fontFamily: "'DM Sans',sans-serif" }}>
      <h2 style={{ fontSize: 28, color: "#2C2420" }}>Please Login</h2>
      <p style={{ color: "#7A6E6A" }}>You need to be logged in to view your enquiries.</p>
    </div>
  );

  return (
    <div style={{ background: "#FDF8F3", minHeight: "100vh", fontFamily: "'DM Sans',sans-serif", padding: "40px 24px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 36, color: "#2C2420", marginBottom: 8 }}>My Enquiries</h1>
        <p style={{ color: "#7A6E6A", fontSize: 14, marginBottom: 32 }}>Track all your vendor enquiries in one place</p>

        {loading ? <div style={{ textAlign: "center", padding: 60, color: "#7A6E6A" }}>Loading...</div> :
        enquiries.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, background: "#fff", borderRadius: 16, border: "1px solid #EDE0D8" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📩</div>
            <h3 style={{ fontSize: 20, color: "#2C2420" }}>No Enquiries Yet</h3>
            <p style={{ color: "#7A6E6A", fontSize: 14, marginBottom: 24 }}>Start exploring vendors and send your first enquiry!</p>
            <button onClick={() => navigate("/wedding-shop/vendors")} style={{ background: "#D4426A", color: "#fff", border: "none", padding: "12px 28px", borderRadius: 50, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Browse Vendors</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {enquiries.map(e => {
              const v = e.vendorId || {};
              const s = STATUS[e.status] || STATUS.new;
              return (
                <div key={e._id} style={{ background: "#fff", borderRadius: 16, border: "1px solid #EDE0D8", padding: 24, display: "flex", gap: 20, alignItems: "flex-start" }}>
                  <div style={{ width: 80, height: 80, borderRadius: 12, overflow: "hidden", flexShrink: 0, background: "#EDE0D8" }}>
                    {v.image && <img src={v.image?.startsWith("http") ? v.image : `${API_BASE.replace("/api","")}${v.image}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                      <h3 onClick={() => navigate(`/wedding-shop/vendors/${v._id}`)} style={{ fontSize: 18, fontWeight: 700, color: "#2C2420", margin: 0, cursor: "pointer" }}>{v.name || "Vendor"}</h3>
                      <span style={{ background: s.bg, color: s.color, padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{s.label}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "#7A6E6A", marginBottom: 8 }}>
                      {e.eventType && <span style={{ textTransform: "capitalize" }}>{e.eventType} · </span>}
                      {e.eventDate && <span>{new Date(e.eventDate).toLocaleDateString("en-IN")} · </span>}
                      {e.guestCount && <span>{e.guestCount} guests</span>}
                    </div>
                    {e.message && <p style={{ fontSize: 14, color: "#5C524F", margin: "0 0 8px", lineHeight: 1.5 }}>{e.message}</p>}
                    {e.vendorResponse && (
                      <div style={{ background: "#FDF8F3", borderRadius: 10, padding: "10px 14px", borderLeft: "3px solid #D4426A", fontSize: 13, color: "#5C524F" }}>
                        <strong style={{ color: "#D4426A" }}>Vendor Reply:</strong> {e.vendorResponse}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: "#B5A9A3", marginTop: 8 }}>Sent {new Date(e.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
