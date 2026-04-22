import { useEffect, useMemo, useState } from "react";

const API_URL = import.meta.env.VITE_API_KEY || "http://localhost:8000/api";
const FORM_KEY = "photographer_vendor_onboarding";
const LS_KEY = `marketplace:${FORM_KEY}:draft`;

const sanitizeKey = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

const buildInitialData = (config) => {
  const data = {};
  (config?.sections || []).forEach((s) => {
    (s.fields || []).forEach((f) => {
      const k = sanitizeKey(f.key);
      if (!k) return;
      if (data[k] === undefined) data[k] = f.defaultValue ?? (f.type === "multi_checkbox" ? [] : "");
    });
  });
  return data;
};

const validateStep = (section, formData, uploadedFiles) => {
  const errors = {};
  (section.fields || [])
    .filter((f) => f.enabled !== false)
    .forEach((f) => {
      if (!f.required) return;
      const key = sanitizeKey(f.key);
      if (!key) return;
      if (f.type === "file") {
        const files = uploadedFiles?.[key] || [];
        if (!Array.isArray(files) || files.length === 0) errors[key] = `${f.label} is required`;
        return;
      }
      const value = formData[key];
      if (f.type === "multi_checkbox") {
        const arr = Array.isArray(value) ? value : [];
        if (arr.length === 0) errors[key] = `${f.label} is required`;
        return;
      }
      if (value === undefined || value === null || value === "") errors[key] = `${f.label} is required`;
    });
  return errors;
};

