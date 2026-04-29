import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_KEY || "http://localhost:8000/api";

const STAR_COLOR = "#D4426A";
const STAR_EMPTY = "#E5D6D0";
const CATEGORIES = [
  { key: "qualityRating", label: "Quality" },
  { key: "valueForMoneyRating", label: "Value for Money" },
  { key: "professionalismRating", label: "Professionalism" },
  { key: "responseTimeRating", label: "Response Time" },
];
const EVENT_TYPES = ["wedding","engagement","reception","pre-wedding","other"];

/* ── tiny helpers ── */
const Stars = ({ rating, size = 16, interactive, onRate }) => (
  <div style={{ display: "inline-flex", gap: 2 }}>
    {[1,2,3,4,5].map(i => (
      <svg key={i} width={size} height={size} viewBox="0 0 24 24"
        style={{ cursor: interactive ? "pointer" : "default", transition: "transform .15s" }}
        onClick={() => interactive && onRate?.(i)}
        onMouseEnter={e => interactive && (e.currentTarget.style.transform = "scale(1.2)")}
        onMouseLeave={e => interactive && (e.currentTarget.style.transform = "scale(1)")}>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          fill={i <= rating ? STAR_COLOR : STAR_EMPTY} />
      </svg>
    ))}
  </div>
);

const RatingBar = ({ label, avg, count, total }) => {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
      <span style={{ width: 18, textAlign: "right", fontWeight: 600, color: "#2C2420" }}>{label}</span>
      <svg width={12} height={12} viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={STAR_COLOR}/></svg>
      <div style={{ flex: 1, height: 8, borderRadius: 4, background: "#F5E9D0", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 4, background: `linear-gradient(90deg, ${STAR_COLOR}, #e8637e)`, transition: "width .6s ease" }} />
      </div>
      <span style={{ width: 28, textAlign: "right", color: "#7A6E6A", fontSize: 12 }}>{count}</span>
    </div>
  );
};

const Avatar = ({ name, avatar }) => {
  const initials = (name || "?").split(" ").slice(0,2).map(w => w[0]).join("").toUpperCase();
  return (
    <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#FDE8EE", color: STAR_COLOR, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0, overflow: "hidden", border: "2px solid #F5E9D0" }}>
      {avatar ? <img src={avatar} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
    </div>
  );
};

const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  if (s < 2592000) return `${Math.floor(s/86400)}d ago`;
  return new Date(d).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
};

