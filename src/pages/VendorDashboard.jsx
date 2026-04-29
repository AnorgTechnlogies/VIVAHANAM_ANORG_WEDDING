import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, FileText, LogOut, MapPin, User } from "lucide-react";

const API_URL = import.meta.env.VITE_API_KEY || "http://localhost:8000/api";
const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");
const FORM_KEY = "vendor_onboarding";

const STATUS_META = {
  approved: { label: "Approved", badge: "bg-green-100 text-green-700" },
  rejected: { label: "Rejected", badge: "bg-red-100 text-red-700" },
  submitted: { label: "Under Review", badge: "bg-amber-100 text-amber-700" },
  draft: { label: "Draft", badge: "bg-gray-100 text-gray-700" },
};

const toTitle = (value = "") =>
  value
    .toString()
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (s) => s.toUpperCase());

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

export default function VendorDashboard() {
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    brandName: "",
    mobile: "",
    city: "",
    vendorType: "",
  });
  const [isEditingForm, setIsEditingForm] = useState(false);
  const [editableFormData, setEditableFormData] = useState({});
  const [savingForm, setSavingForm] = useState(false);

  const [enquiries, setEnquiries] = useState([]);
  const [loadingEnquiries, setLoadingEnquiries] = useState(false);

  useEffect(() => {
    const fetchVendorData = async () => {
      const token = localStorage.getItem("vendorToken");
      if (!token) {
        navigate("/wedding-shop/vendor-auth");
        return;
      }

      try {
        const res = await fetch(`${API_URL}/vendor/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok || !data?.success) throw new Error(data?.message || "Session expired");
        setVendor(data.data);
      } catch (err) {
        localStorage.removeItem("vendorToken");
        localStorage.removeItem("vendorData");
        navigate("/wedding-shop/vendor-auth");
      } finally {
        setLoading(false);
      }
    };
    fetchVendorData();
  }, [navigate]);

  useEffect(() => {
    const initial = vendor?.submission?.data;
    if (initial && typeof initial === "object") {
      setEditableFormData(initial);
    } else {
      setEditableFormData({});
    }
    setIsEditingForm(false);
  }, [vendor]);

  useEffect(() => {
    const fetchEnquiries = async () => {
      if (activeTab !== "enquiries") return;
      const token = localStorage.getItem("vendorToken");
      if (!token) return;

      setLoadingEnquiries(true);
      try {
        const res = await fetch(`${API_URL}/vendors/vendor-dashboard/enquiries`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setEnquiries(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch enquiries", err);
      } finally {
        setLoadingEnquiries(false);
      }
    };
    fetchEnquiries();
  }, [activeTab]);

  useEffect(() => {
    setProfileForm({
      brandName: vendor?.brandName || "",
      mobile: vendor?.mobile || "",
      city: vendor?.city || "",
      vendorType: vendor?.vendorType || "",
    });
    setIsEditingProfile(false);
  }, [vendor]);

  const profileFields = useMemo(() => {
    if (!vendor) return [];
    return [
      { label: "Brand Name", value: vendor.brandName },
      { label: "Vendor Type", value: vendor.vendorType },
      { label: "Email", value: vendor.email },
      { label: "Mobile", value: vendor.mobile },
      { label: "City", value: vendor.city },
      { label: "Joined On", value: vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString() : "-" },
    ];
  }, [vendor]);

  const submissionEntries = useMemo(() => {
    const payload = isEditingForm ? editableFormData : vendor?.submission?.data;
    if (!payload || typeof payload !== "object") return [];
    return Object.entries(payload).map(([key, value]) => ({
      key,
      label: toTitle(key),
      value: formatValue(value),
    }));
  }, [vendor, editableFormData, isEditingForm]);

  const uploadedFiles = useMemo(() => {
    const files = vendor?.submission?.uploadedFiles;
    if (!files || typeof files !== "object") return [];
    return Object.entries(files).flatMap(([fieldKey, values]) => {
      if (!Array.isArray(values)) return [];
      return values.map((file, idx) => ({
        id: `${fieldKey}-${idx}`,
        fieldKey,
        name: file?.name || `File ${idx + 1}`,
        url: file?.url?.startsWith("http") ? file.url : `${API_ORIGIN}${file?.url || ""}`,
      }));
    });
  }, [vendor]);

  const handleLogout = () => {
    localStorage.removeItem("vendorToken");
    localStorage.removeItem("vendorData");
    navigate("/");
  };

  const handleFieldEdit = (key, nextValue) => {
    setEditableFormData((prev) => ({ ...prev, [key]: nextValue }));
  };

  const handleProfileFieldChange = (key, value) => {
    setProfileForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveProfile = async () => {
    const token = localStorage.getItem("vendorToken");
    if (!token) {
      alert("Session expired. Please login again.");
      navigate("/wedding-shop/vendor-auth");
      return;
    }
    setSavingProfile(true);
    try {
      const res = await fetch(`${API_URL}/vendor/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileForm),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) throw new Error(data?.message || "Failed to update profile");
      setVendor(data.data);
      localStorage.setItem("vendorData", JSON.stringify(data.data || {}));
      setIsEditingProfile(false);
      alert("Profile updated successfully.");
    } catch (error) {
      alert(error.message || "Unable to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveFormUpdate = async () => {
    const token = localStorage.getItem("vendorToken");
    if (!token) {
      alert("Session expired. Please login again.");
      navigate("/wedding-shop/vendor-auth");
      return;
    }

    setSavingForm(true);
    try {
      const saveRes = await fetch(`${API_URL}/vendor-submissions/${FORM_KEY}/draft`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          data: editableFormData,
          uploadedFiles: vendor?.submission?.uploadedFiles || {},
        }),
      });
      const saveData = await saveRes.json().catch(() => ({}));
      if (!saveRes.ok) throw new Error(saveData?.message || "Failed to save update");

      const submitRes = await fetch(`${API_URL}/vendor-submissions/${FORM_KEY}/submit`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          data: editableFormData,
          uploadedFiles: vendor?.submission?.uploadedFiles || {},
        }),
      });
      const submitData = await submitRes.json().catch(() => ({}));
      if (!submitRes.ok) throw new Error(submitData?.message || "Failed to submit updated form");

      setVendor((prev) => ({
        ...prev,
        submission: {
          ...(prev?.submission || {}),
          data: editableFormData,
          uploadedFiles: prev?.submission?.uploadedFiles || {},
          status: "submitted",
        },
        registrationStatus: "submitted",
      }));
      setIsEditingForm(false);
      alert("Form updated successfully.");
    } catch (error) {
      alert(error.message || "Unable to update form");
    } finally {
      setSavingForm(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600" />
      </div>
    );
  }

  if (!vendor) return null;

  const status = vendor.registrationStatus || "draft";
  const statusMeta = STATUS_META[status] || STATUS_META.draft;
  const completionBase = profileFields.filter((item) => item.value && item.value !== "-").length;
  const profileCompletion = Math.round((completionBase / profileFields.length) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="h-25 bg-gradient-to-r from-amber-600 to-red-600" />
        <div className="px-6 sm:px-10 pb-8 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between">
            <div className="flex items-center sm:items-end -mt-12 sm:-mt-16 mb-4 sm:mb-0 gap-4 sm:gap-6 flex-col sm:flex-row">
              <div className="w-20 h-20 sm:w-32 sm:h-32 bg-white rounded-full p-2 shadow-lg">
                <div className="w-full h-full bg-amber-100 rounded-full flex items-center justify-center text-amber-600 text-3xl sm:text-4xl font-bold">
                  {(vendor.brandName || "V").charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="text-center sm:text-left ">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{vendor.brandName || "Vendor"}</h1>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4 text-amber-600" />
                    {vendor.vendorType || "-"}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-amber-600" />
                    {vendor.city || "-"}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusMeta.badge}`}>
                    {statusMeta.label}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-28">
            <nav className="flex flex-col p-4 space-y-1">
              {[
                { id: "overview", label: "Overview", icon: User },
                { id: "profile", label: "My Profile", icon: User },
                { id: "submission", label: "Submitted Form", icon: FileText },
                { id: "documents", label: "Documents", icon: FileText },
                { id: "enquiries", label: "Leads & Enquiries", icon: Briefcase },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                      activeTab === item.id ? "bg-amber-50 text-amber-700" : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {activeTab === "overview" && (
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="text-xs text-gray-500 mb-1">Registration Status</div>
                <div className="text-xl font-bold text-gray-900">{statusMeta.label}</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="text-xs text-gray-500 mb-1">Profile Completion</div>
                <div className="text-xl font-bold text-gray-900">{profileCompletion}%</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="text-xs text-gray-500 mb-1">Submitted Fields</div>
                <div className="text-xl font-bold text-gray-900">{submissionEntries.length}</div>
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between gap-3 mb-6">
                <h3 className="text-xl font-bold text-gray-900">Vendor Profile</h3>
                {!isEditingProfile ? (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="px-4 py-2 rounded-lg border border-amber-600 text-amber-700 hover:bg-amber-50"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setIsEditingProfile(false);
                        setProfileForm({
                          brandName: vendor?.brandName || "",
                          mobile: vendor?.mobile || "",
                          city: vendor?.city || "",
                          vendorType: vendor?.vendorType || "",
                        });
                      }}
                      className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                      disabled={savingProfile}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      className="px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
                      disabled={savingProfile}
                    >
                      {savingProfile ? "Saving..." : "Save Profile"}
                    </button>
                  </div>
                )}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {profileFields.map((item) => (
                  <div key={item.label}>
                    <div className="text-sm text-gray-500 mb-1">{item.label}</div>
                    {isEditingProfile && item.label !== "Email" && item.label !== "Joined On" ? (
                      <input
                        type="text"
                        value={
                          item.label === "Brand Name"
                            ? profileForm.brandName
                            : item.label === "Vendor Type"
                            ? profileForm.vendorType
                            : item.label === "Mobile"
                            ? profileForm.mobile
                            : profileForm.city
                        }
                        onChange={(e) => {
                          if (item.label === "Brand Name") handleProfileFieldChange("brandName", e.target.value);
                          else if (item.label === "Vendor Type") handleProfileFieldChange("vendorType", e.target.value);
                          else if (item.label === "Mobile") handleProfileFieldChange("mobile", e.target.value);
                          else handleProfileFieldChange("city", e.target.value);
                        }}
                        className="w-full bg-white border border-gray-300 rounded-lg p-3 text-gray-900"
                      />
                    ) : (
                      <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 font-medium text-gray-900">
                        {item.value || "-"}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "submission" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between gap-3 mb-6">
                <h3 className="text-xl font-bold text-gray-900">Submitted Registration Data</h3>
                {submissionEntries.length > 0 && (
                  <div className="flex items-center gap-2">
                    {!isEditingForm ? (
                      <button
                        onClick={() => setIsEditingForm(true)}
                        className="px-4 py-2 rounded-lg border border-amber-600 text-amber-700 hover:bg-amber-50"
                      >
                        Edit Form
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setIsEditingForm(false);
                            setEditableFormData(vendor?.submission?.data || {});
                          }}
                          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                          disabled={savingForm}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveFormUpdate}
                          className="px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
                          disabled={savingForm}
                        >
                          {savingForm ? "Saving..." : "Save & Update"}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
              {submissionEntries.length === 0 ? (
                <div className="text-sm text-gray-500">No submitted form data found yet.</div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {submissionEntries.map((item) => (
                    <div key={item.key}>
                      <div className="text-sm text-gray-500 mb-1">{item.label}</div>
                      {isEditingForm ? (
                        <input
                          type="text"
                          value={editableFormData[item.key] ?? ""}
                          onChange={(e) => handleFieldEdit(item.key, e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded-lg p-3 text-gray-900"
                        />
                      ) : (
                        <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-gray-900">
                          {item.value}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "documents" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Uploaded Documents</h3>
              {uploadedFiles.length === 0 ? (
                <div className="text-sm text-gray-500">No documents uploaded yet.</div>
              ) : (
                <div className="space-y-3">
                  {uploadedFiles.map((file) => (
                    <a
                      key={file.id}
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div>
                        <div className="font-medium text-gray-900">{file.name}</div>
                        <div className="text-xs text-gray-500">Field: {toTitle(file.fieldKey)}</div>
                      </div>
                      <span className="text-sm text-amber-700 font-medium">View</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "enquiries" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Leads & Enquiries</h3>
              {loadingEnquiries ? (
                <div className="text-sm text-gray-500 py-10 text-center">Loading enquiries...</div>
              ) : enquiries.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <div className="text-4xl mb-4">📨</div>
                  <h4 className="text-lg font-medium text-gray-900">No leads yet</h4>
                  <p className="text-sm text-gray-500 mt-1">When users enquire about your services, they will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {enquiries.map((enq) => (
                    <div key={enq._id} className="border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow bg-white">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg border border-amber-100">
                            {(enq.name || "U")[0].toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900">{enq.name}</h4>
                            <div className="text-sm text-gray-500 flex flex-wrap gap-x-4 mt-1">
                              <span>📞 {enq.phone}</span>
                              {enq.email && <span>✉️ {enq.email}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            enq.status === 'new' ? 'bg-blue-100 text-blue-700' :
                            enq.status === 'viewed' ? 'bg-amber-100 text-amber-700' :
                            enq.status === 'booked' ? 'bg-purple-100 text-purple-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {enq.status.charAt(0).toUpperCase() + enq.status.slice(1)}
                          </span>
                          <div className="text-xs text-gray-400 mt-2">
                            {new Date(enq.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {/* User's Registered Profile Info */}
                      {enq.userId && (
                        <div className="mb-4 flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg p-2.5">
                          <img 
                            src={enq.userId.profileImage?.startsWith("http") ? enq.userId.profileImage : (enq.userId.profileImage ? `${API_ORIGIN}${enq.userId.profileImage}` : "https://cdn-icons-png.flaticon.com/512/149/149071.png")} 
                            alt="User Profile" 
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <div className="text-xs text-gray-600">
                            <span className="font-semibold">Registered Account:</span> {enq.userId.name} {enq.userId.email && `(${enq.userId.email})`}
                          </div>
                        </div>
                      )}

                      {!enq.contactViewed ? (
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                          <div className="flex flex-wrap gap-x-6 gap-y-2 mb-3 text-sm">
                            <div>
                              <span className="text-gray-500">Event:</span>{" "}
                              <span className="font-medium text-gray-900 capitalize">{enq.eventType || "N/A"}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Date:</span>{" "}
                              <span className="font-medium text-gray-900">
                                {enq.eventDate ? new Date(enq.eventDate).toLocaleDateString() : "N/A"}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Guests:</span>{" "}
                              <span className="font-medium text-gray-900">{enq.guestCount || "N/A"}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Budget:</span>{" "}
                              <span className="font-medium text-gray-900">{enq.budget || "N/A"}</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Message</span>
                            <p className="text-sm text-gray-700 whitespace-pre-line">{enq.message || "No message provided."}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-amber-50 rounded-lg p-3 border border-amber-100 text-sm text-amber-800 flex items-center gap-2">
                          <span className="text-lg">👀</span>
                          User viewed your contact details. Reach out to them!
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
