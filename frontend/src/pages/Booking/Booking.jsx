import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import "./Booking.css";

const PHONE_NUMBER = "+91 96995 26233";
const PHONE_LINK = "tel:+919699526233";
const GARAGE_OWNER = "Rehan";

const truckBrands = [
  "TATA",
  "Ashok Leyland",
  "Eicher",
  "Mahindra",
  "BharatBenz",
];

const carBrands = [
  "Maruti Suzuki",
  "Hyundai",
  "Tata Motors",
  "Mahindra",
  "Toyota",
  "Honda",
  "Kia",
  "Volkswagen",
  "Skoda",
  "Other",
];

const services = [
  {
    id: "battery",
    icon: "🔋",
    title: "Battery / Starting Problem",
    description: "Vehicle is not starting or battery is weak",
  },
  {
    id: "tyre",
    icon: "🛞",
    title: "Tyre / Puncture",
    description: "Flat tyre or tyre-related problem",
  },
  {
    id: "breakdown",
    icon: "🔧",
    title: "Vehicle Breakdown",
    description: "Vehicle stopped working on the road",
  },
  {
    id: "towing",
    icon: "🚚",
    title: "Towing Assistance",
    description: "Vehicle needs to be towed",
  },
  {
    id: "electrical",
    icon: "⚡",
    title: "Electrical Problem",
    description: "Lights, wiring or electrical issue",
  },
  {
    id: "other",
    icon: "🛠️",
    title: "Other Assistance",
    description: "Something else is wrong",
  },
];

function getSavedLocation() {
  try {
    const data = localStorage.getItem("oggyGarageLocation");
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Unable to read saved location:", error);
    return null;
  }
}

