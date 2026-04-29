import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Phone, Briefcase, KeyRound, ArrowRight, ArrowLeft, Home, Store, Eye, EyeOff } from "lucide-react";  
import useVendorNavigation from "../hooks/useVendorNavigation";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export default function AuthPage() {
  const navigate = useNavigate();
  const { handleVendorNavigation } = useVendorNavigation();

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 🔐 Forgot Password States
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    brandName: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  const validateForm = (isRegister = false) => {
    const newErrors = {};
    
    if (!form.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Email is invalid";
    
    if (!form.password) newErrors.password = "Password is required";
    else if (!isLogin && form.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    
    if (isRegister) {
      if (!form.brandName) newErrors.brandName = "Brand name is required";
      if (!form.mobile) newErrors.mobile = "Mobile number is required";
      else if (!/^\d{10}$/.test(form.mobile)) newErrors.mobile = "Mobile must be 10 digits";
      if (form.password !== form.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    }
    
    return newErrors;
  };

  // 🔹 LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();
    const newErrors = validateForm(false);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    try {
      setLoading(true);
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
      localStorage.setItem("vendorData", JSON.stringify(data.vendor || data.user || {}));
      
      // Use useVendorNavigation to check registration status and redirect accordingly
      await handleVendorNavigation({ fromGatekeeper: true, replace: true });
    } catch (err) {
      alert(err.message || "Login Error");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 REGISTER
  const handleRegister = async (e) => {
    e.preventDefault();
    
    const newErrors = validateForm(true);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/vendor/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");
      
      alert(data.message || "Registration successful!");
      setIsLogin(true);
      setForm({
        brandName: "",
        email: "",
        mobile: "",
        password: "",
        confirmPassword: "",
      });
    } catch (err) {
      alert(err.message || "Register Error");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 SEND OTP
  const handleSendOtp = async () => {
    if (!forgotEmail) {
      alert("Please enter your email");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error sending OTP");
      
      alert("OTP Sent 📩");
      setStep(2);
    } catch (err) {
      alert(err.message || "Error sending OTP");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 RESET PASSWORD WITH OTP
  const handleResetPassword = async () => {
    if (!otp || !newPassword) {
      alert("Please fill all fields");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail,
          otp,
          password: newPassword,
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error resetting password");

      alert(data.message || "Password reset successful!");
      setShowForgot(false);
      setStep(1);
      setOtp("");
      setNewPassword("");
      setForgotEmail("");
    } catch (err) {
      alert(err.message || "Error resetting password");
    } finally {
      setLoading(false);
    }
  };

  // Rest of the JSX remains the same...
  return (
    <div className="min-h-screen bg-neutral-50 flex overflow-hidden">
      {/* Decorative Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-rose-200/40 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-amber-200/40 blur-[120px]"></div>
      </div>

      {/* Left Pane - Image & Brand */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900 z-10 flex-col justify-between overflow-hidden shadow-2xl">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=2669&auto=format&fit=crop" 
            alt="Wedding Setup" 
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>
        </div>
        
        <div className="relative z-10 p-12">
          <Link to="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white/90 hover:text-white transition-all">
            <Home size={18} />
            <span className="font-semibold tracking-wide text-sm uppercase">Back to Home</span>
          </Link>
        </div>

        <div className="relative z-10 p-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-600/20 backdrop-blur-md text-rose-300 font-medium text-sm mb-6 border border-rose-500/30">
              <Store size={16} /> Vendor Portal
            </div>
            <h1 className="text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
              Manage your wedding <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-300 to-pink-300">business seamlessly.</span>
            </h1>
            <p className="text-gray-300 text-lg max-w-md leading-relaxed font-light">
              Join thousands of top-tier wedding professionals on Vivahanam and elevate your booking experience with state-of-the-art tools.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Pane - Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 z-10 relative">
        <div className="w-full max-w-[460px]">
          <AnimatePresence mode="wait">
            {showForgot ? (
              <motion.div 
                key="forgot"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_40px_rgb(0,0,0,0.06)] p-8 sm:p-10 border border-white"
              >
                <button 
                  onClick={() => { setShowForgot(false); setStep(1); }}
                  className="text-gray-400 hover:text-gray-800 transition-colors mb-6 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider"
                >
                  <ArrowLeft size={16} /> Back to login
                </button>
                
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-100 text-amber-600 mb-6">
                  {step === 1 ? <Mail size={24} /> : <KeyRound size={24} />}
                </div>

                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {step === 1 ? "Forgot Password" : "Reset Password"}
                </h2>
                <p className="text-gray-500 mb-8">
                  {step === 1 
                    ? "Enter your email to receive a secure reset code." 
                    : `Enter the secure code sent to ${forgotEmail}`}
                </p>

                {step === 1 ? (
                  <div className="space-y-5">
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors" size={20} />
                      <input
                        type="email"
                        placeholder="Email Address"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all outline-none"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                      />
                    </div>
                    <button
                      onClick={handleSendOtp}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-gray-900 to-gray-800 text-white font-semibold py-4 rounded-2xl hover:shadow-xl hover:shadow-gray-900/20 transition-all flex justify-center items-center gap-2 active:scale-[0.98] disabled:opacity-70"
                    >
                      {loading ? "Sending Code..." : "Send Reset Code"} <ArrowRight size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="relative group">
                      <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors" size={20} />
                      <input
                        type="text"
                        placeholder="6-digit OTP"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all outline-none tracking-[0.5em] font-mono font-bold text-lg"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                      />
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors" size={20} />
                      <input
                        type="password"
                        placeholder="New Password"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all outline-none"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    <button
                      onClick={handleResetPassword}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold py-4 rounded-2xl hover:shadow-xl hover:shadow-rose-500/20 transition-all active:scale-[0.98] disabled:opacity-70"
                    >
                      {loading ? "Resetting..." : "Reset Password"}
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="auth"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_40px_rgb(0,0,0,0.06)] p-8 sm:p-10 border border-white"
              >
                <div className="lg:hidden flex justify-center mb-8">
                  <Link to="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gray-900 border border-gray-800 text-white transition-all shadow-lg shadow-gray-900/20">
                    <Home size={16} />
                    <span className="font-bold tracking-wide text-xs uppercase">Vivahanam</span>
                  </Link>
                </div>

                <div className="flex bg-gray-100/50 p-1.5 rounded-2xl mb-8 border border-gray-200/50">
                  <button
                    onClick={() => {
                      setIsLogin(true);
                      setErrors({});
                    }}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${isLogin ? "bg-white text-gray-900 shadow-sm border border-gray-100" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setIsLogin(false);
                      setErrors({});
                    }}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${!isLogin ? "bg-white text-gray-900 shadow-sm border border-gray-100" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    Create Account
                  </button>
                </div>

                <div className="mb-8">
                  <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">
                    {isLogin ? "Welcome back" : "Join as a Vendor"}
                  </h2>
                  <p className="text-gray-500 font-medium">
                    {isLogin ? "Enter your details to access your dashboard." : "Set up your professional profile in minutes."}
                  </p>
                </div>

                {isLogin ? (
                  <form onSubmit={handleLogin} className="space-y-5">
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-rose-500 transition-colors" size={20} />
                      <input
                        type="email"
                        name="email"
                        placeholder="Email Address"
                        value={form.email}
                        onChange={handleChange}
                        className={`w-full pl-12 pr-4 py-4 bg-gray-50/50 border rounded-2xl focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all outline-none font-medium text-gray-800 ${errors.email ? 'border-red-500' : 'border-gray-200'}`}
                      />
                      {errors.email && <p className="text-red-500 text-xs mt-1 ml-2">{errors.email}</p>}
                    </div>
                    
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-rose-500 transition-colors" size={20} />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={handleChange}
                        className={`w-full pl-12 pr-12 py-4 bg-gray-50/50 border rounded-2xl focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all outline-none font-medium text-gray-800 ${errors.password ? 'border-red-500' : 'border-gray-200'}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                      {errors.password && <p className="text-red-500 text-xs mt-1 ml-2">{errors.password}</p>}
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowForgot(true)}
                        className="text-sm font-bold text-rose-500 hover:text-rose-600 transition-colors"
                      >
                        Forgot Password?
                      </button>
                    </div>

                    <button 
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold py-4 rounded-2xl hover:shadow-xl hover:shadow-rose-500/20 transition-all mt-4 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {loading ? "Signing in..." : "Sign In to Dashboard"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="relative group sm:col-span-2">
                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-rose-500 transition-colors" size={18} />
                        <input 
                          name="brandName" 
                          placeholder="Brand/Business Name" 
                          value={form.brandName}
                          onChange={handleChange} 
                          className={`w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border rounded-xl focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all outline-none text-sm font-medium text-gray-800 ${errors.brandName ? 'border-red-500' : 'border-gray-200'}`}
                        />
                        {errors.brandName && <p className="text-red-500 text-xs mt-1 ml-2">{errors.brandName}</p>}
                      </div>
                      
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-rose-500 transition-colors" size={18} />
                        <input 
                          type="email" 
                          name="email" 
                          placeholder="Email Address" 
                          value={form.email}
                          onChange={handleChange} 
                          className={`w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border rounded-xl focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all outline-none text-sm font-medium text-gray-800 ${errors.email ? 'border-red-500' : 'border-gray-200'}`}
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1 ml-2">{errors.email}</p>}
                      </div>
                      
                      <div className="relative group">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-rose-500 transition-colors" size={18} />
                        <input 
                          name="mobile" 
                          placeholder="Mobile Number" 
                          value={form.mobile}
                          onChange={handleChange} 
                          className={`w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border rounded-xl focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all outline-none text-sm font-medium text-gray-800 ${errors.mobile ? 'border-red-500' : 'border-gray-200'}`}
                        />
                        {errors.mobile && <p className="text-red-500 text-xs mt-1 ml-2">{errors.mobile}</p>}
                      </div>

                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-rose-500 transition-colors" size={18} />
                        <input 
                          type={showPassword ? "text" : "password"} 
                          name="password" 
                          placeholder="Password" 
                          value={form.password}
                          onChange={handleChange} 
                          className={`w-full pl-11 pr-10 py-3.5 bg-gray-50/50 border rounded-xl focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all outline-none text-sm font-medium text-gray-800 ${errors.password ? 'border-red-500' : 'border-gray-200'}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        {errors.password && <p className="text-red-500 text-xs mt-1 ml-2">{errors.password}</p>}
                      </div>
                      
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-rose-500 transition-colors" size={18} />
                        <input 
                          type={showConfirmPassword ? "text" : "password"} 
                          name="confirmPassword" 
                          placeholder="Confirm Password" 
                          value={form.confirmPassword}
                          onChange={handleChange} 
                          className={`w-full pl-11 pr-10 py-3.5 bg-gray-50/50 border rounded-xl focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all outline-none text-sm font-medium text-gray-800 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-200'}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 ml-2">{errors.confirmPassword}</p>}
                      </div>
                    </div>

                    <button 
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold py-4 rounded-xl hover:shadow-xl hover:shadow-rose-500/20 transition-all mt-6 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {loading ? "Creating Account..." : "Create Vendor Account"}
                    </button>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}