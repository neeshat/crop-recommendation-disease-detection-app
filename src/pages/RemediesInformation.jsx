import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";

const informationData = [
  {
    id: "phytin",
    type: "Disease",
    code: "PHYTIN",
    name: "Phytophthora infestans",
    displayName: "Late Blight",
    crop: "Tomato / Potato",
    description:
      "Late blight is a plant disease caused by Phytophthora infestans and can affect tomato and potato plants.",
    symptoms: [
      "Dark or water-soaked lesions may appear on leaves.",
      "Affected areas may become brown and expand quickly.",
      "Fruit or tubers can also develop dark lesions.",
    ],
    prevention: [
      "Improve airflow around plants.",
      "Avoid unnecessary moisture on foliage.",
      "Remove infected plant material promptly.",
    ],
    remedies: [
      "Remove severely affected plant parts.",
      "Keep foliage as dry as practical.",
      "Follow locally recommended disease-management practices.",
    ],
  },
  {
    id: "altetp",
    type: "Disease",
    code: "ALTETP",
    name: "Alternaria linariae",
    displayName: "Early Blight of Tomato",
    crop: "Tomato",
    description:
      "Alternaria linariae is associated with early blight and target spot symptoms in tomato.",
    symptoms: [
      "Dark lesions may develop on leaves.",
      "Affected areas may gradually enlarge.",
      "Older leaves can be affected first.",
    ],
    prevention: [
      "Maintain good field sanitation.",
      "Avoid prolonged leaf wetness.",
      "Provide adequate spacing and airflow.",
    ],
    remedies: [
      "Remove severely affected plant material.",
      "Avoid unnecessary overhead irrigation.",
      "Follow locally recommended disease-management practices.",
    ],
  },
  {
    id: "fulvfu",
    type: "Disease",
    code: "FULVFU",
    name: "Fulvia fulva",
    displayName: "Leaf Mould of Tomato",
    crop: "Tomato",
    description:
      "Fulvia fulva is the causal organism associated with leaf mould of tomato.",
    symptoms: [
      "Leaf symptoms may develop on tomato foliage.",
      "Affected areas can become discolored.",
      "Severe infection may reduce healthy leaf area.",
    ],
    prevention: [
      "Improve airflow between plants.",
      "Avoid excessive humidity around foliage.",
      "Remove affected leaves and plant debris.",
    ],
    remedies: [
      "Remove severely affected leaves.",
      "Reduce prolonged leaf moisture.",
      "Follow locally recommended disease-management practices.",
    ],
  },
  {
    id: "tomato-early-blight",
    type: "Disease",
    code: "TOMATO_EARLY_BLIGHT",
    name: "Alternaria Early Blight",
    displayName: "Tomato Early Blight",
    crop: "Tomato",
    description:
      "A common tomato disease that can affect foliage and other plant parts.",
    symptoms: [
      "Dark spots may appear on older leaves.",
      "Leaves may develop yellowing around affected areas.",
      "Severely affected leaves may dry and fall.",
    ],
    prevention: [
      "Maintain good field sanitation.",
      "Avoid prolonged leaf wetness.",
      "Provide adequate spacing and airflow between plants.",
    ],
    remedies: [
      "Remove severely affected plant material.",
      "Avoid unnecessary overhead irrigation.",
      "Use locally recommended disease-management practices.",
    ],
  },
  {
    id: "tomato-late-blight",
    type: "Disease",
    code: "TOMATO_LATE_BLIGHT",
    name: "Phytophthora infestans",
    displayName: "Tomato Late Blight",
    crop: "Tomato",
    description:
      "A serious tomato disease associated with Phytophthora infestans.",
    symptoms: [
      "Dark, water-soaked lesions may develop on leaves.",
      "Affected leaves may become brown and collapse.",
      "Fruit may develop dark lesions.",
    ],
    prevention: [
      "Improve airflow around plants.",
      "Avoid unnecessary moisture on foliage.",
      "Remove infected plant material promptly.",
    ],
    remedies: [
      "Remove heavily infected plant parts.",
      "Keep foliage as dry as practical.",
      "Follow locally recommended disease-management practices.",
    ],
  },
  {
    id: "potato-early-blight",
    type: "Disease",
    code: "POTATO_EARLY_BLIGHT",
    name: "Alternaria Early Blight",
    displayName: "Potato Early Blight",
    crop: "Potato",
    description:
      "A fungal disease that commonly affects potato foliage.",
    symptoms: [
      "Brown lesions may develop on older leaves.",
      "Affected areas can form concentric ring patterns.",
      "Severe infection may lead to leaf loss.",
    ],
    prevention: [
      "Maintain proper plant nutrition.",
      "Remove diseased plant debris.",
      "Maintain good airflow around plants.",
    ],
    remedies: [
      "Remove severely affected leaves.",
      "Avoid prolonged leaf wetness.",
      "Use locally recommended disease-management practices.",
    ],
  },
];

