// AuthPage.jsx - Complete authentication component with all features
import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react"; // Import eye icons

const AuthPage = ({ onSuccess, onClose, disableRegisterRedirect = false, context = "" }) => {
  const [showAuthModal, setShowAuthModal] = useState(true);
  const [authMode, setAuthMode] = useState("login"); // 'login', 'signup', 'forgot', 'verify', 'success'
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // Login state
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    showPassword: false,
  });

  // Signup form data
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    showPassword: false,
    showConfirmPassword: false,
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});

  const navigate = useNavigate();
  const location = useLocation();

  const API_URL = import.meta.env.VITE_API_KEYSU;

  // Check if user is already logged in on component mount
  useEffect(() => {
    const checkUserLoggedIn = () => {
      const token = localStorage.getItem("vivahanamToken");
      const userData = localStorage.getItem("vivahanamUser");

      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);

          // If a redirect target is provided (e.g., Wedding Service Form), honor it
          const redirectTo = location.state?.redirectTo || "/register";
          const selectedPlan = location.state?.selectedPlan;

          if (onSuccess) onSuccess();
          navigate(redirectTo, {
            state: selectedPlan ? { selectedPlan } : undefined,
          });
        } catch (error) {
          console.error("Error parsing user data:", error);
          // Clear invalid data
          localStorage.removeItem("vivahanamToken");
          localStorage.removeItem("vivahanamUser");
        }
      }
    };

    checkUserLoggedIn();
  }, [navigate, location.state, onSuccess]);

  // Validation rules for signup
  const validationRules = {
    firstName: {
      required: true,
      minLength: 2,
      maxLength: 50,
      pattern: /^[A-Za-z\s]+$/,
      message: "First name must be 2-50 letters only",
    },
    lastName: {
      required: true,
      minLength: 1,
      maxLength: 50,
      pattern: /^[A-Za-z\s]+$/,
      message: "Last name must be 1-50 letters only",
    },
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: "Enter a valid email address",
    },
    password: {
      required: true,
      minLength: 6,
      message: "Password must be at least 6 characters",
    },
    confirmPassword: {
      required: true,
      validate: (value, formData) => value === formData.password,
      message: "Passwords do not match",
    },
  };

  // Validation function
  const validateField = (name, value, allFormData = formData) => {
    const rule = validationRules[name];
    if (!rule) return null;

    if (rule.required && (!value || value.toString().trim() === "")) {
      return "This field is required";
    }

    if (value && rule.minLength && value.length < rule.minLength) {
      return rule.message || `Minimum ${rule.minLength} characters required`;
    }

    if (value && rule.maxLength && value.length > rule.maxLength) {
      return rule.message || `Maximum ${rule.maxLength} characters allowed`;
    }

    if (value && rule.pattern && !rule.pattern.test(value)) {
      return rule.message || "Invalid format";
    }

    if (value && rule.validate) {
      const isValid = rule.validate(value, allFormData);
      if (!isValid) return rule.message || "Invalid value";
    }

    return null;
  };

  const validateAllFields = () => {
    const errors = {};

    Object.keys(validationRules).forEach((fieldName) => {
      const value = formData[fieldName];
      const error = validateField(fieldName, value, formData);
      if (error) {
        errors[fieldName] = error;
      }
    });

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form handlers for signup
  const handleFieldBlur = (fieldName) => {
    setTouchedFields((prev) => ({ ...prev, [fieldName]: true }));

    const value = formData[fieldName];
    const error = validateField(fieldName, value, formData);

    setFieldErrors((prev) => ({
      ...prev,
      [fieldName]: error,
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (touchedFields[name]) {
      const error = validateField(name, value, formData);
      setFieldErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    }
  };

  // OTP handler for email verification
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setVerifyError("Please enter a valid 6-digit OTP.");
      return;
    }

    setVerifyError("");
    setVerifyLoading(true);

    try {
      const response = await fetch(`${API_URL}/user/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          verificationCode: otp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `Verification failed: ${response.statusText}`
        );
      }

      if (data.token) {
        localStorage.setItem("vivahanamToken", data.token);
      }

      // Prefill login email for seamless transition
      setLoginData((prev) => ({ ...prev, email: formData.email }));

      setShowOtpModal(false);
      setSuccess("Account verified successfully! You can now login.");
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        showPassword: false,
        showConfirmPassword: false,
      });
      setOtp("");
      // Switch to login mode (modal stays open)
      setAuthMode("login");
    } catch (err) {
      setVerifyError(
        err.message ||
          "Verification failed. Please check your email and try again."
      );
    } finally {
      setVerifyLoading(false);
    }
  };

  // Forgot Password - Step 1: Request verification code
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!forgotEmail) {
      setError("Please enter your email address");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/user/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          loginId: forgotEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to send verification code`);
      }

      setSuccess(
        "✅ Verification code sent to your email! Please check your inbox."
      );
      setAuthMode("verify");
    } catch (err) {
      console.error("Forgot password error:", err);
      setError(
        err.message || "Failed to send verification code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password - Step 2: Verify code and reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!otp || !newPassword || !confirmNewPassword) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit verification code");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/user/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: forgotEmail,
          verificationCode: otp,
          newPassword: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Password reset failed`);
      }

      // Prefill login email for seamless transition
      setLoginData({ email: forgotEmail, password: "", showPassword: false });

      setSuccess(
        "✅ Password reset successfully! You can now login with your new password."
      );
      setAuthMode("login"); // Switch to login after successful password reset
      setForgotEmail("");
      setNewPassword("");
      setConfirmNewPassword("");
      setOtp("");
      setShowNewPassword(false);
      setShowConfirmNewPassword(false);
    } catch (err) {
      console.error("Reset password error:", err);
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Signup function
  const handleSignup = async (e) => {
    e.preventDefault();

    // Validate all fields
    const allFields = Object.keys(validationRules);
    const touched = {};
    allFields.forEach((field) => {
      touched[field] = true;
    });
    setTouchedFields(touched);

    if (!validateAllFields()) {
      setError("Please fix all validation errors before submitting.");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/user/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `Signup failed: ${response.statusText}`
        );
      }

      setShowOtpModal(true);
      setSuccess(
        "Registration successful! Please check your email for verification code."
      );
    } catch (err) {
      setError(err.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Login function - MODIFIED for SubscriptionPlans
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Frontend validation: Check if all fields are filled
    if (!loginData.email || !loginData.password) {
      setError("All fields are required. Please fill in email and password.");
      setLoading(false);
      return;
    }

    // Additional frontend validation for email format (basic)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(loginData.email)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    // Additional frontend validation for password length
    if (loginData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/user/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loginId: loginData.email,
          password: loginData.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        let errorMsg =
          errorData?.message || `Login failed: ${response.statusText}`;

        // Handle specific backend errors if available
        if (
          errorMsg.toLowerCase().includes("user not found") ||
          errorMsg.toLowerCase().includes("invalid credentials")
        ) {
          errorMsg = "Please signup first, then login.";
        } else if (
          errorMsg.toLowerCase().includes("invalid password") ||
          errorMsg.toLowerCase().includes("wrong password")
        ) {
          errorMsg = "Password is wrong. Please try again.";
        } else if (
          errorMsg.toLowerCase().includes("verify your email") ||
          errorMsg.toLowerCase().includes("verification")
        ) {
          errorMsg =
            "Please check your email for verification code and verify before logging in.";
        }

        throw new Error(errorMsg);
      }

      const data = await response.json();

      if (data.token) {
        localStorage.setItem("vivahanamToken", data.token);
      }

      if (data.user) {
        localStorage.setItem("vivahanamUser", JSON.stringify(data.user));
        setUser(data.user);
      }

      setShowAuthModal(false);
      setLoginData({
        email: "",
        password: "",
        showPassword: false,
      });

      // Check if we're coming from SubscriptionPlans
      const isFromSubscriptionPlans = disableRegisterRedirect || 
                                      context === "subscriptionPlans" ||
                                      window.location.pathname.includes("subscription");

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Check if we should skip register redirect (for SubscriptionPlans)
      if (isFromSubscriptionPlans) {
        // For SubscriptionPlans: Don't navigate to /register
        // Stay on current page and let SubscriptionPlans handle the flow
        return;
      }

      // Original logic for other pages (like PayAsYouGoDashboard)
      const isFromPayAsYouGo = location.state?.fromPayAsYouGo || 
                               location.pathname.includes("payas") ||
                               window.location.pathname.includes("payas");

      // If user profile is not completed, go to registration
      if (data.user && !data.user.profileCompleted) {
        navigate("/register", { 
          state: { 
            redirectTo: isFromPayAsYouGo ? "/payas" : "/",
            fromPayAsYouGo: isFromPayAsYouGo
          } 
        });
      } else {
        // If profile is completed, stay in the current page (PayAsYouGoDashboard)
        if (isFromPayAsYouGo) {
          // We're already in PayAsYouGoDashboard, no need to navigate
        } else {
          // If not from PayAsYouGoDashboard, go to home
          navigate("/");
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Please signup first, then login.");
    } finally {
      setLoading(false);
    }
  };

  // Navigation functions
  const switchToLogin = () => {
    setAuthMode("login");
    setError("");
    setSuccess("");
    setLoginData({
      email: "",
      password: "",
      showPassword: false,
    });
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      showPassword: false,
      showConfirmPassword: false,
    });
    setFieldErrors({});
    setTouchedFields({});
  };

  const switchToSignup = () => {
    setAuthMode("signup");
    setError("");
    setSuccess("");
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      showPassword: false,
      showConfirmPassword: false,
    });
    setFieldErrors({});
    setTouchedFields({});
  };

  const switchToForgot = () => {
    setAuthMode("forgot");
    setError("");
    setSuccess("");
    setForgotEmail("");
    setNewPassword("");
    setConfirmNewPassword("");
    setOtp("");
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);
  };

  const requestNewCode = () => {
    setAuthMode("forgot");
    setError("");
    setSuccess("");
    setOtp("");
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
    setError("");
    setSuccess("");

    setLoginData({
      email: "",
      password: "",
      showPassword: false,
    });

    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      showPassword: false,
      showConfirmPassword: false,
    });

    setFieldErrors({});
    setTouchedFields({});
    setForgotEmail("");
    setNewPassword("");
    setConfirmNewPassword("");
    setOtp("");
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);

    // Call onClose callback if provided
    if (onClose) {
      onClose();
    }
  };

  const closeOtpModal = () => {
    setShowOtpModal(false);
    setOtp("");
    setVerifyError("");
  };

  // Helper functions for modal content
  const getTitle = () => {
    switch (authMode) {
      case "login":
        return "Welcome Back";
      case "signup":
        return "Join Vivahanam";
      case "forgot":
        return "Reset Your Password";
      case "verify":
        return "Enter Verification Code";
      case "success":
        return "Success!";
      default:
        return "Welcome Back";
    }
  };

  const getSubtitle = () => {
    switch (authMode) {
      case "login":
        return "Sign in to your account to continue";
      case "signup":
        return "Create your account to find your perfect life partner";
      case "forgot":
        return "Enter your email to receive a verification code";
      case "verify":
        return "Enter the code and your new password";
      case "success":
        return "Your password has been reset successfully";
      default:
        return "Sign in to your account to continue";
    }
  };

  const getButtonText = () => {
    if (loading) {
      switch (authMode) {
        case "login":
          return "Signing in...";
        case "signup":
          return "Creating Account...";
        case "forgot":
          return "Sending code...";
        case "verify":
          return "Resetting Password...";
        default:
          return "Processing...";
      }
    }

    switch (authMode) {
      case "login":
        return "Sign in";
      case "signup":
        return "Create Account";
      case "forgot":
        return "Send Verification Code";
      case "verify":
        return "Reset Password";
      case "success":
        return "Continue to Login";
      default:
        return "Sign in";
    }
  };

  // Render helpers for signup
  const renderFieldError = (fieldName) => {
    if (touchedFields[fieldName] && fieldErrors[fieldName]) {
      return (
        <p className="mt-1 text-sm text-red-600">{fieldErrors[fieldName]}</p>
      );
    }
    return null;
  };

  const getInputClassName = (fieldName) => {
    const baseClass =
      "mt-1 block w-full px-3 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm";

    if (touchedFields[fieldName] && fieldErrors[fieldName]) {
      return `${baseClass} border-red-300 focus:border-red-500`;
    }

    return `${baseClass} border-gray-300 focus:border-orange-500`;
  };

  // If user is logged in, show a loading state or redirect message
  if (!showAuthModal && !user) {
    return null;
  }

  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-3 rounded-xl">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Already Logged In
          </h2>
          <p className="text-gray-600 mb-6">
            You are already logged in. Redirecting to registration page...
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate("/register")}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
            >
              Go to Registration
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("vivahanamToken");
                localStorage.removeItem("vivahanamUser");
                setUser(null);
                window.location.reload();
              }}
              className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-all duration-300"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center">
      {/* Auth Modal - Only show if user is not logged in */}
      {!user && showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-2">
                <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-2 rounded-xl">
                  <span className="text-lg font-bold">V</span>
                </div>
                <span className="text-lg font-semibold text-gray-800">
                  IVAHANAM
                </span>
              </div>
              <button
                onClick={closeAuthModal}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                disabled={loading}
              >
                ×
              </button>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {getTitle()}
              </h2>
              <p className="mt-2 text-sm text-gray-600">{getSubtitle()}</p>

              {authMode === "verify" && forgotEmail && (
                <p className="mt-1 text-sm text-orange-600 font-medium">
                  📧 Code sent to: {forgotEmail}
                </p>
              )}
            </div>

            {/* Toggle Buttons - Only show for login/signup */}
            {(authMode === "login" || authMode === "signup") && (
              <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
                <button
                  onClick={switchToLogin}
                  className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                    authMode === "login"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={switchToSignup}
                  className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                    authMode === "signup"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Sign Up
                </button>
              </div>
            )}

            <form
              onSubmit={
                authMode === "login"
                  ? handleLogin
                  : authMode === "signup"
                  ? handleSignup
                  : authMode === "forgot"
                  ? handleForgotPassword
                  : authMode === "verify"
                  ? handleResetPassword
                  : switchToLogin
              }
              className="space-y-4"
            >
              {/* Error and Success Messages */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
                  {success}
                </div>
              )}

              {/* Name Fields - Show for Signup only */}
              {authMode === "signup" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      onBlur={() => handleFieldBlur("firstName")}
                      required
                      className={getInputClassName("firstName")}
                      placeholder="John"
                      disabled={loading}
                    />
                    {renderFieldError("firstName")}
                  </div>

                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Last Name *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      onBlur={() => handleFieldBlur("lastName")}
                      required
                      className={getInputClassName("lastName")}
                      placeholder="Doe"
                      disabled={loading}
                    />
                    {renderFieldError("lastName")}
                  </div>
                </div>
              )}

              {/* Email Field - Show for login, signup and forgot */}
              {(authMode === "login" ||
                authMode === "signup" ||
                authMode === "forgot") && (
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email Address *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={
                      authMode === "signup"
                        ? formData.email
                        : authMode === "login"
                        ? loginData.email
                        : forgotEmail
                    }
                    onChange={(e) => {
                      if (authMode === "signup") {
                        setFormData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }));
                      } else if (authMode === "login") {
                        setLoginData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }));
                      } else {
                        setForgotEmail(e.target.value);
                      }
                    }}
                    onBlur={
                      authMode === "signup"
                        ? () => handleFieldBlur("email")
                        : undefined
                    }
                    className={
                      authMode === "signup"
                        ? getInputClassName("email")
                        : "relative block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:z-10 transition-colors"
                    }
                    placeholder="Enter your email"
                    disabled={loading}
                  />
                  {authMode === "signup" && renderFieldError("email")}
                </div>
              )}

              {/* Verification Code + New Password Fields - Show for verify mode */}
              {authMode === "verify" && (
                <>
                  <div>
                    <label
                      htmlFor="verificationCode"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Verification Code *
                    </label>
                    <input
                      id="verificationCode"
                      name="verificationCode"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength="6"
                      required
                      value={otp}
                      onChange={(e) =>
                        setOtp(
                          e.target.value.replace(/\D/g, "").slice(0, 6)
                        )
                      }
                      className="relative block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:z-10 transition-colors text-center text-lg font-mono tracking-widest"
                      placeholder="000000"
                      disabled={loading}
                    />
                    <p className="text-xs text-gray-500 mt-1 text-center">
                      ⏰ 6-digit code (expires in 10 minutes)
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="newPassword"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      New Password *
                    </label>
                    <div className="relative">
                      <input
                        id="newPassword"
                        name="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="relative block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:z-10 transition-colors pr-10"
                        placeholder="Enter new password (min 6 characters)"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="confirmNewPassword"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Confirm New Password *
                    </label>
                    <div className="relative">
                      <input
                        id="confirmNewPassword"
                        name="confirmNewPassword"
                        type={showConfirmNewPassword ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="relative block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:z-10 transition-colors pr-10"
                        placeholder="Confirm new password"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() =>
                          setShowConfirmNewPassword(!showConfirmNewPassword)
                        }
                      >
                        {showConfirmNewPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Request new code link */}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={requestNewCode}
                      className="text-sm text-orange-600 hover:text-orange-500 transition-colors font-medium"
                      disabled={loading}
                    >
                      🔄 Didn't receive code? Request new one
                    </button>
                  </div>
                </>
              )}

              {/* Password Field - Show for login and signup */}
              {(authMode === "login" || authMode === "signup") && (
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {authMode === "login" ? "Password *" : "Create Password *"}
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={
                        authMode === "login"
                          ? loginData.showPassword
                            ? "text"
                            : "password"
                          : formData.showPassword
                          ? "text"
                          : "password"
                      }
                      autoComplete={
                        authMode === "login"
                          ? "current-password"
                          : "new-password"
                      }
                      required
                      value={
                        authMode === "signup"
                          ? formData.password
                          : loginData.password
                      }
                      onChange={(e) => {
                        if (authMode === "signup") {
                          setFormData((prev) => ({
                            ...prev,
                            password: e.target.value,
                          }));
                        } else {
                          setLoginData((prev) => ({
                            ...prev,
                            password: e.target.value,
                          }));
                        }
                      }}
                      onBlur={
                        authMode === "signup"
                          ? () => handleFieldBlur("password")
                          : undefined
                      }
                      className={
                        authMode === "signup"
                          ? getInputClassName("password") + " pr-10"
                          : "relative block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:z-10 transition-colors pr-10"
                      }
                      placeholder={
                        authMode === "login"
                          ? "Enter your password"
                          : "Create a password (min 6 characters)"
                      }
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => {
                        if (authMode === "login") {
                          setLoginData((prev) => ({
                            ...prev,
                            showPassword: !prev.showPassword,
                          }));
                        } else {
                          setFormData((prev) => ({
                            ...prev,
                            showPassword: !prev.showPassword,
                          }));
                        }
                      }}
                    >
                      {authMode === "login"
                        ? loginData.showPassword
                          ? <EyeOff className="h-5 w-5 text-gray-400" />
                          : <Eye className="h-5 w-5 text-gray-400" />
                        : formData.showPassword
                        ? <EyeOff className="h-5 w-5 text-gray-400" />
                        : <Eye className="h-5 w-5 text-gray-400" />}
                    </button>
                  </div>
                  {authMode === "signup" && renderFieldError("password")}
                </div>
              )}

              {/* Confirm Password Field - Show for signup */}
              {authMode === "signup" && (
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={
                        formData.showConfirmPassword ? "text" : "password"
                      }
                      autoComplete="new-password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      onBlur={() => handleFieldBlur("confirmPassword")}
                      className={
                        getInputClassName("confirmPassword") + " pr-10"
                      }
                      placeholder="Confirm your password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          showConfirmPassword: !prev.showConfirmPassword,
                        }));
                      }}
                    >
                      {formData.showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {renderFieldError("confirmPassword")}
                </div>
              )}

              {/* Remember Me and Forgot Password - Only show for login */}
              {authMode === "login" && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="remember-me"
                      className="ml-2 block text-sm text-gray-700"
                    >
                      Remember me
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={switchToForgot}
                    className="text-sm font-medium text-orange-600 hover:text-orange-500 transition-colors"
                    disabled={loading}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <div>
                <button
                  type={authMode === "success" ? "button" : "submit"}
                  onClick={authMode === "success" ? switchToLogin : undefined}
                  disabled={loading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      {getButtonText()}
                    </div>
                  ) : (
                    getButtonText()
                  )}
                </button>
              </div>

              {/* Navigation Links */}
              <div className="text-center space-y-2">
                {authMode === "login" ? (
                  <>
                    <p className="text-sm text-gray-600">
                      Don't have an account?{" "}
                      <button
                        type="button"
                        onClick={switchToSignup}
                        className="font-medium text-orange-600 hover:text-orange-500 transition-colors"
                        disabled={loading}
                      >
                        Signup now
                      </button>
                    </p>
                  </>
                ) : authMode === "signup" ? (
                  <>
                    <p className="text-sm text-gray-600">
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={switchToLogin}
                        className="font-medium text-orange-600 hover:text-orange-500 transition-colors"
                        disabled={loading}
                      >
                        Login here
                      </button>
                    </p>
                  </>
                ) : authMode === "success" ? (
                  <p className="text-sm text-gray-600">
                    Ready to continue?{" "}
                    <button
                      type="button"
                      onClick={switchToLogin}
                      className="font-medium text-orange-600 hover:text-orange-500 transition-colors"
                    >
                      Click here to login
                    </button>
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-gray-600">
                      Remember your password?{" "}
                      <button
                        type="button"
                        onClick={switchToLogin}
                        className="font-medium text-orange-600 hover:text-orange-500 transition-colors"
                        disabled={loading}
                      >
                        Back to login
                      </button>
                    </p>
                  </>
                )}
              </div>
            </form>

            {/* Additional Info */}
            <div className="text-center mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                By continuing, you agree to our{" "}
                <Link
                  to="/terms"
                  className="text-orange-600 hover:text-orange-500"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy"
                  className="text-orange-600 hover:text-orange-500"
                >
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* OTP Modal for Email Verification */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Verify Your Email
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              We've sent a 6-digit verification code to{" "}
              <strong>{formData.email}</strong>
            </p>
            {verifyError && (
              <p className="text-red-500 text-sm text-center mb-2">
                {verifyError}
              </p>
            )}
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter 6-digit code"
                maxLength={6}
                disabled={verifyLoading}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-center text-lg font-mono disabled:opacity-50"
              />
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeOtpModal}
                  disabled={verifyLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifyLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifyLoading ? "Verifying..." : "Verify Email"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthPage;