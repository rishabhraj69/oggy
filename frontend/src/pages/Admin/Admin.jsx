import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Admin.css";

import {
  adminLogin,
  getCurrentUser,
  logoutUser,
  createGarageAccount,
  getAdminGarages,
} from "../../services/api";

// ========================================
// INITIAL GARAGE FORM
// ========================================

const initialGarageForm = {
  ownerName: "",
  ownerEmail: "",
  ownerPhone: "",
  password: "",

  garageName: "",
  description: "",
  garageEmail: "",
  garagePhone: "",

  address: "",
  city: "",
  state: "",
  pincode: "",
  logoUrl: "",
};

export default function Admin() {
  const navigate = useNavigate();

  // ========================================
  // AUTH STATES
  // ========================================

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);

  const [adminUser, setAdminUser] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // ========================================
  // BOOKING STATES
  // ========================================

  const [bookings, setBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // ========================================
  // GARAGE MANAGEMENT STATES
  // ========================================

  const [activePage, setActivePage] = useState("dashboard");

  const [garages, setGarages] = useState([]);
  const [garageForm, setGarageForm] = useState(initialGarageForm);

  const [showGarageForm, setShowGarageForm] = useState(false);
  const [garageLoading, setGarageLoading] = useState(false);
  const [garageListLoading, setGarageListLoading] = useState(false);

  const [garageMessage, setGarageMessage] = useState("");
  const [garageError, setGarageError] = useState("");

  // ========================================
  // CHECK BACKEND SESSION
  // ========================================

  useEffect(() => {
    let isMounted = true;

    async function verifySession() {
      try {
        const response = await getCurrentUser();
        const user = response?.user;

        if (!isMounted) return;

        if (user?.role === "admin") {
          setAdminUser(user);
          setIsLoggedIn(true);
        } else {
          setAdminUser(null);
          setIsLoggedIn(false);
        }
      } catch {
        if (isMounted) {
          setAdminUser(null);
          setIsLoggedIn(false);
        }
      } finally {
        if (isMounted) {
          setCheckingSession(false);
        }
      }
    }

    verifySession();

    return () => {
      isMounted = false;
    };
  }, []);

  // ========================================
  // LOAD BOOKINGS AFTER LOGIN
  // ========================================

  useEffect(() => {
    if (isLoggedIn) {
      loadBookings();
    }
  }, [isLoggedIn]);

  function loadBookings() {
    try {
      const storedBookings = localStorage.getItem("oggyBookings");

      const parsedBookings = storedBookings
        ? JSON.parse(storedBookings)
        : [];

      setBookings(
        Array.isArray(parsedBookings) ? parsedBookings : []
      );
    } catch (error) {
      console.error("Booking load error:", error);
      setBookings([]);
    }
  }

  // ========================================
  // LOAD GARAGES FROM BACKEND
  // ========================================

  async function loadGarages() {
    try {
      setGarageListLoading(true);
      setGarageError("");

      const response = await getAdminGarages();

      const garageList = response?.garages || [];

      setGarages(Array.isArray(garageList) ? garageList : []);
    } catch (error) {
      console.error("Garage loading error:", error);
      setGarageError(
        error.message || "Unable to load garages."
      );
    } finally {
      setGarageListLoading(false);
    }
  }

  useEffect(() => {
    if (isLoggedIn && activePage === "garages") {
      loadGarages();
    }
  }, [isLoggedIn, activePage]);

  // ========================================
  // ADMIN LOGIN
  // ========================================

  async function handleLogin(e) {
    e.preventDefault();

    setLoginError("");

    if (!email.trim() || !password) {
      setLoginError("Please enter email and password.");
      return;
    }

    try {
      setLoginLoading(true);

      const response = await adminLogin(email, password);
      const user = response?.user;

      if (!user) {
        setLoginError("Invalid server response.");
        return;
      }

      if (user.role !== "admin") {
        try {
          await logoutUser();
        } catch (error) {
          console.error("Logout error:", error);
        }

        setLoginError("Access denied. Admin account required.");
        return;
      }

      setAdminUser(user);
      setIsLoggedIn(true);

      setEmail("");
      setPassword("");
    } catch (error) {
      setLoginError(
        error.message || "Login failed. Please try again."
      );
    } finally {
      setLoginLoading(false);
    }
  }

  // ========================================
  // LOGOUT
  // ========================================

  async function handleLogout() {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggedIn(false);
      setAdminUser(null);
      setBookings([]);
      setGarages([]);

      navigate("/admin");
    }
  }

  // ========================================
  // UPDATE BOOKING STATUS
  // ========================================

  function updateStatus(bookingId, newStatus) {
    const updatedBookings = bookings.map((booking) =>
      String(booking.id) === String(bookingId)
        ? { ...booking, status: newStatus }
        : booking
    );

    setBookings(updatedBookings);

    localStorage.setItem(
      "oggyBookings",
      JSON.stringify(updatedBookings)
    );
  }

  // ========================================
  // DELETE BOOKING
  // ========================================

  function deleteBooking(bookingId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this booking?"
    );

    if (!confirmed) return;

    const updatedBookings = bookings.filter(
      (booking) =>
        String(booking.id) !== String(bookingId)
    );

    setBookings(updatedBookings);

    localStorage.setItem(
      "oggyBookings",
      JSON.stringify(updatedBookings)
    );
  }

  // ========================================
  // FILTER BOOKINGS
  // ========================================

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const search = searchTerm.toLowerCase();

      const matchesSearch = [
        booking.name,
        booking.phone,
        booking.email,
        booking.service,
      ].some((value) =>
        String(value || "").toLowerCase().includes(search)
      );

      const currentStatus = booking.status || "Pending";

      const matchesStatus =
        statusFilter === "All" ||
        currentStatus.toLowerCase() ===
          statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchTerm, statusFilter]);

  // ========================================
  // DASHBOARD STATS
  // ========================================

  const totalBookings = bookings.length;

  const pendingBookings = bookings.filter(
    (booking) =>
      (booking.status || "Pending").toLowerCase() === "pending"
  ).length;

  const confirmedBookings = bookings.filter(
    (booking) =>
      (booking.status || "").toLowerCase() === "confirmed"
  ).length;

  const completedBookings = bookings.filter(
    (booking) =>
      (booking.status || "").toLowerCase() === "completed"
  ).length;

  // ========================================
  // GARAGE FORM INPUT HANDLER
  // ========================================

  function handleGarageChange(e) {
    const { name, value } = e.target;

    setGarageForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  // ========================================
  // CREATE GARAGE ACCOUNT
  // ========================================

  async function handleCreateGarage(e) {
    e.preventDefault();

    setGarageMessage("");
    setGarageError("");

    if (
      !garageForm.ownerName.trim() ||
      !garageForm.ownerEmail.trim() ||
      !garageForm.ownerPhone.trim() ||
      !garageForm.password ||
      !garageForm.garageName.trim() ||
      !garageForm.garagePhone.trim() ||
      !garageForm.address.trim() ||
      !garageForm.city.trim()
    ) {
      setGarageError("Please fill all required fields.");
      return;
    }

    if (garageForm.password.length < 8) {
      setGarageError(
        "Password must be at least 8 characters long."
      );
      return;
    }

    try {
      setGarageLoading(true);

      const payload = {
        ...garageForm,
        ownerName: garageForm.ownerName.trim(),
        ownerEmail: garageForm.ownerEmail.trim().toLowerCase(),
        ownerPhone: garageForm.ownerPhone.trim(),

        garageName: garageForm.garageName.trim(),
        garagePhone: garageForm.garagePhone.trim(),

        address: garageForm.address.trim(),
        city: garageForm.city.trim(),
      };

      const response = await createGarageAccount(payload);

      setGarageMessage(
        response?.message ||
          "Garage account created successfully!"
      );

      setGarageForm(initialGarageForm);
      setShowGarageForm(false);

      await loadGarages();
    } catch (error) {
      setGarageError(
        error.message || "Failed to create garage account."
      );
    } finally {
      setGarageLoading(false);
    }
  }

  // ========================================
  // SESSION LOADING
  // ========================================

  if (checkingSession) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
        <p>Checking admin session...</p>
      </div>
    );
  }

  // ========================================
  // ADMIN LOGIN PAGE
  // ========================================

  if (!isLoggedIn) {
    return (
      <div className="admin-login-page">
        <div className="admin-login-card">
          <div className="admin-login-logo">
            <span>🚗</span>
          </div>

          <p className="admin-eyebrow">DOCTOR MOTORS</p>

          <h1>Admin Login</h1>

          <p className="admin-login-subtitle">
            Sign in to manage your garage bookings.
          </p>

          <form onSubmit={handleLogin}>
            <div className="admin-form-group">
              <label htmlFor="admin-email">
                Email Address
              </label>

              <input
                id="admin-email"
                type="email"
                placeholder="Enter admin email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="admin-password">
                Password
              </label>

              <input
                id="admin-password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {loginError && (
              <div className="admin-error">{loginError}</div>
            )}

            <button
              type="submit"
              className="admin-login-btn"
              disabled={loginLoading}
            >
              {loginLoading
                ? "Signing in..."
                : "Login to Dashboard"}
            </button>
          </form>

          <div className="admin-register-links">
            <p>New to Doctor Motors?</p>

            <button
              type="button"
              onClick={() => navigate("/register")}
            >
              Create Customer Account
            </button>

            <button
              type="button"
              onClick={() => navigate("/garage-register")}
            >
              Register Your Garage
            </button>
          </div>

          <button
            className="admin-back-btn"
            type="button"
            onClick={() => navigate("/")}
          >
            ← Back to Website
          </button>

          <p className="admin-login-footer">
            Doctor Motors © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    );
  }

  // ========================================
  // ADMIN DASHBOARD
  // ========================================

  return (
    <div className="admin-dashboard">
      {/* SIDEBAR */}

      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-icon">🚗</span>

          <div>
            <h2>Doctor Motors</h2>
            <span>Admin Panel</span>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          <button
            className={`admin-nav-item ${
              activePage === "dashboard" ? "active" : ""
            }`}
            type="button"
            onClick={() => setActivePage("dashboard")}
          >
            📊 Dashboard
          </button>

          <button
            className={`admin-nav-item ${
              activePage === "garages" ? "active" : ""
            }`}
            type="button"
            onClick={() => {
              setActivePage("garages");
              setGarageMessage("");
              setGarageError("");
            }}
          >
            🏢 Garage Management
          </button>

          <button
            className="admin-nav-item"
            type="button"
            onClick={() => navigate("/")}
          >
            🌐 Visit Website
          </button>
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-profile">
            <div className="admin-avatar">
              {(adminUser?.name || "A")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="admin-profile-info">
              <strong>
                {adminUser?.name || "Administrator"}
              </strong>

              <span>Administrator</span>
            </div>
          </div>

          <button
            className="admin-logout-btn"
            type="button"
            onClick={handleLogout}
          >
            ↪ Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}

      <main className="admin-main">
        {/* TOPBAR */}

        <header className="admin-topbar">
          <div>
            <h1>
              {activePage === "dashboard"
                ? "Dashboard"
                : "Garage Management"}
            </h1>

            <p>
              {activePage === "dashboard"
                ? "Manage your garage bookings"
                : "Create and manage garage owner accounts"}
            </p>
          </div>

          <div className="admin-topbar-user">
            Welcome, {adminUser?.name || "Admin"}
          </div>
        </header>

        {/* ================================== */}
        {/* DASHBOARD PAGE */}
        {/* ================================== */}

        {activePage === "dashboard" && (
          <>
            <section className="admin-stats-grid">
              <div className="admin-stat-card">
                <div className="admin-stat-icon">📋</div>

                <div>
                  <p>Total Bookings</p>
                  <h2>{totalBookings}</h2>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon">⏳</div>

                <div>
                  <p>Pending</p>
                  <h2>{pendingBookings}</h2>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon">✅</div>

                <div>
                  <p>Confirmed</p>
                  <h2>{confirmedBookings}</h2>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon">🏁</div>

                <div>
                  <p>Completed</p>
                  <h2>{completedBookings}</h2>
                </div>
              </div>
            </section>

            {/* BOOKING MANAGEMENT */}

            <section className="admin-bookings-section">
              <div className="admin-bookings-header">
                <div>
                  <h2>Booking Management</h2>

                  <p>
                    View and manage customer bookings
                  </p>
                </div>

                <button
                  className="admin-refresh-btn"
                  type="button"
                  onClick={loadBookings}
                >
                  ↻ Refresh
                </button>
              </div>

              {/* SEARCH + FILTER */}

              <div className="admin-booking-controls">
                <input
                  type="text"
                  placeholder="Search name, phone, email or service..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {/* BOOKINGS TABLE */}

              <div className="admin-table-wrapper">
                <table className="admin-bookings-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Contact</th>
                      <th>Service</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredBookings.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="admin-empty">
                          No bookings found.
                        </td>
                      </tr>
                    ) : (
                      filteredBookings.map((booking, index) => (
                        <tr key={booking.id || index}>
                          <td>
                            <strong>
                              {booking.name || "N/A"}
                            </strong>
                          </td>

                          <td>
                            <div>
                              {booking.phone || "N/A"}
                            </div>

                            <small>{booking.email || ""}</small>
                          </td>

                          <td>{booking.service || "N/A"}</td>

                          <td>
                            {booking.date ||
                              booking.bookingDate ||
                              "N/A"}
                          </td>

                          <td>
                            <select
                              className={`admin-status-select ${(
                                booking.status || "Pending"
                              ).toLowerCase()}`}
                              value={booking.status || "Pending"}
                              onChange={(e) =>
                                updateStatus(
                                  booking.id,
                                  e.target.value
                                )
                              }
                            >
                              <option value="Pending">Pending</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Completed">Completed</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </td>

                          <td>
                            <button
                              className="admin-delete-btn"
                              type="button"
                              onClick={() =>
                                deleteBooking(booking.id)
                              }
                            >
                              🗑 Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="admin-table-footer">
                Showing {filteredBookings.length} of{" "}
                {totalBookings} bookings
              </div>
            </section>
          </>
        )}

        {/* ================================== */}
        {/* GARAGE MANAGEMENT PAGE */}
        {/* ================================== */}

        {activePage === "garages" && (
          <section className="admin-bookings-section">
            <div className="admin-bookings-header">
              <div>
                <h2>Garage Management</h2>

                <p>
                  Create garage owner accounts and manage garages.
                </p>
              </div>

              <button
                className="admin-refresh-btn"
                type="button"
                onClick={() => {
                  setShowGarageForm(!showGarageForm);
                  setGarageMessage("");
                  setGarageError("");
                }}
              >
                {showGarageForm
                  ? "✕ Close Form"
                  : "+ Create Garage Account"}
              </button>
            </div>

            {/* SUCCESS MESSAGE */}

            {garageMessage && (
              <div className="garage-success-message">
                ✅ {garageMessage}
              </div>
            )}

            {/* ERROR MESSAGE */}

            {garageError && (
              <div className="garage-error-message">
                ❌ {garageError}
              </div>
            )}

            {/* CREATE GARAGE FORM */}

            {showGarageForm && (
              <form
                className="garage-create-form"
                onSubmit={handleCreateGarage}
              >
                <div className="garage-form-heading">
                  <h3>Create Garage Owner Account</h3>

                  <p>
                    Fill in the owner and garage details below.
                  </p>
                </div>

                {/* OWNER DETAILS */}

                <div className="garage-form-section">
                  <h4>Owner Account Details</h4>

                  <div className="garage-form-grid">
                    <div className="garage-form-group">
                      <label>Owner Full Name *</label>

                      <input
                        name="ownerName"
                        value={garageForm.ownerName}
                        onChange={handleGarageChange}
                        placeholder="Enter owner name"
                        required
                      />
                    </div>

                    <div className="garage-form-group">
                      <label>Owner Email *</label>

                      <input
                        type="email"
                        name="ownerEmail"
                        value={garageForm.ownerEmail}
                        onChange={handleGarageChange}
                        placeholder="owner@example.com"
                        required
                      />
                    </div>

                    <div className="garage-form-group">
                      <label>Owner Phone *</label>

                      <input
                        type="tel"
                        name="ownerPhone"
                        value={garageForm.ownerPhone}
                        onChange={handleGarageChange}
                        placeholder="Enter phone number"
                        required
                      />
                    </div>

                    <div className="garage-form-group">
                      <label>Login Password *</label>

                      <input
                        type="password"
                        name="password"
                        value={garageForm.password}
                        onChange={handleGarageChange}
                        placeholder="Minimum 8 characters"
                        minLength={8}
                        autoComplete="new-password"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* GARAGE DETAILS */}

                <div className="garage-form-section">
                  <h4>Garage Details</h4>

                  <div className="garage-form-grid">
                    <div className="garage-form-group">
                      <label>Garage Name *</label>

                      <input
                        name="garageName"
                        value={garageForm.garageName}
                        onChange={handleGarageChange}
                        placeholder="Enter garage name"
                        required
                      />
                    </div>

                    <div className="garage-form-group">
                      <label>Garage Phone *</label>

                      <input
                        type="tel"
                        name="garagePhone"
                        value={garageForm.garagePhone}
                        onChange={handleGarageChange}
                        placeholder="Garage contact number"
                        required
                      />
                    </div>

                    <div className="garage-form-group">
                      <label>Garage Email</label>

                      <input
                        type="email"
                        name="garageEmail"
                        value={garageForm.garageEmail}
                        onChange={handleGarageChange}
                        placeholder="garage@example.com"
                      />
                    </div>

                    <div className="garage-form-group">
                      <label>City *</label>

                      <input
                        name="city"
                        value={garageForm.city}
                        onChange={handleGarageChange}
                        placeholder="Enter city"
                        required
                      />
                    </div>

                    <div className="garage-form-group">
                      <label>State</label>

                      <input
                        name="state"
                        value={garageForm.state}
                        onChange={handleGarageChange}
                        placeholder="Enter state"
                      />
                    </div>

                    <div className="garage-form-group">
                      <label>Pincode</label>

                      <input
                        name="pincode"
                        value={garageForm.pincode}
                        onChange={handleGarageChange}
                        placeholder="Enter pincode"
                      />
                    </div>

                    <div className="garage-form-group garage-full-width">
                      <label>Complete Address *</label>

                      <textarea
                        name="address"
                        value={garageForm.address}
                        onChange={handleGarageChange}
                        placeholder="Enter complete garage address"
                        rows={3}
                        required
                      />
                    </div>

                    <div className="garage-form-group garage-full-width">
                      <label>Garage Description</label>

                      <textarea
                        name="description"
                        value={garageForm.description}
                        onChange={handleGarageChange}
                        placeholder="Describe garage and its services"
                        rows={3}
                      />
                    </div>

                    <div className="garage-form-group garage-full-width">
                      <label>Garage Logo URL</label>

                      <input
                        type="url"
                        name="logoUrl"
                        value={garageForm.logoUrl}
                        onChange={handleGarageChange}
                        placeholder="https://example.com/logo.png"
                      />
                    </div>
                  </div>
                </div>

                {/* FORM ACTIONS */}

                <div className="garage-form-actions">
                  <button
                    type="button"
                    className="garage-cancel-btn"
                    onClick={() => {
                      setShowGarageForm(false);
                      setGarageError("");
                    }}
                    disabled={garageLoading}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="garage-submit-btn"
                    disabled={garageLoading}
                  >
                    {garageLoading
                      ? "Creating Account..."
                      : "Create Garage Account"}
                  </button>
                </div>
              </form>
            )}

            {/* GARAGE LIST */}

            <div className="garage-list-heading">
              <h3>Registered Garages</h3>

              <button
                type="button"
                className="admin-refresh-btn"
                onClick={loadGarages}
                disabled={garageListLoading}
              >
                {garageListLoading ? "Loading..." : "↻ Refresh"}
              </button>
            </div>

            {garageListLoading ? (
              <div className="garage-empty-state">
                Loading garages...
              </div>
            ) : garages.length === 0 ? (
              <div className="garage-empty-state">
                No garages found. Create your first garage account.
              </div>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-bookings-table">
                  <thead>
                    <tr>
                      <th>Garage</th>
                      <th>Owner ID</th>
                      <th>Contact</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>

                  <tbody>
                    {garages.map((garage) => (
                      <tr key={garage.id}>
                        <td>
                          <strong>{garage.name}</strong>

                          <br />

                          <small>
                            {garage.email || "No garage email"}
                          </small>
                        </td>

                        <td>{garage.owner_id}</td>

                        <td>{garage.phone || "N/A"}</td>

                        <td>
                          {[garage.city, garage.state]
                            .filter(Boolean)
                            .join(", ") || "N/A"}
                        </td>

                        <td>
                          <span
                            className={`garage-status-badge ${
                              garage.status || "pending"
                            }`}
                          >
                            {garage.status || "pending"}
                          </span>
                        </td>

                        <td>
                          {garage.created_at
                            ? new Date(
                                garage.created_at
                              ).toLocaleDateString()
                            : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}