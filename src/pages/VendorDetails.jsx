import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_KEY || "http://localhost:8000/api";

const VendorDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVendor = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/vendors/${id}`);
        const data = await res.json();
        if (data.success) {
          setVendor(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch vendor details", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVendor();
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div className="animate-pulse" style={{ color: "#D4426A", fontSize: "1.2rem", fontWeight: 500 }}>
          Loading vendor details...
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div style={{ textAlign: "center", padding: "80px 24px" }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2rem", color: "#2C2420" }}>Vendor Not Found</h2>
        <p style={{ color: "#7A6E6A", margin: "16px 0 32px" }}>The vendor you're looking for might have been removed or the link is incorrect.</p>
        <button 
          onClick={() => navigate("/wedding-shop/vendors")}
          style={{ 
            background: "#D4426A", color: "#fff", border: "none", 
            padding: "12px 24px", borderRadius: 50, cursor: "pointer",
            fontWeight: 600
          }}
        >
          Back to Vendors
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: "#FDF8F3", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
      {/* ── HERO BANNER ── */}
      <div style={{ height: "45vh", position: "relative", overflow: "hidden" }}>
        <img 
          src={vendor.image || (vendor.gallery && vendor.gallery[0]) || "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1600&auto=format&fit=crop"} 
          alt={vendor.name} 
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div style={{ 
          position: "absolute", inset: 0, 
          background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)" 
        }} />
        
        <div style={{ 
          position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)",
          width: "min(1100px, 90%)", color: "#fff"
        }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
            <div>
              <span style={{ 
                background: "#D4426A", color: "#fff", padding: "4px 12px", 
                borderRadius: 4, fontSize: 12, fontWeight: 600, textTransform: "uppercase" 
              }}>
                {vendor.categories?.[0] || "Vendor"}
              </span>
              <h1 style={{ 
                fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2.5rem, 6vw, 3.5rem)", 
                margin: "12px 0 8px", lineHeight: 1.1 
              }}>
                {vendor.name}
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 15, opacity: 0.9 }}>
                <span>📍 {vendor.location?.city}, {vendor.location?.state}</span>
                {vendor.rating > 0 && <span>⭐ {vendor.rating} Rating</span>}
              </div>
            </div>
            
            <div style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", padding: "20px 32px", borderRadius: 16, border: "1px solid rgba(255,255,255,0.2)" }}>
              <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 4 }}>Starting Price</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{vendor.price ? `₹${vendor.price.toLocaleString()}` : "On Request"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "60px 24px", display: "grid", gridTemplateColumns: "1fr 350px", gap: 40 }}>
        
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          {/* About Section */}
          <section>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, color: "#2C2420", marginBottom: 20 }}>About {vendor.name}</h2>
            <p style={{ color: "#5C524F", lineHeight: 1.8, fontSize: 16, whiteSpace: "pre-line" }}>
              {vendor.description || "No description provided."}
            </p>
          </section>

          {/* Gallery Section */}
          {vendor.gallery && vendor.gallery.length > 0 && (
            <section>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, color: "#2C2420", marginBottom: 20 }}>Portfolio Gallery</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
                {vendor.gallery.map((img, i) => (
                  <div key={i} style={{ borderRadius: 12, overflow: "hidden", height: 200, cursor: "pointer" }}>
                    <img src={img} alt={`Gallery ${i}`} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s" }} onMouseEnter={e => e.target.style.transform = "scale(1.1)"} onMouseLeave={e => e.target.style.transform = "scale(1)"} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column (Sticky Sidebar) */}
        <aside style={{ position: "sticky", top: 120, height: "fit-content" }}>
          <div style={{ background: "#fff", borderRadius: 24, padding: 32, border: "1px solid #EDE0D8", boxShadow: "0 12px 32px rgba(44,36,32,0.06)" }}>
            <h3 style={{ fontSize: 20, color: "#2C2420", marginBottom: 24, fontWeight: 600 }}>Interested in this vendor?</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button style={{ 
                background: "#D4426A", color: "#fff", border: "none", 
                padding: "16px", borderRadius: 50, fontSize: 15, fontWeight: 600,
                cursor: "pointer", transition: "all 0.2s"
              }}>
                Book Appointment
              </button>
              <button style={{ 
                background: "#fff", color: "#D4426A", border: "1.5px solid #D4426A", 
                padding: "16px", borderRadius: 50, fontSize: 15, fontWeight: 600,
                cursor: "pointer", transition: "all 0.2s"
              }}>
                Send Enquiry
              </button>
            </div>

            <div style={{ marginTop: 32, paddingTop: 32, borderTop: "1px solid #F5E9D0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 18 }}>📞</span>
                <div>
                  <div style={{ fontSize: 12, color: "#7A6E6A" }}>Phone</div>
                  <div style={{ fontSize: 15, color: "#2C2420" }}>{vendor.phone || "Not public"}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 18 }}>✉️</span>
                <div>
                  <div style={{ fontSize: 12, color: "#7A6E6A" }}>Email</div>
                  <div style={{ fontSize: 15, color: "#2C2420" }}>{vendor.email || "Not public"}</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 24, padding: "0 20px" }}>
            <p style={{ fontSize: 13, color: "#7A6E6A", textAlign: "center", lineHeight: 1.5 }}>
              Vivahanam guarantees verified vendors and secure booking experience.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default VendorDetails;
