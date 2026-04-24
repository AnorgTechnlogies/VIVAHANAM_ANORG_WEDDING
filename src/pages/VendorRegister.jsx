import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  CheckCircle2, 
  Loader2, 
  Upload, 
  Trash2, 
  ChevronRight,
  Heart,
  Info
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_KEY || "http://localhost:8000/api";
const FORM_KEY = "vendor_onboarding";
const LS_KEY = `vivahanam_vendor_form_${FORM_KEY}`;

const sanitizeKey = (value = "") =>
  value.toString().trim().toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "");

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

  const uploadFiles = async (field, files) => {
    const key = sanitizeKey(field.key);
    const list = Array.from(files || []);
    const token = localStorage.getItem("vendorToken");
    const uploaded = [];
    for (const file of list) {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch(`${API_URL}/vendor-submissions/${FORM_KEY}/upload`, { 
        method: "POST", body, headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) uploaded.push(data.data);
    }
    setUploadedFiles((prev) => {
      const next = { ...prev, [key]: field.multiple ? [...(prev[key] || []), ...uploaded] : uploaded[0] };
      persistLocal(formValues, next);
      return next;
    });
  };

  const validate = () => {
    const nextErrors = {};
    config.sections.forEach(s => {
      (s.fields || []).forEach(f => {
        if (f.depends_on && f.depends_on_value && formValues[sanitizeKey(f.depends_on)] !== f.depends_on_value) return;
        if (f.required) {
          const k = sanitizeKey(f.key);
          const val = f.type === "file" ? uploadedFiles[k] : formValues[k];
          if (!val || (Array.isArray(val) && val.length === 0)) nextErrors[k] = "Required";
        }
      });
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
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
        const data = await res.json();
        alert(data.message || "Submission failed");
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
      case "file":
        const files = uploadedFiles[key] || [];
        const list = Array.isArray(files) ? files : [files];
        return (
          <div className="space-y-3">
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-rose-100 rounded-2xl py-8 px-4 hover:bg-rose-50/30 transition-all cursor-pointer group">
              <Upload className="w-6 h-6 text-rose-300 group-hover:text-rose-500 mb-2" />
              <span className="text-sm font-medium text-rose-400">Upload {f.label}</span>
              <input type="file" className="hidden" multiple={f.multiple} onChange={e => uploadFiles(f, e.target.files)} />
            </label>
            <div className="flex flex-wrap gap-3">
              {list.map((file, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-rose-100 shadow-sm">
                  <img src={file.url || file} className="w-full h-full object-cover" />
                  <button onClick={() => setUploadedFiles(p => ({...p, [key]: f.multiple ? list.filter((_, idx)=>idx!==i) : null }))} className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4 text-white" /></button>
                </div>
              ))}
            </div>
          </div>
        );
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