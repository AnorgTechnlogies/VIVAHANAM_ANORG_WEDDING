// Yeh component VendorList page hai — vendors ki list fetch karke UI me dikhata hai,
// aur saath me search + filter + pagination + empty state handle karta hai.

import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import SearchBar from "../components/SearchBar";

const API_BASE = import.meta.env.VITE_API_KEY || "http://localhost:8000/api";

// ─── EMPTY STATE COMPONENT ────────────────────────────────────────────────────
const EmptyState = ({ onClearFilters }) => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "48px 24px",
        animation: "fadeUp 0.5s ease both",
      }}
    >
      {/* Illustration */}
      <div
        style={{
          width: 140,
          height: 140,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #F9E8EE, #F5E9D0)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 28,
          position: "relative",
          boxShadow: "0 8px 32px rgba(212,66,106,0.12)",
        }}
      >
        {/* outer ring */}
        <div
          style={{
            position: "absolute",
            inset: -10,
            borderRadius: "50%",
            border: "1.5px dashed rgba(212,66,106,0.25)",
            animation: "rotateSlow 20s linear infinite",
          }}
        />
        <svg
          width="64"
          height="64"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* magnifier */}
          <circle cx="27" cy="27" r="16" stroke="#D4426A" strokeWidth="3" strokeLinecap="round" />
          <line x1="38.5" y1="38.5" x2="54" y2="54" stroke="#D4426A" strokeWidth="3" strokeLinecap="round" />
          {/* question mark inside */}
          <text x="21" y="33" fontSize="16" fill="#D4426A" fontFamily="Georgia, serif" fontWeight="bold">?</text>
        </svg>
      </div>

      {/* Heading */}
      <h2
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
          fontWeight: 400,
          color: "#2C2420",
          marginBottom: 12,
          lineHeight: 1.2,
        }}
      >
        No Vendors Found
      </h2>

      {/* Subtext */}
      <p
        style={{
          fontSize: 14,
          color: "#7A6E6A",
          maxWidth: 400,
          lineHeight: 1.7,
          marginBottom: 36,
        }}
      >
        We couldn't find any vendors matching your search.
        <br />
        Try adjusting your filters or browse all vendors.
      </p>

      {/* Buttons */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={() => navigate("/wedding-shop")}
          style={{
            background: "#D4426A",
            color: "#fff",
            border: "none",
            padding: "13px 28px",
            borderRadius: 50,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 18px rgba(212,66,106,0.28)",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.target.style.background = "#A8274A"; e.target.style.transform = "translateY(-2px)"; }}
          onMouseLeave={e => { e.target.style.background = "#D4426A"; e.target.style.transform = ""; }}
        >
          ← Go to Home
        </button>

        <button
          onClick={onClearFilters}
          style={{
            background: "#fff",
            color: "#D4426A",
            border: "1.5px solid #D4426A",
            padding: "13px 28px",
            borderRadius: 50,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.target.style.background = "#F9E8EE"; e.target.style.transform = "translateY(-2px)"; }}
          onMouseLeave={e => { e.target.style.background = "#fff"; e.target.style.transform = ""; }}
        >
          Browse All Vendors
        </button>
      </div>

      {/* Suggestion chips */}
      <div style={{ marginTop: 36 }}>
        <p style={{ fontSize: 12, color: "#7A6E6A", marginBottom: 12, letterSpacing: "1px", textTransform: "uppercase" }}>
          Popular categories
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
          {["Venues", "Photographers", "Makeup", "Catering", "Decoration"].map((tag) => (
            <span
              key={tag}
              onClick={() => onClearFilters(tag.toLowerCase())}
              style={{
                background: "#F9E8EE",
                color: "#D4426A",
                fontSize: 12,
                padding: "6px 14px",
                borderRadius: 20,
                cursor: "pointer",
                transition: "all 0.2s",
                border: "1px solid transparent",
              }}
              onMouseEnter={e => { e.target.style.background = "#D4426A"; e.target.style.color = "#fff"; }}
              onMouseLeave={e => { e.target.style.background = "#F9E8EE"; e.target.style.color = "#D4426A"; }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── SKELETON LOADER ──────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div style={{
    background: "#fff", borderRadius: 16, overflow: "hidden",
    border: "1px solid #EDE0D8", animation: "pulse 1.5s ease infinite",
  }}>
    <div style={{ height: 180, background: "linear-gradient(90deg, #f0e8e8 25%, #f8f0f0 50%, #f0e8e8 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
    <div style={{ padding: 16 }}>
      <div style={{ height: 16, background: "#EDE0D8", borderRadius: 8, marginBottom: 10, width: "70%" }} />
      <div style={{ height: 12, background: "#EDE0D8", borderRadius: 8, marginBottom: 8, width: "50%" }} />
      <div style={{ height: 12, background: "#EDE0D8", borderRadius: 8, width: "40%" }} />
    </div>
  </div>
);

// ─── VENDOR LIST PAGE ─────────────────────────────────────────────────────────
const VendorList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  // aapka original params — bilkul same
  const category = searchParams.get("category") || "";
  const location  = searchParams.get("location")  || "";
  const page      = Number(searchParams.get("page") || 1);

  // aapka original fetch — bilkul same
  useEffect(() => {
    const fetchVendors = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams({ status: "approved", page: String(page), limit: "9" });
        if (category) query.set("category", category);
        if (location)  query.set("location",  location);
        const res  = await fetch(`${API_BASE}/vendors?${query.toString()}`);
        const data = await res.json();
        setVendors(data?.data || []);
        setPagination(data?.pagination || { page: 1, totalPages: 1 });
      } catch (error) {
        console.error("Failed to fetch vendors", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVendors();
  }, [category, location, page]);

  // aapka original search handler — same
  const handleSearch = ({ category: c, location: l }) => {
    const query = new URLSearchParams();
    if (c) query.set("category", c);
    if (l) query.set("location",  l);
    query.set("page", "1");
    setSearchParams(query);
  };

  const changePage = (nextPage) => {
    const query = new URLSearchParams(searchParams);
    query.set("page", String(nextPage));
    setSearchParams(query);
  };

  // clear filters — EmptyState ke buttons ke liye
  const handleClearFilters = (categoryOverride = "") => {
    const query = new URLSearchParams();
    if (categoryOverride) query.set("category", categoryOverride);
    query.set("page", "1");
    setSearchParams(query);
  };

  const activeFilters = category || location;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#FDF8F3", minHeight: "100vh" }}>

      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />

      {/* ── PAGE HEADER ── */}
      <div style={{
        background: "linear-gradient(135deg, #2C2420 0%, #5C2D3A 55%, #8B3A52 100%)",
        padding: "40px 24px 32px",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 10, letterSpacing: "4px", textTransform: "uppercase", color: "#F5C97A", marginBottom: 8 }}>
            Discover
          </p>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif", fontWeight: 300,
            fontSize: "clamp(1.8rem, 4vw, 2.8rem)", color: "#fff",
            marginBottom: 20, lineHeight: 1.2,
          }}>
            Wedding Vendors
            {category && (
              <em style={{ fontStyle: "italic", color: "#F5C97A", marginLeft: 12 }}>
                — {category}
              </em>
            )}
          </h1>

          {/* SearchBar */}
          <div style={{
            background: "#fff", borderRadius: 50, overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)", width: "min(680px, 100%)",
          }}>
            <SearchBar onSearch={handleSearch} />
          </div>

          {/* Active filter chips */}
          {activeFilters && (
            <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: "1px", textTransform: "uppercase" }}>
                Filters:
              </span>
              {category && (
                <span style={{
                  background: "rgba(212,66,106,0.25)", border: "1px solid rgba(212,66,106,0.5)",
                  color: "#F9C8D6", fontSize: 12, padding: "4px 12px", borderRadius: 20,
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  {category}
                  <span
                    onClick={() => { const q = new URLSearchParams(searchParams); q.delete("category"); q.set("page","1"); setSearchParams(q); }}
                    style={{ cursor: "pointer", opacity: 0.7, fontSize: 14 }}
                  >×</span>
                </span>
              )}
              {location && (
                <span style={{
                  background: "rgba(200,146,42,0.2)", border: "1px solid rgba(200,146,42,0.4)",
                  color: "#F5E9D0", fontSize: 12, padding: "4px 12px", borderRadius: 20,
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  📍 {location}
                  <span
                    onClick={() => { const q = new URLSearchParams(searchParams); q.delete("location"); q.set("page","1"); setSearchParams(q); }}
                    style={{ cursor: "pointer", opacity: 0.7, fontSize: 14 }}
                  >×</span>
                </span>
              )}
              <span
                onClick={() => handleClearFilters()}
                style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", cursor: "pointer", textDecoration: "underline", marginLeft: 4 }}
              >
                Clear all
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── CONTENT AREA ── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 24px 60px" }}>

        {/* Result count */}
        {!loading && vendors.length > 0 && (
          <p style={{ fontSize: 13, color: "#7A6E6A", marginBottom: 24 }}>
            Showing <strong style={{ color: "#2C2420" }}>{vendors.length}</strong> vendor{vendors.length !== 1 ? "s" : ""}
            {category ? ` in "${category}"` : ""}
            {location ? ` near "${location}"` : ""}
          </p>
        )}

        {/* ── LOADING skeleton ── */}
        {loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* ── EMPTY STATE ── */}
        {!loading && vendors.length === 0 && (
          <EmptyState onClearFilters={handleClearFilters} />
        )}

        {/* ── VENDOR GRID ── */}
        {!loading && vendors.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
            {vendors.map((vendor) => (
              <VendorCard key={vendor._id} vendor={vendor} />
            ))}
          </div>
        )}

        {/* ── PAGINATION ── */}
        {!loading && vendors.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 48 }}>
            <button
              onClick={() => changePage(Math.max(1, page - 1))}
              disabled={page <= 1}
              style={{
                padding: "10px 20px", borderRadius: 50, border: "1.5px solid #EDE0D8",
                background: page <= 1 ? "#f5f0ed" : "#fff",
                color: page <= 1 ? "#bbb" : "#2C2420",
                fontSize: 13, fontWeight: 500, cursor: page <= 1 ? "not-allowed" : "pointer",
                transition: "all 0.2s",
              }}
            >
              ← Prev
            </button>

            {/* page numbers */}
            {Array.from({ length: pagination.totalPages || 1 }, (_, i) => i + 1)
              .filter(p => p === 1 || p === (pagination.totalPages || 1) || Math.abs(p - page) <= 1)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === "..." ? (
                  <span key={`dot-${idx}`} style={{ color: "#7A6E6A", fontSize: 13, padding: "0 4px" }}>…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => changePage(p)}
                    style={{
                      width: 38, height: 38, borderRadius: "50%",
                      border: p === page ? "none" : "1.5px solid #EDE0D8",
                      background: p === page ? "#D4426A" : "#fff",
                      color: p === page ? "#fff" : "#2C2420",
                      fontSize: 13, fontWeight: p === page ? 700 : 400,
                      cursor: "pointer", transition: "all 0.2s",
                    }}
                  >
                    {p}
                  </button>
                )
              )}

            <button
              onClick={() => changePage(Math.min(pagination.totalPages || 1, page + 1))}
              disabled={page >= (pagination.totalPages || 1)}
              style={{
                padding: "10px 20px", borderRadius: 50, border: "1.5px solid #EDE0D8",
                background: page >= (pagination.totalPages || 1) ? "#f5f0ed" : "#fff",
                color: page >= (pagination.totalPages || 1) ? "#bbb" : "#2C2420",
                fontSize: 13, fontWeight: 500,
                cursor: page >= (pagination.totalPages || 1) ? "not-allowed" : "pointer",
                transition: "all 0.2s",
              }}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes rotateSlow { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};

export default VendorList;