import {
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../services/firebase";
import {
  useAuth,
} from "../context/AuthContext";
import {
  createNotification,
} from "../services/notificationService";

const initialFormData = {
  phone: "",
  qualification: "",
  specialization: "",
  experienceYears: "",
  organization: "",
  experienceDetails: "",
  expertise: "",
  motivation: "",
};

function ExpertVerification() {
  const navigate = useNavigate();

  const {
    currentUser,
    userProfile,
  } = useAuth();

  const [formData, setFormData] =
    useState(initialFormData);

  const [
    applicationStatus,
    setApplicationStatus,
  ] = useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  useEffect(() => {
    async function loadApplication() {
      if (!currentUser) {
        return;
      }

      try {
        const applicationDocument =
          await getDoc(
            doc(
              db,
              "expertApplications",
              currentUser.uid
            )
          );

        if (
          applicationDocument.exists()
        ) {
          const data =
            applicationDocument.data();

          setFormData({
            phone: data.phone || "",
            qualification:
              data.qualification || "",
            specialization:
              data.specialization || "",
            experienceYears:
              data.experienceYears ??
              "",
            organization:
              data.organization || "",
            experienceDetails:
              data.experienceDetails ||
              "",
            expertise:
              data.expertise || "",
            motivation:
              data.motivation || "",
          });

          setApplicationStatus(
            data.status || "pending"
          );
        }
      } catch (loadError) {
        console.error(
          "Failed to load expert application:",
          loadError
        );
      }
    }

    loadApplication();
  }, [currentUser]);

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!currentUser) {
      setError(
        "You must be logged in to submit an application."
      );
      return;
    }

    if (
      userProfile?.role !==
      "agricultural-expert"
    ) {
      setError(
        "Only Agricultural Expert applicants can submit this form."
      );
      return;
    }

    if (
      userProfile?.expertStatus ===
      "approved"
    ) {
      setError(
        "Your expert account has already been approved."
      );
      return;
    }

    if (!formData.phone.trim()) {
      setError(
        "Phone number is required."
      );
      return;
    }

    if (
      !formData.qualification.trim()
    ) {
      setError(
        "Educational qualification is required."
      );
      return;
    }

    if (
      !formData.specialization.trim()
    ) {
      setError(
        "Area of specialization is required."
      );
      return;
    }

    if (
      formData.experienceYears === "" ||
      Number(formData.experienceYears) <
        0
    ) {
      setError(
        "Please enter a valid experience value."
      );
      return;
    }

    if (
      !formData.experienceDetails.trim()
    ) {
      setError(
        "Professional experience details are required."
      );
      return;
    }

    if (!formData.expertise.trim()) {
      setError(
        "Agricultural expertise details are required."
      );
      return;
    }

    try {
      setIsSubmitting(true);

      await setDoc(
        doc(
          db,
          "expertApplications",
          currentUser.uid
        ),
        {
          userId: currentUser.uid,
          fullName:
            userProfile?.fullName ||
            currentUser.displayName ||
            "",
          email:
            userProfile?.email ||
            currentUser.email ||
            "",
          phone:
            formData.phone.trim(),
          qualification:
            formData.qualification.trim(),
          specialization:
            formData.specialization.trim(),
          experienceYears:
            Number(
              formData.experienceYears
            ),
          organization:
            formData.organization.trim(),
          experienceDetails:
            formData.experienceDetails.trim(),
          expertise:
            formData.expertise.trim(),
          motivation:
            formData.motivation.trim(),
          status: "pending",
          submittedAt:
            serverTimestamp(),
          updatedAt:
            serverTimestamp(),
        }
      );

      await createNotification(
        currentUser.uid,
        "Expert Verification Submitted",
        "Your Agricultural Expert verification application has been submitted for review.",
        "expert_verification"
      );

      setApplicationStatus(
        "pending"
      );

      setSuccess(
        "Your expert verification application has been submitted."
      );
    } catch (submitError) {
      console.error(
        "Expert application submission failed:",
        submitError
      );

      setError(
        "Unable to submit the application. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!currentUser) {
    return null;
  }

  if (
    userProfile?.role !==
    "agricultural-expert"
  ) {
    return (
      <div className="feature-page">
        <div className="feature-header">
          <h1>
            Access Restricted
          </h1>

          <p>
            This page is only available for
            Agricultural Expert applicants.
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
          Expert Verification
        </p>

        <h1>
          Agricultural Expert Verification
        </h1>

        <p>
          Submit your professional
          background and experience for
          verification.
        </p>
      </div>

      {applicationStatus ===
        "pending" && (
        <div className="info-linked-result">
          <strong>
            Application Status: Pending
          </strong>

          <span>
            Your application is under
            review. You may be contacted
            for an interview.
          </span>
        </div>
      )}

      {userProfile?.expertStatus ===
        "rejected" && (
        <div className="error-message">
          Your previous application was
          rejected. You may submit updated
          information for another review.
        </div>
      )}

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form
        className="feature-form"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="form-section">
          <h2>
            Personal Information
          </h2>

          <div className="feature-form-grid">
            <div className="form-group">
              <label htmlFor="phone">
                Phone Number
              </label>

              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="Enter phone number"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="qualification">
                Educational Qualification
              </label>

              <input
                id="qualification"
                name="qualification"
                type="text"
                placeholder="Enter your qualification"
                value={
                  formData.qualification
                }
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>
            Professional Information
          </h2>

          <div className="feature-form-grid">
            <div className="form-group">
              <label htmlFor="specialization">
                Area of Specialization
              </label>

              <input
                id="specialization"
                name="specialization"
                type="text"
                placeholder="Example: Plant Pathology"
                value={
                  formData.specialization
                }
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="experienceYears">
                Years of Experience
              </label>

              <input
                id="experienceYears"
                name="experienceYears"
                type="number"
                min="0"
                step="1"
                placeholder="Enter years of experience"
                value={
                  formData.experienceYears
                }
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="organization">
                Organization / Institution
              </label>

              <input
                id="organization"
                name="organization"
                type="text"
                placeholder="Enter organization"
                value={
                  formData.organization
                }
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>
            Experience & Expertise
          </h2>

          <div className="form-group">
            <label htmlFor="experienceDetails">
              Professional Experience
            </label>

            <textarea
              id="experienceDetails"
              name="experienceDetails"
              rows="5"
              placeholder="Describe your professional experience."
              value={
                formData.experienceDetails
              }
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="expertise">
              Agricultural Expertise
            </label>

            <textarea
              id="expertise"
              name="expertise"
              rows="5"
              placeholder="Describe your areas of agricultural expertise."
              value={formData.expertise}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="motivation">
              Motivation
            </label>

            <textarea
              id="motivation"
              name="motivation"
              rows="4"
              placeholder="Explain why you want to join as an agricultural expert."
              value={
                formData.motivation
              }
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="feature-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Submitting..."
              : "Submit for Verification"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ExpertVerification;