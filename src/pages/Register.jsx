import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const initialFormData = {
  fullName: "",
  email: "",
  role: "",
  password: "",
  confirmPassword: "",
  termsAccepted: false,
};

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState(initialFormData);
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

  function getPasswordRequirements(password) {
    return {
      minLength: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    };
  }

  function validateForm() {
    const newErrors = {};

    const fullName = formData.fullName.trim();
    const email = formData.email.trim();
    const password = formData.password;
    const confirmPassword = formData.confirmPassword;

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRequirements = getPasswordRequirements(password);

    if (!fullName) {
      newErrors.fullName = "Full name is required.";
    } else if (fullName.length < 2) {
      newErrors.fullName = "Full name must contain at least 2 characters.";
    }

    if (!email) {
      newErrors.email = "Email is required.";
    } else if (!emailPattern.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    const allowedRoles = ["farmer", "agricultural-expert"];

    if (!formData.role) {
      newErrors.role = "Please select your user type.";
    } else if (!allowedRoles.includes(formData.role)) {
      newErrors.role = "Please select a valid user type.";
    }

    if (!password) {
      newErrors.password = "Password is required.";
    } else {
      const allRequirementsMet =
        Object.values(passwordRequirements).every(Boolean);

      if (!allRequirementsMet) {
        newErrors.password =
          "Password does not meet all security requirements.";
      }
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    if (!formData.termsAccepted) {
      newErrors.termsAccepted = "You must accept the terms and conditions.";
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

      navigate("/dashboard");
    } catch (error) {
      let message = "Registration failed. Please try again.";

      if (error.code === "auth/email-already-in-use") {
        message = "An account with this email already exists.";
      } else if (error.code === "auth/invalid-email") {
        message = "Please enter a valid email address.";
      } else if (error.code === "auth/weak-password") {
        message = "The password is too weak.";
      } else if (error.code === "auth/network-request-failed") {
        message = "Network error. Please check your connection.";
      }

      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const passwordRequirements = getPasswordRequirements(formData.password);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="app-logo">CR</div>

          <h1>Create Account</h1>

          <p>Crop Recommendation & Disease Detection</p>

          <span className="auth-subtitle">
            Register to use the agriculture assistant
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
            <label htmlFor="role">User Type</label>

            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="">Select user type</option>
              <option value="farmer">Farmer</option>
              <option value="agricultural-expert">Agricultural Expert</option>
            </select>

            {errors.role && <p className="field-error">{errors.role}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>

            <div className="password-input-wrapper">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
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
                  <span>Password strength</span>
                  <span>
                    {Object.values(passwordRequirements).filter(Boolean).length}{" "}
                    / 5
                  </span>
                </div>

                <div className="password-strength-bar">
                  <div
                    className={`password-strength-fill strength-${
                      Object.values(passwordRequirements).filter(Boolean).length
                    }`}
                    style={{
                      width: `${
                        (Object.values(passwordRequirements).filter(Boolean)
                          .length /
                          5) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            )}

            {formData.password && (
              <div className="password-requirements">
                <p className={passwordRequirements.minLength ? "valid" : ""}>
                  At least 8 characters
                </p>

                <p className={passwordRequirements.uppercase ? "valid" : ""}>
                  At least one uppercase letter
                </p>

                <p className={passwordRequirements.lowercase ? "valid" : ""}>
                  At least one lowercase letter
                </p>

                <p className={passwordRequirements.number ? "valid" : ""}>
                  At least one number
                </p>

                <p className={passwordRequirements.special ? "valid" : ""}>
                  At least one special character
                </p>
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

            {errors.confirmPassword && (
              <p className="field-error">{errors.confirmPassword}</p>
            )}
          </div>

          <div className="terms-group">
            <label>
              <input
                type="checkbox"
                name="termsAccepted"
                checked={formData.termsAccepted}
                onChange={handleChange}
              />

              <span>I agree to the terms and conditions.</span>
            </label>

            {errors.termsAccepted && (
              <p className="field-error">{errors.termsAccepted}</p>
            )}
          </div>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create Account"}
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
