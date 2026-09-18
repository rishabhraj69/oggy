import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Admin.css";

function Admin() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("All");

  const loadBookings = () => {
    const savedBookings =
      JSON.parse(localStorage.getItem("oggyBookings")) || [];

    setBookings(savedBookings);
  };

  useEffect(() => {
    loadBookings();

    const handleStorageChange = () => {
      loadBookings();
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const updateBookingStatus = (bookingId, newStatus) => {
    const updatedBookings = bookings.map((booking) =>
      booking.bookingId === bookingId
        ? {
            ...booking,
            status: newStatus,
          }
        : booking
    );

    localStorage.setItem(
      "oggyBookings",
      JSON.stringify(updatedBookings)
    );

    setBookings(updatedBookings);
  };

  const deleteBooking = (bookingId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this request?"
    );

    if (!confirmed) return;

    const updatedBookings = bookings.filter(
      (booking) => booking.bookingId !== bookingId
    );

    localStorage.setItem(
      "oggyBookings",
      JSON.stringify(updatedBookings)
    );

    setBookings(updatedBookings);
  };

  const clearAllBookings = () => {
    if (bookings.length === 0) return;

    const confirmed = window.confirm(
      "This will permanently remove all booking requests. Continue?"
    );

    if (!confirmed) return;

    localStorage.removeItem("oggyBookings");
    setBookings([]);
  };

  const filteredBookings =
    filter === "All"
      ? bookings
      : bookings.filter(
          (booking) => booking.status === filter
        );

  const pendingCount = bookings.filter(
    (booking) => booking.status === "Pending"
  ).length;

  const acceptedCount = bookings.filter(
    (booking) => booking.status === "Accepted"
  ).length;

  const completedCount = bookings.filter(
    (booking) => booking.status === "Completed"
  ).length;

  const formatDate = (date) => {
    if (!date) return "Unknown";

    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="admin-page">
      {/* HEADER */}

      <header className="admin-header">
        <button
          className="admin-brand"
          onClick={() => navigate("/")}
        >
          <div className="admin-logo">OG</div>

          <div>
            <strong>Oggy</strong>
            <span>Garage Admin</span>
          </div>
        </button>

        <div className="admin-header-actions">
          <button
            className="refresh-button"
            onClick={loadBookings}
          >
            ↻ Refresh
          </button>

          <button
            className="home-button"
            onClick={() => navigate("/")}
          >
            Home →
          </button>
        </div>
      </header>

      {/* MAIN */}

      <main className="admin-container">
        <div className="admin-top">
          <div>
            <span className="admin-label">
              ADMIN DASHBOARD
            </span>

            <h1>
              Assistance <span>requests.</span>
            </h1>

            <p>
              Manage roadside assistance requests received by
              Oggy Garage.
            </p>
          </div>

          {bookings.length > 0 && (
            <button
              className="clear-button"
              onClick={clearAllBookings}
            >
              Clear All
            </button>
          )}
        </div>

        {/* STATS */}

        <section className="stats-grid">
          <div className="stat-card">
            <span>Total Requests</span>
            <strong>{bookings.length}</strong>
            <small>All assistance requests</small>
          </div>

          <div className="stat-card pending-stat">
            <span>Pending</span>
            <strong>{pendingCount}</strong>
            <small>Waiting for action</small>
          </div>

          <div className="stat-card accepted-stat">
            <span>Accepted</span>
            <strong>{acceptedCount}</strong>
            <small>Currently being handled</small>
          </div>

          <div className="stat-card completed-stat">
            <span>Completed</span>
            <strong>{completedCount}</strong>
            <small>Successfully completed</small>
          </div>
        </section>

        {/* REQUESTS */}

        <section className="requests-section">
          <div className="requests-header">
            <div>
              <h2>Roadside Assistance Requests</h2>
              <p>
                View and manage customer requests.
              </p>
            </div>

            <div className="filter-buttons">
              {[
                "All",
                "Pending",
                "Accepted",
                "Completed",
              ].map((status) => (
                <button
                  key={status}
                  className={
                    filter === status ? "active" : ""
                  }
                  onClick={() => setFilter(status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* EMPTY STATE */}

          {filteredBookings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>

              <h3>
                {bookings.length === 0
                  ? "No requests yet"
                  : "No requests found"}
              </h3>

              <p>
                {bookings.length === 0
                  ? "Customer roadside assistance requests will appear here."
                  : "There are no requests under this filter."}
              </p>

              {bookings.length === 0 && (
                <button
                  onClick={() => navigate("/")}
                  className="empty-home-button"
                >
                  Go to Home
                </button>
              )}
            </div>
          ) : (
            <div className="requests-list">
              {filteredBookings
                .slice()
                .reverse()
                .map((booking) => (
                  <article
                    className="request-card"
                    key={booking.bookingId}
                  >
                    {/* REQUEST TOP */}

                    <div className="request-top">
                      <div>
                        <span className="request-id">
                          {booking.bookingId}
                        </span>

                        <h3>
                          {booking.customerName ||
                            "Customer"}
                        </h3>

                        <span className="request-date">
                          {formatDate(
                            booking.createdAt
                          )}
                        </span>
                      </div>

                      <span
                        className={`status-badge ${booking.status?.toLowerCase()}`}
                      >
                        {booking.status || "Pending"}
                      </span>
                    </div>

                    {/* REQUEST DETAILS */}

                    <div className="request-details">
                      <div className="detail-item">
                        <span>📍 Location</span>
                        <strong>
                          {booking.location ||
                            "Not specified"}
                        </strong>
                      </div>

                      <div className="detail-item">
                        <span>🚗 Vehicle</span>
                        <strong>
                          {booking.vehicleBrand ||
                            "Unknown"}{" "}
                          ·{" "}
                          {booking.vehicleType ===
                          "truck"
                            ? "Commercial"
                            : "Car"}
                        </strong>
                      </div>

                      <div className="detail-item">
                        <span>⚡ Electrical System</span>
                        <strong>
                          {booking.voltage ||
                            "Not specified"}
                        </strong>
                      </div>

                      <div className="detail-item">
                        <span>🔧 Assistance</span>
                        <strong>
                          {booking.service ||
                            "Not specified"}
                        </strong>
                      </div>

                      <div className="detail-item">
                        <span>☎ Phone</span>
                        <strong>
                          {booking.phone ||
                            "Not provided"}
                        </strong>
                      </div>

                      <div className="detail-item">
                        <span>📝 Notes</span>
                        <strong>
                          {booking.notes?.trim()
                            ? booking.notes
                            : "No additional information"}
                        </strong>
                      </div>
                    </div>

                    {/* ACTIONS */}

                    <div className="request-actions">
                      <a
                        href={`tel:${booking.phone}`}
                        className="call-customer-button"
                      >
                        ☎ Call Customer
                      </a>

                      {booking.status === "Pending" && (
                        <button
                          className="accept-button"
                          onClick={() =>
                            updateBookingStatus(
                              booking.bookingId,
                              "Accepted"
                            )
                          }
                        >
                          ✓ Accept Request
                        </button>
                      )}

                      {booking.status === "Accepted" && (
                        <button
                          className="complete-button"
                          onClick={() =>
                            updateBookingStatus(
                              booking.bookingId,
                              "Completed"
                            )
                          }
                        >
                          ✓ Mark Completed
                        </button>
                      )}

                      {booking.status === "Completed" && (
                        <span className="completed-text">
                          ✓ Request Completed
                        </span>
                      )}

                      <button
                        className="delete-button"
                        onClick={() =>
                          deleteBooking(
                            booking.bookingId
                          )
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Admin;