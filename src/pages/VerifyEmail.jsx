import { useState } from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext";

function VerifyEmail() {
  const navigate = useNavigate();

  const {
    currentUser,
    refreshUser,
    resendVerificationEmail,
    logout,
  } = useAuth();

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [isChecking, setIsChecking] =
    useState(false);

  const [isResending, setIsResending] =
    useState(false);

  async function handleCheckVerification() {
    try {
      setIsChecking(true);
      setMessage("");
      setError("");

      if (!currentUser) {
        navigate("/", {
          replace: true,
        });

        return;
      }

      const user =
        await refreshUser();

      if (user?.emailVerified) {
        setMessage(
          "Your email has been verified successfully."
        );

        navigate("/dashboard", {
          replace: true,
        });

        return;
      }

      setError(
        "Your email is not verified yet. Please open the verification email and click the verification link."
      );
    } catch (checkError) {
      console.error(
        "Email verification check failed:",
        checkError
      );

      setError(
        "Unable to check verification status. Please try again."
      );
    } finally {
      setIsChecking(false);
    }
  }

  async function handleResend() {
    try {
      setIsResending(true);
      setMessage("");
      setError("");

      await resendVerificationEmail();

      setMessage(
        "Verification email sent again. Please check your inbox."
      );
    } catch (resendError) {
      console.error(
        "Failed to resend verification email:",
        resendError
      );

      if (
        resendError.code ===
        "auth/too-many-requests"
      ) {
        setError(
          "Too many requests. Please wait a moment and try again."
        );
      } else {
        setError(
          "Unable to resend the verification email. Please try again."
        );
      }
    } finally {
      setIsResending(false);
    }
  }

  async function handleLogout() {
    try {
      await logout();

      navigate("/", {
        replace: true,
      });
    } catch (logoutError) {
      console.error(
        "Logout failed:",
        logoutError
      );
    }
  }

  if (!currentUser) {
    return (
      <div className="auth-page">
        <div className="auth-card">

          <div className="auth-header">
            <img
              src="/logo.png"
              alt="Crop Recommendation and Disease Detection"
              className="app-logo"
            />

            <h1>
              Verify Your Email
            </h1>

            <p>
              Please log in to continue.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/")
            }
          >
            Go to Login
          </button>

        </div>
      </div>
    );
  }

  if (currentUser.emailVerified) {
    return (
      <div className="auth-page">
        <div className="auth-card">

          <div className="auth-header">
            <img
              src="/logo.png"
              alt="Crop Recommendation and Disease Detection"
              className="app-logo"
            />

            <h1>
              Email Verified
            </h1>

            <p>
              Your email has already been verified.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/dashboard", {
                replace: true,
              })
            }
          >
            Go to Dashboard
          </button>

        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-header">

          <img
            src="/logo.png"
            alt="Crop Recommendation and Disease Detection"
            className="app-logo"
          />

          <h1>
            Verify Your Email
          </h1>

          <p>
            Your account has been created successfully.
          </p>

          <span className="auth-subtitle">
            One more step is required before you can use the application.
          </span>

        </div>

        <div className="verification-success-card">

          <div className="verification-icon">
            ✓
          </div>

          <h2>
            Check Your Email
          </h2>

          <p>
            We sent a verification link to:
          </p>

          <strong>
            {currentUser.email}
          </strong>

          <p className="verification-instruction">
            Open your email inbox and click the
            verification link. After verifying,
            return to this page and click
            "I Have Verified My Email".
          </p>

        </div>

        {message && (
          <div className="success-message">
            {message}
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="feature-actions">

          <button
            type="button"
            onClick={
              handleCheckVerification
            }
            disabled={isChecking}
          >
            {isChecking
              ? "Checking..."
              : "I Have Verified My Email"}
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={handleResend}
            disabled={isResending}
          >
            {isResending
              ? "Sending..."
              : "Resend Verification Email"}
          </button>

        </div>

        <div className="verification-login-note">
          <p>
            You must verify your email before
            logging in and using the application.
          </p>
        </div>

        <div className="auth-footer">

          <p>
            Need to use a different account?
          </p>

          <button
            type="button"
            className="secondary-button"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </div>
    </div>
  );
}

export default VerifyEmail;