const cropData = [
  {
    id: "tomato",
    type: "Crop",
    code: "TOMATO",
    name: "Tomato",
    description:
      "Tomato is an important vegetable crop that requires suitable soil, temperature, moisture, and disease management.",
    information: [
      "Monitor plant health regularly.",
      "Maintain appropriate spacing between plants.",
      "Inspect leaves regularly for early disease symptoms.",
    ],
  },
  {
    id: "potato",
    type: "Crop",
    code: "POTATO",
    name: "Potato",
    description:
      "Potato is a major food crop that benefits from proper soil management and regular crop monitoring.",
    information: [
      "Maintain appropriate soil moisture.",
      "Monitor foliage for disease symptoms.",
      "Use proper field sanitation practices.",
    ],
  },
];

const emptyExpertForm = {
  type: "Disease",
  code: "",
  name: "",
  displayName: "",
  crop: "",
  description: "",
  symptoms: "",
  prevention: "",
  remedies: "",
};

function RemediesInformation() {
  const navigate = useNavigate();

  const [searchParams] =
    useSearchParams();

  const { currentUser, userProfile } =
    useAuth();

  const diseaseParam =
    searchParams.get("disease");

  const [
    firestoreItems,
    setFirestoreItems,
  ] = useState([]);

  const [activeTab, setActiveTab] =
    useState("all");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [selectedItem, setSelectedItem] =
    useState(null);

  const [showExpertForm, setShowExpertForm] =
    useState(false);

  const [editingItem, setEditingItem] =
    useState(null);

  const [expertForm, setExpertForm] =
    useState(emptyExpertForm);

  const [formError, setFormError] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const isApprovedExpert =
    userProfile?.role ===
      "agricultural-expert" &&
    userProfile?.expertStatus ===
      "approved";

  async function loadFirestoreItems() {
    try {
      const snapshot = await getDocs(
        collection(
          db,
          "expertInformation"
        )
      );

      const items = snapshot.docs.map(
        (document) => ({
          id: document.id,
          ...document.data(),
          source: "expert",
        })
      );

      setFirestoreItems(items);
    } catch (error) {
      console.error(
        "Failed to load expert information:",
        error
      );
    }
  }

  useEffect(() => {
    loadFirestoreItems();
  }, []);

  const allItems = useMemo(
    () => [
      ...informationData,
      ...cropData,
      ...firestoreItems,
    ],
    [firestoreItems]
  );

  const normalizedDiseaseParam =
    diseaseParam
      ?.trim()
      .toLowerCase() || "";

  const filteredItems = useMemo(() => {
    const query =
      searchTerm.trim().toLowerCase();

    return allItems.filter((item) => {
      const matchesTab =
        activeTab === "all" ||
        (activeTab === "disease" &&
          item.type === "Disease") ||
        (activeTab === "crop" &&
          item.type === "Crop");

      const matchesSearch =
        !query ||
        item.name
          ?.toLowerCase()
          .includes(query) ||
        item.code
          ?.toLowerCase()
          .includes(query) ||
        item.displayName
          ?.toLowerCase()
          .includes(query) ||
        item.crop
          ?.toLowerCase()
          .includes(query);

      return (
        matchesTab &&
        matchesSearch
      );
    });
  }, [
    activeTab,
    searchTerm,
    allItems,
  ]);

  useEffect(() => {
    if (!normalizedDiseaseParam) {
      return;
    }

    const matchedItem =
      allItems.find((item) => {
        const values = [
          item.id,
          item.code,
          item.name,
          item.displayName,
        ]
          .filter(Boolean)
          .map((value) =>
            value.toLowerCase()
          );

        return values.includes(
          normalizedDiseaseParam
        );
      });

    if (matchedItem) {
      setSelectedItem(matchedItem);
      setActiveTab("disease");
    } else {
      setSearchTerm(diseaseParam);
      setActiveTab("disease");
      setSelectedItem(null);
    }
  }, [
    diseaseParam,
    allItems,
    normalizedDiseaseParam,
  ]);

  function handleSelectItem(item) {
    setSelectedItem(item);
  }

  function handleCloseDetails() {
    setSelectedItem(null);
  }

  function handleExpertFormChange(
    event
  ) {
    const {
      name,
      value,
    } = event.target;

    setExpertForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setFormError("");
  }

  function openAddForm() {
    setEditingItem(null);

    setExpertForm(
      emptyExpertForm
    );

    setFormError("");
    setShowExpertForm(true);
  }

  function openEditForm(item) {
    if (!item.source) {
      return;
    }

    setEditingItem(item);

    setExpertForm({
      type: item.type || "Disease",
      code: item.code || "",
      name: item.name || "",
      displayName:
        item.displayName || "",
      crop: item.crop || "",
      description:
        item.description || "",
      symptoms:
        item.symptoms?.join("\n") ||
        "",
      prevention:
        item.prevention?.join("\n") ||
        "",
      remedies:
        item.remedies?.join("\n") ||
        "",
    });

    setFormError("");
    setShowExpertForm(true);
  }

  function cancelExpertForm() {
    setShowExpertForm(false);
    setEditingItem(null);
    setExpertForm(
      emptyExpertForm
    );
    setFormError("");
  }

  async function handleExpertSubmit(
    event
  ) {
    event.preventDefault();

    if (!isApprovedExpert) {
      setFormError(
        "Only approved Agricultural Experts can manage information."
      );
      return;
    }

    if (
      !expertForm.code.trim() ||
      !expertForm.name.trim() ||
      !expertForm.displayName.trim() ||
      !expertForm.description.trim()
    ) {
      setFormError(
        "Please complete all required fields."
      );
      return;
    }

    try {
      setSaving(true);
      setFormError("");

      const payload = {
        type: expertForm.type,
        code: expertForm.code
          .trim()
          .toUpperCase(),
        name: expertForm.name.trim(),
        displayName:
          expertForm.displayName.trim(),
        crop: expertForm.crop.trim(),
        description:
          expertForm.description.trim(),
        symptoms: expertForm.symptoms
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
        prevention: expertForm.prevention
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
        remedies: expertForm.remedies
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
        createdBy: currentUser.uid,
        updatedAt: serverTimestamp(),
      };

      if (editingItem) {
        await updateDoc(
          doc(
            db,
            "expertInformation",
            editingItem.id
          ),
          payload
        );
      } else {
        await addDoc(
          collection(
            db,
            "expertInformation"
          ),
          {
            ...payload,
            createdAt:
              serverTimestamp(),
          }
        );
      }

      await loadFirestoreItems();

      cancelExpertForm();
    } catch (error) {
      console.error(
        "Failed to save expert information:",
        error
      );

      setFormError(
        "Unable to save information. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteItem(item) {
    if (!isApprovedExpert) {
      return;
    }

    if (!item.source) {
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this information?"
      );

    if (!confirmed) {
      return;
    }

    try {
      await deleteDoc(
        doc(
          db,
          "expertInformation",
          item.id
        )
      );

      if (
        selectedItem?.id === item.id
      ) {
        setSelectedItem(null);
      }

      await loadFirestoreItems();
    } catch (error) {
      console.error(
        "Failed to delete expert information:",
        error
      );

      setFormError(
        "Unable to delete information."
      );
    }
  }

  return (
    <div className="info-page">
      <div className="info-container">
        <button
          type="button"
          className="back-button"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          ← Back to Dashboard
        </button>

        <div className="feature-header info-header">
          <p className="feature-label">
            Agricultural Knowledge
          </p>

          <h1>
            Remedies & Information
          </h1>

          <p>
            Explore disease information,
            symptoms, preventive measures,
            remedies, and crop information.
          </p>
        </div>

        {isApprovedExpert && (
          <div className="feature-actions">
            <button
              type="button"
              onClick={openAddForm}
            >
              Add Information
            </button>
          </div>
        )}

        {diseaseParam && (
          <div className="info-linked-result">
            <strong>
              Detection result:
            </strong>{" "}
            {diseaseParam}

            <span>
              Information linked from the
              disease detection result.
            </span>
          </div>
        )}

        {showExpertForm && (
          <form
            className="feature-form"
            onSubmit={handleExpertSubmit}
            noValidate
          >
            <div className="form-section">
              <h2>
                {editingItem
                  ? "Edit Information"
                  : "Add Information"}
              </h2>

              {formError && (
                <div className="error-message">
                  {formError}
                </div>
              )}

              <div className="feature-form-grid">
                <div className="form-group">
                  <label htmlFor="type">
                    Type
                  </label>

                  <select
                    id="type"
                    name="type"
                    value={expertForm.type}
                    onChange={
                      handleExpertFormChange
                    }
                  >
                    <option value="Disease">
                      Disease
                    </option>

                    <option value="Crop">
                      Crop
                    </option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="code">
                    Code
                  </label>

                  <input
                    id="code"
                    name="code"
                    type="text"
                    placeholder="Example: NEW_DISEASE"
                    value={expertForm.code}
                    onChange={
                      handleExpertFormChange
                    }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="name">
                    Scientific / Base Name
                  </label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter name"
                    value={expertForm.name}
                    onChange={
                      handleExpertFormChange
                    }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="displayName">
                    Display Name
                  </label>

                  <input
                    id="displayName"
                    name="displayName"
                    type="text"
                    placeholder="Enter display name"
                    value={
                      expertForm.displayName
                    }
                    onChange={
                      handleExpertFormChange
                    }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="crop">
                    Crop
                  </label>

                  <input
                    id="crop"
                    name="crop"
                    type="text"
                    placeholder="Example: Tomato"
                    value={expertForm.crop}
                    onChange={
                      handleExpertFormChange
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">
                  Description
                </label>

                <textarea
                  id="description"
                  name="description"
                  rows="4"
                  placeholder="Enter a detailed description."
                  value={
                    expertForm.description
                  }
                  onChange={
                    handleExpertFormChange
                  }
                />
              </div>

              {expertForm.type ===
                "Disease" && (
                <>
                  <div className="form-group">
                    <label htmlFor="symptoms">
                      Symptoms
                    </label>

                    <textarea
                      id="symptoms"
                      name="symptoms"
                      rows="5"
                      placeholder="Enter one symptom per line."
                      value={
                        expertForm.symptoms
                      }
                      onChange={
                        handleExpertFormChange
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="prevention">
                      Preventive Measures
                    </label>

                    <textarea
                      id="prevention"
                      name="prevention"
                      rows="5"
                      placeholder="Enter one preventive measure per line."
                      value={
                        expertForm.prevention
                      }
                      onChange={
                        handleExpertFormChange
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="remedies">
                      Remedies
                    </label>

                    <textarea
                      id="remedies"
                      name="remedies"
                      rows="5"
                      placeholder="Enter one remedy per line."
                      value={
                        expertForm.remedies
                      }
                      onChange={
                        handleExpertFormChange
                      }
                    />
                  </div>
                </>
              )}

              <div className="feature-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    cancelExpertForm
                  }
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingItem
                    ? "Update Information"
                    : "Add Information"}
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="info-toolbar">
          <input
            type="search"
            placeholder="Search disease or crop..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
          />

          <div className="info-tabs">
            <button
              type="button"
              className={
                activeTab === "all"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveTab("all")
              }
            >
              All
            </button>

            <button
              type="button"
              className={
                activeTab === "disease"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveTab("disease")
              }
            >
              Diseases
            </button>

            <button
              type="button"
              className={
                activeTab === "crop"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveTab("crop")
              }
            >
              Crops
            </button>
          </div>
        </div>

        <div className="info-grid">
          {filteredItems.length === 0 ? (
            <div className="empty-state">
              <p>
                No detailed information is
                currently available.
              </p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                className="info-card"
                key={item.id}
              >
                <div className="info-card-top">
                  <span className="info-type">
                    {item.type}
                  </span>

                  {item.source && (
                    <span className="info-type">
                      Expert Added
                    </span>
                  )}
                </div>

                <h2>
                  {item.displayName ||
                    item.name}
                </h2>

                <p>
                  {item.description}
                </p>

                <div className="feature-actions">
                  <button
                    type="button"
                    onClick={() =>
                      handleSelectItem(
                        item
                      )
                    }
                  >
                    View Details
                  </button>

                  {isApprovedExpert &&
                    item.source && (
                      <>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() =>
                            openEditForm(
                              item
                            )
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() =>
                            handleDeleteItem(
                              item
                            )
                          }
                        >
                          Delete
                        </button>
                      </>
                    )}
                </div>
              </div>
            ))
          )}
        </div>

        {selectedItem && (
          <div className="info-details">
            <div className="info-details-header">
              <div>
                <span className="info-type">
                  {selectedItem.type}
                </span>

                <h2>
                  {selectedItem.displayName ||
                    selectedItem.name}
                </h2>

                {selectedItem.code && (
                  <p>
                    Code:{" "}
                    {selectedItem.code}
                  </p>
                )}

                {selectedItem.crop && (
                  <p>
                    Crop:{" "}
                    {selectedItem.crop}
                  </p>
                )}
              </div>

              <button
                type="button"
                className="close-details-button"
                onClick={
                  handleCloseDetails
                }
              >
                Close
              </button>
            </div>

            <p className="info-description">
              {selectedItem.description}
            </p>

            {selectedItem.type ===
            "Disease" ? (
              <div className="details-grid">
                <div className="detail-section">
                  <h3>
                    Symptoms
                  </h3>

                  <ul>
                    {(
                      selectedItem.symptoms ||
                      []
                    ).map(
                      (symptom) => (
                        <li
                          key={symptom}
                        >
                          {symptom}
                        </li>
                      )
                    )}
                  </ul>
                </div>

                <div className="detail-section">
                  <h3>
                    Preventive Measures
                  </h3>

                  <ul>
                    {(
                      selectedItem.prevention ||
                      []
                    ).map(
                      (item) => (
                        <li key={item}>
                          {item}
                        </li>
                      )
                    )}
                  </ul>
                </div>

                <div className="detail-section full-width">
                  <h3>
                    Remedies
                  </h3>

                  <ul>
                    {(
                      selectedItem.remedies ||
                      []
                    ).map(
                      (item) => (
                        <li key={item}>
                          {item}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="details-grid">
                <div className="detail-section full-width">
                  <h3>
                    Crop Information
                  </h3>

                  <ul>
                    {(
                      selectedItem.information ||
                      []
                    ).map(
                      (item) => (
                        <li key={item}>
                          {item}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default RemediesInformation;