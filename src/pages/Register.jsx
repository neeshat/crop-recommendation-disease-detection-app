import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function Register() {
  const navigate = useNavigate();

  const { register } = useAuth();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "farmer",
    termsAccepted: false,
  });

  const [errors, setErrors] = useState({});

  const [serverError, setServerError] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));

    setServerError("");
  }

  function getPasswordStrength(password) {
    if (!password) {
      return {
        label: "",
        width: 0,
      };
    }

    let score = 0;

    if (password.length >= 6) {
      score += 1;
    }

    if (password.length >= 8) {
      score += 1;
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    }

    if (/[0-9]/.test(password)) {
      score += 1;
    }

    if (/[^A-Za-z0-9]/.test(password)) {
      score += 1;
    }

    if (score <= 2) {
      return {
        label: "Weak",
        width: 30,
      };
    }

    if (score <= 4) {
      return {
        label: "Medium",
        width: 65,
      };
    }

    return {
      label: "Strong",
      width: 100,
    };
  }

  const passwordStrength = getPasswordStrength(formData.password);

  const passwordRequirements = {
    minLength: formData.password.length >= 6,

    uppercase: /[A-Z]/.test(formData.password),

    lowercase: /[a-z]/.test(formData.password),

    number: /[0-9]/.test(formData.password),

    special: /[^A-Za-z0-9]/.test(formData.password),
  };

  function validateForm() {
    const newErrors = {};

    const fullName = formData.fullName.trim();

    const email = formData.email.trim();

    const password = formData.password;

    const confirmPassword = formData.confirmPassword;

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!fullName) {
      newErrors.fullName = "Full name is required.";
    }

    if (!email) {
      newErrors.email = "Email is required.";
    } else if (!emailPattern.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!password) {
      newErrors.password = "Password is required.";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    if (!formData.role) {
      newErrors.role = "Please select a role.";
    }

    if (!formData.termsAccepted) {
      newErrors.termsAccepted = "You must accept the Terms & Conditions.";
    }

    return newErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setServerError("");

    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setIsSubmitting(true);

      await register(
        formData.email.trim(),
        formData.password,
        formData.fullName.trim(),
        formData.role,
      );

      navigate("/verify-email", {
        replace: true,
      });
    } catch (error) {
      console.error("Registration failed:", error);

      let message = "Unable to create your account. Please try again.";

      if (error.code === "auth/email-already-in-use") {
        message = "An account with this email already exists.";
      } else if (error.code === "auth/invalid-email") {
        message = "Please enter a valid email address.";
      } else if (error.code === "auth/weak-password") {
        message = "Password is too weak. Please use a stronger password.";
      } else if (error.code === "auth/network-request-failed") {
        message = "Network error. Please check your internet connection.";
      } else if (error.code === "auth/too-many-requests") {
        message = "Too many requests. Please try again later.";
      } else {
        message = error.message || message;
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

          <h1>Create Account</h1>

          <p>Crop Recommendation & Disease Detection</p>

          <span className="auth-subtitle">
            Create your account to get started
          </span>
        </div>

        {serverError && <div className="error-message">{serverError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>

            <input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={handleChange}
              autoComplete="name"
            />

            {errors.fullName && (
              <p className="field-error">{errors.fullName}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>

            <input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
            />

            {errors.email && <p className="field-error">{errors.email}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>

            <div className="password-input-wrapper">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((previous) => !previous)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {formData.password && (
              <div className="password-strength">
                <div className="password-strength-header">
                  <span>Password Strength</span>

                  <span>{passwordStrength.label}</span>
                </div>

                <div className="password-strength-bar">
                  <div
                    className="password-strength-fill"
                    style={{
                      width: `${passwordStrength.width}%`,
                    }}
                  />
                </div>

                <div className="password-requirements">
                  <p className={passwordRequirements.minLength ? "valid" : ""}>
                    At least 6 characters
                  </p>

                  <p className={passwordRequirements.uppercase ? "valid" : ""}>
                    One uppercase letter
                  </p>

                  <p className={passwordRequirements.lowercase ? "valid" : ""}>
                    One lowercase letter
                  </p>

                  <p className={passwordRequirements.number ? "valid" : ""}>
                    One number
                  </p>

                  <p className={passwordRequirements.special ? "valid" : ""}>
                    One special character
                  </p>
                </div>
              </div>
            )}

            {errors.password && (
              <p className="field-error">{errors.password}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>

            <div className="password-input-wrapper">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword((previous) => !previous)}
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>

            {formData.confirmPassword &&
              formData.password === formData.confirmPassword && (
                <p className="password-match">✓ Passwords match</p>
              )}

            {errors.confirmPassword && (
              <p className="field-error">{errors.confirmPassword}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="role">Account Type</label>

            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="farmer">Farmer</option>

              <option value="agricultural-expert">Agricultural Expert</option>
            </select>

            {errors.role && <p className="field-error">{errors.role}</p>}

            {formData.role === "agricultural-expert" && (
              <p className="role-note">
                Agricultural Expert accounts require verification and admin
                approval before expert features can be used.
              </p>
            )}
          </div>

          <div className="terms-group">
            <label className="terms-checkbox">
              <input
                type="checkbox"
                name="termsAccepted"
                checked={formData.termsAccepted}
                onChange={handleChange}
              />

              <span>I accept the Terms & Conditions.</span>
            </label>

            {errors.termsAccepted && (
              <p className="field-error">{errors.termsAccepted}</p>
            )}
          </div>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
