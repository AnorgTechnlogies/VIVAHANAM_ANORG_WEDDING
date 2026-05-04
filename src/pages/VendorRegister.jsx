import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  CheckCircle2, 
  Loader2, 
  Upload, 
  Trash2, 
  Heart,
  Info,
  FileText
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_KEY || "http://localhost:8000/api";
const FORM_KEY = "vendor_onboarding";
const LS_KEY = `vivahanam_vendor_form_${FORM_KEY}`;

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const ACCEPT_ATTR = "image/jpeg,image/png,image/webp,application/pdf";

const PROFILE_KEYS = new Set([
  "profile_picture",
  "logo",
  "brand_logo",
  "profile_pic",
  "profile_image",
]);
const PORTFOLIO_KEYS = new Set(["portfolio_gallery", "portfolio"]);

const sanitizeKey = (value = "") =>
  value.toString().trim().toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "");

const countSlot = (slot) => {
  if (slot === undefined || slot === null) return 0;
  if (Array.isArray(slot)) return slot.filter(Boolean).length;
  return 1;
};

function getFileFieldKind(field) {
  const role = field?.validation?.fileRole;
  if (role === "profile") return "profile";
  if (role === "portfolio") return "portfolio";
  const sk = sanitizeKey(field.key);
  if (PROFILE_KEYS.has(sk)) return "profile";
  if (PORTFOLIO_KEYS.has(sk)) return "portfolio";
  return "generic";
}

function validateLocalFile(file, kind) {
  if (!file) return "No file selected.";
  if (file.size > MAX_FILE_BYTES) {
    return `File must be 2MB or smaller (this file is ${(file.size / (1024 * 1024)).toFixed(2)}MB).`;
  }
  const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!allowed.includes(file.type)) {
    return "Only JPEG, PNG, WebP, or PDF files are allowed.";
  }
  if (kind === "profile" || kind === "portfolio") {
    const imgOnly = ["image/jpeg", "image/png", "image/webp"];
    if (!imgOnly.includes(file.type)) {
      return kind === "profile"
        ? "Profile / logo must be an image (JPEG, PNG, or WebP)."
        : "Portfolio must be images only (JPEG, PNG, or WebP).";
    }
  }
  return null;
}

function normalizeList(slot) {
  if (!slot) return [];
  return Array.isArray(slot) ? slot.filter(Boolean) : [slot].filter(Boolean);
}

