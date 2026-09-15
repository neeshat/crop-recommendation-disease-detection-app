# Crop Recommendation & Disease Detection Application

A full-stack web application for crop recommendation and plant disease detection. It combines a machine-learning-based crop recommendation system, image-based plant disease detection, Firebase authentication and data storage, and an agricultural expert verification workflow.

## Live Application

- **Frontend:** https://cradd.netlify.app
- **Backend API:** https://cradd-backend.onrender.com
- **Swagger API Docs:** https://cradd-backend.onrender.com/docs
- **Admin Expert Applications:** https://cradd.netlify.app/admin/expert-applications
- **GitHub:** https://github.com/neeshat/crop-recommendation-disease-detection-app

## Features

### Crop Recommendation

Users provide:

- Nitrogen (N)
- Phosphorus (P)
- Potassium (K)
- Temperature
- Humidity
- pH
- Rainfall

A trained **Random Forest classifier** predicts a suitable crop.

**Model Performance**

- Accuracy: **99.32%**
- Precision: **99.35%**
- Recall: **99.32%**
- F1 Score: **99.32%**

### Plant Disease Detection

Users upload a plant leaf image. The FastAPI backend sends the image to the **Pl@ntNet API** for disease identification and returns the predicted disease, confidence, and top results.

### Authentication

Firebase Authentication supports:

- Farmer accounts
- Agricultural Expert accounts
- Email verification
- Protected application access

### Agricultural Expert Verification

Expert accounts require approval before expert features can be used.

**Workflow**

1. Register as an Agricultural Expert
2. Verify email
3. Submit expert verification information
4. Admin reviews the application
5. Admin approves or rejects the application
6. Approved experts can manage expert information

### Admin

Admins can:

- View expert applications
- Review expert information
- Approve applications
- Reject applications

### History & Notifications

Prediction results and notifications are stored in Firestore. Users can view:

- Crop recommendation history
- Disease detection history
- Notifications
- Prediction details

### Agricultural Information

Approved experts can add, edit, and delete expert-created crop and disease information. Other users can view the available information.

## System Architecture

```text
                         ┌──────────────┐
                         │     User     │
                         └──────┬───────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │   React Frontend      │
                    │       Netlify         │
                    └──────────┬────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
       Firebase Auth      Firestore      FastAPI Backend
                                               Render
                                                 │
                                  ┌──────────────┴──────────────┐
                                  │                             │
                                  ▼                             ▼
                           Random Forest                  Pl@ntNet API
                         Crop Recommendation            Disease Detection
```
