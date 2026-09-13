import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { createNotification } from "../services/notificationService";

const API_BASE_URL = "http://127.0.0.1:8000";

const initialFormData = {
  nitrogen: "",
  phosphorus: "",
  potassium: "",
  temperature: "",
  humidity: "",
  ph: "",
  rainfall: "",
};

function CropRecommendation() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
      form: "",
    }));

    setResult(null);
  }

  function validateForm() {
    const newErrors = {};

    const numericFields = [
      "nitrogen",
      "phosphorus",
      "potassium",
      "temperature",
      "humidity",
      "ph",
      "rainfall",
    ];

    numericFields.forEach((field) => {
      const value = formData[field];

      if (value === "") {
        newErrors[field] = "This field is required.";
        return;
      }

      if (!Number.isFinite(Number(value))) {
        newErrors[field] = "Please enter a valid number.";
      }
    });

    if (formData.nitrogen !== "" && Number(formData.nitrogen) < 0) {
      newErrors.nitrogen = "Value cannot be negative.";
    }

    if (formData.phosphorus !== "" && Number(formData.phosphorus) < 0) {
      newErrors.phosphorus = "Value cannot be negative.";
    }

    if (formData.potassium !== "" && Number(formData.potassium) < 0) {
      newErrors.potassium = "Value cannot be negative.";
    }

    if (
      formData.temperature !== "" &&
      (Number(formData.temperature) < -50 || Number(formData.temperature) > 70)
    ) {
      newErrors.temperature = "Please enter a realistic temperature.";
    }

    if (
      formData.humidity !== "" &&
      (Number(formData.humidity) < 0 || Number(formData.humidity) > 100)
    ) {
      newErrors.humidity = "Humidity must be between 0 and 100.";
    }

    if (
      formData.ph !== "" &&
      (Number(formData.ph) < 0 || Number(formData.ph) > 14)
    ) {
      newErrors.ph = "pH must be between 0 and 14.";
    }

    if (formData.rainfall !== "" && Number(formData.rainfall) < 0) {
      newErrors.rainfall = "Value cannot be negative.";
    }

    return newErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setErrors({});
    setResult(null);

    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!currentUser) {
      setErrors({
        form: "You must be logged in to get a recommendation.",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const inputData = {
        nitrogen: Number(formData.nitrogen),
        phosphorus: Number(formData.phosphorus),
        potassium: Number(formData.potassium),
        temperature: Number(formData.temperature),
        humidity: Number(formData.humidity),
        ph: Number(formData.ph),
        rainfall: Number(formData.rainfall),
      };

      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          N: inputData.nitrogen,
          P: inputData.phosphorus,
          K: inputData.potassium,
          temperature: inputData.temperature,
          humidity: inputData.humidity,
          ph: inputData.ph,
          rainfall: inputData.rainfall,
        }),
      });

      if (!response.ok) {
        let errorMessage = "The prediction server returned an error.";

        try {
          const errorData = await response.json();

          if (errorData.detail) {
            errorMessage = errorData.detail;
          }
        } catch {
          // Ignore response parsing errors.
        }

        throw new Error(errorMessage);
      }

      const prediction = await response.json();

      if (!prediction.recommended_crop) {
        throw new Error("The prediction server returned an invalid response.");
      }

      await addDoc(collection(db, "cropRecommendations"), {
        userId: currentUser.uid,
        inputData,
        recommendation: prediction.recommended_crop,
        confidence: prediction.confidence ?? null,
        topPredictions: prediction.top_predictions ?? [],
        status: "success",
        createdAt: serverTimestamp(),
      });

      await createNotification(
        currentUser.uid,
        "Crop Recommendation Ready",
        `Recommended crop: ${prediction.recommended_crop}`,
        "crop_recommendation",
      );

      setResult({
        crop: prediction.recommended_crop,
        confidence: prediction.confidence ?? 0,
        topPredictions: prediction.top_predictions ?? [],
      });
    } catch (error) {
      console.error("Crop recommendation failed:", error);

      setErrors({
        form:
          error.message ||
          "Unable to get a crop recommendation. Please make sure the prediction server is running.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    setFormData(initialFormData);
    setErrors({});
    setResult(null);
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

        <h1>Crop Recommendation</h1>

        <p>
          Enter your soil and environmental information to get a suitable crop
          recommendation.
        </p>
      </div>

      <form className="feature-form" onSubmit={handleSubmit} noValidate>
        {errors.form && <div className="error-message">{errors.form}</div>}

        <div className="form-section">
          <h2>Soil Parameters</h2>

          <div className="feature-form-grid">
            <div className="form-group">
              <label htmlFor="nitrogen">Nitrogen (N)</label>

              <input
                id="nitrogen"
                name="nitrogen"
                type="number"
                min="0"
                step="any"
                placeholder="Enter nitrogen value"
                value={formData.nitrogen}
                onChange={handleChange}
              />

              {errors.nitrogen && (
                <p className="field-error">{errors.nitrogen}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="phosphorus">Phosphorus (P)</label>

              <input
                id="phosphorus"
                name="phosphorus"
                type="number"
                min="0"
                step="any"
                placeholder="Enter phosphorus value"
                value={formData.phosphorus}
                onChange={handleChange}
              />

              {errors.phosphorus && (
                <p className="field-error">{errors.phosphorus}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="potassium">Potassium (K)</label>

              <input
                id="potassium"
                name="potassium"
                type="number"
                min="0"
                step="any"
                placeholder="Enter potassium value"
                value={formData.potassium}
                onChange={handleChange}
              />

              {errors.potassium && (
                <p className="field-error">{errors.potassium}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="ph">Soil pH</label>

              <input
                id="ph"
                name="ph"
                type="number"
                min="0"
                max="14"
                step="0.1"
                placeholder="Enter soil pH"
                value={formData.ph}
                onChange={handleChange}
              />

              {errors.ph && <p className="field-error">{errors.ph}</p>}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Environmental Parameters</h2>

          <div className="feature-form-grid">
            <div className="form-group">
              <label htmlFor="temperature">Temperature</label>

              <input
                id="temperature"
                name="temperature"
                type="number"
                step="any"
                placeholder="Enter temperature"
                value={formData.temperature}
                onChange={handleChange}
              />

              {errors.temperature && (
                <p className="field-error">{errors.temperature}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="humidity">Humidity</label>

              <input
                id="humidity"
                name="humidity"
                type="number"
                min="0"
                max="100"
                step="any"
                placeholder="Enter humidity percentage"
                value={formData.humidity}
                onChange={handleChange}
              />

              {errors.humidity && (
                <p className="field-error">{errors.humidity}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="rainfall">Rainfall</label>

              <input
                id="rainfall"
                name="rainfall"
                type="number"
                min="0"
                step="any"
                placeholder="Enter rainfall value"
                value={formData.rainfall}
                onChange={handleChange}
              />

              {errors.rainfall && (
                <p className="field-error">{errors.rainfall}</p>
              )}
            </div>
          </div>
        </div>

        <div className="feature-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={handleReset}
            disabled={isSubmitting}
          >
            Clear
          </button>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Getting Recommendation..." : "Get Recommendation"}
          </button>
        </div>
      </form>

      {result && (
        <div className="recommendation-result">
          <p className="result-label">Recommendation Result</p>

          <h2>{result.crop}</h2>

          <p className="confidence-value">
            Confidence: {(result.confidence * 100).toFixed(1)}%
          </p>

          <div className="top-predictions">
            <h3>Top Recommendations</h3>

            {result.topPredictions.map((prediction, index) => (
              <div
                className="prediction-row"
                key={`${prediction.crop}-${index}`}
              >
                <span>
                  {index + 1}. {prediction.crop}
                </span>

                <strong>{(prediction.confidence * 100).toFixed(1)}%</strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CropRecommendation;
