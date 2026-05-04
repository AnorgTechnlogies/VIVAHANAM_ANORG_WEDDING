import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_KEY || "http://localhost:8000/api";
const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");
const FORM_KEY = "vendor_onboarding";

const STATUS = {
  approved: { label: "Approved", color: "#16a34a", bg: "#f0fdf4" },
  rejected: { label: "Rejected", color: "#dc2626", bg: "#fef2f2" },
  submitted: { label: "Under Review", color: "#d97706", bg: "#fffbeb" },
  draft:    { label: "Draft", color: "#6b7280", bg: "#f9fafb" },
};

const toTitle = (v = "") =>
  v.toString().replace(/_/g, " ").trim().replace(/\b\w/g, (s) => s.toUpperCase());

const fmt = (v) => {
  if (v === null || v === undefined || v === "") return "—";
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
};

const TABS = [
  { id: "overview",   label: "Overview" },
  { id: "profile",    label: "Profile" },
  { id: "submission", label: "Form" },
  { id: "documents",  label: "Documents" },
  { id: "enquiries",  label: "Enquiries" },
];

export default function VendorDashboard() {
  const navigate = useNavigate();
  const [vendor, setVendor]           = useState(null);
  const [loading, setLoading]         = useState(true);
  const [tab, setTab]                 = useState("overview");

  const [editProfile, setEditProfile] = useState(false);
  const [savingP, setSavingP]         = useState(false);
  const [pForm, setPForm]             = useState({ brandName:"", mobile:"", city:"", vendorType:"" });

  const [editForm, setEditForm]       = useState(false);
  const [formData, setFormData]       = useState({});
  const [savingF, setSavingF]         = useState(false);

  const [enquiries, setEnquiries]     = useState([]);
  const [loadingE, setLoadingE]       = useState(false);

  /* fetch vendor */
  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("vendorToken");
      if (!token) { navigate("/wedding-shop/vendor-auth"); return; }
      try {
        const r = await fetch(`${API_URL}/vendor/me`, { headers: { Authorization: `Bearer ${token}` } });
        const d = await r.json();
        if (!r.ok || !d?.success) throw new Error();
        setVendor(d.data);
      } catch {
        localStorage.removeItem("vendorToken");
        navigate("/wedding-shop/vendor-auth");
      } finally { setLoading(false); }
    })();
  }, [navigate]);

  useEffect(() => {
    if (!vendor) return;
    setPForm({ brandName: vendor.brandName||"", mobile: vendor.mobile||"", city: vendor.city||"", vendorType: vendor.vendorType||"" });
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

  const profileFields = useMemo(() => !vendor ? [] : [
    { key:"brandName",  label:"Brand Name",   value: vendor.brandName,   editable: true },
    { key:"vendorType", label:"Vendor Type",   value: vendor.vendorType,  editable: true },
    { key:"email",      label:"Email",         value: vendor.email,       editable: false },
    { key:"mobile",     label:"Mobile",        value: vendor.mobile,      editable: true },
    { key:"city",       label:"City",          value: vendor.city,        editable: true },
    { key:"createdAt",  label:"Joined On",     value: vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString() : "—", editable: false },
  ], [vendor]);

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
        id: `${fk}-${i}`, fieldKey: fk, name: file?.name || `File ${i+1}`,
        url: file?.url?.startsWith("http") ? file.url : `${API_ORIGIN}${file?.url||""}`,
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
        method:"PUT", headers:{"Content-Type":"application/json", Authorization:`Bearer ${token}`},
        body: JSON.stringify(pForm),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d?.success) throw new Error(d?.message || "Failed");
      setVendor(d.data);
      localStorage.setItem("vendorData", JSON.stringify(d.data||{}));
      setEditProfile(false);
    } catch(e) { alert(e.message); } finally { setSavingP(false); }
  };

  const handleSaveForm = async () => {
    const token = localStorage.getItem("vendorToken");
    setSavingF(true);
    try {
      const body = { data: formData, uploadedFiles: vendor?.submission?.uploadedFiles || {} };
      const r1 = await fetch(`${API_URL}/vendor-submissions/${FORM_KEY}/draft`, {
        method:"PUT", headers:{"Content-Type":"application/json", Authorization:`Bearer ${token}`}, body:JSON.stringify(body),
      });
      if (!r1.ok) throw new Error((await r1.json().catch(()=>({}))).message || "Failed to save");
      const r2 = await fetch(`${API_URL}/vendor-submissions/${FORM_KEY}/submit`, {
        method:"POST", headers:{"Content-Type":"application/json", Authorization:`Bearer ${token}`}, body:JSON.stringify(body),
      });
      if (!r2.ok) throw new Error((await r2.json().catch(()=>({}))).message || "Failed to submit");
      setVendor(p => ({ ...p, submission: { ...p?.submission, data: formData, status:"submitted" }, registrationStatus:"submitted" }));
      setEditForm(false);
    } catch(e) { alert(e.message); } finally { setSavingF(false); }
  };

  /* ── Loading ── */
  if (loading) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#fafaf8"}}>
      <div style={{width:32,height:32,border:"2.5px solid #e5e7eb",borderTopColor:"#c2894b",borderRadius:"50%",animation:"spin .7s linear infinite"}} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (!vendor) return null;

  const status = vendor.registrationStatus || "draft";
  const sMeta  = STATUS[status] || STATUS.draft;
  const initial = (vendor.brandName || "V").charAt(0).toUpperCase();

  return (
    <div style={{minHeight:"100vh",background:"#fafaf8",fontFamily:"'Inter',system-ui,sans-serif",color:"#1a1a1a"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
        @keyframes spin{to{transform:rotate(360deg)}}
        .vd-tab{border:none;cursor:pointer;transition:all .15s;background:transparent}
        .vd-tab:hover{color:#c2894b!important}
        .vd-btn{border:none;cursor:pointer;font-family:inherit;font-size:13px;font-weight:500;border-radius:8px;padding:8px 16px;transition:opacity .15s}
        .vd-btn:hover{opacity:.85}
        .vd-input{width:100%;font-family:inherit;font-size:14px;padding:9px 13px;border:1.5px solid #e5e7eb;border-radius:8px;outline:none;box-sizing:border-box;background:#fff;color:#1a1a1a;transition:border-color .15s}
        .vd-input:focus{border-color:#c2894b}
        .vd-row:hover{background:#fdf8f3!important}
        .vd-enq:hover{border-color:#e8d5bc!important}
      `}</style>

      {/* ── Top bar ── */}
      <div style={{background:"#fff",borderBottom:"1px solid #f0ede8",padding:"0 32px",display:"flex",alignItems:"center",justifyContent:"space-between",height:60,position:"sticky",top:0,zIndex:10,gap:16}}>
        {/* Brand */}
        <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
          <div style={{width:34,height:34,borderRadius:"50%",background:"linear-gradient(135deg,#c2894b,#8b5e3c)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:600,fontSize:14}}>
            {initial}
          </div>
          <div>
            <div style={{fontWeight:600,fontSize:14,lineHeight:1.2}}>{vendor.brandName || "Vendor"}</div>
            <div style={{fontSize:11,color:"#9ca3af"}}>{vendor.vendorType || "—"}</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",gap:2}}>
          {TABS.map(t => (
            <button key={t.id} className="vd-tab"
              onClick={() => setTab(t.id)}
              style={{
                padding:"6px 14px",borderRadius:8,fontSize:13,
                fontWeight: tab===t.id ? 600 : 400,
                color: tab===t.id ? "#c2894b" : "#6b7280",
                background: tab===t.id ? "#fdf8f3" : "transparent",
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Right side */}
        <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
          <span style={{fontSize:12,fontWeight:600,padding:"4px 10px",borderRadius:20,background:sMeta.bg,color:sMeta.color}}>
            {sMeta.label}
          </span>
          <button className="vd-btn" onClick={handleLogout}
            style={{background:"#fef2f2",color:"#dc2626"}}>
            Logout
          </button>
        </div>
      </div>

      {/* ── Page body ── */}
      <div style={{maxWidth:860,margin:"0 auto",padding:"28px 20px"}}>

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
              {[
                { label:"Status",       value: sMeta.label },
                { label:"Completion",   value:`${completion}%`, progress:true },
                { label:"Form Fields",  value: subEntries.length },
                { label:"Documents",    value: docFiles.length },
              ].map(s => (
                <div key={s.label} style={{background:"#fff",border:"1px solid #f0ede8",borderRadius:12,padding:"16px 18px"}}>
                  <div style={{fontSize:11,color:"#9ca3af",textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>{s.label}</div>
                  <div style={{fontSize:22,fontWeight:600,color:"#1a1a1a",letterSpacing:"-.02em"}}>{s.value}</div>
                  {s.progress && (
                    <div style={{marginTop:8,height:3,borderRadius:2,background:"#f3f4f6"}}>
                      <div style={{height:"100%",width:`${completion}%`,borderRadius:2,background:"#c2894b"}} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{background:"#fff",border:"1px solid #f0ede8",borderRadius:12,padding:"20px 22px"}}>
              <div style={{fontWeight:600,fontSize:14,marginBottom:14,color:"#1a1a1a"}}>Profile Summary</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
                {profileFields.map(f => (
                  <div key={f.key}>
                    <div style={{fontSize:11,color:"#9ca3af",textTransform:"uppercase",letterSpacing:".06em",marginBottom:3}}>{f.label}</div>
                    <div style={{fontSize:13,fontWeight:500,color:"#1a1a1a"}}>{f.value||"—"}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── PROFILE ── */}
        {tab === "profile" && (
          <div style={{background:"#fff",border:"1px solid #f0ede8",borderRadius:12,padding:"22px 24px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
              <div style={{fontWeight:600,fontSize:14}}>My Profile</div>
              {!editProfile
                ? <button className="vd-btn" onClick={() => setEditProfile(true)} style={{background:"#fdf8f3",color:"#c2894b",border:"1px solid #e8d5bc"}}>Edit</button>
                : <div style={{display:"flex",gap:8}}>
                    <button className="vd-btn" style={{background:"#f9fafb",color:"#6b7280"}} disabled={savingP}
                      onClick={() => { setEditProfile(false); setPForm({brandName:vendor.brandName||"",mobile:vendor.mobile||"",city:vendor.city||"",vendorType:vendor.vendorType||""}); }}>
                      Cancel
                    </button>
                    <button className="vd-btn" onClick={handleSaveProfile} disabled={savingP}
                      style={{background:"#c2894b",color:"#fff"}}>
                      {savingP ? "Saving…" : "Save"}
                    </button>
                  </div>
              }
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:14}}>
              {profileFields.map(f => (
                <div key={f.key}>
                  <div style={{fontSize:11,color:"#9ca3af",textTransform:"uppercase",letterSpacing:".06em",marginBottom:5}}>{f.label}</div>
                  {editProfile && f.editable
                    ? <input className="vd-input" value={pForm[f.key]||""} onChange={e => setPForm(p=>({...p,[f.key]:e.target.value}))} />
                    : <div style={{fontSize:13,color:"#1a1a1a",fontWeight:500,padding:"9px 12px",background:"#fafaf8",borderRadius:8,border:"1px solid #f0ede8"}}>{f.value||"—"}</div>
                  }
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SUBMISSION ── */}
        {tab === "submission" && (
          <div style={{background:"#fff",border:"1px solid #f0ede8",borderRadius:12,padding:"22px 24px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
              <div style={{fontWeight:600,fontSize:14}}>Submitted Form</div>
              {subEntries.length > 0 && (
                !editForm
                  ? <button className="vd-btn" onClick={() => setEditForm(true)} style={{background:"#fdf8f3",color:"#c2894b",border:"1px solid #e8d5bc"}}>Edit</button>
                  : <div style={{display:"flex",gap:8}}>
                      <button className="vd-btn" style={{background:"#f9fafb",color:"#6b7280"}} disabled={savingF}
                        onClick={() => { setEditForm(false); setFormData(vendor?.submission?.data||{}); }}>Cancel</button>
                      <button className="vd-btn" onClick={handleSaveForm} disabled={savingF}
                        style={{background:"#c2894b",color:"#fff"}}>{savingF ? "Saving…" : "Save"}</button>
                    </div>
              )}
            </div>
            {subEntries.length === 0
              ? <Empty icon="📋" text="No form data submitted yet." />
              : <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:14}}>
                  {subEntries.map(e => (
                    <div key={e.key}>
                      <div style={{fontSize:11,color:"#9ca3af",textTransform:"uppercase",letterSpacing:".06em",marginBottom:5}}>{e.label}</div>
                      {editForm
                        ? <input className="vd-input" value={formData[e.key]??""} onChange={ev => setFormData(p=>({...p,[e.key]:ev.target.value}))} />
                        : <div style={{fontSize:13,color:"#1a1a1a",fontWeight:500,padding:"9px 12px",background:"#fafaf8",borderRadius:8,border:"1px solid #f0ede8"}}>{e.value}</div>
                      }
                    </div>
                  ))}
                </div>
            }
          </div>
        )}

        {/* ── DOCUMENTS ── */}
        {tab === "documents" && (
          <div style={{background:"#fff",border:"1px solid #f0ede8",borderRadius:12,padding:"22px 24px"}}>
            <div style={{fontWeight:600,fontSize:14,marginBottom:16}}>Documents</div>
            {docFiles.length === 0
              ? <Empty icon="📎" text="No documents uploaded yet." />
              : <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {docFiles.map(f => (
                    <a key={f.id} href={f.url} target="_blank" rel="noreferrer" className="vd-row"
                      style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 13px",borderRadius:10,border:"1px solid #f0ede8",textDecoration:"none",background:"#fafaf8",transition:"background .15s"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:30,height:30,borderRadius:7,background:"#fdf8f3",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>📄</div>
                        <div>
                          <div style={{fontSize:13,fontWeight:500,color:"#1a1a1a"}}>{f.name}</div>
                          <div style={{fontSize:11,color:"#9ca3af",marginTop:1}}>{toTitle(f.fieldKey)}</div>
                        </div>
                      </div>
                      <span style={{fontSize:12,color:"#c2894b",fontWeight:600}}>View →</span>
                    </a>
                  ))}
                </div>
            }
          </div>
        )}

        {/* ── ENQUIRIES ── */}
        {tab === "enquiries" && (
          <div style={{background:"#fff",border:"1px solid #f0ede8",borderRadius:12,padding:"22px 24px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <div style={{fontWeight:600,fontSize:14}}>Leads & Enquiries</div>
              {enquiries.length > 0 && (
                <span style={{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,background:"#eff6ff",color:"#1d4ed8"}}>
                  {enquiries.filter(e=>e.status==="new").length} new
                </span>
              )}
            </div>

            {loadingE
              ? <div style={{textAlign:"center",padding:"40px 0",color:"#9ca3af",fontSize:13}}>Loading…</div>
              : enquiries.length === 0
              ? <Empty icon="📨" text="No leads yet. Enquiries will appear here." />
              : <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {enquiries.map(enq => {
                    const eMap = {
                      new:    {label:"New",    bg:"#eff6ff",c:"#1d4ed8"},
                      viewed: {label:"Viewed", bg:"#fffbeb",c:"#b45309"},
                      booked: {label:"Booked", bg:"#f0fdf4",c:"#166534"},
                    };
                    const em = eMap[enq.status] || {label:enq.status,bg:"#f9fafb",c:"#374151"};
                    return (
                      <div key={enq._id} className="vd-enq"
                        style={{border:"1px solid #f0ede8",borderRadius:11,padding:"14px 16px",display:"flex",flexDirection:"column",gap:10,transition:"border-color .15s",background:"#fff"}}>
                        {/* Header */}
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                          <div style={{display:"flex",alignItems:"center",gap:10}}>
                            <div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#c2894b,#8b5e3c)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:600,fontSize:14,flexShrink:0}}>
                              {(enq.name||"U").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{fontWeight:600,fontSize:13,color:"#1a1a1a"}}>{enq.name}</div>
                              <div style={{fontSize:11,color:"#6b7280",marginTop:1}}>{enq.phone}{enq.email?` · ${enq.email}`:""}</div>
                            </div>
                          </div>
                          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                            <span style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:20,background:em.bg,color:em.c}}>{em.label}</span>
                            <span style={{fontSize:11,color:"#9ca3af"}}>{new Date(enq.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* Registered user pill */}
                        {enq.userId && (
                          <div style={{display:"flex",alignItems:"center",gap:7,background:"#fafaf8",borderRadius:7,padding:"5px 9px",border:"1px solid #f0ede8"}}>
                            <img
                              src={enq.userId.profileImage?.startsWith("http") ? enq.userId.profileImage : enq.userId.profileImage ? `${API_ORIGIN}${enq.userId.profileImage}` : "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                              alt="" style={{width:18,height:18,borderRadius:"50%",objectFit:"cover"}} />
                            <span style={{fontSize:11,color:"#6b7280"}}>
                              <b>Registered:</b> {enq.userId.name}{enq.userId.email ? ` (${enq.userId.email})` : ""}
                            </span>
                          </div>
                        )}

                        {/* Body */}
                        {!enq.contactViewed ? (
                          <>
                            <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
                              {[["Event",enq.eventType],["Date",enq.eventDate?new Date(enq.eventDate).toLocaleDateString():null],["Guests",enq.guestCount],["Budget",enq.budget]]
                                .filter(([,v])=>v).map(([l,v])=>(
                                <div key={l} style={{fontSize:12}}>
                                  <span style={{color:"#9ca3af"}}>{l}: </span>
                                  <span style={{fontWeight:600,color:"#374151",textTransform:"capitalize"}}>{v}</span>
                                </div>
                              ))}
                            </div>
                            {enq.message && (
                              <div style={{fontSize:13,color:"#4b5563",lineHeight:1.6,background:"#fafaf8",borderRadius:8,padding:"9px 12px",border:"1px solid #f0ede8"}}>
                                {enq.message}
                              </div>
                            )}
                          </>
                        ) : (
                          <div style={{fontSize:12,color:"#92400e",background:"#fffbeb",borderRadius:8,padding:"8px 12px",border:"1px solid #fde68a"}}>
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

      </div>
    </div>
  );
}

function Empty({ icon, text }) {
  return (
    <div style={{textAlign:"center",padding:"44px 0",color:"#9ca3af"}}>
      <div style={{fontSize:28,marginBottom:8}}>{icon}</div>
      <div style={{fontSize:13}}>{text}</div>
    </div>
  );
}