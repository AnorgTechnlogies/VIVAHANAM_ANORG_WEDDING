import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const API_URL = import.meta.env.VITE_API_KEY || "http://localhost:8000/api";
const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");
const FORM_KEY = "vendor_onboarding";

const STATUS = {
  approved: { label: "Approved", color: "#16a34a", bg: "#f0fdf4" },
  rejected: { label: "Rejected", color: "#dc2626", bg: "#fef2f2" },
  submitted: { label: "Under Review", color: "#d97706", bg: "#fffbeb" },
  draft: { label: "Draft", color: "#6b7280", bg: "#f9fafb" },
};

const toTitle = (v = "") =>
  v.toString().replace(/_/g, " ").trim().replace(/\b\w/g, (s) => s.toUpperCase());

const isFieldUneditable = (key = "") => {
  const k = key.toLowerCase();
  return (
    k === "city" ||
    k === "state" ||
    k === "category" ||
    k === "services" ||
    k === "email" ||
    k === "mobile" ||
    k === "phone" ||
    k.includes("city") ||
    k.includes("state") ||
    k.includes("category") ||
    k.includes("services") ||
    k.includes("email") ||
    k.includes("mobile") ||
    k.includes("phone")
  );
};

const fmt = (v) => {
  if (v === null || v === undefined || v === "") return "—";
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
};

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "profile", label: "Profile" },
  { id: "submission", label: "Form" },
  { id: "documents", label: "Documents" },
  { id: "enquiries", label: "Enquiries" },
  { id: "review", label: "Review" },
  { id: "myplan", label: "My Plan" },
  { id: "payments", label: "Payments" },
];

const SUB_STATUS = {
  ACTIVE: { label: "Active", color: "#16a34a", bg: "#f0fdf4" },
  EXPIRED: { label: "Expired", color: "#dc2626", bg: "#fef2f2" },
  CANCELLED: { label: "Cancelled", color: "#6b7280", bg: "#f9fafb" },
};

const TXN_STATUS = {
  COMPLETED: { label: "Completed", color: "#16a34a", bg: "#f0fdf4" },
  PENDING: { label: "Pending", color: "#d97706", bg: "#fffbeb" },
  AUTHORIZED: { label: "Authorized", color: "#2563eb", bg: "#eff6ff" },
  FAILED: { label: "Failed", color: "#dc2626", bg: "#fef2f2" },
  REFUNDED: { label: "Refunded", color: "#7c3aed", bg: "#f5f3ff" },
  PARTIAL_REFUND: { label: "Partial Refund", color: "#7c3aed", bg: "#f5f3ff" },
  DISPUTED: { label: "Disputed", color: "#dc2626", bg: "#fef2f2" },
};

