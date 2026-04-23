import { useState, useEffect } from "react";
import useVendorNavigation from "../hooks/useVendorNavigation";

const API_URL = import.meta.env.VITE_API_KEY || "http://localhost:8000/api";

export default function VendorAuth() {
  const [isLogin, setIsLogin] = useState(true); // Default to sign in
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { handleVendorNavigation, isVendorLoggedIn } = useVendorNavigation();

  // Redirect if already logged in
  useEffect(() => {
    if (isVendorLoggedIn) {
      handleVendorNavigation({ fromGatekeeper: true, replace: true });
    }
  }, [handleVendorNavigation, isVendorLoggedIn]);

  // Form State
  const [form, setForm] = useState({
    brandName: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    city: "",
    vendorType: "",
  });

  const [errors, setErrors] = useState({});

  // 🔹 Validation
  const validate = (name, value) => {
    let error = "";

    if (name === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) error = "Invalid email format";
    }

    if (!isLogin && name === "mobile") {
      const mobileRegex = /^[0-9]{10}$/;
      if (!mobileRegex.test(value)) error = "Mobile must be 10 digits";
    }

    if (!isLogin && name === "password") {
      const strongPassword = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
      if (!strongPassword.test(value)) {
        error = "Min 6 chars, 1 uppercase & 1 number required";
      }
    }

    if (!isLogin && name === "confirmPassword") {
      if (value !== form.password) error = "Passwords do not match";
    }

    return error;
  };

  // 🔹 Handle Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    const error = validate(name, value);
    setErrors({ ...errors, [name]: error });
  };

  // 🔹 Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault();

    let newErrors = {};

    // Validate relevant fields
    const fieldsToValidate = isLogin
      ? ["email", "password"]
      : Object.keys(form);

    fieldsToValidate.forEach((key) => {
      const error = validate(key, form[key]);
      if (error) newErrors[key] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);

      if (isLogin) {
        // Handle Login
        const res = await fetch(`${API_URL}/vendor/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
          }),
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Login failed");

        localStorage.setItem("vendorToken", data.token);
        localStorage.setItem("vendorData", JSON.stringify(data.user || {}));
        await handleVendorNavigation({ fromGatekeeper: true, replace: true });
      } else {
        // Handle Registration
        const res = await fetch(`${API_URL}/vendor/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Registration failed");
        
        alert(data.message || "Registration successful! Please sign in.");
        
        // Clear form and switch to login
        setForm({
          brandName: "",
          email: "",
          mobile: "",
          password: "",
          confirmPassword: "",
          city: "",
          vendorType: "",
        });
        setIsLogin(true);
      }
    } catch (err) {
      alert(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) =>
    `w-full mt-1 border p-2 rounded-lg ${
      errors[field] ? "border-red-500" : "border-gray-300"
    }`;

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
          {isLogin ? "Welcome Back" : "Join as a Vendor"}
        </h2>
        <p className="text-center text-gray-500 mb-6">
          {isLogin ? "Sign in to manage your profile" : "Create your vendor profile today"}
        </p>

        {/* Toggle Buttons */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          <button
            type="button"
            className={`w-1/2 py-2 text-sm font-medium rounded-md transition-all ${
              isLogin ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => {
              setIsLogin(true);
              setErrors({});
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`w-1/2 py-2 text-sm font-medium rounded-md transition-all ${
              !isLogin ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => {
              setIsLogin(false);
              setErrors({});
            }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="text-sm font-medium text-gray-700">Brand Name *</label>
              <input
                type="text"
                name="brandName"
                placeholder="Enter your brand name"
                className={inputStyle("brandName")}
                value={form.brandName}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700">Email Address *</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              className={inputStyle("email")}
              value={form.email}
              onChange={handleChange}
              required
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          {!isLogin && (
            <div>
              <label className="text-sm font-medium text-gray-700">Mobile Number *</label>
              <input
                type="text"
                name="mobile"
                placeholder="10-digit mobile number"
                className={inputStyle("mobile")}
                value={form.mobile}
                onChange={handleChange}
                required
              />
              {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>}
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700">Password *</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder={isLogin ? "Enter your password" : "Create a strong password"}
                className={inputStyle("password")}
                value={form.password}
                onChange={handleChange}
                required
              />
              <span
                className="absolute right-3 top-3.5 cursor-pointer text-sm"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "🙈" : "👁️"}
              </span>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="text-sm font-medium text-gray-700">Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Re-enter password"
                  className={inputStyle("confirmPassword")}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Base City *</label>
                <select
                  name="city"
                  className={inputStyle("city")}
                  value={form.city}
                  onChange={handleChange}
                  required
                >
                  <option value="">Choose your base city</option>
                  <option>Nagpur</option>
                  <option>Mumbai</option>
                  <option>Pune</option>
                  <option>Delhi</option>
                  <option>Bangalore</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Vendor Type *</label>
                <select
                  name="vendorType"
                  className={inputStyle("vendorType")}
                  value={form.vendorType}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select vendor type</option>
                  <option>Photographer</option>
                  <option>Decorator</option>
                  <option>Planner</option>
                  <option>Makeup Artist</option>
                  <option>Venue</option>
                  <option>Caterer</option>
                </select>
              </div>
            </>
          )}

          {isLogin && (
            <div className="flex justify-between text-sm mt-2">
              <label className="flex items-center gap-2 text-gray-600">
                <input type="checkbox" className="rounded text-amber-600 focus:ring-amber-500" />
                Remember me
              </label>
              <a href="#" className="text-amber-600 hover:text-amber-700 font-medium">
                Forgot password?
              </a>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 rounded-lg text-white font-medium mt-6 transition-colors ${
              loading ? "bg-amber-400 cursor-not-allowed" : "bg-amber-600 hover:bg-amber-700"
            }`}
          >
            {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
