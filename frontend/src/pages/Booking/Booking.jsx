import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import "./Booking.css";

const PHONE_NUMBER = "+91 96995 26233";

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
    description:
      "Vehicle is not starting or battery is weak",
  },
  {
    id: "tyre",
    icon: "🛞",
    title: "Tyre / Puncture",
    description:
      "Flat tyre or tyre-related problem",
  },
  {
    id: "breakdown",
    icon: "🔧",
    title: "Vehicle Breakdown",
    description:
      "Vehicle stopped working on the road",
  },
  {
    id: "towing",
    icon: "🚚",
    title: "Towing Assistance",
    description:
      "Vehicle needs to be towed",
  },
  {
    id: "electrical",
    icon: "⚡",
    title: "Electrical Problem",
    description:
      "Lights, wiring or electrical issue",
  },
  {
    id: "other",
    icon: "🛠️",
    title: "Other Assistance",
    description:
      "Something else is wrong",
  },
];

function Booking() {
  const navigate = useNavigate();
  const routerLocation = useLocation();

  /*
    Location can come from:
    1. Home.jsx through React Router state
    2. localStorage as backup
  */

  const savedLocation = (() => {
    try {
      const data = localStorage.getItem(
        "oggyGarageLocation"
      );

      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  })();

  const locationData =
    routerLocation.state?.location ||
    savedLocation ||
    null;

  const [vehicleType, setVehicleType] =
    useState("");

  const [voltage, setVoltage] =
    useState("");

  const [vehicleBrand, setVehicleBrand] =
    useState("");

  const [service, setService] =
    useState("");

  const [customerName, setCustomerName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [submitted, setSubmitted] =
    useState(false);

  const [bookingId, setBookingId] =
    useState("");

  const availableBrands =
    vehicleType === "truck"
      ? truckBrands
      : carBrands;

  const handleVehicleTypeChange = (type) => {
    setVehicleType(type);

    setVoltage("");
    setVehicleBrand("");
    setService("");
  };

  const handleVoltageChange = (selectedVoltage) => {
    setVoltage(selectedVoltage);

    setVehicleBrand("");
    setService("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!locationData?.address) {
      alert(
        "Please select your location from the Home page first."
      );

      navigate("/");
      return;
    }

    if (!vehicleType) {
      alert(
        "Please select your vehicle type."
      );
      return;
    }

    if (!voltage) {
      alert(
        "Please select 12V or 24V."
      );
      return;
    }

    if (!vehicleBrand) {
      alert(
        "Please select your vehicle brand."
      );
      return;
    }

    if (!service) {
      alert(
        "Please select the problem you are facing."
      );
      return;
    }

    if (!customerName.trim()) {
      alert(
        "Please enter your name."
      );
      return;
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      alert(
        "Please enter a valid 10-digit Indian mobile number."
      );
      return;
    }

    const newBookingId =
      "OGG-" +
      Math.floor(
        100000 +
          Math.random() * 900000
      );

    const selectedService =
      services.find(
        (item) => item.id === service
      );

    const booking = {
      bookingId: newBookingId,

      location: locationData.address,

      latitude:
        locationData.latitude ?? null,

      longitude:
        locationData.longitude ?? null,

      vehicleType,

      vehicleTypeLabel:
        vehicleType === "truck"
          ? "Commercial Vehicle"
          : "Car",

      voltage,

      vehicleBrand,

      service,

      serviceLabel:
        selectedService?.title ||
        service,

      customerName:
        customerName.trim(),

      phone,

      notes:
        notes.trim(),

      status: "Pending",

      createdAt:
        new Date().toISOString(),
    };

    const existingBookings =
      JSON.parse(
        localStorage.getItem(
          "oggyBookings"
        )
      ) || [];

    const updatedBookings = [
      ...existingBookings,
      booking,
    ];

    localStorage.setItem(
      "oggyBookings",
      JSON.stringify(
        updatedBookings
      )
    );

    setBookingId(
      newBookingId
    );

    setSubmitted(true);
  };

  /*
    CONFIRMATION SCREEN
  */

  if (submitted) {
    return (
      <div className="booking-page">

        <header className="booking-header">

          <button
            className="brand-button"
            onClick={() =>
              navigate("/")
            }
          >
            <div className="brand-logo">
              OG
            </div>

            <div>
              <strong>
                Oggy
              </strong>

              <span>
                Garage
              </span>
            </div>
          </button>

          <a
            href="tel:+919699526233"
            className="header-call"
          >
            ☎ {PHONE_NUMBER}
          </a>

        </header>

        <div className="confirmation-wrapper">

          <div className="confirmation-card">

            <div className="success-icon">
              ✓
            </div>

            <p className="success-label">
              BOOKING REQUEST SENT
            </p>

            <h1>
              Help is{" "}
              <span>
                on the way.
              </span>
            </h1>

            <p className="confirmation-text">
              Your roadside assistance
              request has been received.
              Our team will contact you
              shortly.
            </p>

            <div className="booking-id-box">

              <span>
                Booking ID
              </span>

              <strong>
                {bookingId}
              </strong>

            </div>

            <div className="confirmation-details">

              <div>
                <small>
                  Location
                </small>

                <strong>
                  {locationData.address}
                </strong>
              </div>

              <div>
                <small>
                  Vehicle
                </small>

                <strong>
                  {vehicleBrand} ·{" "}
                  {vehicleType ===
                  "truck"
                    ? "Commercial Vehicle"
                    : "Car"}
                </strong>
              </div>

              <div>
                <small>
                  Electrical System
                </small>

                <strong>
                  {voltage}
                </strong>
              </div>

              <div>
                <small>
                  Assistance
                </small>

                <strong>
                  {
                    services.find(
                      (item) =>
                        item.id ===
                        service
                    )?.title
                  }
                </strong>
              </div>

            </div>

            <div className="call-box">

              <div className="call-icon">
                ☎
              </div>

              <div>

                <span>
                  Need immediate help?
                </span>

                <a href="tel:+919699526233">
                  {PHONE_NUMBER}
                </a>

              </div>

            </div>

            <button
              className="back-home-button"
              onClick={() =>
                navigate("/")
              }
            >
              Back to Home
            </button>

          </div>

        </div>

      </div>
    );
  }

  /*
    BOOKING FORM
  */

  return (
    <div className="booking-page">

      {/* HEADER */}

      <header className="booking-header">

        <button
          className="brand-button"
          onClick={() =>
            navigate("/")
          }
        >
          <div className="brand-logo">
            OG
          </div>

          <div>
            <strong>
              Oggy
            </strong>

            <span>
              Garage
            </span>
          </div>
        </button>

        <a
          href="tel:+919699526233"
          className="header-call"
        >
          ☎ {PHONE_NUMBER}
        </a>

      </header>

      {/* MAIN */}

      <main className="booking-container">

        <div className="booking-top">

          <button
            className="back-button"
            onClick={() =>
              navigate(-1)
            }
          >
            ← Back
          </button>

          <p className="booking-label">
            ROADSIDE ASSISTANCE
          </p>

          <h1>
            Tell us what{" "}
            <span>
              you need.
            </span>
          </h1>

          <p>
            Fill in a few details and
            our team will come to your
            location.
          </p>

        </div>

        <form
          className="booking-form"
          onSubmit={handleSubmit}
        >

          {/* LOCATION */}

          <section className="form-section">

            <div className="section-heading">

              <div className="section-number">
                1
              </div>

              <div>
                <h2>
                  Your location
                </h2>

                <p>
                  This is where our
                  assistance team will come.
                </p>
              </div>

            </div>

            <div className="location-display">

              <div className="location-pin">
                📍
              </div>

              <div>

                <small>
                  Selected location
                </small>

                <strong>
                  {locationData?.address ||
                    "No location selected"}
                </strong>

                {locationData?.latitude !=
                  null &&
                  locationData?.longitude !=
                    null && (
                    <span>
                      ✓ GPS location captured
                    </span>
                  )}

              </div>

            </div>

            {!locationData?.address && (
              <button
                type="button"
                className="back-home-button"
                style={{
                  marginTop: "15px",
                }}
                onClick={() =>
                  navigate("/")
                }
              >
                Select Location
              </button>
            )}

          </section>

          {/* VEHICLE */}

          <section className="form-section">

            <div className="section-heading">

              <div className="section-number">
                2
              </div>

              <div>
                <h2>
                  What vehicle do you have?
                </h2>

                <p>
                  Select your vehicle type.
                </p>
              </div>

            </div>

            <div className="vehicle-options">

              {/* CAR */}

              <button
                type="button"
                className={`vehicle-card ${
                  vehicleType ===
                  "car"
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  handleVehicleTypeChange(
                    "car"
                  )
                }
              >

                <div className="vehicle-icon">
                  🚗
                </div>

                <div>
                  <strong>
                    Car
                  </strong>

                  <span>
                    Passenger vehicles
                  </span>
                </div>

                {vehicleType ===
                  "car" && (
                  <div className="selected-check">
                    ✓
                  </div>
                )}

              </button>

              {/* TRUCK */}

              <button
                type="button"
                className={`vehicle-card ${
                  vehicleType ===
                  "truck"
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  handleVehicleTypeChange(
                    "truck"
                  )
                }
              >

                <div className="vehicle-icon">
                  🚚
                </div>

                <div>
                  <strong>
                    Truck / Commercial
                  </strong>

                  <span>
                    12V & 24V vehicles
                  </span>
                </div>

                {vehicleType ===
                  "truck" && (
                  <div className="selected-check">
                    ✓
                  </div>
                )}

              </button>

            </div>

          </section>

          {/* VOLTAGE */}

          {vehicleType && (
            <section className="form-section voltage-section">

              <div className="section-heading">

                <div className="section-number">
                  3
                </div>

                <div>
                  <h2>
                    Vehicle electrical system
                  </h2>

                  <p>
                    Oggy Garage supports
                    both 12V and 24V vehicles.
                  </p>
                </div>

              </div>

              {/* MAIN HIGHLIGHT */}

              <div className="voltage-highlight">

                <div className="voltage-title">
                  ⚡{" "}
                  <strong>
                    12V & 24V Support
                  </strong>
                </div>

                <p>
                  We specifically provide
                  roadside assistance for
                  compatible 12-volt and
                  24-volt vehicle systems.
                </p>

              </div>

              <div className="voltage-options">

                <button
                  type="button"
                  className={`voltage-card ${
                    voltage ===
                    "12V"
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    handleVoltageChange(
                      "12V"
                    )
                  }
                >
                  <strong>
                    12V
                  </strong>

                  <span>
                    Cars & compatible
                    vehicles
                  </span>
                </button>

                <button
                  type="button"
                  className={`voltage-card ${
                    voltage ===
                    "24V"
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    handleVoltageChange(
                      "24V"
                    )
                  }
                >
                  <strong>
                    24V
                  </strong>

                  <span>
                    Commercial & heavy
                    vehicles
                  </span>
                </button>

              </div>

            </section>
          )}

          {/* BRAND */}

          {vehicleType &&
            voltage && (
              <section className="form-section">

                <div className="section-heading">

                  <div className="section-number">
                    4
                  </div>

                  <div>
                    <h2>
                      Vehicle brand
                    </h2>

                    <p>
                      Select your vehicle
                      manufacturer.
                    </p>
                  </div>

                </div>

                <div className="brand-grid">

                  {availableBrands.map(
                    (brand) => (
                      <button
                        type="button"
                        key={brand}
                        className={`brand-option ${
                          vehicleBrand ===
                          brand
                            ? "selected"
                            : ""
                        }`}
                        onClick={() =>
                          setVehicleBrand(
                            brand
                          )
                        }
                      >

                        {brand}

                        {vehicleBrand ===
                          brand && (
                          <span>
                            ✓
                          </span>
                        )}

                      </button>
                    )
                  )}

                </div>

                {vehicleType ===
                  "truck" && (
                  <div className="commercial-note">

                    <strong>
                      Commercial vehicle
                      support
                    </strong>

                    <p>
                      We support TATA,
                      Ashok Leyland,
                      Eicher, Mahindra
                      and BharatBenz
                      trucks.
                    </p>

                  </div>
                )}

                {vehicleType ===
                  "car" && (
                  <div className="commercial-note">

                    <strong>
                      Car assistance
                    </strong>

                    <p>
                      We provide roadside
                      assistance for major
                      car brands.
                    </p>

                  </div>
                )}

              </section>
            )}

          {/* SERVICE */}

          {vehicleBrand && (
            <section className="form-section">

              <div className="section-heading">

                <div className="section-number">
                  5
                </div>

                <div>
                  <h2>
                    What happened?
                  </h2>

                  <p>
                    Choose the problem
                    you are facing.
                  </p>
                </div>

              </div>

              <div className="service-grid">

                {services.map(
                  (item) => (
                    <button
                      type="button"
                      key={item.id}
                      className={`service-card ${
                        service ===
                        item.id
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        setService(
                          item.id
                        )
                      }
                    >

                      <div className="service-icon">
                        {item.icon}
                      </div>

                      <div>
                        <strong>
                          {item.title}
                        </strong>

                        <span>
                          {item.description}
                        </span>
                      </div>

                      {service ===
                        item.id && (
                        <div className="selected-check">
                          ✓
                        </div>
                      )}

                    </button>
                  )
                )}

              </div>

            </section>
          )}

          {/* CUSTOMER DETAILS */}

          {service && (
            <section className="form-section">

              <div className="section-heading">

                <div className="section-number">
                  6
                </div>

                <div>
                  <h2>
                    Your contact details
                  </h2>

                  <p>
                    So our team can contact
                    you.
                  </p>
                </div>

              </div>

              <div className="input-grid">

                <div className="input-group">

                  <label>
                    Your name
                  </label>

                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={customerName}
                    onChange={(e) =>
                      setCustomerName(
                        e.target.value
                      )
                    }
                  />

                </div>

                <div className="input-group">

                  <label>
                    Mobile number
                  </label>

                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    maxLength="10"
                    value={phone}
                    onChange={(e) =>
                      setPhone(
                        e.target.value.replace(
                          /\D/g,
                          ""
                        )
                      )
                    }
                  />

                </div>

              </div>

              <div className="input-group full-input">

                <label>
                  Additional information{" "}
                  <span>
                    (optional)
                  </span>
                </label>

                <textarea
                  placeholder="Tell us anything that may help our team..."
                  value={notes}
                  onChange={(e) =>
                    setNotes(
                      e.target.value
                    )
                  }
                  rows="4"
                />

              </div>

            </section>
          )}

          {/* SUBMIT */}

          {service && (
            <div className="submit-area">

              <div className="submit-info">

                <span>
                  Need immediate help?
                </span>

                <a href="tel:+919699526233">
                  Call {PHONE_NUMBER}
                </a>

              </div>

              <button
                type="submit"
                className="submit-button"
              >
                Request Roadside Assistance
                <span>
                  →
                </span>
              </button>

              <p className="privacy-note">
                Your information is only
                used to process your
                roadside assistance request.
              </p>

            </div>
          )}

        </form>

      </main>

    </div>
  );
}

export default Booking;