import { useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Home from "./pages/Home/Home";
import Booking from "./pages/Booking/Booking";
import Admin from "./pages/Admin/Admin";
import Register from "./pages/Register/Register";

import AuthModal from "./components/AuthModal";

import "./components/AuthModal.css";

function App() {
  const [showAuth, setShowAuth] = useState(false);

  const location = useLocation();

  // Hide global login button on admin and registration pages
  const hideGlobalLogin = [
    "/admin",
    "/register",
    "/garage-register",
  ].includes(location.pathname);

  return (
    <>
      {/* ========================================
          GLOBAL LOGIN BUTTON
      ======================================== */}

      {!hideGlobalLogin && (
        <button
          className="global-login-button"
          type="button"
          onClick={() => setShowAuth(true)}
        >
          Login / Sign Up
        </button>
      )}

      {/* ========================================
          LOGIN MODAL
      ======================================== */}

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
        />
      )}

      {/* ========================================
          WEBSITE ROUTES
      ======================================== */}

      <Routes>
        {/* HOME PAGE */}
        <Route
          path="/"
          element={<Home />}
        />

        {/* BOOKING PAGE */}
        <Route
          path="/booking"
          element={<Booking />}
        />

        {/* ADMIN PANEL */}
        <Route
          path="/admin"
          element={<Admin />}
        />

        {/* CUSTOMER REGISTRATION */}
        <Route
          path="/register"
          element={<Register />}
        />

        {/* GARAGE OWNER REGISTRATION */}
        <Route
          path="/garage-register"
          element={<Register />}
        />

        {/* UNKNOWN ROUTES */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </>
  );
}

export default App;