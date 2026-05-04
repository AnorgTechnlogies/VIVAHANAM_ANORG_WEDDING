import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import VendorReviewSection from "../components/VendorReviewSection";
import EnquiryModal from "../components/EnquiryModal";
import AuthPage from "./SignUp";

const API_BASE = import.meta.env.VITE_API_KEY || "http://localhost:8000/api";
const ROOT = API_BASE.replace(/\/api.*$/, "");

const img = (src) => {
  if (!src) return null;
  if (src.startsWith("http")) return src;
  return `${ROOT}${src}`;
};

const FALLBACK = "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1600&auto=format&fit=crop";
const TABS = ["about", "photos", "reviews"];

/* ═══════════════════ MAIN COMPONENT ═══════════════════ */
const VendorDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("about");
  const [stickyVisible, setStickyVisible] = useState(false);
  const [lightbox, setLightbox] = useState({ open: false, idx: 0 });
  const [shortlisted, setShortlisted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [contactRevealed, setContactRevealed] = useState(false);
  const [revealedContact, setRevealedContact] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const token = localStorage.getItem("vivahanamToken");
  const isLoggedIn = !!token;

  const sectionRefs = { about: useRef(), photos: useRef(), reviews: useRef() };
  const galleryEndRef = useRef();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/vendors/${id}`);
        const d = await res.json();
        if (d.success) setVendor(d.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [id]);

  /* check shortlist status */
  useEffect(() => {
    if (!isLoggedIn || !id) return;
    fetch(`${API_BASE}/vendors/${id}/shortlist/check`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.success) setShortlisted(d.data.shortlisted); }).catch(() => {});
  }, [id, isLoggedIn]);

  /* sticky tab observer */
  useEffect(() => {
    if (!galleryEndRef.current) return;
    const obs = new IntersectionObserver(([e]) => setStickyVisible(!e.isIntersecting), { threshold: 0 });
    obs.observe(galleryEndRef.current);
    return () => obs.disconnect();
  }, [vendor]);

  const scrollTo = (key) => {
    setActiveTab(key);
    sectionRefs[key]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleShare = async () => {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { /* ignore */ }
  };

  const handleAuthSuccess = () => {
    setShowAuth(false);
    if (pendingAction === "enquiry") {
      setShowEnquiry(true);
    } else if (pendingAction === "contact") {
      handleViewContact();
    } else if (pendingAction === "shortlist") {
      handleShortlist();
    }
    setPendingAction(null);
  };

  const handleShortlist = async () => {
    const currentToken = localStorage.getItem("vivahanamToken");
    if (!currentToken) {
      setPendingAction("shortlist");
      setShowAuth(true);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/vendors/${id}/shortlist`, { method: "POST", headers: { Authorization: `Bearer ${currentToken}` } });
      const d = await res.json();
      if (d.success) setShortlisted(d.data.shortlisted);
    } catch { /* ignore */ }
  };

  const handleViewContact = async () => {
    const currentToken = localStorage.getItem("vivahanamToken");
    if (!currentToken) {
      setPendingAction("contact");
      setShowAuth(true);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/vendors/${id}/contact`, { headers: { Authorization: `Bearer ${currentToken}` } });
      const d = await res.json();
      if (d.success) { setRevealedContact(d.data); setContactRevealed(true); }
    } catch { /* ignore */ }
  };

  /* ── loading / not found ── */
  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", background: "#FDF8F3" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 48, height: 48, border: "3px solid #F5E9D0", borderTopColor: "#D4426A", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto 16px" }} />
        <span style={{ color: "#7A6E6A", fontSize: 15 }}>Loading vendor details...</span>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!vendor) return (
    <div style={{ textAlign: "center", padding: "100px 24px", background: "#FDF8F3", minHeight: "80vh" }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
      <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, color: "#2C2420" }}>Vendor Not Found</h2>
      <p style={{ color: "#7A6E6A", margin: "12px 0 32px" }}>The vendor you're looking for might have been removed.</p>
      <button onClick={() => navigate("/wedding-shop/vendors")} style={{ background: "#D4426A", color: "#fff", border: "none", padding: "14px 32px", borderRadius: 50, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
        Back to Vendors
      </button>
    </div>
  );

  const allImages = [...(vendor.gallery || [])];
  if (vendor.image && !allImages.includes(vendor.image)) allImages.unshift(vendor.image);
  const heroImg = img(allImages[0]) || FALLBACK;
  const gridImgs = allImages.slice(1, 5);
  const extraCount = Math.max(0, allImages.length - 5);
  const data = vendor.additionalData || {};
  const category = vendor.categories?.[0] || "Vendor";
  const city = vendor.location?.city || "";
  const state = vendor.location?.state || "";

  return (
    <div style={{ background: "#FDF8F3", minHeight: "100vh", fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .vd-gallery-cell:hover img{transform:scale(1.06)}
        .vd-tab:hover{color:#D4426A!important}
        .vd-sidebar-btn:hover{opacity:.88;transform:translateY(-1px)}
      `}</style>

      {/* ══════ BREADCRUMB ══════ */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 24px" }}>
        <nav style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#7A6E6A", flexWrap: "wrap" }}>
          <span style={{ cursor: "pointer", color: "#D4426A" }} onClick={() => navigate("/")}>Home</span>
          <span>›</span>
          <span style={{ cursor: "pointer", color: "#D4426A" }} onClick={() => navigate("/wedding-shop/vendors")}>{category}s</span>
          {city && <><span>›</span><span style={{ cursor: "pointer", color: "#D4426A" }} onClick={() => navigate(`/wedding-shop/vendors?location=${city}`)}>{city}</span></>}
          <span>›</span>
          <span style={{ color: "#2C2420", fontWeight: 500 }}>{vendor.name}</span>
        </nav>
      </div>

      {/* ══════ GALLERY GRID (WedMeGood style) ══════ */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 6, borderRadius: 16, overflow: "hidden", height: 420 }}>
          {/* Main large image */}
          <div className="vd-gallery-cell" onClick={() => setLightbox({ open: true, idx: 0 })}
            style={{ cursor: "pointer", overflow: "hidden", position: "relative", gridRow: "1 / 1" }}>
            <img src={heroImg} alt={vendor.name} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .4s" }} />
          </div>
          {/* 2×2 small grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 6 }}>
            {[0,1,2,3].map(i => {
              const src = gridImgs[i] ? img(gridImgs[i]) : null;
              const isLast = i === 3 && extraCount > 0;
              return (
                <div key={i} className="vd-gallery-cell" onClick={() => src && setLightbox({ open: true, idx: i + 1 })}
                  style={{ cursor: src ? "pointer" : "default", overflow: "hidden", position: "relative", background: "#EDE0D8" }}>
                  {src ? (
                    <>
                      <img src={src} alt={`Gallery ${i}`} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .4s" }} />
                      {isLast && (
                        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20, fontWeight: 700 }}>
                          +{extraCount} more
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#B5A9A3", fontSize: 13 }}>No image</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div ref={galleryEndRef} />
      </div>

      {/* ══════ VENDOR IDENTITY + ACTION BAR ══════ */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 36, fontWeight: 700, color: "#2C2420", margin: "0 0 6px", lineHeight: 1.1 }}>
              {vendor.name}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, color: "#5C524F", flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7A6E6A" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {[city, state].filter(Boolean).join(", ") || "Location N/A"}
              </span>
              <span style={{ color: "#D4426A", fontWeight: 600, textTransform: "capitalize" }}>{category}</span>
            </div>
          </div>
          {/* Action buttons */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button onClick={handleShortlist} style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px",
              borderRadius: 8, border: "1px solid #EDE0D8", background: shortlisted ? "#FDE8EE" : "#fff",
              fontSize: 13, fontWeight: 600, color: shortlisted ? "#D4426A" : "#2C2420", cursor: "pointer",
            }}>
              {shortlisted ? "❤️" : "🤍"} Shortlist
            </button>
            <button onClick={() => scrollTo("reviews")} style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px",
              borderRadius: 8, border: "1px solid #EDE0D8", background: "#fff",
              fontSize: 13, fontWeight: 600, color: "#2C2420", cursor: "pointer",
            }}>
              ✍️ Write a Review
            </button>
            <button onClick={handleShare} style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px",
              borderRadius: 8, border: "1px solid #EDE0D8", background: "#fff",
              fontSize: 13, fontWeight: 600, color: "#2C2420", cursor: "pointer",
            }}>
              {copied ? "✓ Copied!" : "🔗 Share"}
            </button>
          </div>
        </div>
      </div>

    

      {/* ══════ TWO-COLUMN LAYOUT (65/35) ══════ */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 80px", display: "grid", gridTemplateColumns: "1fr 380px", gap: 40, alignItems: "start" }}>

        {/* ── LEFT COLUMN ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

          {/* ── PRICING ── */}
          <section ref={sectionRefs.about} style={{ background: "#fff", borderRadius: 16, border: "1px solid #EDE0D8", padding: 28, marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: "#7A6E6A", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Starting Price</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#2C2420", fontFamily: "'Cormorant Garamond',serif" }}>
                  {vendor.price ? `₹${vendor.price.toLocaleString()}` : "Price On Request"}
                </div>
              </div>
              {vendor.categories?.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {vendor.categories.map((c, i) => (
                    <span key={i} style={{ background: "#FDE8EE", color: "#D4426A", padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, textTransform: "capitalize" }}>{c}</span>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ── ABOUT ── */}
          <section style={{ background: "#fff", borderRadius: 16, border: "1px solid #EDE0D8", padding: 28, marginBottom: 24 }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, color: "#2C2420", margin: "0 0 16px", fontWeight: 700 }}>About {vendor.name}</h2>
            <p style={{ color: "#5C524F", lineHeight: 1.85, fontSize: 15, whiteSpace: "pre-line", margin: 0, wordWrap: "break-word", overflowWrap: "break-word", wordBreak: "break-word" }}>
              {vendor.description || data.about || data.description || "No description available for this vendor yet."}
            </p>
          </section>

          {/* ── QUICK INFO / SERVICE DETAILS ── */}
          {data && Object.keys(data).filter(k => !["about","description"].includes(k) && data[k]).length > 0 && (
            <section style={{ background: "#fff", borderRadius: 16, border: "1px solid #EDE0D8", padding: 28, marginBottom: 24 }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, color: "#2C2420", margin: "0 0 20px", fontWeight: 700 }}>Quick Info</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
                {Object.entries(data).map(([key, val]) => {
                  if (["about","description"].includes(key) || !val) return null;
                  return (
                    <div key={key} style={{ padding: "14px 0", borderBottom: "1px solid #F5EDE7", display: "flex", justifyContent: "space-between", alignItems: "center", paddingRight: 20 }}>
                      <span style={{ fontSize: 13, color: "#7A6E6A", textTransform: "capitalize" }}>{key.replace(/_/g, " ")}</span>
                      <span style={{ fontSize: 14, color: "#2C2420", fontWeight: 600, textAlign: "right", maxWidth: "60%", wordBreak: "break-word" }}>
                        {Array.isArray(val) ? val.join(", ") : String(val)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── PORTFOLIO / PHOTOS ── */}
          <section ref={sectionRefs.photos} style={{ background: "#fff", borderRadius: 16, border: "1px solid #EDE0D8", padding: 28, marginBottom: 24 }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, color: "#2C2420", margin: "0 0 20px", fontWeight: 700 }}>
              Portfolio {allImages.length > 0 && <span style={{ fontSize: 14, color: "#7A6E6A", fontFamily: "'DM Sans',sans-serif", fontWeight: 400 }}>({allImages.length} photos)</span>}
            </h2>
            {allImages.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {allImages.map((im, i) => (
                  <div key={i} className="vd-gallery-cell" onClick={() => setLightbox({ open: true, idx: i })}
                    style={{ borderRadius: 10, overflow: "hidden", height: 140, cursor: "pointer" }}>
                    <img src={img(im)} alt={`Photo ${i+1}`} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .3s" }} />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#B5A9A3" }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>📷</div>
                <p style={{ fontSize: 14, margin: 0 }}>No portfolio photos yet</p>
              </div>
            )}
          </section>

          {/* ── REVIEWS ── */}
          <section ref={sectionRefs.reviews}>
            <VendorReviewSection vendorId={id} />
          </section>
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <aside style={{ position: "sticky", top: 80, height: "fit-content" }}>
          {/* Enquiry card */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #EDE0D8", overflow: "hidden", boxShadow: "0 8px 32px rgba(44,36,32,0.06)" }}>
            {/* Pricing header */}
            <div style={{ background: "linear-gradient(135deg, #D4426A, #e8637e)", padding: "24px 28px", color: "#fff" }}>
              <div style={{ fontSize: 12, opacity: .85, marginBottom: 4 }}>Starting Price</div>
              <div style={{ fontSize: 30, fontWeight: 700, fontFamily: "'Cormorant Garamond',serif" }}>
                {vendor.price ? `₹${vendor.price.toLocaleString()}` : "On Request"}
              </div>
            </div>

            <div style={{ padding: 28 }}>
              <h3 style={{ fontSize: 16, color: "#2C2420", margin: "0 0 20px", fontWeight: 600 }}>Interested? Let's connect</h3>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <button onClick={() => {
                  const currentToken = localStorage.getItem("vivahanamToken");
                  if (!currentToken) {
                    setPendingAction("enquiry");
                    setShowAuth(true);
                  } else {
                    setShowEnquiry(true);
                  }
                }} className="vd-sidebar-btn" style={{
                  background: "#D4426A", color: "#fff", border: "none", padding: "14px",
                  borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer",
                  transition: "all .2s", width: "100%",
                }}>
                  📩 Send Message
                </button>
                <button onClick={handleViewContact} className="vd-sidebar-btn" style={{
                  background: "#fff", color: "#2C2420", border: "1.5px solid #EDE0D8", padding: "14px",
                  borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer",
                  transition: "all .2s", width: "100%",
                }}>
                  {contactRevealed ? "📞 " + (revealedContact?.phone || vendor.phone) : "📞 View Contact"}
                </button>
              </div>

              {/* Contact info */}
              <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid #F5E9D0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "#FDE8EE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📞</div>
                  <div>
                    <div style={{ fontSize: 11, color: "#7A6E6A", textTransform: "uppercase", letterSpacing: .5 }}>Phone</div>
                    <div style={{ fontSize: 14, color: "#2C2420", fontWeight: 500 }}>{vendor.phone || "Contact for details"}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "#FDE8EE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>✉️</div>
                  <div>
                    <div style={{ fontSize: 11, color: "#7A6E6A", textTransform: "uppercase", letterSpacing: .5 }}>Email</div>
                    <div style={{ fontSize: 14, color: "#2C2420", fontWeight: 500, wordBreak: "break-all" }}>{vendor.email || "Contact for details"}</div>
                  </div>
                </div>
              </div>

              {/* Demand indicator */}
              <div style={{ marginTop: 20, background: "#FFFBEB", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>🔥</span>
                <span style={{ fontSize: 12, color: "#92400E", fontWeight: 500 }}>High demand — enquire soon!</span>
              </div>
            </div>
          </div>

          {/* Trust badge */}
          <div style={{ marginTop: 16, background: "#fff", borderRadius: 16, border: "1px solid #EDE0D8", padding: "20px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>✅</div>
            <div style={{ fontSize: 13, color: "#5C524F", lineHeight: 1.5 }}>
              <strong style={{ color: "#2C2420" }}>Vivahanam Verified</strong><br />
              Guaranteed quality & secure booking experience
            </div>
          </div>
        </aside>
      </div>

      {/* ══════ LIGHTBOX ══════ */}
      {lightbox.open && (
        <div onClick={() => setLightbox({ open: false, idx: 0 })}
          style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,.92)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <button onClick={e => { e.stopPropagation(); setLightbox(l => ({ ...l, idx: Math.max(0, l.idx - 1) })); }}
            style={{ position: "absolute", left: 20, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,.15)", border: "none", color: "#fff", fontSize: 28, width: 48, height: 48, borderRadius: "50%", cursor: "pointer" }}>‹</button>
          <img src={img(allImages[lightbox.idx]) || FALLBACK} alt="" onClick={e => e.stopPropagation()}
            style={{ maxWidth: "85vw", maxHeight: "85vh", borderRadius: 12, objectFit: "contain" }} />
          <button onClick={e => { e.stopPropagation(); setLightbox(l => ({ ...l, idx: Math.min(allImages.length - 1, l.idx + 1) })); }}
            style={{ position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,.15)", border: "none", color: "#fff", fontSize: 28, width: 48, height: 48, borderRadius: "50%", cursor: "pointer" }}>›</button>
          <button onClick={() => setLightbox({ open: false, idx: 0 })}
            style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,.15)", border: "none", color: "#fff", fontSize: 22, width: 44, height: 44, borderRadius: "50%", cursor: "pointer" }}>✕</button>
          <div style={{ position: "absolute", bottom: 24, color: "rgba(255,255,255,.7)", fontSize: 14 }}>{lightbox.idx + 1} / {allImages.length}</div>
        </div>
      )}

      {/* ══════ ENQUIRY MODAL ══════ */}
      {showEnquiry && vendor && <EnquiryModal vendor={vendor} onClose={() => setShowEnquiry(false)} />}

      {/* ══════ AUTH MODAL ══════ */}
      {showAuth && (
        <AuthPage 
          onSuccess={handleAuthSuccess} 
          onClose={() => { setShowAuth(false); setPendingAction(null); }} 
          disableRegisterRedirect={true} 
        />
      )}
    </div>
  );
};

export default VendorDetails;
