import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const navigate = useNavigate();

  const {
    currentUser,
    userProfile,
    logout,
  } = useAuth();

  async function handleLogout() {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error(
        "Logout failed:",
        error
      );
    }
  }

  const displayName =
    userProfile?.fullName ||
    currentUser?.displayName ||
    "User";

  const role =
    userProfile?.role || "user";

  const roleLabel = {
    farmer: "Farmer",
    "agricultural-expert":
      "Agricultural Expert",
  };

  const normalizedRole =
    roleLabel[role] || "User";

  const isFarmer =
    role === "farmer";

  const isExpert =
    role === "agricultural-expert";

  const expertStatus =
    userProfile?.expertStatus ||
    "pending";

  const isApprovedExpert =
    isExpert &&
    expertStatus === "approved";

  const isPendingExpert =
    isExpert &&
    expertStatus === "pending";

  const isRejectedExpert =
    isExpert &&
    expertStatus === "rejected";

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <img
            src="/logo.png"
            alt="Crop Recommendation and Disease Detection"
            className="dashboard-logo"
          />

          <div>
            <h1>
              Crop Recommendation & Disease Detection
            </h1>

            <p>
              Agricultural Assistance Platform
            </p>
          </div>
        </div>

        <div className="dashboard-user-area">
          <div className="user-summary">
            <strong>
              {displayName}
            </strong>

            <span>
              {normalizedRole}
            </span>
          </div>

          <button
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        <section className="welcome-section">
          <div>
            <p className="welcome-label">
              Dashboard
            </p>

            <h2>
              Welcome, {displayName}
            </h2>

            <p>
              You are currently using the
              application as a{" "}
              <strong>
                {normalizedRole}
              </strong>.
            </p>
          </div>
        </section>

        <section className="dashboard-history-link">
          <div>
            <h2>
              Activity History
            </h2>

            <p>
              View your previous crop
              recommendation and disease
              detection requests.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/history")
            }
          >
            View History
          </button>
        </section>

        {isFarmer && (
          <section className="dashboard-section">
            <div className="section-heading">
              <h2>
                Farmer Services
              </h2>

              <p>
                Tools for crop selection and
                plant disease detection.
              </p>
            </div>

            <div className="dashboard-grid">
              <div className="dashboard-card">
                <div className="card-icon">
                  CR
                </div>

                <h3>
                  Crop Recommendation
                </h3>

                <p>
                  Enter soil and environmental
                  parameters to receive a
                  suitable crop recommendation.
                </p>

                <button
                  onClick={() =>
                    navigate(
                      "/crop-recommendation"
                    )
                  }
                >
                  Start Recommendation
                </button>
              </div>

              <div className="dashboard-card">
                <div className="card-icon">
                  DD
                </div>

                <h3>
                  Disease Detection
                </h3>

                <p>
                  Upload a plant leaf image
                  to detect possible diseases.
                </p>

                <button
                  onClick={() =>
                    navigate(
                      "/disease-detection"
                    )
                  }
                >
                  Upload Leaf Image
                </button>
              </div>

              <div className="dashboard-card">
                <div className="card-icon">
                  RI
                </div>

                <h3>
                  Remedies & Information
                </h3>

                <p>
                  Access disease information,
                  preventive measures, remedies,
                  and crop information.
                </p>

                <button
                  onClick={() =>
                    navigate(
                      "/remedies-information"
                    )
                  }
                >
                  Explore Information
                </button>
              </div>

              <div className="dashboard-card">
                <div className="card-icon">
                  NT
                </div>

                <h3>
                  Notifications
                </h3>

                <p>
                  View important application
                  notifications and updates.
                </p>

                <button
                  onClick={() =>
                    navigate(
                      "/notifications"
                    )
                  }
                >
                  View Notifications
                </button>
              </div>
            </div>
          </section>
        )}

        {isExpert && (
          <section className="dashboard-section">
            <div className="section-heading">
              <h2>
                Expert Services
              </h2>

              <p>
                Professional agricultural
                expert services.
              </p>
            </div>

            {!isApprovedExpert && (
              <div className="info-linked-result">
                <strong>
                  {isRejectedExpert
                    ? "Verification Rejected"
                    : "Verification Pending"}
                </strong>

                <span>
                  {isRejectedExpert
                    ? "Your previous application was rejected. You may submit a new application."
                    : "Your expert privileges are locked until your professional information is reviewed and your account is approved."}
                </span>
              </div>
            )}

            <div className="dashboard-grid">
              <div className="dashboard-card">
                <div className="card-icon">
                  EV
                </div>

                <h3>
                  Expert Verification
                </h3>

                <p>
                  Submit or update your
                  professional information for
                  expert verification.
                </p>

                <button
                  onClick={() =>
                    navigate(
                      "/expert-verification"
                    )
                  }
                >
                  {isApprovedExpert
                    ? "View Verification"
                    : isRejectedExpert
                    ? "Submit Again"
                    : "Submit Verification"}
                </button>
              </div>

              <div className="dashboard-card">
                <div className="card-icon">
                  DI
                </div>

                <h3>
                  Disease Information
                </h3>

                <p>
                  Add and manage disease
                  information, symptoms,
                  preventive measures, and
                  remedies.
                </p>

                <button
                  disabled={!isApprovedExpert}
                  onClick={() =>
                    navigate(
                      "/remedies-information"
                    )
                  }
                >
                  {isApprovedExpert
                    ? "Manage Information"
                    : "Locked"}
                </button>
              </div>

              <div className="dashboard-card">
                <div className="card-icon">
                  NT
                </div>

                <h3>
                  Notifications
                </h3>

                <p>
                  View relevant application
                  notifications and updates.
                </p>

                <button
                  onClick={() =>
                    navigate(
                      "/notifications"
                    )
                  }
                >
                  View Notifications
                </button>
              </div>

              {isApprovedExpert && (
                <div className="dashboard-card">
                  <div className="card-icon">
                    PR
                  </div>

                  <h3>
                    Prediction Review
                  </h3>

                  <p>
                    Review disease detection
                    results and provide
                    agricultural guidance.
                  </p>

                  <button
                    onClick={() =>
                      navigate(
                        "/history"
                      )
                    }
                  >
                    View Detection History
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        <section className="profile-section">
          <div className="section-heading">
            <h2>
              Account Information
            </h2>
          </div>

          <div className="profile-info">
            <p>
              <strong>Name:</strong>{" "}
              {displayName}
            </p>

            <p>
              <strong>Email:</strong>{" "}
              {currentUser?.email}
            </p>

            <p>
              <strong>User Type:</strong>{" "}
              {normalizedRole}
            </p>

            {isExpert && (
              <p>
                <strong>
                  Expert Status:
                </strong>{" "}
                {expertStatus}
              </p>
            )}

            <p>
              <strong>User ID:</strong>{" "}
              {currentUser?.uid}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;