import {
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  query,
  updateDoc,
  doc,
  where,
} from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";

function Notifications() {
  const navigate = useNavigate();
  const { currentUser } =
    useAuth();

  const [
    notifications,
    setNotifications,
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function fetchNotifications() {
    if (!currentUser) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const notificationsQuery =
        query(
          collection(
            db,
            "notifications"
          ),
          where(
            "userId",
            "==",
            currentUser.uid
          )
        );

      const snapshot =
        await getDocs(
          notificationsQuery
        );

      const notificationData =
        snapshot.docs.map(
          (document) => ({
            id: document.id,
            ...document.data(),
          })
        );

      notificationData.sort(
        (a, b) =>
          (b.createdAt?.seconds ||
            0) -
          (a.createdAt?.seconds ||
            0)
      );

      setNotifications(
        notificationData
      );
    } catch (fetchError) {
      console.error(
        "Failed to fetch notifications:",
        fetchError
      );

      setError(
        "Unable to load notifications."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotifications();
  }, [currentUser]);

  function formatDate(timestamp) {
    if (!timestamp) {
      return "Recently";
    }

    if (
      typeof timestamp.toDate ===
      "function"
    ) {
      return timestamp
        .toDate()
        .toLocaleString();
    }

    if (timestamp.seconds) {
      return new Date(
        timestamp.seconds * 1000
      ).toLocaleString();
    }

    return "Recently";
  }

  async function handleNotificationClick(
    notification
  ) {
    if (
      !notification.read
    ) {
      try {
        await updateDoc(
          doc(
            db,
            "notifications",
            notification.id
          ),
          {
            read: true,
          }
        );

        setNotifications(
          (previous) =>
            previous.map((item) =>
              item.id ===
              notification.id
                ? {
                    ...item,
                    read: true,
                  }
                : item
            )
        );
      } catch (error) {
        console.error(
          "Failed to mark notification as read:",
          error
        );
      }
    }
  }

  if (loading) {
    return (
      <div className="history-page">
        <div className="history-loading">
          Loading notifications...
        </div>
      </div>
    );
  }

  return (
    <div className="history-page">
      <div className="history-container">
        <button
          type="button"
          className="back-button"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          ← Back to Dashboard
        </button>

        <div className="feature-header history-header">
          <p className="feature-label">
            User Updates
          </p>

          <h1>
            Notifications
          </h1>

          <p>
            View important updates and
            activity messages.
          </p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {notifications.length ===
        0 ? (
          <div className="empty-state">
            <p>
              No notifications available.
            </p>
          </div>
        ) : (
          <div className="notification-list">
            {notifications.map(
              (notification) => (
                <div
                  className={`notification-card ${
                    notification.read
                      ? "notification-read"
                      : "notification-unread"
                  }`}
                  key={notification.id}
                  onClick={() =>
                    handleNotificationClick(
                      notification
                    )
                  }
                >
                  <div className="notification-content">
                    <div className="notification-top">
                      <h3>
                        {
                          notification.title
                        }
                      </h3>

                      {!notification.read && (
                        <span className="unread-badge">
                          New
                        </span>
                      )}
                    </div>

                    <p>
                      {
                        notification.message
                      }
                    </p>

                    <span className="notification-date">
                      {formatDate(
                        notification.createdAt
                      )}
                    </span>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;