export default function VendorRegister() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const [formData, setFormData] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const sections = useMemo(() => {
    const list = (config?.sections || []).filter((s) => s.enabled !== false);
    return [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [config]);

  const activeSection = sections[stepIndex] || null;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/marketplace/forms/${FORM_KEY}/config`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Failed to load form config");
        setConfig(data.data);

        const saved = localStorage.getItem(LS_KEY);
        const savedParsed = saved ? JSON.parse(saved) : null;
        const initial = buildInitialData(data.data);
        setFormData({ ...initial, ...(savedParsed?.data || {}) });
        setUploadedFiles(savedParsed?.uploadedFiles || {});
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const persistLocal = (nextData, nextFiles) => {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({
        data: nextData,
        uploadedFiles: nextFiles,
        savedAt: Date.now(),
      })
    );
  };

  const vendorEmail = (formData.email || formData.vendor_email || "").toString().trim();
  const vendorPhone = (formData.phone || formData.vendor_phone || "").toString().trim();

  const saveDraft = async () => {
    setSaving(true);
    try {
      persistLocal(formData, uploadedFiles);
      if (!vendorEmail && !vendorPhone) return;
      const res = await fetch(`${API_URL}/marketplace/forms/${FORM_KEY}/submissions/draft`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorEmail: vendorEmail || undefined,
          vendorPhone: vendorPhone || undefined,
          data: formData,
          uploadedFiles,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to save draft");
    } catch (e) {
      console.error(e);
      alert(e.message || "Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const uploadFiles = async (field, files) => {
    const key = sanitizeKey(field.key);
    if (!key) return;
    const list = Array.from(files || []);
    if (list.length === 0) return;

    const uploaded = [];
    for (const file of list) {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch(`${API_URL}/marketplace/forms/${FORM_KEY}/upload`, { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Upload failed");
      uploaded.push(data.data);
    }

    setUploadedFiles((prev) => {
      const next = { ...prev, [key]: [...(prev[key] || []), ...uploaded] };
      persistLocal(formData, next);
      return next;
    });
  };

  const removeUploaded = (fieldKey, idx) => {
    const key = sanitizeKey(fieldKey);
    setUploadedFiles((prev) => {
      const nextList = (prev[key] || []).filter((_, i) => i !== idx);
      const next = { ...prev, [key]: nextList };
      persistLocal(formData, next);
      return next;
    });
  };

  const nextStep = async () => {
    if (!activeSection) return;
    const stepErrors = validateStep(activeSection, formData, uploadedFiles);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) return;
    await saveDraft();
    setStepIndex((i) => Math.min(i + 1, sections.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const prevStep = () => {
    setErrors({});
    setStepIndex((i) => Math.max(0, i - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async () => {
    const allErrors = {};
    sections.forEach((s) => Object.assign(allErrors, validateStep(s, formData, uploadedFiles)));
    setErrors(allErrors);
    if (Object.keys(allErrors).length > 0) {
      alert("Please fill all required fields.");
      return;
    }
    if (!vendorEmail && !vendorPhone) {
      alert("Please provide at least an email or phone number (add a field with key `email` or `phone`).");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/marketplace/forms/${FORM_KEY}/submissions/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorEmail: vendorEmail || undefined,
          vendorPhone: vendorPhone || undefined,
          data: formData,
          uploadedFiles,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Submit failed");
      localStorage.removeItem(LS_KEY);
      alert("Submitted successfully!");
      setStepIndex(0);
    } catch (e) {
      console.error(e);
      alert(e.message || "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field) => {
    const key = sanitizeKey(field.key);
    if (!key) return null;
    const isError = !!errors[key];
    const common =
      "mt-1 w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500 " +
      (isError ? "border-red-300" : "border-gray-300");

    if (field.enabled === false) return null;

    switch (field.type) {
      case "text":
        return (
          <input
            className={common}
            value={formData[key] ?? ""}
            placeholder={field.placeholder || ""}
            onChange={(e) => setFormData((p) => ({ ...p, [key]: e.target.value }))}
          />
        );
      case "number":
        return (
          <input
            className={common}
            type="number"
            value={formData[key] ?? ""}
            placeholder={field.placeholder || ""}
            onChange={(e) => setFormData((p) => ({ ...p, [key]: e.target.value === "" ? "" : Number(e.target.value) }))}
          />
        );
      case "textarea":
        return (
          <textarea
            className={common}
            rows={4}
            value={formData[key] ?? ""}
            placeholder={field.placeholder || ""}
            onChange={(e) => setFormData((p) => ({ ...p, [key]: e.target.value }))}
          />
        );
      case "dropdown":
        return (
          <select className={common} value={formData[key] ?? ""} onChange={(e) => setFormData((p) => ({ ...p, [key]: e.target.value }))}>
            <option value="">Select...</option>
            {(field.options || []).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        );
      case "radio":
        return (
          <div className="mt-2 space-y-2">
            {(field.options || []).map((o) => (
              <label key={o.value} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name={key}
                  checked={(formData[key] ?? "") === o.value}
                  onChange={() => setFormData((p) => ({ ...p, [key]: o.value }))}
                />
                <span>{o.label}</span>
              </label>
            ))}
          </div>
        );
      case "multi_checkbox": {
        const cur = Array.isArray(formData[key]) ? formData[key] : [];
        return (
          <div className="mt-2 grid sm:grid-cols-2 gap-2">
            {(field.options || []).map((o) => {
              const checked = cur.includes(o.value);
              return (
                <label key={o.value} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      setFormData((p) => {
                        const prev = Array.isArray(p[key]) ? p[key] : [];
                        const next = e.target.checked ? [...prev, o.value] : prev.filter((v) => v !== o.value);
                        return { ...p, [key]: next };
                      });
                    }}
                  />
                  <span>{o.label}</span>
                </label>
              );
            })}
          </div>
        );
      }
      case "file": {
        const list = uploadedFiles?.[key] || [];
        return (
          <div className="mt-2 space-y-3">
            <input
              type="file"
              accept={field.accept || "image/*,video/*"}
              multiple={!!field.multiple}
              onChange={(e) => uploadFiles(field, e.target.files)}
            />
            {Array.isArray(list) && list.length > 0 && (
              <div className="space-y-2">
                {list.map((f, idx) => (
                  <div key={`${f.url}-${idx}`} className="flex items-center justify-between border rounded-lg px-3 py-2">
                    <div className="text-sm text-gray-800 truncate">{f.name}</div>
                    <button
                      type="button"
                      onClick={() => removeUploaded(key, idx)}
                      className="text-sm text-red-700 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }
      default:
        return (
          <input
            className={common}
            value={formData[key] ?? ""}
            placeholder={field.placeholder || ""}
            onChange={(e) => setFormData((p) => ({ ...p, [key]: e.target.value }))}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-gray-700">Loading vendor onboarding form…</div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-gray-700">Form is not available yet. (Admin needs to publish it.)</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b bg-gradient-to-r from-amber-600 to-orange-600">
          <div className="text-white text-2xl font-bold"> Vendor Registration</div>
          <div className="text-white/90 text-sm mt-1">
            Step {Math.min(stepIndex + 1, sections.length)} of {Math.max(sections.length, 1)}
          </div>
        </div>

        <div className="p-6">
          {activeSection ? (
            <>
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <div className="text-xl font-semibold text-gray-900">{activeSection.title}</div>
                  <div className="text-sm text-gray-600">{(activeSection.fields || []).length} fields</div>
                </div>
                <button
                  onClick={saveDraft}
                  disabled={saving || submitting}
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save Draft"}
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                {(activeSection.fields || [])
                  .filter((f) => f.enabled !== false)
                  .map((f) => {
                    const key = sanitizeKey(f.key);
                    const wide = f.type === "textarea" || f.type === "multi_checkbox" || f.type === "file";
                    return (
                      <div key={f.id || key} className={wide ? "md:col-span-2" : ""}>
                        <label className="text-sm font-medium text-gray-800">
                          {f.label} {f.required && <span className="text-red-600">*</span>}
                        </label>
                        {renderField(f)}
                        {errors[key] && <div className="text-sm text-red-700 mt-1">{errors[key]}</div>}
                      </div>
                    );
                  })}
              </div>

              <div className="mt-8 flex items-center justify-between">
                <button
                  onClick={prevStep}
                  disabled={stepIndex === 0 || submitting}
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                >
                  Back
                </button>

                {stepIndex < sections.length - 1 ? (
                  <button
                    onClick={nextStep}
                    disabled={submitting}
                    className="px-5 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={submit}
                    disabled={submitting}
                    className="px-5 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
                  >
                    {submitting ? "Submitting…" : "Submit"}
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="text-gray-700">No enabled sections found.</div>
          )}
        </div>
      </div>

      <div className="text-xs text-gray-500 mt-4">
        Draft is stored locally automatically. If you include a field with key <span className="font-mono">email</span> or{" "}
        <span className="font-mono">phone</span>, drafts will also save to the server.
      </div>
    </div>
  );
}