export default function VendorDashboard() {
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");

  const [editProfile, setEditProfile] = useState(false);
  const [savingP, setSavingP] = useState(false);
  const [pForm, setPForm] = useState({ brandName: "", mobile: "", city: "", vendorType: "" });

  const [editForm, setEditForm] = useState(false);
  const [formData, setFormData] = useState({});
  const [savingF, setSavingF] = useState(false);

  const [enquiries, setEnquiries] = useState([]);
  const [loadingE, setLoadingE] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [loadingT, setLoadingT] = useState(false);

  const [subscription, setSubscription] = useState(null);
  const [loadingSub, setLoadingSub] = useState(false);

  // Review data states
  const [reviews, setReviews] = useState([]);
  const [loadingR, setLoadingR] = useState(false);
  const [ratingSummary, setRatingSummary] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [postingReply, setPostingReply] = useState(false);

  const [formConfig, setFormConfig] = useState(null);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedState, setSelectedState] = useState("");

  // Fetch dynamic form options and states
  useEffect(() => {
    fetch(`${API_URL}/marketplace/forms/${FORM_KEY}/config`)
      .then(r => r.json()).then(d => { if (d.data) setFormConfig(d.data); }).catch(console.error);

    fetch(`${API_URL}/locations/states`)
      .then(r => r.json()).then(d => { if (d.data) setStates(d.data); }).catch(console.error);
  }, []);

  // Fetch cities when state changes
  useEffect(() => {
    if (!selectedState) { setCities([]); return; }
    fetch(`${API_URL}/locations/states/${selectedState}/cities`)
      .then(r => r.json()).then(d => { if (d.data) setCities(d.data); }).catch(console.error);
  }, [selectedState]);

  // Extract categories from form config
  const categories = useMemo(() => {
    if (!formConfig) return [];
    const catField = (formConfig.sections || []).flatMap(s => s.fields || []).find(f => f.key === "category");
    return catField?.options || [];
  }, [formConfig]);

  const [slotLoading, setSlotLoading] = useState({});

  const fetchVendorData = async (silent = false) => {
    const token = localStorage.getItem("vendorToken");
    if (!token) { navigate("/wedding-shop/vendor-auth"); return; }
    if (!silent) setLoading(true);
    try {
      const r = await fetch(`${API_URL}/vendor/me`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (!r.ok || !d?.success) throw new Error();

      if (!d.data?.hasActiveSubscription) {
        navigate("/plans", { replace: true });
        return;
      }

      setVendor(d.data);
    } catch (e) {
      console.error(e);
      localStorage.removeItem("vendorToken");
      navigate("/wedding-shop/vendor-auth");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  /* fetch vendor + subscription guard */
  useEffect(() => {
    fetchVendorData();
  }, [navigate]);

  useEffect(() => {
    if (!vendor) return;
    const subData = vendor.submission?.data || {};

    // Fallback to submission data if base vendor profile fields are empty
    const vType = vendor.vendorType || subData.category || "";
    const vCity = vendor.city || subData.city || "";
    const vState = vendor.state || subData.state || "";

    setPForm({
      brandName: vendor.brandName || subData.brand_name || "",
      mobile: vendor.mobile || subData.mobile || "",
      city: vCity,
      vendorType: vType
    });

    if (vState) setSelectedState(vState);

    setFormData(vendor?.submission?.data && typeof vendor.submission.data === "object" ? vendor.submission.data : {});
  }, [vendor]);

  /* fetch enquiries */
  useEffect(() => {
    if (tab !== "enquiries") return;
    const token = localStorage.getItem("vendorToken");
    if (!token) return;
    setLoadingE(true);
    fetch(`${API_URL}/vendors/vendor-dashboard/enquiries`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.success) setEnquiries(d.data); })
      .catch(console.error).finally(() => setLoadingE(false));
  }, [tab]);

  /* fetch reviews for vendor dashboard */
  useEffect(() => {
    if (tab !== "review") return;
    const token = localStorage.getItem("vendorToken");
    if (!token) return;
    setLoadingR(true);
    // UPDATED URL - added /vendors/ prefix
    fetch(`${API_URL}/vendors/vendor/my-reviews`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json()).then(d => {
        if (d.success) {
          setReviews(d.data || []);
          if (d.summary) setRatingSummary(d.summary);
        }
      })
      .catch(console.error).finally(() => setLoadingR(false));
  }, [tab]);

  /* fetch payment transactions */
  useEffect(() => {
    if (tab !== "payments") return;
    const token = localStorage.getItem("vendorToken");
    if (!token) return;
    setLoadingT(true);
    fetch(`${API_URL}/vendor-billing/my-transactions`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.success) setTransactions(d.data || []); })
      .catch(console.error).finally(() => setLoadingT(false));
  }, [tab]);

  /* fetch subscription details */
  useEffect(() => {
    if (tab !== "myplan") return;
    const token = localStorage.getItem("vendorToken");
    if (!token) return;
    setLoadingSub(true);
    fetch(`${API_URL}/vendor-billing/my-subscription`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.success) setSubscription(d.subscription || null); })
      .catch(console.error).finally(() => setLoadingSub(false));
  }, [tab]);

  const profileFields = useMemo(() => {
    if (!vendor) return [];
    const subData = vendor.submission?.data || {};
    return [
      { key: "brandName", label: "Brand Name", value: vendor.brandName || subData.brand_name, editable: true },
      { key: "vendorType", label: "Vendor Type", value: vendor.vendorType || subData.category, editable: true, type: "select", options: categories },
      { key: "email", label: "Email", value: vendor.email || subData.email, editable: false },
      { key: "mobile", label: "Mobile", value: vendor.mobile || subData.mobile, editable: true },
      { key: "city", label: "City", value: vendor.city || subData.city, editable: true, type: "city_select" },
      { key: "createdAt", label: "Joined On", value: vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString() : "—", editable: false },
    ];
  }, [vendor, categories]);

  const subEntries = useMemo(() => {
    const p = editForm ? formData : vendor?.submission?.data;
    if (!p || typeof p !== "object") return [];
    return Object.entries(p).map(([k, v]) => ({ key: k, label: toTitle(k), value: fmt(v) }));
  }, [vendor, formData, editForm]);

  const docFiles = useMemo(() => {
    const f = vendor?.submission?.uploadedFiles;
    if (!f || typeof f !== "object") return [];
    return Object.entries(f).flatMap(([fk, vals]) =>
      Array.isArray(vals) ? vals.map((file, i) => ({
        id: `${fk}-${i}`, fieldKey: fk, name: file?.name || `File ${i + 1}`,
        url: file?.url?.startsWith("http") ? file.url : `${API_ORIGIN}${file?.url || ""}`,
      })) : []
    );
  }, [vendor]);

  const completion = useMemo(() => {
    const filled = profileFields.filter(f => f.value && f.value !== "—").length;
    return Math.round((filled / Math.max(profileFields.length, 1)) * 100);
  }, [profileFields]);

  const handleLogout = () => {
    localStorage.removeItem("vendorToken");
    localStorage.removeItem("vendorData");
    navigate("/");
  };

  const handleSaveProfile = async () => {
    const token = localStorage.getItem("vendorToken");
    setSavingP(true);
    try {
      const r = await fetch(`${API_URL}/vendor/me`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(pForm),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d?.success) throw new Error(d?.message || "Failed");
      setVendor(d.data);
      localStorage.setItem("vendorData", JSON.stringify(d.data || {}));
      setEditProfile(false);
    } catch (e) { toast.error(e.message); } finally { setSavingP(false); }
  };

  const handleUploadSlot = async (file, index) => {
    if (!file) return;

    // File validation
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    const fileType = file.type || "";
    const isAllowed = allowedTypes.includes(fileType) || file.name.match(/\.(jpg|jpeg|png|webp)$/i);

    if (!isAllowed) {
      toast.error("Unsupported file format! Please upload jpg, jpeg, png, or webp.");
      return;
    }

    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_SIZE) {
      toast.error("File is too large! Maximum limit is 2MB.");
      return;
    }

    setSlotLoading(prev => ({ ...prev, [index]: true }));
    const token = localStorage.getItem("vendorToken");
    const body = new FormData();
    body.append("fieldKey", "gallery");
    body.append("file", file);
    body.append("index", index);

    try {
      const res = await fetch(`${API_URL}/vendor-submissions/vendor_onboarding/upload`, {
        method: "POST",
        body,
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        toast.success(`Image uploaded successfully in slot ${index + 1}!`);
        await fetchVendorData(true); // silent refresh
      } else {
        toast.error(data.message || "Failed to upload image.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred during file upload.");
    } finally {
      setSlotLoading(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleDeleteSlot = async (index, fileMeta) => {
    if (!fileMeta || !fileMeta.publicId) return;

    setSlotLoading(prev => ({ ...prev, [index]: true }));
    const token = localStorage.getItem("vendorToken");

    try {
      const res = await fetch(`${API_URL}/vendor-submissions/vendor_onboarding/upload/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fieldKey: "gallery",
          index: index,
          publicId: fileMeta.publicId,
          resourceType: fileMeta.resourceType || "image",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        toast.success(`Image in slot ${index + 1} deleted successfully.`);
        await fetchVendorData(true); // silent refresh
      } else {
        toast.error(data.message || "Failed to delete image.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred during file deletion.");
    } finally {
      setSlotLoading(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleSaveForm = async () => {
    const token = localStorage.getItem("vendorToken");
    setSavingF(true);
    try {
      const body = { data: formData, uploadedFiles: vendor?.submission?.uploadedFiles || {} };
      const r1 = await fetch(`${API_URL}/vendor-submissions/${FORM_KEY}/draft`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body),
      });
      if (!r1.ok) throw new Error((await r1.json().catch(() => ({}))).message || "Failed to save");
      const r2 = await fetch(`${API_URL}/vendor-submissions/${FORM_KEY}/submit`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body),
      });
      if (!r2.ok) throw new Error((await r2.json().catch(() => ({}))).message || "Failed to submit");
      setVendor(p => ({ ...p, submission: { ...p?.submission, data: formData, status: "submitted" }, registrationStatus: "submitted" }));
      setEditForm(false);
    } catch (e) { toast.error(e.message); } finally { setSavingF(false); }
  };

  // Handle posting a reply to a review
  // Handle posting a reply to a review
  const handlePostReply = async (reviewId) => {
    if (!replyText.trim()) {
      toast.error("Please enter a reply");
      return;
    }

    const token = localStorage.getItem("vendorToken");
    setPostingReply(true);

    try {
      // UPDATED URL - added /vendors/ prefix
      const res = await fetch(`${API_URL}/vendors/vendor/reviews/${reviewId}/reply`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ vendorReply: replyText.trim() })
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Reply posted successfully");
        setReviews(prev => prev.map(review =>
          review._id === reviewId
            ? { ...review, vendorReply: replyText.trim(), vendorRepliedAt: new Date().toISOString() }
            : review
        ));
        setReplyText("");
        setReplyingTo(null);
      } else {
        toast.error(data.message || "Failed to post reply");
      }
    } catch (err) {
      console.error("Error posting reply:", err);
      toast.error("Something went wrong");
    } finally {
      setPostingReply(false);
    }
  };

  // Helper function to render star rating
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars = [];
    for (let i = 0; i < fullStars; i++) stars.push("★");
    if (hasHalfStar) stars.push("½");
    while (stars.length < 5) stars.push("☆");
    return (
      <span style={{ color: "#f59e0b", fontSize: 14, letterSpacing: 1 }}>
        {stars.join("")}
      </span>
    );
  };

  /* ── Loading ── */
  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fafaf8" }}>
      <div style={{ width: 32, height: 32, border: "2.5px solid #e5e7eb", borderTopColor: "#c2894b", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (!vendor) return null;

  const status = vendor.registrationStatus || "draft";
  const sMeta = STATUS[status] || STATUS.draft;
  const initial = (vendor.brandName || "V").charAt(0).toUpperCase();

  if (status === "submitted") {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #fffcf9 0%, #fff5f5 100%)",
        fontFamily: "'Inter',system-ui,sans-serif",
        color: "#1a1a1a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        boxSizing: "border-box"
      }}>
        <div style={{
          background: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(20px)",
          borderRadius: 32,
          padding: "50px 40px",
          maxWidth: 600,
          width: "100%",
          boxShadow: "0 20px 40px rgba(139, 94, 60, 0.08)",
          border: "1px solid rgba(255, 255, 255, 0.6)",
          textAlign: "center",
          boxSizing: "border-box"
        }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #fef3c7, #fde68a)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 40,
            margin: "0 auto 24px",
            animation: "pulse 2s infinite"
          }}>
            ⏳
          </div>

          <h2 style={{
            fontSize: 28,
            fontWeight: 800,
            color: "#854d0e",
            margin: "0 0 12px",
            fontFamily: "'Playfair Display', serif"
          }}>Application Under Review</h2>

          <p style={{
            fontSize: 15,
            lineHeight: 1.6,
            color: "#6b7280",
            margin: "0 0 32px"
          }}>
            Thank you for completing your registration and subscription! Your application has been successfully submitted to our team for approval. We are verifying your details and will activate your profile shortly.
          </p>

          <div style={{
            background: "#fffbeb",
            borderRadius: 16,
            padding: "16px 20px",
            border: "1px solid #fde68a",
            textAlign: "left",
            marginBottom: 32
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#854d0e", marginBottom: 6 }}>
              Onboarding Checklist:
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#16a34a", marginBottom: 6 }}>
              <span>✓</span> Email Verification Completed
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#16a34a", marginBottom: 6 }}>
              <span>✓</span> Profile Registration Completed
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#16a34a", marginBottom: 6 }}>
              <span>✓</span> Payment / Plan Activated
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#d97706" }}>
              <span style={{ display: "inline-block", animation: "spin_icon 1.5s linear infinite" }}>🔄</span> Admin Verification & Activation (Pending)
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              background: "#1c1917",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "12px 24px",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              transition: "opacity 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            Logout
          </button>
        </div>

        <style>{`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          @keyframes spin_icon {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#fafaf8", fontFamily: "'Inter',system-ui,sans-serif", color: "#1a1a1a" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
        @keyframes spin{to{transform:rotate(360deg)}}
        .vd-tab{border:none;cursor:pointer;transition:all .15s;background:transparent;white-space:nowrap}
        .vd-tab:hover{color:#c2894b!important}
        .vd-btn{border:none;cursor:pointer;font-family:inherit;font-size:13px;font-weight:500;border-radius:8px;padding:8px 16px;transition:opacity .15s}
        .vd-btn:hover{opacity:.85}
        .vd-input{width:100%;font-family:inherit;font-size:14px;padding:9px 13px;border:1.5px solid #e5e7eb;border-radius:8px;outline:none;box-sizing:border-box;background:#fff;color:#1a1a1a;transition:border-color .15s}
        .vd-input:focus{border-color:#c2894b}
        .vd-row:hover{background:#fdf8f3!important}
        .vd-enq:hover{border-color:#e8d5bc!important}

        /* ── Top bar layout ── */
        .vd-topbar{background:#fff;border-bottom:1px solid #f0ede8;padding:0 32px;display:flex;align-items:center;justify-content:space-between;height:60px;position:sticky;top:0;z-index:10;gap:16px}
        .vd-topbar-brand{display:flex;align-items:center;gap:10px;flex-shrink:0}
        .vd-topbar-tabs{display:flex;gap:2px}
        .vd-topbar-right{display:flex;align-items:center;gap:10px;flex-shrink:0}

        /* ── Grid helpers ── */
        .vd-grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
        .vd-grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
        .vd-grid-2{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}

        /* ── Body ── */
        .vd-body{max-width:860px;margin:0 auto;padding:28px 20px}

        /* ── Enquiry header ── */
        .vd-enq-header{display:flex;align-items:center;justify-content:space-between}
        .vd-enq-meta{display:flex;flex-direction:column;align-items:flex-end;gap:4px}
        .vd-enq-details{display:flex;gap:14px;flex-wrap:wrap}

        /* ── Mobile: up to 768px ── */
        @media(max-width:768px){
          .vd-topbar{flex-wrap:wrap;height:auto;padding:10px 16px;gap:8px}
          .vd-topbar-tabs{overflow-x:auto;-webkit-overflow-scrolling:touch;width:100%;order:3;gap:0;padding-bottom:2px}
          .vd-topbar-tabs::-webkit-scrollbar{display:none}
          .vd-topbar-right{margin-left:auto}
          .vd-grid-4{grid-template-columns:repeat(2,1fr)}
          .vd-grid-3{grid-template-columns:repeat(2,1fr)}
          .vd-body{padding:16px 12px}
          .vd-enq-header{flex-direction:column;align-items:flex-start;gap:8px}
          .vd-enq-meta{align-items:flex-start;flex-direction:row;gap:8px}
        }

        /* ── Mobile: up to 480px ── */
        @media(max-width:480px){
          .vd-topbar{padding:8px 12px}
          .vd-grid-4{grid-template-columns:1fr}
          .vd-grid-3{grid-template-columns:1fr}
          .vd-grid-2{grid-template-columns:1fr}
          .vd-body{padding:12px 8px}
          .vd-btn{font-size:12px;padding:7px 12px}
          .vd-enq-details{flex-direction:column;gap:6px}
        }

        /* ── Premium Image Slots Gallery ── */
        .img-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
          margin-top: 12px;
          margin-bottom: 24px;
        }
        .img-slot {
          position: relative;
          aspect-ratio: 1;
          border-radius: 12px;
          overflow: hidden;
          background: #fafaf8;
          border: 2px dashed #e2e0da;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          user-select: none;
        }
        .img-slot:hover {
          border-color: #c2894b;
          background: #fdfaf7;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(194, 137, 75, 0.08);
        }
        .img-slot-filled {
          border: 1px solid #f0ede8;
          border-style: solid;
          cursor: default;
        }
        .img-slot-filled:hover {
          transform: none;
          box-shadow: none;
        }
        .img-preview {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s;
        }
        .img-slot-filled:hover .img-preview {
          transform: scale(1.05);
        }
        .img-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          opacity: 0;
          transition: opacity 0.2s;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .img-slot-filled:hover .img-overlay {
          opacity: 1;
        }
        .img-btn {
          border: none;
          cursor: pointer;
          font-family: inherit;
          font-size: 11px;
          font-weight: 600;
          border-radius: 6px;
          padding: 6px 12px;
          transition: all 0.15s;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .img-btn-replace {
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255, 255, 255, 0.4);
        }
        .img-btn-replace:hover {
          background: rgba(255, 255, 255, 0.35);
        }
        .img-btn-delete {
          background: #dc2626;
        }
        .img-btn-delete:hover {
          background: #b91c1c;
        }
        .img-label-slot {
          position: absolute;
          bottom: 8px;
          left: 8px;
          background: rgba(0, 0, 0, 0.6);
          color: #fff;
          font-size: 9px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
          backdrop-filter: blur(2px);
          z-index: 1;
        }
        .img-loading-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid rgba(194, 137, 75, 0.2);
          border-top-color: #c2894b;
          border-radius: 50%;
          animation: spin .7s linear infinite;
        }
        .img-upload-icon {
          font-size: 20px;
          color: #a3a39e;
          margin-bottom: 4px;
          transition: color 0.2s;
        }
        .img-slot:hover .img-upload-icon {
          color: #c2894b;
        }
        .img-upload-text {
          font-size: 11px;
          font-weight: 500;
          color: #73736d;
          transition: color 0.2s;
        }
        .img-slot:hover .img-upload-text {
          color: #c2894b;
        }
        @media(max-width: 900px) {
          .img-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        @media(max-width: 768px) {
          .img-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
          }
        }
        @media(max-width: 480px) {
          .img-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
        }
      `}</style>

      {/* ── Top bar ── */}
      <div className="vd-topbar">
        {/* Brand */}
        <div className="vd-topbar-brand">
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#c2894b,#8b5e3c)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600, fontSize: 14 }}>
            {initial}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.2 }}>{vendor.brandName || "Vendor"}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="vd-topbar-tabs">
          {TABS.map(t => (
            <button key={t.id} className="vd-tab"
              onClick={() => setTab(t.id)}
              style={{
                padding: "6px 14px", borderRadius: 8, fontSize: 13,
                fontWeight: tab === t.id ? 600 : 400,
                color: tab === t.id ? "#c2894b" : "#6b7280",
                background: tab === t.id ? "#fdf8f3" : "transparent",
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Right side */}
        <div className="vd-topbar-right">
          <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 20, background: sMeta.bg, color: sMeta.color }}>
            {sMeta.label}
          </span>
          <button className="vd-btn" onClick={handleLogout}
            style={{ background: "#fef2f2", color: "#dc2626" }}>
            Logout
          </button>
        </div>
      </div>

      {/* ── Page body ── */}
      <div className="vd-body">

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="vd-grid-4">
              {[
                { label: "Status", value: sMeta.label },
                { label: "Completion", value: `${completion}%`, progress: true },
                { label: "Form Fields", value: subEntries.length },
                { label: "Documents", value: docFiles.length },
              ].map(s => (
                <div key={s.label} style={{ background: "#fff", border: "1px solid #f0ede8", borderRadius: 12, padding: "16px 18px" }}>
                  <div style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 600, color: "#1a1a1a", letterSpacing: "-.02em" }}>{s.value}</div>
                  {s.progress && (
                    <div style={{ marginTop: 8, height: 3, borderRadius: 2, background: "#f3f4f6" }}>
                      <div style={{ height: "100%", width: `${completion}%`, borderRadius: 2, background: "#c2894b" }} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ background: "#fff", border: "1px solid #f0ede8", borderRadius: 12, padding: "20px 22px" }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14, color: "#1a1a1a" }}>Profile Summary</div>
              <div className="vd-grid-3">
                {profileFields.map(f => (
                  <div key={f.key}>
                    <div style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>{f.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}>{f.value || "—"}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── PROFILE ── */}
        {tab === "profile" && (
          <div style={{ background: "#fff", border: "1px solid #f0ede8", borderRadius: 12, padding: "22px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>My Profile</div>
            </div>
            <div className="vd-grid-2">
              {profileFields.map(f => (
                <div key={f.key}>
                  <div style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5 }}>{f.label}</div>
                  <div style={{ fontSize: 13, color: "#1a1a1a", fontWeight: 500, padding: "9px 12px", background: "#fafaf8", borderRadius: 8, border: "1px solid #f0ede8" }}>{f.value || "—"}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SUBMISSION ── */}
        {tab === "submission" && (
          <div style={{ background: "#fff", border: "1px solid #f0ede8", borderRadius: 12, padding: "22px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Submitted Form</div>
              {subEntries.length > 0 && (
                !editForm
                  ? <button className="vd-btn" onClick={() => setEditForm(true)} style={{ background: "#fdf8f3", color: "#c2894b", border: "1px solid #e8d5bc" }}>Edit</button>
                  : <div style={{ display: "flex", gap: 8 }}>
                    <button className="vd-btn" style={{ background: "#f9fafb", color: "#6b7280" }} disabled={savingF}
                      onClick={() => { setEditForm(false); setFormData(vendor?.submission?.data || {}); }}>Cancel</button>
                    <button className="vd-btn" onClick={handleSaveForm} disabled={savingF}
                      style={{ background: "#c2894b", color: "#fff" }}>{savingF ? "Saving…" : "Save"}</button>
                  </div>
              )}
            </div>
            {subEntries.length === 0
              ? <Empty icon="📋" text="No form data submitted yet." />
              : <div className="vd-grid-2">
                {subEntries.map(e => (
                  <div key={e.key}>
                    <div style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5 }}>{e.label}</div>
                    {editForm
                      ? (isFieldUneditable(e.key) ? (
                        <div style={{ position: "relative" }}>
                          <input
                            className="vd-input"
                            value={formData[e.key] ?? ""}
                            disabled={true}
                            style={{ background: "#f5f5f4", color: "#a8a29e", cursor: "not-allowed", border: "1px solid #e7e5e4" }}
                          />
                          <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#a8a29e", display: "flex", alignItems: "center", gap: 4 }}>
                            🔒 Locked
                          </span>
                        </div>
                      ) : (
                        <input
                          className="vd-input"
                          value={formData[e.key] ?? ""}
                          onChange={ev => setFormData(p => ({ ...p, [e.key]: ev.target.value }))}
                        />
                      ))
                      : <div style={{ fontSize: 13, color: "#1a1a1a", fontWeight: 500, padding: "9px 12px", background: "#fafaf8", borderRadius: 8, border: "1px solid #f0ede8" }}>{e.value}</div>
                    }
                  </div>
                ))}
              </div>
            }
          </div>
        )}

        {/* ── DOCUMENTS ── */}
        {tab === "documents" && (() => {
          // Parse gallery files (up to 10 slots)
          const f = vendor?.submission?.uploadedFiles?.gallery;
          const galleryFiles = Array.isArray(f) ? [...f] : f ? [f] : [];
          while (galleryFiles.length < 10) galleryFiles.push(null);

          // Parse other non-gallery files
          const otherFiles = [];
          const filesMap = vendor?.submission?.uploadedFiles || {};
          Object.entries(filesMap).forEach(([fk, vals]) => {
            if (fk === "gallery") return;
            if (Array.isArray(vals)) {
              vals.forEach((file, i) => {
                if (file) {
                  otherFiles.push({
                    id: `${fk}-${i}`,
                    fieldKey: fk,
                    name: file.name || `${toTitle(fk)} File ${i + 1}`,
                    url: file.url?.startsWith("http") ? file.url : `${API_ORIGIN}${file.url || ""}`,
                  });
                }
              });
            } else if (vals) {
              otherFiles.push({
                id: `${fk}-0`,
                fieldKey: fk,
                name: vals.name || toTitle(fk),
                url: vals.url?.startsWith("http") ? vals.url : `${API_ORIGIN}${vals.url || ""}`,
              });
            }
          });

          const totalUploaded = galleryFiles.filter(Boolean).length;

          return (
            <div style={{ background: "#fff", border: "1px solid #f0ede8", borderRadius: 12, padding: "22px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#1a1a1a" }}>Portfolio Gallery</div>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#c2894b", background: "#fdf8f3", padding: "4px 10px", borderRadius: 20, border: "1px solid #e8d5bc" }}>
                  {totalUploaded} / 10 Images
                </span>
              </div>
              <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 16px" }}>
                Upload up to 10 high-quality images. Allowed formats: JPG, JPEG, PNG, WEBP. Max size: 2MB per file.
              </p>

              {/* Grid of 10 slots */}
              <div className="img-grid">
                {galleryFiles.map((file, idx) => {
                  const isLoading = !!slotLoading[idx];
                  const url = file?.url?.startsWith("http") ? file.url : file?.url ? `${API_ORIGIN}${file.url}` : null;

                  if (isLoading) {
                    return (
                      <div key={idx} className="img-slot img-slot-filled" style={{ pointerEvents: "none" }}>
                        <div className="img-loading-spinner" />
                        <span className="img-label-slot">Slot {idx + 1}</span>
                      </div>
                    );
                  }

                  if (url) {
                    return (
                      <div key={idx} className="img-slot img-slot-filled">
                        <img src={url} alt={`Gallery slot ${idx + 1}`} className="img-preview" />
                        <span className="img-label-slot">Slot {idx + 1}</span>
                        <div className="img-overlay">
                          <button
                            type="button"
                            className="img-btn img-btn-replace"
                            onClick={() => document.getElementById(`gallery-upload-${idx}`).click()}
                          >
                            🔄 Replace
                          </button>
                          <button
                            type="button"
                            className="img-btn img-btn-delete"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete the image in Slot ${idx + 1}?`)) {
                                handleDeleteSlot(idx, file);
                              }
                            }}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                        {/* Hidden file input for Replace */}
                        <input
                          type="file"
                          id={`gallery-upload-${idx}`}
                          style={{ display: "none" }}
                          accept="image/jpeg,image/png,image/webp,image/jpg"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleUploadSlot(e.target.files[0], idx);
                            }
                            e.target.value = "";
                          }}
                        />
                      </div>
                    );
                  }

                  return (
                    <div key={idx} className="img-slot" onClick={() => document.getElementById(`gallery-upload-${idx}`).click()}>
                      <div className="img-upload-icon">📸</div>
                      <div className="img-upload-text">Upload Image</div>
                      <span className="img-label-slot" style={{ background: "rgba(0, 0, 0, 0.4)" }}>Slot {idx + 1}</span>
                      <input
                        type="file"
                        id={`gallery-upload-${idx}`}
                        style={{ display: "none" }}
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleUploadSlot(e.target.files[0], idx);
                          }
                          e.target.value = "";
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Other Documents Section */}
              {otherFiles.length > 0 && (
                <div style={{ marginTop: 32, borderTop: "1px solid #f0ede8", paddingTop: 20 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#1a1a1a", marginBottom: 12 }}>Other Verification Documents</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {otherFiles.map(f => (
                      <a key={f.id} href={f.url} target="_blank" rel="noreferrer" className="vd-row"
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 13px", borderRadius: 10, border: "1px solid #f0ede8", textDecoration: "none", background: "#fafaf8", transition: "background .15s" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 30, height: 30, borderRadius: 7, background: "#fdf8f3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>📄</div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}>{f.name}</div>
                            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>{toTitle(f.fieldKey)}</div>
                          </div>
                        </div>
                        <span style={{ fontSize: 12, color: "#c2894b", fontWeight: 600 }}>View →</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── ENQUIRIES ── */}
        {tab === "enquiries" && (
          <div style={{ background: "#fff", border: "1px solid #f0ede8", borderRadius: 12, padding: "22px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Leads & Enquiries</div>
              {enquiries.length > 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#eff6ff", color: "#1d4ed8" }}>
                  {enquiries.filter(e => e.status === "new").length} new
                </span>
              )}
            </div>

            {loadingE
              ? <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af", fontSize: 13 }}>Loading…</div>
              : enquiries.length === 0
                ? <Empty icon="📨" text="No leads yet. Enquiries will appear here." />
                : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {enquiries.map(enq => {
                    const eMap = {
                      new: { label: "New", bg: "#eff6ff", c: "#1d4ed8" },
                      viewed: { label: "Viewed", bg: "#fffbeb", c: "#b45309" },
                      booked: { label: "Booked", bg: "#f0fdf4", c: "#166534" },
                    };
                    const em = eMap[enq.status] || { label: enq.status, bg: "#f9fafb", c: "#374151" };
                    return (
                      <div key={enq._id} className="vd-enq"
                        style={{ border: "1px solid #f0ede8", borderRadius: 11, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10, transition: "border-color .15s", background: "#fff" }}>
                        {/* Header */}
                        <div className="vd-enq-header">
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#c2894b,#8b5e3c)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600, fontSize: 14, flexShrink: 0 }}>
                              {(enq.name || "U").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13, color: "#1a1a1a" }}>{enq.name}</div>
                              <div style={{ fontSize: 11, color: "#6b7280", marginTop: 1 }}>{enq.phone}{enq.email ? ` · ${enq.email}` : ""}</div>
                            </div>
                          </div>
                          <div className="vd-enq-meta">
                            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: em.bg, color: em.c }}>{em.label}</span>
                            <span style={{ fontSize: 11, color: "#9ca3af" }}>{new Date(enq.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* Registered user pill */}
                        {enq.userId && (
                          <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#fafaf8", borderRadius: 7, padding: "5px 9px", border: "1px solid #f0ede8" }}>
                            <img
                              src={enq.userId.profileImage?.startsWith("http") ? enq.userId.profileImage : enq.userId.profileImage ? `${API_ORIGIN}${enq.userId.profileImage}` : "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                              alt="" style={{ width: 18, height: 18, borderRadius: "50%", objectFit: "cover" }} />
                            <span style={{ fontSize: 11, color: "#6b7280" }}>
                              <b>Registered:</b> {enq.userId.name}{enq.userId.email ? ` (${enq.userId.email})` : ""}
                            </span>
                          </div>
                        )}

                        {/* Body */}
                        {!enq.contactViewed ? (
                          <>
                            <div className="vd-enq-details">
                              {[["Event", enq.eventType], ["Date", enq.eventDate ? new Date(enq.eventDate).toLocaleDateString() : null], ["Guests", enq.guestCount], ["Budget", enq.budget]]
                                .filter(([, v]) => v).map(([l, v]) => (
                                  <div key={l} style={{ fontSize: 12 }}>
                                    <span style={{ color: "#9ca3af" }}>{l}: </span>
                                    <span style={{ fontWeight: 600, color: "#374151", textTransform: "capitalize" }}>{v}</span>
                                  </div>
                                ))}
                            </div>
                            {enq.message && (
                              <div style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.6, background: "#fafaf8", borderRadius: 8, padding: "9px 12px", border: "1px solid #f0ede8" }}>
                                {enq.message}
                              </div>
                            )}
                          </>
                        ) : (
                          <div style={{ fontSize: 12, color: "#92400e", background: "#fffbeb", borderRadius: 8, padding: "8px 12px", border: "1px solid #fde68a" }}>
                            👀 User viewed your contact — reach out now!
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
            }
          </div>
        )}

        {/* ── REVIEWS ── */}
        {tab === "review" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {loadingR
              ? <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af", fontSize: 13 }}>Loading reviews…</div>
              : reviews.length === 0
                ? <Empty icon="⭐" text="No reviews yet. Customer feedback will appear here." />
                : <>
                  {/* Rating Summary Card */}
                  {ratingSummary && ratingSummary.totalReviews > 0 && (
                    <div style={{ background: "#fff", border: "1px solid #f0ede8", borderRadius: 12, padding: "22px 24px", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 36, fontWeight: 700, color: "#1a1a1a" }}>{ratingSummary.averageRating.toFixed(1)}</div>
                          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                            {renderStars(ratingSummary.averageRating)}
                          </div>
                          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>Based on {ratingSummary.totalReviews} reviews</div>
                        </div>
                        <div style={{ flex: 1 }}>
                          {[5, 4, 3, 2, 1].map(star => {
                            const count = ratingSummary.ratingDistribution?.[star] || 0;
                            const percentage = ratingSummary.totalReviews > 0 ? (count / ratingSummary.totalReviews) * 100 : 0;
                            return (
                              <div key={star} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                <span style={{ fontSize: 12, width: 30 }}>{star}★</span>
                                <div style={{ flex: 1, height: 6, background: "#f0ede8", borderRadius: 3, overflow: "hidden" }}>
                                  <div style={{ width: `${percentage}%`, height: "100%", background: "#f59e0b", borderRadius: 3 }} />
                                </div>
                                <span style={{ fontSize: 11, color: "#6b7280", width: 36 }}>{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Individual Reviews */}
                  <div style={{ background: "#fff", border: "1px solid #f0ede8", borderRadius: 12, padding: "22px 24px" }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Customer Reviews</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {reviews.map(review => (
                        <div key={review._id} className="vd-enq"
                          style={{ border: "1px solid #f0ede8", borderRadius: 11, padding: "14px 16px", background: "#fff" }}>
                          {/* Header */}
                          <div className="vd-enq-header">
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#c2894b,#8b5e3c)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600, fontSize: 14, flexShrink: 0 }}>
                                {(review.user?.name || "U").charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 13, color: "#1a1a1a" }}>{review.user?.name || "Anonymous"}</div>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                                  {renderStars(review.rating)}
                                  <span style={{ fontSize: 11, color: "#9ca3af" }}>· {new Date(review.createdAt).toLocaleDateString()}</span>
                                  {review.isVerified && (
                                    <span style={{ fontSize: 10, color: "#16a34a", background: "#f0fdf4", padding: "2px 6px", borderRadius: 4 }}>✓ Verified</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Review Title */}
                          {review.title && (
                            <div style={{ fontWeight: 600, fontSize: 13, color: "#1a1a1a", marginTop: 6 }}>{review.title}</div>
                          )}

                          {/* Review Comment */}
                          {review.comment && (
                            <div style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.5, marginTop: 4 }}>
                              {review.comment}
                            </div>
                          )}

                          {/* Event Info */}
                          {(review.eventDate || review.eventType) && (
                            <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 11, color: "#6b7280", flexWrap: "wrap" }}>
                              {review.eventType && <span>🎉 {toTitle(review.eventType)}</span>}
                              {review.eventDate && <span>📅 {new Date(review.eventDate).toLocaleDateString()}</span>}
                            </div>
                          )}

                          {/* Review Images */}
                          {review.images && review.images.length > 0 && (
                            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                              {review.images.map((img, idx) => (
                                <img
                                  key={idx}
                                  src={img.url?.startsWith("http") ? img.url : `${API_ORIGIN}${img.url}`}
                                  alt="Review"
                                  style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8, border: "1px solid #f0ede8", cursor: "pointer" }}
                                  onClick={() => window.open(img.url?.startsWith("http") ? img.url : `${API_ORIGIN}${img.url}`, "_blank")}
                                />
                              ))}
                            </div>
                          )}

                          {/* Helpful Count */}
                          {review.helpfulCount > 0 && (
                            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>
                              👍 {review.helpfulCount} people found this helpful
                            </div>
                          )}

                          {/* Vendor Reply */}
                          {review.vendorReply && (
                            <div style={{ marginTop: 10, background: "#fdf8f3", borderRadius: 8, padding: "10px 12px", borderLeft: `3px solid #c2894b` }}>
                              <div style={{ fontSize: 11, fontWeight: 600, color: "#c2894b", marginBottom: 4 }}>
                                Your Reply:
                                {review.vendorRepliedAt && (
                                  <span style={{ fontSize: 10, fontWeight: "normal", marginLeft: 8, color: "#9ca3af" }}>
                                    {new Date(review.vendorRepliedAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: 12, color: "#374151" }}>{review.vendorReply}</div>
                            </div>
                          )}

                          {/* Reply Input (for vendor to respond) */}
                          {!review.vendorReply && (
                            <div style={{ marginTop: 10 }}>
                              {replyingTo === review._id ? (
                                <div>
                                  <textarea
                                    placeholder="Write a reply to this review..."
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    style={{ width: "100%", fontFamily: "inherit", fontSize: 12, padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 8, resize: "vertical", minHeight: 60 }}
                                    autoFocus
                                  />
                                  <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                                    <button
                                      className="vd-btn"
                                      onClick={() => handlePostReply(review._id)}
                                      disabled={postingReply}
                                      style={{ background: "#c2894b", color: "#fff", padding: "5px 12px", fontSize: 12 }}>
                                      {postingReply ? "Posting..." : "Post Reply"}
                                    </button>
                                    <button
                                      className="vd-btn"
                                      onClick={() => {
                                        setReplyingTo(null);
                                        setReplyText("");
                                      }}
                                      style={{ background: "#f9fafb", color: "#6b7280", padding: "5px 12px", fontSize: 12 }}>
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  className="vd-btn"
                                  onClick={() => setReplyingTo(review._id)}
                                  style={{ background: "#fdf8f3", color: "#c2894b", border: "1px solid #e8d5bc", padding: "5px 12px", fontSize: 12 }}>
                                  Reply to Review
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
            }
          </div>
        )}

        {/* ── MY PLAN ── */}
        {tab === "myplan" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {loadingSub
              ? <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af", fontSize: 13 }}>Loading…</div>
              : !subscription
                ? <div style={{ background: "#fff", border: "1px solid #f0ede8", borderRadius: 12, padding: "22px 24px" }}>
                  <Empty icon="📦" text="No active subscription. Choose a plan to get started." />
                  <div style={{ textAlign: "center", marginTop: 4 }}>
                    <button className="vd-btn" onClick={() => navigate("/wedding-shop/plans")}
                      style={{ background: "#c2894b", color: "#fff" }}>Browse Plans</button>
                  </div>
                </div>
                : <>
                  {/* Plan header card */}
                  <div style={{ background: "#fff", border: "1px solid #f0ede8", borderRadius: 12, padding: "22px 24px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg,#c2894b,#8b5e3c)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600, fontSize: 18, flexShrink: 0 }}>
                          👑
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 16, color: "#1a1a1a" }}>{subscription.planId?.planName || "—"}</div>
                          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2, textTransform: "capitalize" }}>
                            {subscription.planId?.planCode || ""} · {subscription.planId?.billingCycle || ""}
                          </div>
                        </div>
                      </div>
                      {(() => {
                        const ss = SUB_STATUS[subscription.status] || SUB_STATUS.CANCELLED;
                        return <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: ss.bg, color: ss.color }}>{ss.label}</span>;
                      })()}
                    </div>

                    {/* Details grid */}
                    <div className="vd-grid-3">
                      {[
                        { label: "Price", value: subscription.planId?.price != null ? `${subscription.planId.price.toFixed(2)} USD` : "—" },
                        { label: "Amount Paid", value: subscription.amountPaid != null ? `${subscription.amountPaid.toFixed(2)} USD` : "—" },
                        { label: "Payment Status", value: subscription.paymentStatus || "—" },
                        { label: "Period Start", value: subscription.currentPeriodStart ? new Date(subscription.currentPeriodStart).toLocaleDateString() : "—" },
                        { label: "Period End", value: subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : "—" },
                        {
                          label: "Days Remaining", value: (() => {
                            if (!subscription.currentPeriodEnd || subscription.status !== "ACTIVE") return "—";
                            const diff = Math.ceil((new Date(subscription.currentPeriodEnd) - new Date()) / (1000 * 60 * 60 * 24));
                            return diff > 0 ? `${diff} days` : "Expired";
                          })()
                        },
                      ].map(f => (
                        <div key={f.label}>
                          <div style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>{f.label}</div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a", padding: "9px 12px", background: "#fafaf8", borderRadius: 8, border: "1px solid #f0ede8" }}>{f.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment ID */}
                  {subscription.paymentId && (
                    <div style={{ background: "#fff", border: "1px solid #f0ede8", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 14 }}>🧾</span>
                      <div>
                        <div style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 2 }}>Payment ID</div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a", wordBreak: "break-all" }}>{subscription.paymentId}</div>
                      </div>
                    </div>
                  )}

                  {/* Features list */}
                  {subscription.planId?.features?.length > 0 && (
                    <div style={{ background: "#fff", border: "1px solid #f0ede8", borderRadius: 12, padding: "22px 24px" }}>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14, color: "#1a1a1a" }}>Plan Features</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {subscription.planId.features.map((feat, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#fafaf8", borderRadius: 8, border: "1px solid #f0ede8" }}>
                            <span style={{ color: "#16a34a", fontSize: 14, flexShrink: 0 }}>✓</span>
                            <span style={{ fontSize: 13, color: "#374151" }}>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Subscription timestamps */}
                  <div style={{ background: "#fff", border: "1px solid #f0ede8", borderRadius: 12, padding: "16px 20px" }}>
                    <div className="vd-grid-2">
                      <div>
                        <div style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Subscribed On</div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}>{subscription.createdAt ? new Date(subscription.createdAt).toLocaleString() : "—"}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Last Updated</div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}>{subscription.updatedAt ? new Date(subscription.updatedAt).toLocaleString() : "—"}</div>
                      </div>
                    </div>
                  </div>
                </>
            }
          </div>
        )}

        {/* ── PAYMENTS ── */}
        {tab === "payments" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: "#fff", border: "1px solid #f0ede8", borderRadius: 12, padding: "22px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Payment History</div>
                {transactions.length > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#f0fdf4", color: "#16a34a" }}>
                    {transactions.filter(t => t.status === "COMPLETED").length} completed
                  </span>
                )}
              </div>

              {loadingT
                ? <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af", fontSize: 13 }}>Loading…</div>
                : transactions.length === 0
                  ? <Empty icon="💳" text="No payment transactions yet." />
                  : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {transactions.map(txn => {
                      const ts = TXN_STATUS[txn.status] || { label: txn.status, color: "#6b7280", bg: "#f9fafb" };
                      const planName = txn.planId?.planName || "—";
                      const billingCycle = txn.planId?.billingCycle || "";
                      return (
                        <div key={txn._id} className="vd-enq"
                          style={{ border: "1px solid #f0ede8", borderRadius: 11, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10, transition: "border-color .15s", background: "#fff" }}>
                          {/* Header row */}
                          <div className="vd-enq-header">
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#c2894b,#8b5e3c)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600, fontSize: 16, flexShrink: 0 }}>
                                💳
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 13, color: "#1a1a1a" }}>{planName}</div>
                                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 1, textTransform: "capitalize" }}>
                                  {billingCycle}{txn.transactionType ? ` · ${toTitle(txn.transactionType)}` : ""}
                                </div>
                              </div>
                            </div>
                            <div className="vd-enq-meta">
                              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: ts.bg, color: ts.color }}>{ts.label}</span>
                              <span style={{ fontSize: 11, color: "#9ca3af" }}>{new Date(txn.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>

                          {/* Details row */}
                          <div className="vd-enq-details">
                            {[[
                              "Amount",
                              txn.amount != null ? `${txn.currency || "USD"} ${txn.amount.toFixed(2)}` : null
                            ], [
                              "Gateway", txn.paymentGateway
                            ], [
                              "Order ID", txn.gatewayOrderId
                            ]].filter(([, v]) => v).map(([l, v]) => (
                              <div key={l} style={{ fontSize: 12 }}>
                                <span style={{ color: "#9ca3af" }}>{l}: </span>
                                <span style={{ fontWeight: 600, color: "#374151" }}>{v}</span>
                              </div>
                            ))}
                          </div>

                          {/* Coupon pill */}
                          {txn.appliedCoupon?.code && (
                            <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#f5f3ff", borderRadius: 7, padding: "5px 9px", border: "1px solid #e9e5ff" }}>
                              <span style={{ fontSize: 13 }}>🏷️</span>
                              <span style={{ fontSize: 11, color: "#6b7280" }}>
                                <b>Coupon:</b> {txn.appliedCoupon.code}
                                {txn.appliedCoupon.discountAmount ? ` (−${txn.appliedCoupon.discountAmount})` : ""}
                              </span>
                            </div>
                          )}

                          {/* Failure reason */}
                          {txn.failureReason && (
                            <div style={{ fontSize: 12, color: "#dc2626", background: "#fef2f2", borderRadius: 8, padding: "8px 12px", border: "1px solid #fecaca" }}>
                              ⚠️ {txn.failureReason}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
              }
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function Empty({ icon, text }) {
  return (
    <div style={{ textAlign: "center", padding: "44px 0", color: "#9ca3af" }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 13 }}>{text}</div>
    </div>
  );
}