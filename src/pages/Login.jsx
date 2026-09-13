import { useState } from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  sendPasswordResetEmail,
} from "firebase/auth";

import { auth } from "../services/firebase";

import {
  useAuth,
} from "../context/AuthContext";

function Login() {
  const navigate =
    useNavigate();

  const {
    login,
    resendVerificationEmail,
  } = useAuth();

  const [formData, setFormData] =
    useState({
      email: "",
      password: "",
    });

  const [errors, setErrors] =
    useState({});

  const [serverError, setServerError] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [isResetting, setIsResetting] =
    useState(false);

  const [
    isResendingVerification,
    setIsResendingVerification,
  ] = useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [
    showForgotPassword,
    setShowForgotPassword,
  ] = useState(false);

  const [resetMessage, setResetMessage] =
    useState("");

  const [
    verificationMessage,
    setVerificationMessage,
  ] = useState("");

  const [
    emailNotVerified,
    setEmailNotVerified,
  ] = useState(false);

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setFormData(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );

    setErrors(
      (previous) => ({
        ...previous,
        [name]: "",
      })
    );

    setServerError("");
    setResetMessage("");
    setVerificationMessage("");
    setEmailNotVerified(false);

    if (name === "email") {
      setShowForgotPassword(false);
    }
  }

  function validateForm() {
    const newErrors = {};

    const email =
      formData.email.trim();

    const password =
      formData.password;

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      newErrors.email =
        "Email is required.";
    } else if (
      !emailPattern.test(email)
    ) {
      newErrors.email =
        "Please enter a valid email address.";
    }

    if (!password) {
      newErrors.password =
        "Password is required.";
    }

    return newErrors;
  }

  async function handlePasswordReset() {
    const email =
      formData.email.trim();

    setServerError("");
    setResetMessage("");

    if (!email) {
      setErrors(
        (previous) => ({
          ...previous,
          email:
            "Enter your email address first.",
        })
      );

      return;
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      setErrors(
        (previous) => ({
          ...previous,
          email:
            "Please enter a valid email address.",
        })
      );

      return;
    }

    try {
      setIsResetting(true);

      await sendPasswordResetEmail(
        auth,
        email
      );

      setResetMessage(
        "Password reset email sent. Please check your inbox."
      );

      setShowForgotPassword(
        false
      );
    } catch (error) {
      if (
        error.code ===
        "auth/user-not-found"
      ) {
        setServerError(
          "No account was found with this email address."
        );
      } else if (
        error.code ===
        "auth/invalid-email"
      ) {
        setServerError(
          "Please enter a valid email address."
        );
      } else if (
        error.code ===
        "auth/network-request-failed"
      ) {
        setServerError(
          "Network error. Please check your connection."
        );
      } else if (
        error.code ===
        "auth/too-many-requests"
      ) {
        setServerError(
          "Too many reset attempts. Please try again later."
        );
      } else {
        setServerError(
          "Unable to send the password reset email. Please try again."
        );
      }
    } finally {
      setIsResetting(false);
    }
  }

  async function handleResendVerification() {
    try {
      setIsResendingVerification(
        true
      );

      setServerError("");
      setVerificationMessage("");

      await resendVerificationEmail();

      setVerificationMessage(
        "Verification email sent again. Please check your inbox."
      );
    } catch (error) {
      if (
        error.code ===
        "auth/too-many-requests"
      ) {
        setServerError(
          "Too many requests. Please wait a moment and try again."
        );
      } else {
        setServerError(
          "Unable to send the verification email. Please try again."
        );
      }
    } finally {
      setIsResendingVerification(
        false
      );
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setServerError("");
    setResetMessage("");
    setVerificationMessage("");
    setShowForgotPassword(false);
    setEmailNotVerified(false);

    const validationErrors =
      validateForm();

    if (
      Object.keys(
        validationErrors
      ).length > 0
    ) {
      setErrors(
        validationErrors
      );

      return;
    }

    try {
      setIsSubmitting(true);

      await login(
        formData.email.trim(),
        formData.password
      );

      navigate(
        "/dashboard"
      );
    } catch (error) {
      let message =
        "Unable to login. Please try again.";

      if (
        error.code ===
        "auth/email-not-verified"
      ) {
        message =
          "Your email address has not been verified yet.";

        setEmailNotVerified(
          true
        );
      } else if (
        error.code ===
        "auth/invalid-credential"
      ) {
        message =
          "Incorrect email or password.";

        setShowForgotPassword(
          true
        );
      } else if (
        error.code ===
        "auth/user-not-found"
      ) {
        message =
          "No account was found with this email address.";

        setShowForgotPassword(
          true
        );
      } else if (
        error.code ===
        "auth/wrong-password"
      ) {
        message =
          "Incorrect password.";

        setShowForgotPassword(
          true
        );
      } else if (
        error.code ===
        "auth/too-many-requests"
      ) {
        message =
          "Too many login attempts. Please try again later.";
      } else if (
        error.code ===
        "auth/network-request-failed"
      ) {
        message =
          "Network error. Please check your connection.";
      }

      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
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
            Welcome Back
          </h1>

          <p>
            Crop Recommendation & Disease Detection
          </p>

          <span className="auth-subtitle">
            Login to your account
          </span>
        </div>

        {serverError && (
          <div className="error-message">
            {serverError}
          </div>
        )}

        {resetMessage && (
          <div className="success-message">
            {resetMessage}
          </div>
        )}

        {verificationMessage && (
          <div className="success-message">
            {verificationMessage}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="form-group">
            <label htmlFor="email">
              Email Address
            </label>

            <input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={
                formData.email
              }
              onChange={
                handleChange
              }
              autoComplete="email"
            />

            {errors.email && (
              <p className="field-error">
                {errors.email}
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Password
            </label>

            <div className="password-input-wrapper">
              <input
                id="password"
                name="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter your password"
                value={
                  formData.password
                }
                onChange={
                  handleChange
                }
                autoComplete="current-password"
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword(
                    (previous) =>
                      !previous
                  )
                }
              >
                {showPassword
                  ? "Hide"
                  : "Show"}
              </button>
            </div>

            {errors.password && (
              <p className="field-error">
                {errors.password}
              </p>
            )}

            {showForgotPassword && (
              <div className="forgot-password">
                <button
                  type="button"
                  onClick={
                    handlePasswordReset
                  }
                  disabled={
                    isResetting
                  }
                >
                  {isResetting
                    ? "Sending reset email..."
                    : "Forgot Password?"}
                </button>
              </div>
            )}

            {emailNotVerified && (
              <div className="verification-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    handleResendVerification
                  }
                  disabled={
                    isResendingVerification
                  }
                >
                  {isResendingVerification
                    ? "Sending verification email..."
                    : "Resend Verification Email"}
                </button>

                <p className="verification-help">
                  Please verify your email before logging in.
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={
              isSubmitting
            }
          >
            {isSubmitting
              ? "Logging in..."
              : "Login"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{" "}
            <Link to="/register">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;