/* ── MAIN COMPONENT ── */
export default function VendorReviewSection({ vendorId }) {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("recent");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");
  const [userReview, setUserReview] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const token = localStorage.getItem("vivahanamToken");
  const isLoggedIn = !!token;

  const [form, setForm] = useState({
    overallRating: 0, qualityRating: 0, valueForMoneyRating: 0,
    professionalismRating: 0, responseTimeRating: 0,
    title: "", reviewText: "", eventType: "",
  });

  const fetchReviews = async (p = 1) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/vendors/${vendorId}/reviews?page=${p}&limit=5&sort=${sortBy}`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.data.reviews);
        setSummary(data.data.summary);
        setTotalPages(data.data.pagination.totalPages);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const checkExisting = async () => {
    if (!isLoggedIn) return;
    try {
      const res = await fetch(`${API_BASE}/vendors/${vendorId}/reviews/check`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.data.hasReviewed) setUserReview(data.data.review);
    } catch (e) { /* ignore */ }
  };

  useEffect(() => { fetchReviews(page); }, [vendorId, sortBy, page]);
  useEffect(() => { checkExisting(); }, [vendorId]);

  const handleSubmit = async () => {
    if (!form.overallRating) return setToast("Please select overall rating");
    if (!form.reviewText.trim()) return setToast("Please write your review");
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/vendors/${vendorId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setToast("Review submitted! 🎉");
      setShowForm(false);
      setForm({ overallRating: 0, qualityRating: 0, valueForMoneyRating: 0, professionalismRating: 0, responseTimeRating: 0, title: "", reviewText: "", eventType: "" });
      fetchReviews(1);
      checkExisting();
    } catch (e) { setToast(e.message); }
    finally { setSubmitting(false); }
  };

  const handleHelpful = async (reviewId) => {
    if (!isLoggedIn) return setToast("Please login to vote");
    try {
      await fetch(`${API_BASE}/vendors/reviews/${reviewId}/helpful`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }
      });
      fetchReviews(page);
    } catch (e) { /* ignore */ }
  };

  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(""), 3000); return () => clearTimeout(t); }, [toast]);

  const s = summary || { totalReviews: 0, avgOverall: 0, distribution: {5:0,4:0,3:0,2:0,1:0} };

  return (
    <section id="vendor-reviews" style={{ borderTop: "1px solid #F5E9D0", paddingTop: 48 }}>
      {/* Toast */}
      {toast && <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 9999, background: "#1c1917", color: "#fafaf9", padding: "12px 20px", borderRadius: 12, fontSize: 13, fontWeight: 500, boxShadow: "0 8px 32px #00000040" }}>{toast}</div>}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 32 }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, color: "#2C2420", margin: 0 }}>
          Reviews {s.totalReviews > 0 && <span style={{ fontSize: 18, color: "#7A6E6A", fontFamily: "'DM Sans',sans-serif" }}>({s.totalReviews})</span>}
        </h2>
        {isLoggedIn && !userReview && (
          <button onClick={() => setShowForm(!showForm)} style={{
            background: showForm ? "#fff" : "#D4426A", color: showForm ? "#D4426A" : "#fff",
            border: showForm ? "1.5px solid #D4426A" : "none", padding: "12px 28px",
            borderRadius: 50, fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}>
            {showForm ? "Cancel" : "✍️ Write a Review"}
          </button>
        )}
      </div>

      {/* ── RATING SUMMARY ── */}
      {s.totalReviews > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr 1fr", gap: 32, background: "#fff", borderRadius: 20, padding: 32, border: "1px solid #EDE0D8", marginBottom: 32 }}>
          {/* Big rating number */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRight: "1px solid #F5E9D0" }}>
            <div style={{ fontSize: 56, fontWeight: 800, color: "#2C2420", lineHeight: 1, fontFamily: "'Cormorant Garamond', serif" }}>{s.avgOverall}</div>
            <Stars rating={Math.round(s.avgOverall)} size={20} />
            <div style={{ marginTop: 8, fontSize: 13, color: "#7A6E6A" }}>{s.totalReviews} review{s.totalReviews !== 1 ? "s" : ""}</div>
          </div>
          {/* Distribution bars */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
            {[5,4,3,2,1].map(n => (
              <RatingBar key={n} label={n} count={s.distribution[n] || 0} total={s.totalReviews} />
            ))}
          </div>
          {/* Category ratings */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, justifyContent: "center", paddingLeft: 24, borderLeft: "1px solid #F5E9D0" }}>
            {CATEGORIES.map(c => {
              const val = s[`avg${c.key.charAt(0).toUpperCase() + c.key.slice(1).replace("Rating","")}`] || s[`avg${c.key.replace("Rating","").replace(/([A-Z])/g," $1").trim().split(" ").map((w,i) => i===0 ? w.charAt(0).toUpperCase()+w.slice(1) : w.charAt(0).toUpperCase()+w.slice(1)).join("")}`] || 0;
              const avgVal = c.key === "qualityRating" ? s.avgQuality : c.key === "valueForMoneyRating" ? s.avgValue : c.key === "professionalismRating" ? s.avgProfessionalism : s.avgResponseTime;
              return (
                <div key={c.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "#5C524F" }}>{c.label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Stars rating={Math.round(avgVal)} size={12} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#2C2420" }}>{avgVal || "—"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── WRITE REVIEW FORM ── */}
      {showForm && (
        <div style={{ background: "#fff", borderRadius: 20, padding: 32, border: "1px solid #EDE0D8", marginBottom: 32 }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: "#2C2420", marginBottom: 24 }}>Share Your Experience</h3>
          {/* Overall */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#5C524F", display: "block", marginBottom: 8 }}>Overall Rating *</label>
            <Stars rating={form.overallRating} size={32} interactive onRate={v => setForm(f => ({...f, overallRating: v}))} />
          </div>
          {/* Category ratings */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            {CATEGORIES.map(c => (
              <div key={c.key}>
                <label style={{ fontSize: 12, color: "#7A6E6A", display: "block", marginBottom: 4 }}>{c.label}</label>
                <Stars rating={form[c.key]} size={22} interactive onRate={v => setForm(f => ({...f, [c.key]: v}))} />
              </div>
            ))}
          </div>
          {/* Event type */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: "#7A6E6A", display: "block", marginBottom: 4 }}>Event Type</label>
            <select value={form.eventType} onChange={e => setForm(f => ({...f, eventType: e.target.value}))}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #EDE0D8", fontSize: 14, color: "#2C2420", background: "#FDF8F3" }}>
              <option value="">Select...</option>
              {EVENT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
            </select>
          </div>
          {/* Title */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: "#7A6E6A", display: "block", marginBottom: 4 }}>Review Title</label>
            <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="Sum up your experience..."
              maxLength={150} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #EDE0D8", fontSize: 14, color: "#2C2420", background: "#FDF8F3", boxSizing: "border-box" }} />
          </div>
          {/* Review text */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: "#7A6E6A", display: "block", marginBottom: 4 }}>Your Review *</label>
            <textarea value={form.reviewText} onChange={e => setForm(f => ({...f, reviewText: e.target.value}))} placeholder="Tell others about your experience with this vendor..."
              rows={5} maxLength={2000} style={{ width: "100%", padding: "12px", borderRadius: 12, border: "1px solid #EDE0D8", fontSize: 14, color: "#2C2420", background: "#FDF8F3", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }} />
            <div style={{ textAlign: "right", fontSize: 11, color: "#7A6E6A", marginTop: 4 }}>{form.reviewText.length}/2000</div>
          </div>
          <button onClick={handleSubmit} disabled={submitting} style={{
            background: "#D4426A", color: "#fff", border: "none", padding: "14px 40px",
            borderRadius: 50, fontSize: 15, fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? .6 : 1,
          }}>
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      )}

      {/* ── SORT BAR ── */}
      {s.totalReviews > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {[["recent","Most Recent"],["helpful","Most Helpful"],["highest","Highest"],["lowest","Lowest"]].map(([k,l]) => (
            <button key={k} onClick={() => { setSortBy(k); setPage(1); }} style={{
              padding: "7px 16px", borderRadius: 20, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer",
              background: sortBy === k ? "#2C2420" : "#F5E9D0", color: sortBy === k ? "#fff" : "#5C524F",
            }}>{l}</button>
          ))}
        </div>
      )}

      {/* ── REVIEW LIST ── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#7A6E6A" }}>Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 24px", background: "#fff", borderRadius: 20, border: "1px solid #EDE0D8" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
          <h3 style={{ fontSize: 20, color: "#2C2420", marginBottom: 8 }}>No Reviews Yet</h3>
          <p style={{ color: "#7A6E6A", fontSize: 14 }}>Be the first to review this vendor!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {reviews.map(r => (
            <div key={r._id} style={{ background: "#fff", borderRadius: 20, padding: 28, border: "1px solid #EDE0D8" }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <Avatar name={r.userName} avatar={r.userAvatar} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, color: "#2C2420" }}>{r.userName}</div>
                    <div style={{ fontSize: 12, color: "#7A6E6A", marginTop: 2 }}>
                      {timeAgo(r.createdAt)}
                      {r.eventType && <span> · {r.eventType.charAt(0).toUpperCase()+r.eventType.slice(1)}</span>}
                      {r.isVerified && <span style={{ color: "#10b981", marginLeft: 8 }}>✓ Verified</span>}
                    </div>
                  </div>
                </div>
                <Stars rating={r.overallRating} size={16} />
              </div>
              {/* Title */}
              {r.title && <div style={{ fontWeight: 700, fontSize: 16, color: "#2C2420", marginBottom: 8 }}>{r.title}</div>}
              {/* Text */}
              <p style={{ color: "#5C524F", lineHeight: 1.7, fontSize: 14, margin: "0 0 16px", whiteSpace: "pre-line" }}>{r.reviewText}</p>
              {/* Category mini-ratings */}
              {(r.qualityRating || r.valueForMoneyRating || r.professionalismRating || r.responseTimeRating) && (
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
                  {CATEGORIES.map(c => r[c.key] ? (
                    <div key={c.key} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#7A6E6A", background: "#FDF8F3", padding: "4px 10px", borderRadius: 8 }}>
                      {c.label}: <Stars rating={r[c.key]} size={10} />
                    </div>
                  ) : null)}
                </div>
              )}
              {/* Vendor reply */}
              {r.vendorReply?.text && (
                <div style={{ background: "#FDF8F3", borderRadius: 12, padding: "16px 20px", marginBottom: 12, borderLeft: "3px solid #D4426A" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: STAR_COLOR, marginBottom: 4 }}>Vendor Reply</div>
                  <p style={{ fontSize: 13, color: "#5C524F", margin: 0, lineHeight: 1.6 }}>{r.vendorReply.text}</p>
                </div>
              )}
              {/* Helpful */}
              <button onClick={() => handleHelpful(r._id)} style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px",
                borderRadius: 20, border: "1px solid #EDE0D8", background: "transparent",
                fontSize: 12, color: "#7A6E6A", cursor: "pointer",
              }}>
                👍 Helpful {r.helpfulCount > 0 && `(${r.helpfulCount})`}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── PAGINATION ── */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)} style={{
              width: 36, height: 36, borderRadius: "50%", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer",
              background: page === p ? "#D4426A" : "#F5E9D0", color: page === p ? "#fff" : "#5C524F",
            }}>{p}</button>
          ))}
        </div>
      )}

      {/* Login prompt */}
      {!isLoggedIn && (
        <div style={{ textAlign: "center", marginTop: 24, padding: 20, background: "#FDE8EE", borderRadius: 16 }}>
          <p style={{ color: "#D4426A", fontSize: 14, fontWeight: 500, margin: 0 }}>
            Please <a href="/login" style={{ color: "#D4426A", fontWeight: 700 }}>login</a> to write a review
          </p>
        </div>
      )}
    </section>
  );
}
