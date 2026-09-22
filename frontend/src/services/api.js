// ========================================
// API CONFIGURATION
// ========================================

const API_BASE_URL = "https://doctor-motors-api.onrender.com/api";
// ========================================
// COMMON API REQUEST
// ========================================

export async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: "include",

    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Something went wrong");
  }

  return data;
}

// ========================================
// ADMIN LOGIN
// ========================================

export async function adminLogin(email, password) {
  return apiRequest("/auth/login", {
    method: "POST",

    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
    }),
  });
}

// ========================================
// GET CURRENT USER
// ========================================

export async function getCurrentUser() {
  return apiRequest("/auth/me");
}

// ========================================
// LOGOUT
// ========================================

export async function logoutUser() {
  return apiRequest("/auth/logout", {
    method: "POST",
  });
}

// ========================================
// CREATE GARAGE OWNER ACCOUNT
// Admin only
// ========================================

export async function createGarageAccount(garageData) {
  return apiRequest("/admin/garages", {
    method: "POST",
    body: JSON.stringify(garageData),
  });
}

// ========================================
// GET ALL GARAGES
// Admin only
// Requires GET /api/admin/garages backend route
// ========================================

export async function getAdminGarages() {
  return apiRequest("/admin/garages");
}