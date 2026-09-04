import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const navigate = useNavigate();
  const { currentUser, userProfile, logout } = useAuth();

  async function handleLogout() {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  const displayName =
    userProfile?.fullName || currentUser?.displayName || "User";

  const role = userProfile?.role || "user";

  const roleLabel = {
    farmer: "Farmer",
    "agricultural-expert": "Agricultural Expert",
  };

  const normalizedRole = roleLabel[role] || "User";

  const isFarmer = role === "farmer";
  const isExpert = role === "agricultural-expert";

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <h1>Crop Recommendation & Disease Detection</h1>
          <p>Agricultural Assistance Platform</p>
        </div>

        <div className="dashboard-user-area">
          <div className="user-summary">
            <strong>{displayName}</strong>
            <span>{normalizedRole}</span>
          </div>

          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main className="dashboard-content">
        <section className="welcome-section">
          <div>
            <p className="welcome-label">Dashboard</p>
            <h2>Welcome, {displayName}</h2>

            <p>
              You are currently using the application as a{" "}
              <strong>{normalizedRole}</strong>.
            </p>
          </div>
        </section>

        {isFarmer && (
          <section className="dashboard-section">
            <div className="section-heading">
              <h2>Farmer Services</h2>
              <p>Tools for crop selection and plant disease detection.</p>
            </div>

            <div className="dashboard-grid">
              <div className="dashboard-card">
                <div className="card-icon">CR</div>

                <h3>Crop Recommendation</h3>

                <p>
                  Enter soil and environmental parameters to receive a suitable
                  crop recommendation.
                </p>

                <button disabled>Coming Soon</button>
              </div>

              <div className="dashboard-card">
                <div className="card-icon">DD</div>

                <h3>Disease Detection</h3>

                <p>Upload a plant leaf image to detect possible diseases.</p>

                <button disabled>Coming Soon</button>
              </div>

              <div className="dashboard-card">
                <div className="card-icon">RI</div>

                <h3>Remedies & Information</h3>

                <p>
                  Access disease information, preventive measures, remedies, and
                  crop information.
                </p>

                <button disabled>Coming Soon</button>
              </div>

              <div className="dashboard-card">
                <div className="card-icon">NT</div>

                <h3>Notifications</h3>

                <p>View important application notifications and updates.</p>

                <button disabled>Coming Soon</button>
              </div>
            </div>
          </section>
        )}

        {isExpert && (
          <section className="dashboard-section">
            <div className="section-heading">
              <h2>Expert Services</h2>
              <p>Agricultural expert features will be available here.</p>
            </div>

            <div className="dashboard-grid">
              <div className="dashboard-card">
                <div className="card-icon">DI</div>

                <h3>Disease Information</h3>

                <p>
                  Provide disease-related information and agricultural guidance.
                </p>

                <button disabled>Coming Soon</button>
              </div>

              <div className="dashboard-card">
                <div className="card-icon">NT</div>

                <h3>Notifications</h3>

                <p>View relevant application notifications and updates.</p>

                <button disabled>Coming Soon</button>
              </div>
            </div>
          </section>
        )}

        <section className="profile-section">
          <div className="section-heading">
            <h2>Account Information</h2>
          </div>

          <div className="profile-info">
            <p>
              <strong>Name:</strong> {displayName}
            </p>

            <p>
              <strong>Email:</strong> {currentUser?.email}
            </p>

            <p>
              <strong>User Type:</strong> {normalizedRole}
            </p>

            <p>
              <strong>User ID:</strong> {currentUser?.uid}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
