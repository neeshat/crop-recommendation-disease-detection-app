import {
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../services/firebase";
import {
  useAuth,
} from "../context/AuthContext";
import {
  createNotification,
} from "../services/notificationService";

function AdminExpertApplications() {
  const navigate = useNavigate();

  const {
    currentUser,
    userProfile,
  } = useAuth();

  const [
    applications,
    setApplications,
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [actionId, setActionId] =
    useState("");

  async function loadApplications() {
    try {
      setLoading(true);
      setError("");

      const applicationsQuery =
        query(
          collection(
            db,
            "expertApplications"
          ),
          where(
            "status",
            "==",
            "pending"
          )
        );

      const snapshot =
        await getDocs(
          applicationsQuery
        );

      const data =
        snapshot.docs.map(
          (document) => ({
            id: document.id,
            ...document.data(),
          })
        );

      data.sort(
        (a, b) =>
          (b.submittedAt?.seconds ||
            0) -
          (a.submittedAt?.seconds ||
            0)
      );

      setApplications(data);
    } catch (loadError) {
      console.error(
        "Failed to load expert applications:",
        loadError
      );

      setError(
        "Unable to load expert applications."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (
      currentUser &&
      userProfile?.role ===
        "admin"
    ) {
      loadApplications();
    } else {
      setLoading(false);
    }
  }, [
    currentUser,
    userProfile,
  ]);

  async function handleDecision(
    application,
    decision
  ) {
    try {
      setActionId(
        application.id
      );

      setError("");

      const userRef = doc(
        db,
        "users",
        application.userId
      );

      const applicationRef = doc(
        db,
        "expertApplications",
        application.id
      );

      const newStatus =
        decision === "approved"
          ? "approved"
          : "rejected";

      await updateDoc(
        userRef,
        {
          expertStatus:
            newStatus,
          expertVerifiedAt:
            decision === "approved"
              ? serverTimestamp()
              : null,
        }
      );

      await updateDoc(
        applicationRef,
        {
          status: newStatus,
          reviewedAt:
            serverTimestamp(),
          reviewedBy:
            currentUser.uid,
        }
      );

      await createNotification(
        application.userId,
        decision === "approved"
          ? "Expert Verification Approved"
          : "Expert Verification Rejected",
        decision === "approved"
          ? "Your Agricultural Expert account has been approved. Expert services are now available."
          : "Your Agricultural Expert application has been rejected. You may submit updated information for another review.",
        "expert_verification"
      );

      await loadApplications();
    } catch (decisionError) {
      console.error(
        "Expert verification action failed:",
        decisionError
      );

      setError(
        "Unable to update the application."
      );
    } finally {
      setActionId("");
    }
  }

  if (!currentUser) {
    return null;
  }

  if (
    userProfile?.role !==
    "admin"
  ) {
    return (
      <div className="feature-page">
        <div className="feature-header">
          <h1>
            Access Restricted
          </h1>

          <p>
            You do not have permission
            to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="feature-page">
      <div className="feature-header">
        <button
          type="button"
          className="back-button"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          ← Back to Dashboard
        </button>

        <p className="feature-label">
          Administration
        </p>

        <h1>
          Expert Applications
        </h1>

        <p>
          Review Agricultural Expert
          verification applications.
        </p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {loading ? (
        <div className="empty-state">
          <p>
            Loading expert applications...
          </p>
        </div>
      ) : applications.length ===
        0 ? (
        <div className="empty-state">
          <p>
            No pending expert applications.
          </p>
        </div>
      ) : (
        <div className="history-list">
          {applications.map(
            (application) => (
              <div
                className="history-card"
                key={application.id}
              >
                <div className="history-card-header">
                  <div>
                    <span className="history-type">
                      Pending
                    </span>

                    <h2>
                      {
                        application.fullName
                      }
                    </h2>

                    <p>
                      {
                        application.email
                      }
                    </p>
                  </div>
                </div>

                <div className="history-details">
                  <p>
                    <strong>
                      Phone:
                    </strong>{" "}
                    {application.phone}
                  </p>

                  <p>
                    <strong>
                      Qualification:
                    </strong>{" "}
                    {
                      application.qualification
                    }
                  </p>

                  <p>
                    <strong>
                      Specialization:
                    </strong>{" "}
                    {
                      application.specialization
                    }
                  </p>

                  <p>
                    <strong>
                      Experience:
                    </strong>{" "}
                    {
                      application.experienceYears
                    }{" "}
                    years
                  </p>

                  <p>
                    <strong>
                      Organization:
                    </strong>{" "}
                    {
                      application.organization ||
                      "Not provided"
                    }
                  </p>

                  <p>
                    <strong>
                      Professional Experience:
                    </strong>
                  </p>

                  <p>
                    {
                      application.experienceDetails
                    }
                  </p>

                  <p>
                    <strong>
                      Agricultural Expertise:
                    </strong>
                  </p>

                  <p>
                    {
                      application.expertise
                    }
                  </p>

                  <p>
                    <strong>
                      Motivation:
                    </strong>
                  </p>

                  <p>
                    {
                      application.motivation ||
                      "Not provided"
                    }
                  </p>
                </div>

                <div className="feature-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={
                      actionId ===
                      application.id
                    }
                    onClick={() =>
                      handleDecision(
                        application,
                        "rejected"
                      )
                    }
                  >
                    Reject
                  </button>

                  <button
                    type="button"
                    disabled={
                      actionId ===
                      application.id
                    }
                    onClick={() =>
                      handleDecision(
                        application,
                        "approved"
                      )
                    }
                  >
                    {actionId ===
                    application.id
                      ? "Processing..."
                      : "Approve Expert"}
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default AdminExpertApplications;