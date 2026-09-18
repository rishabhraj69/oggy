import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

function Home() {
  const navigate = useNavigate();

  const [location, setLocation] = useState("");
  const [coordinates, setCoordinates] = useState({
    latitude: null,
    longitude: null,
  });

  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");

  const getLocationName = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Unable to get location");
      }

      const data = await response.json();

      const address = data.address || {};

      const parts = [
        address.road,
        address.neighbourhood,
        address.suburb,
        address.city,
        address.town,
        address.village,
        address.state_district,
        address.state,
      ].filter(Boolean);

      const uniqueParts = [...new Set(parts)];

      if (uniqueParts.length > 0) {
        return uniqueParts.slice(0, 4).join(", ");
      }

      return data.display_name || "Current location";
    } catch (error) {
      console.error("Reverse geocoding error:", error);

      return "Current location";
    }
  };

  const handleUseLocation = () => {
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationError(
        "Location is not supported by your browser."
      );
      return;
    }

    setLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          const locationName = await getLocationName(
            latitude,
            longitude
          );

          setLocation(locationName);

          setCoordinates({
            latitude,
            longitude,
          });
        } catch (error) {
          console.error(error);

          setLocationError(
            "Unable to process your location."
          );
        } finally {
          setLoadingLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);

        setLoadingLocation(false);

        if (error.code === 1) {
          setLocationError(
            "Please allow location access from your browser."
          );
        } else if (error.code === 2) {
          setLocationError(
            "Unable to detect your location."
          );
        } else if (error.code === 3) {
          setLocationError(
            "Location request timed out. Please try again."
          );
        } else {
          setLocationError(
            "Unable to get your location."
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const handleLocationChange = (e) => {
    const value = e.target.value;

    setLocation(value);
    setLocationError("");

    // Manual location doesn't have GPS coordinates
    setCoordinates({
      latitude: null,
      longitude: null,
    });
  };

  const handleCheckAvailability = () => {
    if (!location.trim()) {
      setLocationError(
        "Please enter or select your location first."
      );

      return;
    }

    const locationData = {
      address: location.trim(),
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
    };

    // Save for backup
    localStorage.setItem(
      "oggyGarageLocation",
      JSON.stringify(locationData)
    );

    // Send location to Booking page
    navigate("/booking", {
      state: {
        location: locationData,
      },
    });
  };

  const handleBookAssistance = () => {
    if (location.trim()) {
      handleCheckAvailability();
    } else {
      navigate("/booking");
    }
  };

  return (
    <div className="home-page">

      {/* HERO */}

      <main className="hero-section">

        {/* LEFT */}

        <section className="hero-content">

          <div className="service-badge">
            <span className="badge-dot"></span>
            🚨 Roadside Assistance • Within 150 KM
          </div>

          <h1>
            Vehicle
            <br />
            breakdown?
            <span>
              We've got you covered.
            </span>
          </h1>

          <p className="hero-description">
            Get reliable roadside assistance for cars and
            commercial vehicles when you need it most.
            Share your location and we'll come to you.
          </p>

          {/* LOCATION CARD */}

          <div className="location-card">

            <div className="location-heading">

              <div className="location-icon">
                📍
              </div>

              <div>
                <h3>
                  Where are you stranded?
                </h3>

                <p>
                  We currently serve locations within
                  150 KM.
                </p>
              </div>

            </div>

            <div className="location-input-row">

              <input
                type="text"
                value={location}
                onChange={handleLocationChange}
                placeholder="Enter your location"
              />

              <button
                type="button"
                className="use-location-btn"
                onClick={handleUseLocation}
                disabled={loadingLocation}
              >
                📍{" "}
                {loadingLocation
                  ? "Detecting..."
                  : "Use My Location"}
              </button>

            </div>

            {locationError && (
              <p className="location-error">
                {locationError}
              </p>
            )}

            {location && !locationError && (
              <div className="selected-location">

                <span>✓</span>

                <div>
                  <strong>
                    Location selected
                  </strong>

                  <small>
                    {location}
                  </small>
                </div>

              </div>
            )}

            <button
              type="button"
              className="availability-btn"
              onClick={handleCheckAvailability}
            >
              Check Availability
              <span>→</span>
            </button>

          </div>

          {/* STATS */}

          <div className="hero-stats">

            <div className="stat">
              <strong>150 KM</strong>
              <span>Service Radius</span>
            </div>

            <div className="stat featured-stat">
              <strong>12V & 24V</strong>
              <span>Vehicle Support</span>
            </div>

            <div className="stat">
              <strong>24/7</strong>
              <span>Roadside Help</span>
            </div>

          </div>

        </section>

        {/* RIGHT VISUAL */}

        <section className="hero-visual">

          <div className="visual-card">

            <div className="circle circle-one"></div>
            <div className="circle circle-two"></div>

            {/* COMMERCIAL */}

            <div className="floating-card commercial-card">

              <div className="floating-icon">
                🚚
              </div>

              <div>
                <strong>
                  Commercial Vehicles
                </strong>

                <span>
                  12V / 24V Support
                </span>
              </div>

            </div>

            {/* CAR */}

            <div className="floating-card car-card">

              <div className="floating-icon">
                🚗
              </div>

              <div>
                <strong>
                  Cars
                </strong>

                <span>
                  Major Brands Supported
                </span>
              </div>

            </div>

            {/* GARAGE */}

            <div className="garage-card">

              <div className="garage-status"></div>

              <div>
                <strong>
                  Oggy Garage
                </strong>

                <span>
                  Serving within 150 KM
                </span>
              </div>

            </div>

          </div>

        </section>

      </main>

      {/* VEHICLE SUPPORT */}

      <section className="support-section">

        <div className="section-heading">

          <span>
            WHAT WE SUPPORT
          </span>

          <h2>
            Assistance for your
            <span> vehicle.</span>
          </h2>

          <p>
            From everyday cars to heavy commercial
            vehicles, Oggy Garage provides roadside
            assistance for both 12V and 24V electrical
            systems.
          </p>

        </div>

        <div className="support-grid">

          {/* CARS */}

          <div className="support-card">

            <div className="support-card-icon">
              🚗
            </div>

            <h3>
              Cars
            </h3>

            <p>
              Roadside assistance for cars across
              major manufacturers.
            </p>

            <div className="support-tag">
              Major Brands
            </div>

          </div>

          {/* COMMERCIAL */}

          <div className="support-card featured-support">

            <div className="support-card-icon">
              🚛
            </div>

            <h3>
              Commercial Vehicles
            </h3>

            <p>
              Support for commercial vehicles using
              both 12V and 24V electrical systems.
            </p>

            <div className="support-tag">
              12V & 24V
            </div>

          </div>

        </div>

        {/* TRUCK BRANDS */}

        <div className="brands-box">

          <div>

            <span className="brands-label">
              TRUCKS WE SUPPORT
            </span>

            <h3>
              Major commercial vehicle brands
            </h3>

          </div>

          <div className="brands-list">

            <span>
              TATA
            </span>

            <span>
              ASHOK LEYLAND
            </span>

            <span>
              EICHER
            </span>

            <span>
              MAHINDRA
            </span>

            <span>
              BHARAT BENZ
            </span>

          </div>

        </div>

        {/* VOLTAGE HIGHLIGHT */}

        <div className="voltage-home-highlight">

          <div className="voltage-home-icon">
            ⚡
          </div>

          <div>

            <span>
              IMPORTANT
            </span>

            <h3>
              We work with both 12V & 24V vehicles
            </h3>

            <p>
              Cars, trucks and commercial vehicles
              with compatible 12V or 24V electrical
              systems are supported.
            </p>

          </div>

        </div>

      </section>

      {/* CTA */}

      <section className="home-cta">

        <div>

          <span>
            NEED HELP ON THE ROAD?
          </span>

          <h2>
            Don't stay stranded.
          </h2>

          <p>
            Share your location and get roadside
            assistance from Oggy Garage.
          </p>

        </div>

        <button
          type="button"
          onClick={handleBookAssistance}
        >
          Book Assistance
          <span>→</span>
        </button>

      </section>

    </div>
  );
}

export default Home;