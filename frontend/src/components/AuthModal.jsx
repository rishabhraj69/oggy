import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AuthModal.css";

const API_URL = "http://localhost:5000/api/auth";

export default function AuthModal({ onClose }) {
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("customer");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ========================================
  // INPUT CHANGE
  // ========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  // ========================================
  // API REQUEST
  // ========================================

  const apiRequest = async (endpoint, payload) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.success === false) {
      throw new Error(data.message || "Something went wrong.");
    }

    return data;
  };

  // ========================================
  // ROLE SELECTOR
  // ========================================

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    setError("");
    setSuccess("");
    setMode("login");
  };

  // ========================================
  // SWITCH LOGIN / SIGNUP
  // ========================================

  const switchMode = (newMode) => {
    setError("");
    setSuccess("");

    // Admin/Garage Owner registration redirects
    // to garage registration page
    if (
      newMode === "signup" &&
      (role === "admin" || role === "garage_owner")
    ) {
      onClose?.();
      navigate("/garage-register");
      return;
    }

    setMode(newMode);
  };

  // ========================================
  // FORGOT PASSWORD
  // ========================================

  const openForgotPassword = () => {
    setError("");
    setSuccess("");

    setForm((prev) => ({
      ...prev,
      password: "",
      otp: "",
      newPassword: "",
      confirmPassword: "",
    }));

    setMode("forgot");
  };

  // ========================================
  // SEND OTP
  // POST /api/auth/forgot-password
  // ========================================

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const email = form.email.trim().toLowerCase();

    if (!email) {
      setError("Please enter your registered email.");
      return;
    }

    setLoading(true);

    try {
      const data = await apiRequest("/forgot-password", {
        email,
      });

      setForm((prev) => ({
        ...prev,
        email,
        otp: "",
        newPassword: "",
        confirmPassword: "",
      }));

      setSuccess(
        data.message ||
          "If this email is registered, an OTP will be sent."
      );

      setMode("reset");
    } catch (err) {
      setError(err.message || "Unable to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // RESET PASSWORD
  // POST /api/auth/reset-password
  // ========================================

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const email = form.email.trim().toLowerCase();
    const otp = form.otp.trim();
    const newPassword = form.newPassword;
    const confirmPassword = form.confirmPassword;

    if (!email || !otp || !newPassword || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await apiRequest("/reset-password", {
        email,
        otp,
        newPassword,
      });

      setSuccess(
        "Password reset successfully! Please login with your new password."
      );

      setForm((prev) => ({
        ...prev,
        password: "",
        otp: "",
        newPassword: "",
        confirmPassword: "",
      }));

      setMode("login");
    } catch (err) {
      setError(err.message || "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // LOGIN / CUSTOMER SIGNUP
  // ========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const email = form.email.trim().toLowerCase();
    const password = form.password;

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    if (mode === "signup") {
      if (role !== "customer") {
        onClose?.();
        navigate("/garage-register");
        return;
      }

      if (!form.name.trim()) {
        setError("Please enter your full name.");
        return;
      }

      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
    }

    setLoading(true);

    try {
      const endpoint = mode === "login" ? "/login" : "/register";

      const payload =
        mode === "login"
          ? { email, password }
          : {
              name: form.name.trim(),
              email,
              phone: form.phone.trim(),
              password,
            };

      const data = await apiRequest(endpoint, payload);

      // CUSTOMER SIGNUP SUCCESS
      if (mode === "signup") {
        setSuccess("Account created successfully! Please login.");

        setForm({
          name: "",
          email,
          phone: "",
          password: "",
          otp: "",
          newPassword: "",
          confirmPassword: "",
        });

        setMode("login");
        setRole("customer");

        return;
      }

      // LOGIN SUCCESS
      const user = data.user;

      if (!user) {
        throw new Error("User details were not received.");
      }

      // VERIFY SELECTED ROLE
      if (user.role !== role) {
        await fetch(`${API_URL}/logout`, {
          method: "POST",
          credentials: "include",
        });

        const roleNames = {
          customer: "Customer",
          admin: "Admin",
          garage_owner: "Garage Owner",
        };

        throw new Error(
          `This account is not registered as a ${roleNames[role]}.`
        );
      }

      setSuccess("Login successful!");

      onClose?.();

      // ROLE-BASED REDIRECT
      if (user.role === "admin") {
        navigate("/admin");
      } else if (user.role === "garage_owner") {
        navigate("/garage-dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // COMMON MESSAGES
  // ========================================

  const renderMessages = () => (
    <>
      {error && (
        <div className="auth-error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="auth-success" role="status">
          {success}
        </div>
      )}
    </>
  );

  // ========================================
  // UI
  // ========================================

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div
        className="auth-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE BUTTON */}

        <button
          type="button"
          className="auth-close"
          onClick={onClose}
          aria-label="Close login modal"
        >
          ×
        </button>

        {/* HEADER */}

        <h2>
          {mode === "login" && "Welcome Back!"}
          {mode === "signup" && "Create Account"}
          {mode === "forgot" && "Forgot Password?"}
          {mode === "reset" && "Reset Password"}
        </h2>

        <p>
          {mode === "login" && "Login to Doctor Motors"}
          {mode === "signup" && "Create your Doctor Motors account"}
          {mode === "forgot" &&
            "Enter your registered email to receive an OTP."}
          {mode === "reset" &&
            "Enter the OTP sent to your email and set a new password."}
        </p>

        {/* ROLE SELECTOR */}

        {mode === "login" && (
          <div className="auth-role-selector">
            {[
              ["customer", "Customer"],
              ["admin", "Admin"],
              ["garage_owner", "Garage Owner"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={role === value ? "active" : ""}
                onClick={() => handleRoleChange(value)}
                aria-pressed={role === value}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* GARAGE REGISTRATION LINK */}

        {mode === "login" &&
          (role === "admin" || role === "garage_owner") && (
            <div className="auth-admin-register">
              <p>Want to register your garage?</p>

              <button
                type="button"
                onClick={() => switchMode("signup")}
              >
                Register Your Garage
              </button>
            </div>
          )}

        {/* ================================== */}
        {/* LOGIN / SIGNUP FORM */}
        {/* ================================== */}

        {(mode === "login" || mode === "signup") && (
          <form onSubmit={handleSubmit}>
            {mode === "signup" && (
              <>
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                  required
                />

                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number (Optional)"
                  value={form.phone}
                  onChange={handleChange}
                  autoComplete="tel"
                />
              </>
            )}

            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              required
            />

            {/* FORGOT PASSWORD LINK */}

            {mode === "login" && (
              <div className="auth-forgot-password">
                <button
                  type="button"
                  onClick={openForgotPassword}
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {renderMessages()}

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                ? "Login"
                : "Create Account"}
            </button>
          </form>
        )}

        {/* ================================== */}
        {/* FORGOT PASSWORD FORM */}
        {/* ================================== */}

        {mode === "forgot" && (
          <form onSubmit={handleForgotPassword}>
            <input
              type="email"
              name="email"
              placeholder="Registered Email Address"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />

            {renderMessages()}

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        )}

        {/* ================================== */}
        {/* RESET PASSWORD FORM */}
        {/* ================================== */}

        {mode === "reset" && (
          <form onSubmit={handleResetPassword}>
            <input
              type="email"
              name="email"
              placeholder="Registered Email"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />

            <input
              type="text"
              name="otp"
              placeholder="6-Digit OTP"
              value={form.otp}
              onChange={handleChange}
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              required
            />

            <input
              type="password"
              name="newPassword"
              placeholder="New Password (Min 8 Characters)"
              value={form.newPassword}
              onChange={handleChange}
              autoComplete="new-password"
              minLength={8}
              required
            />

            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm New Password"
              value={form.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              minLength={8}
              required
            />

            {renderMessages()}

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? "Resetting Password..." : "Reset Password"}
            </button>

            {/* REQUEST NEW OTP */}

            <div className="auth-forgot-password">
              <button
                type="button"
                onClick={openForgotPassword}
                disabled={loading}
              >
                Request New OTP
              </button>
            </div>
          </form>
        )}

        {/* ================================== */}
        {/* LOGIN / SIGNUP / BACK LINKS */}
        {/* ================================== */}

        <div className="auth-switch">
          {mode === "login" && (
            <>
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => switchMode("signup")}
              >
                Sign Up
              </button>
            </>
          )}

          {mode === "signup" && (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => switchMode("login")}
              >
                Login
              </button>
            </>
          )}

          {(mode === "forgot" || mode === "reset") && (
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
                setSuccess("");
              }}
            >
              ← Back to Login
            </button>
          )}
        </div>

        {/* FOOTER */}

        <div className="auth-footer">Doctor Motors</div>
      </div>
    </div>
  );
}