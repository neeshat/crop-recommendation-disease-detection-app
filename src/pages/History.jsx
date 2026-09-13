import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";

function History() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [cropHistory, setCropHistory] = useState([]);
  const [diseaseHistory, setDiseaseHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true);
        setError("");

        const cropQuery = query(
          collection(db, "cropRecommendations"),
          where("userId", "==", currentUser.uid),
        );

        const diseaseQuery = query(
          collection(db, "diseaseDetections"),
          where("userId", "==", currentUser.uid),
        );

        const [cropSnapshot, diseaseSnapshot] = await Promise.all([
          getDocs(cropQuery),
          getDocs(diseaseQuery),
        ]);

        const crops = cropSnapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        const diseases = diseaseSnapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        crops.sort(
          (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
        );

        diseases.sort(
          (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
        );

        setCropHistory(crops);
        setDiseaseHistory(diseases);
      } catch (fetchError) {
        console.error("Failed to fetch history:", fetchError);
        setError("Unable to load history. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    if (currentUser) {
      fetchHistory();
    }
  }, [currentUser]);

  function formatDate(timestamp) {
    if (!timestamp?.toDate) {
      return "Date unavailable";
    }

    return timestamp.toDate().toLocaleString();
  }

  function formatStatus(status) {
    if (!status) {
      return "Unknown";
    }

    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  if (loading) {
    return (
      <div className="history-page">
        <div className="history-loading">Loading history...</div>
      </div>
    );
  }

  return (
    <div className="history-page">
      <div className="history-container">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate("/dashboard")}
        >
          ← Back to Dashboard
        </button>

        <div className="feature-header history-header">
          <p className="feature-label">My Activity</p>

          <h1>History</h1>

          <p>
            View your previous crop recommendation and disease detection
            activities.
          </p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <section className="history-section">
          <div className="section-heading">
            <h2>Crop Recommendation History</h2>
            <p>Previous soil and environmental analysis requests.</p>
          </div>

          {cropHistory.length === 0 ? (
            <div className="empty-state">
              <p>No crop recommendation history found.</p>

              <button
                type="button"
                onClick={() => navigate("/crop-recommendation")}
              >
                Start a Recommendation
              </button>
            </div>
          ) : (
            <div className="history-list">
              {cropHistory.map((item) => (
                <div className="history-card" key={item.id}>
                  <div className="history-card-header">
                    <div>
                      <h3>Crop Recommendation</h3>
                      <span>{formatDate(item.createdAt)}</span>
                    </div>

                    <span className="status-badge">
                      {formatStatus(item.status)}
                    </span>
                  </div>

                  <div className="history-details">
                    <p>
                      <strong>N:</strong> {item.inputData?.nitrogen}
                    </p>

                    <p>
                      <strong>P:</strong> {item.inputData?.phosphorus}
                    </p>

                    <p>
                      <strong>K:</strong> {item.inputData?.potassium}
                    </p>

                    <p>
                      <strong>Temperature:</strong>{" "}
                      {item.inputData?.temperature}
                    </p>

                    <p>
                      <strong>Humidity:</strong> {item.inputData?.humidity}
                    </p>

                    <p>
                      <strong>pH:</strong> {item.inputData?.ph}
                    </p>

                    <p>
                      <strong>Rainfall:</strong> {item.inputData?.rainfall}
                    </p>
                  </div>

                  <div className="history-result">
                    <p>
                      <strong>Detected Disease:</strong>{" "}
                      {item.detectedDisease || "No probable disease identified"}
                    </p>

                    {item.confidence !== null &&
                      item.confidence !== undefined && (
                        <p>
                          <strong>Confidence:</strong>{" "}
                          {(item.confidence * 100).toFixed(1)}%
                        </p>
                      )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="history-section">
          <div className="section-heading">
            <h2>Disease Detection History</h2>
            <p>Previous leaf image analysis requests.</p>
          </div>

          {diseaseHistory.length === 0 ? (
            <div className="empty-state">
              <p>No disease detection history found.</p>

              <button
                type="button"
                onClick={() => navigate("/disease-detection")}
              >
                Detect a Disease
              </button>
            </div>
          ) : (
            <div className="history-list">
              {diseaseHistory.map((item) => (
                <div className="history-card" key={item.id}>
                  <div className="history-card-header">
                    <div>
                      <h3>Disease Detection</h3>
                      <span>{formatDate(item.createdAt)}</span>
                    </div>

                    <span className="status-badge">
                      {formatStatus(item.status)}
                    </span>
                  </div>

                  <div className="history-details">
                    <p>
                      <strong>File:</strong> {item.fileName}
                    </p>

                    <p>
                      <strong>Type:</strong> {item.fileType}
                    </p>

                    <p>
                      <strong>Size:</strong>{" "}
                      {(item.fileSize / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>

                  <div className="history-result">
                    <strong>Detected Disease:</strong>{" "}
                    {item.detectedDisease || "Pending model result"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default History;
