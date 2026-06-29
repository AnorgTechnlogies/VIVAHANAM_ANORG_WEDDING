import React from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const ROOT_API_BASE = API_BASE ? API_BASE.replace(/\/admin\/?$/, "") : "";

const getImageUrl = (img) => {
  if (!img) return null;
  if (img.startsWith("http")) return img;
  return `${ROOT_API_BASE.replace("/api", "")}${img}`;
};

const VendorCard = ({ vendor }) => {
  const navigate = useNavigate();
  // Image priority: vendor.image > vendor.gallery[0] > placeholder
  const imageUrl = getImageUrl(vendor.image || (vendor.gallery && vendor.gallery[0])) || "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop";

  const data = vendor?.data || {};
  const cat = (vendor?.categories && vendor?.categories[0]) || data?.category || vendor?.vendorType || "Vendor";
  const c = String(cat).toLowerCase();

  const renderDynamicData = () => {
    // Ye list un fields ki hai jo card me nahi dikhani (kyunki wo already upar dikh rahi hain, ya private hain)
    const hiddenKeys = [
      "brand_name", "business_name", "email", "mobile", "phone", 
      "city", "state", "category", "vendorType", "about", "description", 
      "facebook", "instagram", "youtube", "website", 
      "profile_pic", "gallery", "portfolio", "featured", "image", "slug"
    ];

    if (!data || typeof data !== "object") return null;

    // Filter out hidden keys and empty values
    const dynamicFields = Object.entries(data).filter(([key, value]) => {
      if (hiddenKeys.includes(key)) return false;
      if (value === null || value === undefined || value === "") return false;
      if (Array.isArray(value) && value.length === 0) return false;
      if (typeof value === "object" && !Array.isArray(value)) return false; // skip nested objects
      return true;
    });

    if (dynamicFields.length === 0 && !vendor?.price) {
      return (
        <div style={{ color: "#2C2420", fontWeight: 700, fontSize: 16 }}>
          Contact for Price
        </div>
      );
    }

    // Key format helper: "veg_price" -> "Veg Price"
    const formatKey = (str) => {
      return str.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    };

    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {/* Render fallback top-level price if no dynamic price fields exist */}
        {vendor?.price && !dynamicFields.some(([k]) => k.toLowerCase().includes("price")) && (
          <div style={{ 
            background: "#FDF8F3", border: "1px solid #F5E9D0", 
            padding: "6px 10px", borderRadius: 8, 
            display: "flex", flexDirection: "column", gap: 2, minWidth: "45%", flex: 1
          }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: "#A89F9C", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Starting Price
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#2C2420" }}>
              ${Number(vendor.price).toLocaleString()}
            </span>
          </div>
        )}

        {/* Dynamically render all allowed fields from data object */}
        {dynamicFields.slice(0, 4).map(([key, value]) => {
          let displayValue = value;
          if (Array.isArray(value)) {
            displayValue = value.join(", ");
          } else if (!isNaN(value) && key.toLowerCase().includes("price")) {
             displayValue = `$${Number(value).toLocaleString()}`;
          }
          
          return (
            <div key={key} style={{ 
              background: "#FDF8F3", border: "1px solid #F5E9D0", 
              padding: "6px 10px", borderRadius: 8, 
              display: "flex", flexDirection: "column", gap: 2, minWidth: "45%", flex: 1
            }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: "#A89F9C", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {formatKey(key)}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#2C2420", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {displayValue}
              </span>
            </div>
          );
        })}

        {dynamicFields.length > 4 && (
          <div style={{ width: "100%", fontSize: 11, color: "#D4426A", fontWeight: 600, marginTop: 2 }}>
            + {dynamicFields.length - 4} more details
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 20,
        overflow: "hidden",
        border: "1px solid #EDE0D8",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        cursor: "pointer",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        boxShadow: "0 4px 12px rgba(44,36,32,0.04)"
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-8px)";
        e.currentTarget.style.boxShadow = "0 12px 40px rgba(44,36,32,0.12)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(44,36,32,0.04)";
      }}
      onClick={() => navigate(`/vendors/${vendor._id || vendor.id}`)}
    >
      {/* IMAGE SECTION */}
      <div style={{ height: 180, position: "relative", overflow: "hidden" }}>
        <img
          src={imageUrl}
          alt={vendor.name}
          style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s" }}
          onMouseEnter={e => e.target.style.transform = "scale(1.05)"}
          onMouseLeave={e => e.target.style.transform = "scale(1)"}
        />
        {/* Rating Badge */}
        {vendor.rating > 0 && (
          <div style={{
            position: "absolute", top: 12, right: 12,
            background: "rgba(255,255,255,0.9)", backdropFilter: "blur(4px)",
            padding: "4px 10px", borderRadius: 50, fontSize: 12, fontWeight: 600,
            color: "#D4426A", display: "flex", alignItems: "center", gap: 4,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
          }}>
            ⭐ {vendor.rating}
          </div>
        )}
        {/* Category Overlay */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)",
          padding: "20px 16px 12px",
        }}>
          <span style={{
            background: "#D4426A", color: "#fff", fontSize: 10,
            padding: "3px 10px", borderRadius: 4, textTransform: "uppercase",
            letterSpacing: "1px", fontWeight: 600
          }}>
            {vendor.vendorType || vendor.category || vendor.data?.category || vendor.submission?.data?.category || (Array.isArray(vendor.categories) ? vendor.categories[0] : null) || "Vendor"}
          </span>
        </div>
      </div>

      {/* CONTENT SECTION */}
      <div style={{ padding: 16, flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, gap: 8 }}>
          <h3 style={{
            fontFamily: "'Cormorant Garamond', serif", fontSize: 22,
            fontWeight: 600, color: "#2C2420", margin: 0,
            lineHeight: 1.2,
            display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden"
          }}>
            {vendor.name || vendor.brandName || vendor.data?.brandName || "Untitled Vendor"}
          </h3>

          <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#7A6E6A", fontSize: 13, whiteSpace: "nowrap", flexShrink: 0, marginTop: 4 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
            <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis" }}>
              {vendor.city || vendor.location?.city || vendor.data?.city || vendor.submission?.data?.city || "Location"}
            </span>
          </div>
        </div>

        <div style={{
          paddingTop: 16, borderTop: "1px solid #F5E9D0", display: "flex", flexDirection: "column", gap: 8
        }}>
          {/* Dynamic Info Grid */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div style={{ flex: 1 }}>
              {renderDynamicData()}
            </div>
          </div>
          
          <div style={{ alignSelf: "flex-end", marginTop: 4 }}>
            <span style={{
              color: "#D4426A", fontSize: 13, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 4
            }}>
              View Profile <span style={{ fontSize: 16 }}>→</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorCard;