export default function VendorRegister() {
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [vendorInfo, setVendorInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formValues, setFormValues] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dynamicOptions, setDynamicOptions] = useState({});
  const [uploadBusy, setUploadBusy] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch(`${API_URL}/marketplace/forms/${FORM_KEY}/config`);
        const data = await res.json();
        if (res.ok) { setConfig(data.data); loadDraft(); }
        else { setError(data.message || "Could not load form"); }
      } catch (e) { setError("Connection error"); }
      finally { setLoading(false); }
    };

    const fetchVendor = async () => {
      try {
        const token = localStorage.getItem("vendorToken");
        if (!token) return;
        const res = await fetch(`${API_URL}/vendor/me`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setVendorInfo(data.data);
          // If no draft, prefill from vendor profile
          const saved = localStorage.getItem(LS_KEY);
          if (!saved) {
            const v = data.data;
            const initial = {
              brand_name: v.brandName || "",
              email: v.email || "",
              mobile: v.mobile || "",
              city: v.city || "",
              category: v.vendorType || ""
            };
            setFormValues(prev => ({ ...initial, ...prev }));
          }
        }
      } catch (e) { console.error("Could not fetch vendor info", e); }
    };

    const fetchStates = async () => {
      try {
        const res = await fetch(`${API_URL}/locations/states`);
        const data = await res.json();
        if (res.ok) {
          setDynamicOptions(prev => ({ ...prev, state: data.data }));
        }
      } catch (e) { console.error("Could not fetch states", e); }
    };

    fetchConfig();
    fetchVendor();
    fetchStates();
  }, []);

  const loadDraft = () => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      try {
        const { values, files } = JSON.parse(saved);
        setFormValues(values || {});
        setUploadedFiles(files || {});
      } catch (e) { console.error(e); }
    }
  };

  const persistLocal = (values, files) => {
    localStorage.setItem(LS_KEY, JSON.stringify({ values, files }));
  };

  useEffect(() => {
    if (!config) return;
    const allFields = (config.sections || []).flatMap((s) => (s.fields || []).filter((f) => f.enabled !== false));
    allFields.filter((f) => f.depends_on).forEach((field) => {
      const childKey = sanitizeKey(field.key);
      const parentValue = formValues[sanitizeKey(field.depends_on)];
      if (field.depends_on_value && parentValue !== field.depends_on_value) {
        if (formValues[childKey]) {
          setFormValues(prev => { const n = { ...prev }; delete n[childKey]; return n; });
        }
      }
      // Only for non-location dependent fields (like categories)
      if (childKey !== "city" && parentValue && field?.validation?.byCategory?.[parentValue]) {
        const list = field.validation.byCategory[parentValue];
        setDynamicOptions(prev => ({ ...prev, [childKey]: list.map(i => typeof i === "string" ? {label:i,value:i} : i) }));
      }
    });
  }, [config, formValues]);

  // Handle dynamic city options based on state FROM DATABASE
  useEffect(() => {
    const selectedState = formValues["state"];
    if (!selectedState) {
      setDynamicOptions(prev => ({ ...prev, city: [] }));
      return;
    }

    const fetchCities = async () => {
      try {
        const res = await fetch(`${API_URL}/locations/states/${selectedState}/cities`);
        const data = await res.json();
        if (res.ok) {
          setDynamicOptions(prev => ({ ...prev, city: data.data }));
        }
      } catch (e) { console.error("Could not fetch cities", e); }
    };
    fetchCities();
  }, [formValues.state]);

  const handleInputChange = (key, value) => {
    setFormValues((prev) => {
      const next = { ...prev, [key]: value };
      persistLocal(next, uploadedFiles);
      return next;
    });
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const saveDraft = async () => {
    setSaving(true);
    try {
      persistLocal(formValues, uploadedFiles);
      const token = localStorage.getItem("vendorToken");
      await fetch(`${API_URL}/vendor-submissions/${FORM_KEY}/draft`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ data: formValues, uploadedFiles }),
      });
    } finally { setSaving(false); }
  };

  const deleteFileOnServer = async (fileMeta) => {
    if (!fileMeta?.publicId) return true;
    const token = localStorage.getItem("vendorToken");
    const res = await fetch(`${API_URL}/vendor-submissions/${FORM_KEY}/upload/delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        publicId: fileMeta.publicId,
        resourceType: fileMeta.resourceType,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.message || "Could not remove file from server.");
      return false;
    }
    return true;
  };

  /**
   * Multer memory → Cloudinary (`vivahanam/vendors/{vendorId}/{fieldKey}`).
   * Sends fieldKey + file; server validates MIME, 2MB, per-field caps.
   */
  const uploadFiles = async (field, files) => {
    const key = sanitizeKey(field.key);
    const kind = getFileFieldKind(field);
    let list = Array.from(files || []).filter(Boolean);
    if (list.length === 0) return;

    const currentCount = countSlot(uploadedFiles[key]);

    if (kind === "portfolio") {
      const remaining = 10 - currentCount;
      if (remaining <= 0) {
        setErrors((prev) => ({
          ...prev,
          [key]: "Portfolio gallery allows at most 10 images.",
        }));
        return;
      }
      list = list.slice(0, remaining);
    }
    if (kind === "profile" || (!field.multiple && kind === "generic")) {
      list = list.slice(0, 1);
    }

    const token = localStorage.getItem("vendorToken");
    const uploaded = [];

    for (const file of list) {
      const msg = validateLocalFile(file, kind);
      if (msg) {
        setErrors((prev) => ({ ...prev, [key]: msg }));
        return;
      }
    }
    setErrors((prev) => ({ ...prev, [key]: "" }));

    setUploadBusy(true);
    try {
      for (const file of list) {
        const body = new FormData();
        body.append("fieldKey", field.key);
        body.append("file", file);
        const res = await fetch(`${API_URL}/vendor-submissions/${FORM_KEY}/upload`, {
          method: "POST",
          body,
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setErrors((prev) => ({
            ...prev,
            [key]: data.message || "Upload failed.",
          }));
          break;
        }
        uploaded.push(data.data);
      }

      if (uploaded.length === 0) return;

      setUploadedFiles((prev) => {
        const appendSlot = kind === "portfolio" || field.multiple;
        const next = {
          ...prev,
          [key]: appendSlot ? [...normalizeList(prev[key]), ...uploaded] : uploaded[uploaded.length - 1],
        };
        persistLocal(formValues, next);
        return next;
      });
    } finally {
      setUploadBusy(false);
    }
  };

  const validate = () => {
    const nextErrors = {};
    config.sections.forEach((s) => {
      if (s.enabled === false) return;
      (s.fields || []).forEach((f) => {
        if (f.enabled === false) return;
        if (f.depends_on && f.depends_on_value && formValues[sanitizeKey(f.depends_on)] !== f.depends_on_value)
          return;

        const k = sanitizeKey(f.key);

        if (f.type === "file") {
          const kind = getFileFieldKind(f);
          const n = countSlot(uploadedFiles[k]);

          if (kind === "profile") {
            if (n !== 1) {
              nextErrors[k] =
                n === 0
                  ? "Upload exactly one profile image (JPEG, PNG, or WebP)."
                  : "Only one profile / logo image allowed. Remove extras.";
            }
            return;
          }

          if (kind === "portfolio") {
            if (n < 5) {
              nextErrors[k] = `Upload at least 5 portfolio images (${n}/5). JPEG, PNG, or WebP only.`;
            } else if (n > 10) {
              nextErrors[k] = "Portfolio allows at most 10 images.";
            }
            return;
          }

          if (f.required) {
            const val = uploadedFiles[k];
            if (!val || (Array.isArray(val) && val.length === 0)) nextErrors[k] = "Required";
          }
          if (!f.multiple && n > 1) nextErrors[k] = "Only one file allowed for this field.";
          return;
        }

        if (f.required) {
          const val = formValues[k];
          if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) {
            nextErrors[k] = "Required";
          }
        }
      });
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async () => {
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem("vendorToken");
      const res = await fetch(`${API_URL}/vendor-submissions/${FORM_KEY}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ data: formValues, uploadedFiles }),
      });
      if (res.ok) { 
        localStorage.removeItem(LS_KEY); 
        alert("Application submitted successfully! Redirecting to dashboard...");
        navigate("/wedding-shop/vendor/dashboard");
      } else {
        const data = await res.json().catch(() => ({}));
        const detail = data.errors?.length ? `\n\n${data.errors.join("\n")}` : "";
        alert((data.message || "Submission failed") + detail);
      }
    } finally { setSubmitting(false); }
  };

  const renderField = (f) => {
    const key = sanitizeKey(f.key);
    const value = formValues[key] || "";
    const base = "w-full bg-white border border-rose-100 rounded-2xl px-4 py-3.5 text-gray-700 focus:border-rose-400 focus:ring-2 focus:ring-rose-50 transition-all outline-none placeholder:text-gray-300";

    switch (f.type) {
      case "text":
      case "number": return <input type={f.type} className={base} placeholder={f.placeholder} value={value} onChange={e => handleInputChange(key, e.target.value)} />;
      case "textarea": return <textarea className={base} rows={4} placeholder={f.placeholder} value={value} onChange={e => handleInputChange(key, e.target.value)} />;
      case "dropdown":
        const opts = dynamicOptions[key] || f.options || [];
        return (
          <select className={base} value={value} onChange={e => handleInputChange(key, e.target.value)}>
            <option value="">Select Option</option>
            {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        );
      case "multi_checkbox":
        const cur = Array.isArray(value) ? value : [];
        return (
          <div className="grid grid-cols-2 gap-3">
            {(f.options || []).map(o => (
              <label key={o.value} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${cur.includes(o.value) ? "bg-rose-50 border-rose-300 text-rose-700" : "bg-white border-gray-50 text-gray-500 hover:border-rose-100"}`}>
                <input type="checkbox" className="hidden" checked={cur.includes(o.value)} onChange={e => {
                  const next = e.target.checked ? [...cur, o.value] : cur.filter(v => v !== o.value);
                  handleInputChange(key, next);
                }} />
                <span className="text-sm font-medium">{o.label}</span>
              </label>
            ))}
          </div>
        );
      case "file": {
        const kind = getFileFieldKind(f);
        const files = uploadedFiles[key] || [];
        const list = Array.isArray(files) ? files : [files];
        const hint =
          kind === "profile"
            ? "One image required (JPEG, PNG, or WebP). Max 2MB. Replaces previous upload."
            : kind === "portfolio"
              ? `5–10 images required (JPEG, PNG, or WebP). Max 2MB each. ${countSlot(uploadedFiles[key])}/10 uploaded.`
              : "JPEG, PNG, WebP, or PDF. Max 2MB.";
        const multi =
          kind === "portfolio"
            ? true
            : kind === "profile"
              ? false
              : !!f.multiple;
        const previewItem = (file, i) => {
          const url = file?.url || file;
          const mime = file?.type || "";
          const isImg = typeof mime === "string" && mime.startsWith("image/");
          return (
            <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-rose-100 shadow-sm bg-rose-50/50 flex items-center justify-center">
              {isImg ? (
                <img src={url} alt="" className="w-full h-full object-cover" />
              ) : (
                <FileText className="w-8 h-8 text-rose-300" />
              )}
              <button
                type="button"
                onClick={async () => {
                  const ok = await deleteFileOnServer(file);
                  if (!ok) return;
                  setUploadedFiles((p) => {
                    const next = {
                      ...p,
                      [key]: multi ? list.filter((_, idx) => idx !== i) : null,
                    };
                    persistLocal(formValues, next);
                    return next;
                  });
                  setErrors((prev) => ({ ...prev, [key]: "" }));
                }}
                className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4 text-white" />
              </button>
            </div>
          );
        };
        return (
          <div className="space-y-3">
            <p className="text-xs text-gray-400 px-1">{hint}</p>
            <label className={`flex flex-col items-center justify-center border-2 border-dashed border-rose-100 rounded-2xl py-8 px-4 transition-all group ${uploadBusy ? "opacity-50 pointer-events-none" : "hover:bg-rose-50/30 cursor-pointer"}`}>
              <Upload className="w-6 h-6 text-rose-300 group-hover:text-rose-500 mb-2" />
              <span className="text-sm font-medium text-rose-400">{uploadBusy ? "Uploading…" : `Upload ${f.label}`}</span>
              <input
                type="file"
                className="hidden"
                accept={ACCEPT_ATTR}
                multiple={multi}
                disabled={uploadBusy}
                onChange={(e) => {
                  uploadFiles(f, e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
            <div className="flex flex-wrap gap-3">
              {list.filter(Boolean).map((file, i) => previewItem(file, i))}
            </div>
          </div>
        );
      }
      default: return null;
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-rose-50/30"><Loader2 className="w-8 h-8 text-rose-400 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fffafa] to-[#fff5f5] py-8 md:py-16 px-4 font-['Outfit',sans-serif]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10 md:mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-block p-3 bg-white rounded-2xl shadow-sm mb-4">
            <Heart className="w-8 h-8 text-rose-400 fill-rose-400/10" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Become a Partner</h1>
          <p className="text-gray-400 mt-2 font-medium">Join our family and showcase your services to thousands of couples.</p>
        </div>

        <div className="bg-white/70 backdrop-blur-xl rounded-[32px] md:rounded-[48px] shadow-xl shadow-rose-100/50 border border-white p-6 md:p-16 space-y-12 md:space-y-20">
          {(config?.sections || []).filter(s => s.enabled !== false).map(s => {
            const visible = (s.fields || []).filter(f => f.enabled !== false).filter(f => !f.depends_on || !f.depends_on_value || formValues[sanitizeKey(f.depends_on)] === f.depends_on_value);
            if (visible.length === 0) return null;
            return (
              <div key={s.id} className="space-y-8">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-rose-300">Section</span>
                  <h2 className="text-xl font-bold text-gray-700">{s.title}</h2>
                  <div className="h-px flex-1 bg-rose-50" />
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                  {visible.map(f => (
                    <div key={f.id} className={f.type === "textarea" || f.type === "multi_checkbox" || f.type === "file" ? "md:col-span-2" : ""}>
                      <div className="flex items-center justify-between mb-3 px-1">
                        <label className="text-sm font-bold text-gray-600 flex items-center gap-2">
                          {f.label} {f.required && <span className="text-rose-400">*</span>}
                        </label>
                        {errors[sanitizeKey(f.key)] && <div className="text-[10px] font-bold text-rose-500 flex items-center gap-1"><Info className="w-3 h-3" />{errors[sanitizeKey(f.key)]}</div>}
                      </div>
                      {renderField(f)}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="pt-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <button onClick={saveDraft} disabled={saving} className="text-sm font-bold text-gray-400 hover:text-rose-400 transition-colors flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Draft"}
            </button>
            <button onClick={submit} disabled={submitting} className="w-full sm:w-auto px-12 py-4 bg-rose-400 text-white font-bold rounded-2xl shadow-lg shadow-rose-100 hover:bg-rose-500 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              Submit Application
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}