import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_KEY || "http://localhost:8000/api";

export default function MyShortlist() {
  const navigate = useNavigate();
  const token = localStorage.getItem("vivahanamToken");
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchList = () => {
    if (!token) return;
    fetch(`${API_BASE}/vendors/my-shortlist`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.success) setVendors(d.data); })
      .catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchList(); }, []);

  const handleRemove = async (id) => {
    await fetch(`${API_BASE}/vendors/shortlist/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    fetchList();
  };

  if (!token) return (
    <div style={{ textAlign: "center", padding: "100px 24px", background: "#FDF8F3", minHeight: "80vh", fontFamily: "'DM Sans',sans-serif" }}>
      <h2 style={{ fontSize: 28, color: "#2C2420" }}>Please Login</h2>
      <p style={{ color: "#7A6E6A" }}>You need to be logged in to view your shortlist.</p>
    </div>
  );

  return (
    <div style={{ background: "#FDF8F3", minHeight: "100vh", fontFamily: "'DM Sans',sans-serif", padding: "40px 24px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 36, color: "#2C2420", marginBottom: 8 }}>My Shortlist</h1>
        <p style={{ color: "#7A6E6A", fontSize: 14, marginBottom: 32 }}>Your saved vendors — compare and decide</p>

        {loading ? <div style={{ textAlign: "center", padding: 60, color: "#7A6E6A" }}>Loading...</div> :
        vendors.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, background: "#fff", borderRadius: 16, border: "1px solid #EDE0D8" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>❤️</div>
            <h3 style={{ fontSize: 20, color: "#2C2420" }}>No Saved Vendors</h3>
            <p style={{ color: "#7A6E6A", fontSize: 14, marginBottom: 24 }}>Click the heart icon on any vendor to save them here!</p>
            <button onClick={() => navigate("/wedding-shop/vendors")} style={{ background: "#D4426A", color: "#fff", border: "none", padding: "12px 28px", borderRadius: 50, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Browse Vendors</button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {vendors.map(v => (
              <div key={v._id} style={{ background: "#fff", borderRadius: 16, border: "1px solid #EDE0D8", overflow: "hidden" }}>
                <div onClick={() => navigate(`/wedding-shop/vendors/${v._id}`)} style={{ height: 180, overflow: "hidden", cursor: "pointer", position: "relative" }}>
                  <img src={v.image?.startsWith("http") ? v.image : `${API_BASE.replace("/api","")}${v.image}`} alt={v.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => e.target.style.display = "none"} />
                  <button onClick={e => { e.stopPropagation(); handleRemove(v.shortlistId); }}
                    style={{ position: "absolute", top: 12, right: 12, background: "rgba(255,255,255,.9)", border: "none", width: 34, height: 34, borderRadius: "50%", cursor: "pointer", fontSize: 16 }}>❤️</button>
                </div>
                <div style={{ padding: 20 }}>
                  <h3 onClick={() => navigate(`/wedding-shop/vendors/${v._id}`)} style={{ fontSize: 17, fontWeight: 700, color: "#2C2420", margin: "0 0 6px", cursor: "pointer" }}>{v.name}</h3>
                  <div style={{ fontSize: 13, color: "#7A6E6A", marginBottom: 8 }}>
                    📍 {v.location?.city || "N/A"}
                    {v.categories?.[0] && <span> · <span style={{ color: "#D4426A", textTransform: "capitalize" }}>{v.categories[0]}</span></span>}
                  </div>
                  <div style={{ fontSize: 11, color: "#B5A9A3" }}>Saved {new Date(v.shortlistedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
