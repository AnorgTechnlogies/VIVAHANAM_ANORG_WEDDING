import { useEffect, useRef, useState } from "react";
import {
  User, Mail, Phone, MapPin, Briefcase, FileText, Image,
  Upload, X, CheckCircle, AlertCircle, Building2,
  Store, Camera, ChevronDown
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_KEY || "http://localhost:8000/api";
const ROOT_API_BASE = API_BASE.replace(/\/admin\/?$/, "");

const VendorRegister = () => {
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [imagePreview, setImagePreview] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);

  // Refs for click-outside detection
  const categoryRef = useRef(null);
  const locationRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    categories: [],
    city: "",
    state: "",
    description: "",
    image: null,
  });

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
      if (locationRef.current && !locationRef.current.contains(e.target)) {
        setIsLocationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [catRes, locRes] = await Promise.all([
          fetch(`${ROOT_API_BASE}/categories`),
          fetch(`${ROOT_API_BASE}/locations`),
        ]);
        const [catData, locData] = await Promise.all([catRes.json(), locRes.json()]);
        setCategories(catData?.data || []);
        setLocations(locData?.data || []);
      } catch (error) {
        console.error("Failed to load master data", error);
      }
    };
    fetchMasters();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm({ ...form, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setForm({ ...form, image: null });
    setImagePreview(null);
  };

  const handleCategoryToggle = (categoryName) => {
    setForm(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryName)
        ? prev.categories.filter(c => c !== categoryName)
        : [...prev.categories, categoryName]
    }));
  };

  const handleLocationSelect = (location) => {
    setForm({
      ...form,
      city: location.city,
      state: location.state
    });
    setIsLocationOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key === "categories") {
          data.append("categories", value.join(","));
        } else if (value !== null) {
          data.append(key, value);
        }
      });

      const res = await fetch(`${ROOT_API_BASE}/vendors/register`, {
        method: "POST",
        body: data
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result?.message || "Registration failed");

      setMessage({
        type: "success",
        text: "Registration submitted successfully! Admin will review your profile."
      });

      setForm({
        name: "",
        email: "",
        phone: "",
        categories: [],
        city: "",
        state: "",
        description: "",
        image: null,
      });
      setImagePreview(null);

    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Format: "City (State)" to match the image
  const getSelectedLocationLabel = () => {
    if (form.city && form.state) {
      return `${form.city} (${form.state})`;
    }
    return "Select Location";
  };

  return (
    <div className="min-h-screen bg-amber-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-amber-600 to-amber-700 rounded-full shadow-lg mb-4">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
            Vendor Registration
          </h1>
          <p className="text-gray-600">
            Join our marketplace and grow your business with Vivahanam
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8">
            {/* Message Alert */}
            {message.text && (
              <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
                message.type === "success"
                  ? "bg-green-50 border border-green-200 text-green-700"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}>
                {message.type === "success" ? (
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                )}
                <span className="text-sm">{message.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <User className="w-4 h-4 text-amber-600" />
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Mail className="w-4 h-4 text-amber-600" />
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                  placeholder="you@example.com"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Phone className="w-4 h-4 text-amber-600" />
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                  placeholder="+91 98765 43210"
                />
              </div>

              {/* Categories Dropdown */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Briefcase className="w-4 h-4 text-amber-600" />
                  Service Categories <span className="text-red-500">*</span>
                </label>
                {/* ✅ Fix 1: ref added for click-outside */}
                <div className="relative" ref={categoryRef}>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full px-4 py-3 text-left border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors flex justify-between items-center"
                  >
                    <span className={form.categories.length === 0 ? "text-gray-400" : "text-gray-700"}>
                      {form.categories.length === 0
                        ? "Select categories"
                        : `${form.categories.length} category(ies) selected`}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {categories.map((item) => (
                        <label
                          key={item._id}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-amber-50 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={form.categories.includes(item.name)}
                            onChange={() => handleCategoryToggle(item.name)}
                            className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                          />
                          <span className="text-gray-700">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                {form.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.categories.map((cat) => (
                      <span key={cat} className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
                        {cat}
                        <button
                          type="button"
                          onClick={() => handleCategoryToggle(cat)}
                          className="hover:text-amber-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Location Dropdown */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <MapPin className="w-4 h-4 text-amber-600" />
                  Location <span className="text-red-500">*</span>
                </label>
                {/* ✅ Fix 2: ref added for click-outside */}
                <div className="relative" ref={locationRef}>
                  <button
                    type="button"
                    onClick={() => setIsLocationOpen(!isLocationOpen)}
                    className="w-full px-4 py-3 text-left border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors flex justify-between items-center"
                  >
                    <span className={!form.city ? "text-gray-400" : "text-gray-700"}>
                      {getSelectedLocationLabel()}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isLocationOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isLocationOpen && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {locations.map((item) => (
                        <button
                          key={item._id}
                          type="button"
                          onClick={() => handleLocationSelect(item)}
                          className="w-full text-left px-4 py-3 hover:bg-amber-50 transition-colors text-gray-700"
                        >
                          {/* ✅ Fix 3: Format as "City (State)" matching the image */}
                          {item.city} ({item.state})
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-2 md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Image className="w-4 h-4 text-amber-600" />
                  Business Logo/Image
                </label>
                <div className="flex items-center gap-4">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg border-2 border-amber-200"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-amber-400 transition-colors bg-gray-50">
                      <div className="flex flex-col items-center justify-center">
                        <Camera className="w-8 h-8 text-gray-400" />
                        <span className="text-xs text-gray-500 mt-1">Upload</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                  <p className="text-xs text-gray-500">
                    Recommended: Square image, max 2MB<br />
                    JPG, PNG or GIF format
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2 md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FileText className="w-4 h-4 text-amber-600" />
                  Business Description
                </label>
                <textarea
                  rows="5"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors resize-none"
                  placeholder="Tell us about your business, services, experience, and what makes you unique..."
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-8 w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white font-semibold py-3 px-6 rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Submitting Registration...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Building2 className="w-5 h-5" />
                  <span>Submit Registration</span>
                </div>
              )}
            </button>

            {/* Info Note */}
            <p className="mt-4 text-xs text-center text-gray-500">
              By submitting this form, you agree to our terms and conditions.
              Your profile will be reviewed by our admin team within 24-48 hours.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VendorRegister;