import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { createNotification } from "../services/notificationService";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function DiseaseDetection() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  function handleFileChange(event) {
    const file = event.target.files[0];

    setError("");
    setResult(null);

    if (!file) {
      setSelectedFile(null);
      setPreviewUrl("");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png"];

    const maxFileSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      setSelectedFile(null);
      setPreviewUrl("");
      setError("Please upload a JPG or PNG image.");
      return;
    }

    if (file.size > maxFileSize) {
      setSelectedFile(null);
      setPreviewUrl("");
      setError("Image size must be less than 5 MB.");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const newPreviewUrl = URL.createObjectURL(file);

    setSelectedFile(file);
    setPreviewUrl(newPreviewUrl);
  }

  function handleRemoveImage() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setPreviewUrl("");
    setError("");
    setResult(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setResult(null);

    if (!currentUser) {
      setError("You must be logged in to use disease detection.");
      return;
    }

    if (!selectedFile) {
      setError("Please select a leaf image first.");
      return;
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();

      formData.append("image", selectedFile);

      const response = await fetch(`${API_BASE_URL}/disease/predict`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let message = "Disease detection failed.";

        try {
          const errorData = await response.json();

          if (errorData.detail) {
            message = errorData.detail;
          }
        } catch {
          // Ignore response parsing errors.
        }

        throw new Error(message);
      }

      const prediction = await response.json();

      await addDoc(collection(db, "diseaseDetections"), {
        userId: currentUser.uid,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileSize: selectedFile.size,
        detectedDisease: prediction.disease || null,
        confidence: prediction.confidence ?? 0,
        topPredictions: prediction.results ?? [],
        status: prediction.disease ? "success" : "no-result",
        createdAt: serverTimestamp(),
      });

      if (prediction.disease) {
        await createNotification(
          currentUser.uid,
          "Disease Detection Complete",
          `Possible disease detected: ${prediction.disease}`,
          "disease_detection",
        );
      } else {
        await createNotification(
          currentUser.uid,
          "Disease Detection Complete",
          "No probable disease was identified from the uploaded image.",
          "disease_detection",
        );
      }

      setResult({
        disease: prediction.disease || null,
        confidence: prediction.confidence ?? 0,
        results: prediction.results ?? [],
        message: prediction.message || "Disease detection completed.",
      });
    } catch (detectionError) {
      console.error("Disease detection failed:", detectionError);

      setError(
        detectionError.message ||
          "Unable to detect disease. Please make sure the prediction server is running.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleViewInformation() {
    if (!result?.disease) {
      return;
    }

    navigate(
      `/remedies-information?disease=${encodeURIComponent(result.disease)}`,
    );
  }

  return (
    <div className="feature-page">
      <div className="feature-header">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate("/dashboard")}
        >
          ← Back to Dashboard
        </button>

        <p className="feature-label">Farmer Service</p>

        <h1>Disease Detection</h1>

        <p>Upload a clear image of a plant leaf to detect possible diseases.</p>
      </div>

      <form className="feature-form" onSubmit={handleSubmit} noValidate>
        {error && <div className="error-message">{error}</div>}

        <div className="form-section">
          <h2>Upload Leaf Image</h2>

          <div className="upload-area">
            <input
              id="leafImage"
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleFileChange}
            />

            <label htmlFor="leafImage">
              <span className="upload-title">Select a leaf image</span>

              <span className="upload-description">
                JPG or PNG · Maximum 5 MB
              </span>
            </label>
          </div>

          {previewUrl && (
            <div className="image-preview">
              <img src={previewUrl} alt="Selected plant leaf" />

              <div className="image-details">
                <strong>{selectedFile.name}</strong>

                <span>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>

                <button
                  type="button"
                  className="remove-image-button"
                  onClick={handleRemoveImage}
                >
                  Remove Image
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="feature-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate("/dashboard")}
          >
            Cancel
          </button>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Analyzing..." : "Detect Disease"}
          </button>
        </div>
      </form>

      {result && (
        <div className="recommendation-result">
          <p className="result-label">Detection Result</p>

          {result.disease ? (
            <>
              <h2>Possible Disease: {result.disease}</h2>

              <p className="confidence-value">
                Confidence: {(result.confidence * 100).toFixed(1)}%
              </p>

              <p className="result-disclaimer">
                This is an AI-based preliminary result and should not be treated
                as a confirmed diagnosis.
              </p>

              <button
                type="button"
                className="information-button"
                onClick={handleViewInformation}
              >
                View Information & Remedies
              </button>

              <div className="top-predictions">
                <h3>Top Results</h3>

                {result.results.map((prediction, index) => (
                  <div
                    className="prediction-row"
                    key={`${prediction.disease}-${index}`}
                  >
                    <span>
                      {index + 1}. {prediction.disease}
                    </span>

                    <strong>{(prediction.confidence * 100).toFixed(1)}%</strong>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <h2>No probable disease identified</h2>

              <p>{result.message}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default DiseaseDetection;
