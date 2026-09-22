import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import "./Register.css";

const API_URL = "http://localhost:5000/api/registration";

const INITIAL_FORM = {
  name: "",
  ownerName: "",
  email: "",
  phone: "",
  ownerPhone: "",
  password: "",
  garageName: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  garagePhone: "",
};

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();

  const isGaragePage =
    location.pathname === "/garage-register";

  const [form, setForm] = useState(INITIAL_FORM);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ========================================
  // FORM INPUT HANDLER
  // ========================================

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  }

  // ========================================
  // FORM SUBMISSION
  // ========================================

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (isGaragePage) {
      const requiredGarageFields = [
        form.ownerName,
        form.email,
        form.ownerPhone,
        form.garageName,
        form.address,
        form.city,
        form.state,
        form.pincode,
        form.garagePhone,
      ];

      if (requiredGarageFields.some((value) => !value.trim())) {
        setError("Please fill in all required garage details.");
        return;
      }
    } else {
      if (
        !form.name.trim() ||
        !form.email.trim() ||
        !form.phone.trim()
      ) {
        setError("Please fill in all required fields.");
        return;
      }
    }

    const endpoint = isGaragePage
      ? `${API_URL}/garage`
      : `${API_URL}/customer`;

    const payload = isGaragePage
      ? {
          ownerName: form.ownerName.trim(),
          email: form.email.trim().toLowerCase(),
          ownerPhone: form.ownerPhone.trim(),
          password: form.password,

          garageName: form.garageName.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          pincode: form.pincode.trim(),
          garagePhone: form.garagePhone.trim(),
        }
      : {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          password: form.password,
        };

    try {
      setLoading(true);

      const response = await fetch(endpoint, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        credentials: "include",

        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message || "Registration failed. Please try again."
        );
      }

      setSuccess(
        data.message ||
          (isGaragePage
            ? "Garage registration submitted successfully."
            : "Account created successfully.")
      );

      setForm(INITIAL_FORM);
    } catch (err) {
      setError(
        err.message ||
          "Unable to connect to Doctor Motors server."
      );
    } finally {
      setLoading(false);
    }
  }

  // ========================================
  // PAGE UI
  // ========================================

  return (
    <div className="register-page">
      <div className="register-card">

        {/* BRAND */}

        <div className="register-logo">🚗</div>

        <p className="register-label">
          DOCTOR MOTORS
        </p>

        <h1>
          {isGaragePage
            ? "Register Your Garage"
            : "Create Your Account"}
        </h1>

        <p className="register-subtitle">
          {isGaragePage
            ? "Join Doctor Motors and grow your garage business."
            : "Create your account to get started with Doctor Motors."}
        </p>

        {/* REGISTRATION TYPE */}

        <div className="register-tabs">
          <button
            type="button"
            className={!isGaragePage ? "active" : ""}
            onClick={() => navigate("/register")}
          >
            Customer
          </button>

          <button
            type="button"
            className={isGaragePage ? "active" : ""}
            onClick={() => navigate("/garage-register")}
          >
            Garage Owner
          </button>
        </div>

        {/* REGISTRATION FORM */}

        <form onSubmit={handleSubmit}>

          {/* GARAGE OWNER FORM */}

          {isGaragePage ? (
            <>
              <h3 className="register-section-title">
                Owner Information
              </h3>

              <div className="register-field">
                <label htmlFor="ownerName">
                  Owner Full Name *
                </label>

                <input
                  id="ownerName"
                  name="ownerName"
                  type="text"
                  placeholder="Enter owner full name"
                  value={form.ownerName}
                  onChange={handleChange}
                  autoComplete="name"
                  maxLength={100}
                  required
                />
              </div>

              <div className="register-field">
                <label htmlFor="garage-owner-email">
                  Email Address *
                </label>

                <input
                  id="garage-owner-email"
                  name="email"
                  type="email"
                  placeholder="Enter email address"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  maxLength={254}
                  required
                />
              </div>

              <div className="register-field">
                <label htmlFor="ownerPhone">
                  Owner Phone *
                </label>

                <input
                  id="ownerPhone"
                  name="ownerPhone"
                  type="tel"
                  placeholder="Enter owner phone number"
                  value={form.ownerPhone}
                  onChange={handleChange}
                  autoComplete="tel"
                  maxLength={20}
                  required
                />
              </div>

              <div className="register-field">
                <label htmlFor="garage-password">
                  Password *
                </label>

                <input
                  id="garage-password"
                  name="password"
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  required
                />
              </div>

              <h3 className="register-section-title">
                Garage Information
              </h3>

              <div className="register-field">
                <label htmlFor="garageName">
                  Garage Name *
                </label>

                <input
                  id="garageName"
                  name="garageName"
                  type="text"
                  placeholder="Enter garage name"
                  value={form.garageName}
                  onChange={handleChange}
                  maxLength={150}
                  required
                />
              </div>

              <div className="register-field">
                <label htmlFor="address">
                  Garage Address *
                </label>

                <input
                  id="address"
                  name="address"
                  type="text"
                  placeholder="Street address"
                  value={form.address}
                  onChange={handleChange}
                  maxLength={250}
                  required
                />
              </div>

              <div className="register-row">
                <div className="register-field">
                  <label htmlFor="city">
                    City *
                  </label>

                  <input
                    id="city"
                    name="city"
                    type="text"
                    placeholder="City"
                    value={form.city}
                    onChange={handleChange}
                    maxLength={100}
                    required
                  />
                </div>

                <div className="register-field">
                  <label htmlFor="state">
                    State *
                  </label>

                  <input
                    id="state"
                    name="state"
                    type="text"
                    placeholder="State"
                    value={form.state}
                    onChange={handleChange}
                    maxLength={100}
                    required
                  />
                </div>
              </div>

              <div className="register-row">
                <div className="register-field">
                  <label htmlFor="pincode">
                    PIN Code *
                  </label>

                  <input
                    id="pincode"
                    name="pincode"
                    type="text"
                    inputMode="numeric"
                    placeholder="PIN Code"
                    value={form.pincode}
                    onChange={handleChange}
                    maxLength={10}
                    required
                  />
                </div>

                <div className="register-field">
                  <label htmlFor="garagePhone">
                    Garage Phone *
                  </label>

                  <input
                    id="garagePhone"
                    name="garagePhone"
                    type="tel"
                    placeholder="Garage contact"
                    value={form.garagePhone}
                    onChange={handleChange}
                    maxLength={20}
                    required
                  />
                </div>
              </div>
            </>
          ) : (

            /* CUSTOMER FORM */

            <>
              <h3 className="register-section-title">
                Customer Information
              </h3>

              <div className="register-field">
                <label htmlFor="customer-name">
                  Full Name *
                </label>

                <input
                  id="customer-name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                  maxLength={100}
                  required
                />
              </div>

              <div className="register-field">
                <label htmlFor="customer-email">
                  Email Address *
                </label>

                <input
                  id="customer-email"
                  name="email"
                  type="email"
                  placeholder="Enter email address"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  maxLength={254}
                  required
                />
              </div>

              <div className="register-field">
                <label htmlFor="customer-phone">
                  Phone Number *
                </label>

                <input
                  id="customer-phone"
                  name="phone"
                  type="tel"
                  placeholder="Enter phone number"
                  value={form.phone}
                  onChange={handleChange}
                  autoComplete="tel"
                  maxLength={20}
                  required
                />
              </div>

              <div className="register-field">
                <label htmlFor="customer-password">
                  Password *
                </label>

                <input
                  id="customer-password"
                  name="password"
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  required
                />
              </div>
            </>
          )}

          {/* ERROR */}

          {error && (
            <div className="register-error" role="alert">
              {error}
            </div>
          )}

          {/* SUCCESS */}

          {success && (
            <div className="register-success" role="status">
              {success}
            </div>
          )}

          {/* SUBMIT */}

          <button
            className="register-submit"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : isGaragePage
              ? "Submit Garage Registration"
              : "Create Account"}
          </button>
        </form>

        {/* LOGIN LINK */}

        <p className="register-login-link">
          Already have an account?{" "}

          <button
            type="button"
            onClick={() => navigate("/")}
          >
            Back to Website
          </button>
        </p>

        {/* BACK BUTTON */}

        <button
          type="button"
          className="register-back"
          onClick={() => navigate("/")}
        >
          ← Back to Website
        </button>

      </div>
    </div>
  );
}