function Booking() {
  const navigate = useNavigate();
  const routerLocation = useLocation();

  const savedLocation = getSavedLocation();

  const locationData =
    routerLocation.state?.location || savedLocation || null;

  const [vehicleType, setVehicleType] = useState("");
  const [voltage, setVoltage] = useState("");
  const [vehicleBrand, setVehicleBrand] = useState("");
  const [service, setService] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [submitted, setSubmitted] = useState(false);
  const [bookingId, setBookingId] = useState("");

  const availableBrands =
    vehicleType === "truck"
      ? truckBrands
      : vehicleType === "car"
        ? carBrands
        : [];

  const customerMapUrl =
    locationData?.latitude != null &&
    locationData?.longitude != null
      ? `https://www.google.com/maps?q=${locationData.latitude},${locationData.longitude}`
      : locationData?.address
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            locationData.address
          )}`
        : null;

  const handleVehicleTypeChange = (type) => {
    setVehicleType(type);

    if (type === "car") {
      setVoltage("12V");
    } else if (type === "truck") {
      setVoltage("24V");
    } else {
      setVoltage("");
    }

    setVehicleBrand("");
    setService("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!locationData?.address) {
      alert("Please select your location from the Home page first.");
      navigate("/");
      return;
    }

    if (!vehicleType) {
      alert("Please select your vehicle type.");
      return;
    }

    const correctVoltage =
      vehicleType === "car"
        ? "12V"
        : vehicleType === "truck"
          ? "24V"
          : "";

    if (voltage !== correctVoltage) {
      alert("Invalid voltage for the selected vehicle.");
      return;
    }

    if (!vehicleBrand) {
      alert("Please select your vehicle brand.");
      return;
    }

    if (!service) {
      alert("Please select the problem you are facing.");
      return;
    }

    if (!customerName.trim()) {
      alert("Please enter your name.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      alert("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    const newBookingId =
      "DM-" + Math.floor(100000 + Math.random() * 900000);

    const selectedService = services.find(
      (item) => item.id === service
    );

    const booking = {
      bookingId: newBookingId,

      location: locationData.address,
      latitude: locationData.latitude ?? null,
      longitude: locationData.longitude ?? null,
      locationMapUrl: customerMapUrl,

      vehicleType,
      vehicleTypeLabel:
        vehicleType === "truck" ? "Commercial Vehicle" : "Car",

      voltage,
      vehicleBrand,

      service,
      serviceLabel: selectedService?.title || service,

      customerName: customerName.trim(),
      phone,
      notes: notes.trim(),

      status: "Pending",
      createdAt: new Date().toISOString(),
    };

    let existingBookings = [];

    try {
      const storedBookings = localStorage.getItem("oggyBookings");

      existingBookings = storedBookings
        ? JSON.parse(storedBookings)
        : [];

      if (!Array.isArray(existingBookings)) {
        existingBookings = [];
      }
    } catch (error) {
      console.error("Unable to read bookings:", error);
      existingBookings = [];
    }

    const updatedBookings = [...existingBookings, booking];

    try {
      localStorage.setItem(
        "oggyBookings",
        JSON.stringify(updatedBookings)
      );
    } catch (error) {
      console.error("Unable to save booking:", error);
      alert("Unable to save your booking. Please try again.");
      return;
    }

    setBookingId(newBookingId);
    setSubmitted(true);
  };

  // Reusable centered brand footer
  const BrandFooter = () => (
    <footer
      className="booking-brand-footer"
      style={{
        width: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: "8px",
        padding: "30px 20px",
        margin: "35px auto 0",
        borderTop: "1px solid #e2e8f0",
      }}
    >
      <strong
        style={{
          display: "block",
          color: "#111827",
          fontSize: "22px",
          fontWeight: 800,
          letterSpacing: "1.5px",
          lineHeight: 1.3,
        }}
      >
        DOCTOR MOTORS
      </strong>

      <span
        style={{
          display: "block",
          color: "#ef4444",
          fontSize: "15px",
          fontWeight: 600,
          lineHeight: 1.5,
        }}
      >
        Personal Doctor of Your Vehicle
      </span>

      <small
        style={{
          display: "block",
          color: "#64748b",
          fontSize: "13px",
          lineHeight: 1.5,
        }}
      >
        Owned by {GARAGE_OWNER}
      </small>
    </footer>
  );

  // ==============================
  // CONFIRMATION SCREEN
  // ==============================

  if (submitted) {
    return (
      <div className="booking-page">
        <header className="booking-header">
          <button
            type="button"
            className="brand-button"
            onClick={() => navigate("/")}
          >
            <div className="brand-logo">DM</div>

            <div>
              <strong>Doctor</strong>
              <span>Motors</span>
            </div>
          </button>

          <a href={PHONE_LINK} className="header-call">
            ☎ {PHONE_NUMBER}
          </a>
        </header>

        <div className="confirmation-wrapper">
          <div className="confirmation-card">
            <div className="success-icon">✓</div>

            <p className="success-label">BOOKING REQUEST SENT</p>

            <h1>
              Help is <span>on the way.</span>
            </h1>

            <p className="confirmation-text">
              Your roadside assistance request has been received.
              Our team will contact you shortly.
            </p>

            <div className="booking-id-box">
              <span>Booking ID</span>
              <strong>{bookingId}</strong>
            </div>

            <div className="confirmation-details">
              <div>
                <small>Location</small>
                <strong>{locationData.address}</strong>

                {customerMapUrl && (
                  <a
                    href={customerMapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    📍 View location on map
                  </a>
                )}
              </div>

              <div>
                <small>Vehicle</small>
                <strong>
                  {vehicleBrand} ·{" "}
                  {vehicleType === "truck"
                    ? "Commercial Vehicle"
                    : "Car"}
                </strong>
              </div>

              <div>
                <small>Electrical System</small>
                <strong>{voltage}</strong>
              </div>

              <div>
                <small>Assistance</small>
                <strong>
                  {services.find((item) => item.id === service)?.title}
                </strong>
              </div>
            </div>

            <div className="call-box">
              <div className="call-icon">☎</div>

              <div>
                <span>Need immediate help?</span>
                <a href={PHONE_LINK}>{PHONE_NUMBER}</a>
              </div>
            </div>

            <button
              type="button"
              className="back-home-button"
              onClick={() => navigate("/")}
            >
              Back to Home
            </button>

            <p className="privacy-note">
              Personal Doctor of Your Vehicle
            </p>

            <BrandFooter />
          </div>
        </div>
      </div>
    );
  }

  // ==============================
  // BOOKING FORM
  // ==============================

  return (
    <div className="booking-page">
      <header className="booking-header">
        <button
          type="button"
          className="brand-button"
          onClick={() => navigate("/")}
        >
          <div className="brand-logo">DM</div>

          <div>
            <strong>Doctor</strong>
            <span>Motors</span>
          </div>
        </button>

        <a href={PHONE_LINK} className="header-call">
          ☎ {PHONE_NUMBER}
        </a>
      </header>

      <main className="booking-container">
        <div className="booking-top">
          <button
            type="button"
            className="back-button"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>

          <p className="booking-label">
            DOCTOR MOTORS · ROADSIDE ASSISTANCE
          </p>

          <h1>
            Tell us what <span>you need.</span>
          </h1>

          <p>
            Fill in a few details and our team will come to your
            location.
          </p>
        </div>

        <form className="booking-form" onSubmit={handleSubmit}>
          {/* LOCATION */}

          <section className="form-section">
            <div className="section-heading">
              <div className="section-number">1</div>

              <div>
                <h2>Your location</h2>
                <p>This is where our assistance team will come.</p>
              </div>
            </div>

            <div className="location-display">
              <div className="location-pin">📍</div>

              <div>
                <small>Selected location</small>

                <strong>
                  {locationData?.address || "No location selected"}
                </strong>

                {locationData?.latitude != null &&
                  locationData?.longitude != null && (
                    <span>✓ GPS location captured</span>
                  )}

                {customerMapUrl && (
                  <a
                    href={customerMapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="location-map-link"
                  >
                    📍 View exact location on Google Maps →
                  </a>
                )}
              </div>
            </div>

            {!locationData?.address && (
              <button
                type="button"
                className="back-home-button"
                style={{ marginTop: "15px" }}
                onClick={() => navigate("/")}
              >
                Select Location
              </button>
            )}
          </section>

          {/* VEHICLE TYPE */}

          <section className="form-section">
            <div className="section-heading">
              <div className="section-number">2</div>

              <div>
                <h2>What vehicle do you have?</h2>
                <p>Select your vehicle type.</p>
              </div>
            </div>

            <div className="vehicle-options">
              <button
                type="button"
                className={`vehicle-card ${
                  vehicleType === "car" ? "selected" : ""
                }`}
                onClick={() => handleVehicleTypeChange("car")}
              >
                <div className="vehicle-icon">🚗</div>

                <div>
                  <strong>Car</strong>
                  <span>Passenger vehicles · 12V only</span>
                </div>

                {vehicleType === "car" && (
                  <div className="selected-check">✓</div>
                )}
              </button>

              <button
                type="button"
                className={`vehicle-card ${
                  vehicleType === "truck" ? "selected" : ""
                }`}
                onClick={() => handleVehicleTypeChange("truck")}
              >
                <div className="vehicle-icon">🚚</div>

                <div>
                  <strong>Truck / Commercial</strong>
                  <span>Commercial vehicles · 24V only</span>
                </div>

                {vehicleType === "truck" && (
                  <div className="selected-check">✓</div>
                )}
              </button>
            </div>
          </section>

          {/* VOLTAGE */}

          {vehicleType && (
            <section className="form-section voltage-section">
              <div className="section-heading">
                <div className="section-number">3</div>

                <div>
                  <h2>Vehicle electrical system</h2>
                  <p>
                    Voltage is automatically selected for your
                    vehicle type.
                  </p>
                </div>
              </div>

              <div className="voltage-highlight">
                <div className="voltage-title">
                  ⚡ <strong>{voltage} Vehicle Support</strong>
                </div>

                <p>
                  {vehicleType === "car"
                    ? "Doctor Motors provides 12V roadside assistance for cars. 24V is not available for cars."
                    : "Doctor Motors provides 24V roadside assistance for trucks and commercial vehicles."}
                </p>
              </div>

              <div className="voltage-options">
                <div className="voltage-card selected">
                  <strong>{voltage}</strong>

                  <span>
                    {vehicleType === "car"
                      ? "Cars · 12V only"
                      : "Trucks · 24V only"}
                  </span>

                  <div className="selected-check">✓</div>
                </div>
              </div>
            </section>
          )}

          {/* VEHICLE BRAND */}

          {vehicleType && voltage && (
            <section className="form-section">
              <div className="section-heading">
                <div className="section-number">4</div>

                <div>
                  <h2>Vehicle brand</h2>
                  <p>Select your vehicle manufacturer.</p>
                </div>
              </div>

              <div className="brand-grid">
                {availableBrands.map((brand) => (
                  <button
                    type="button"
                    key={brand}
                    className={`brand-option ${
                      vehicleBrand === brand ? "selected" : ""
                    }`}
                    onClick={() => {
                      setVehicleBrand(brand);
                      setService("");
                    }}
                  >
                    {brand}

                    {vehicleBrand === brand && <span>✓</span>}
                  </button>
                ))}
              </div>

              {vehicleType === "truck" && (
                <div className="commercial-note">
                  <strong>24V Commercial Vehicle Support</strong>

                  <p>
                    Doctor Motors supports TATA, Ashok Leyland,
                    Eicher, Mahindra and BharatBenz commercial
                    vehicles.
                  </p>
                </div>
              )}

              {vehicleType === "car" && (
                <div className="commercial-note">
                  <strong>12V Car Assistance</strong>

                  <p>
                    Roadside assistance for major car brands.
                    Cars are supported on 12V only.
                  </p>
                </div>
              )}
            </section>
          )}

          {/* SERVICE */}

          {vehicleBrand && (
            <section className="form-section">
              <div className="section-heading">
                <div className="section-number">5</div>

                <div>
                  <h2>What happened?</h2>
                  <p>Choose the problem you are facing.</p>
                </div>
              </div>

              <div className="service-grid">
                {services.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={`service-card ${
                      service === item.id ? "selected" : ""
                    }`}
                    onClick={() => setService(item.id)}
                  >
                    <div className="service-icon">{item.icon}</div>

                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.description}</span>
                    </div>

                    {service === item.id && (
                      <div className="selected-check">✓</div>
                    )}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* CUSTOMER DETAILS */}

          {service && (
            <section className="form-section">
              <div className="section-heading">
                <div className="section-number">6</div>

                <div>
                  <h2>Your contact details</h2>
                  <p>So our team can contact you.</p>
                </div>
              </div>

              <div className="input-grid">
                <div className="input-group">
                  <label>Your name</label>

                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Mobile number</label>

                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, ""))
                    }
                    required
                  />
                </div>
              </div>

              <div className="input-group full-input">
                <label>
                  Additional information <span>(optional)</span>
                </label>

                <textarea
                  placeholder="Tell us anything that may help our team..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </section>
          )}

          {/* SUBMIT */}

          {service && (
            <div className="submit-area">
              <div className="submit-info">
                <span>Need immediate help?</span>
                <a href={PHONE_LINK}>Call {PHONE_NUMBER}</a>
              </div>

              <button type="submit" className="submit-button">
                Request Roadside Assistance
                <span>→</span>
              </button>

              <p className="privacy-note">
                Your information is used to process your roadside
                assistance request.
              </p>
            </div>
          )}
        </form>

        {/* CENTERED BRAND FOOTER */}

        <BrandFooter />
      </main>
    </div>
  );
}

export default Booking;