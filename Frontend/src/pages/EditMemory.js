
import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import API from "../api/api";
import "../styles/EditMemory.css";

const SERVER_URL = "http://localhost:5000";

function getFileUrl(file) {
  const path =
    typeof file === "string"
      ? file
      : file?.path || file?.url || file?.filename || "";

  if (!path) return "";

  if (path.startsWith("data:") || path.startsWith("blob:")) {
    return path;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const cleanPath = path.replace(/\\/g, "/");

  return `${SERVER_URL}${
    cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`
  }`;
}

function getFileName(file) {
  const path =
    typeof file === "string"
      ? file
      : file?.originalname ||
        file?.filename ||
        file?.path ||
        file?.url ||
        "Attachment";

  return String(path).split(/[\\/]/).pop();
}

function EditMemory() {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Support both /editmemory/:id and older state-based navigation.
  const id = routeId || location.state?.memory?._id;

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Photo",
    date: "",
    notes: "",
  });

  const [existingFiles, setExistingFiles] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadMemory = async () => {
      if (!id) {
        setError("Memory ID is missing. Please return to My Memories and try again.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await API.get(`/memories/${id}`);

        const memory =
          response.data?.memory ||
          response.data?.data ||
          response.data;

        if (!memory || !active) return;

        setForm({
          title: memory.title || "",
          description: memory.description || "",
          category: memory.category || "Photo",
          date: memory.date
            ? new Date(memory.date).toISOString().slice(0, 10)
            : "",
          notes: memory.notes || "",
        });

        // Keep all existing attachments.
        let savedFiles = Array.isArray(memory.files)
          ? memory.files
          : [];

        // Support older records with a single file.
        if (savedFiles.length === 0 && memory.file) {
          savedFiles = [memory.file];
        }

        setExistingFiles(savedFiles);
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Unable to load memory. Please try again."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadMemory();

    return () => {
      active = false;
    };
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Add new files without replacing existing files.
  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);

    setNewFiles((previous) => [...previous, ...selected]);

    // Allow selecting the same file again.
    e.target.value = "";
  };

  // Remove only a newly selected file before saving.
  const removeNewFile = (indexToRemove) => {
    setNewFiles((previous) =>
      previous.filter((_, index) => index !== indexToRemove)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!id) {
      setError("Memory ID is missing. Please return to My Memories.");
      return;
    }

    if (!form.title.trim()) {
      setError("Please enter a memory title.");
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();

      formData.append("title", form.title.trim());
      formData.append("description", form.description);
      formData.append("category", form.category);
      formData.append("date", form.date);
      formData.append("notes", form.notes);

      // Send only newly selected files.
      // The backend appends these to the existing attachments.
      newFiles.forEach((file) => {
        formData.append("files", file);
      });

      await API.put(`/memories/${id}`, formData);

      alert("Memory updated successfully!");

      navigate("/mymemories");
    } catch (err) {
      console.error("UPDATE MEMORY ERROR:", err);

      setError(
        err.response?.data?.message ||
          "Failed to update memory. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="edit-memory-page">
        Loading memory...
      </div>
    );
  }

  return (
    <div className="edit-memory-page">
      <div className="edit-memory-card">
        <h2>Edit Memory</h2>

        <p className="edit-memory-subtitle">
          Update your memory or add more attachments.
          Your existing photos and files will be preserved.
        </p>

        {error && (
          <div className="edit-memory-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label htmlFor="title">Memory Title</label>
          <input
            id="title"
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
          />

          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
          />

          <label htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
            value={form.category}
            onChange={handleChange}
          >
            <option value="Photo">Photo</option>
            <option value="Video">Video</option>
            <option value="Document">Document</option>
            <option value="Note">Note</option>
          </select>

          <label htmlFor="date">Memory Date</label>
          <input
            id="date"
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
          />

          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={3}
          />

          <div className="edit-attachments">
            <h3>Existing Attachments ({existingFiles.length})</h3>

            {existingFiles.length === 0 ? (
              <p>No existing attachments.</p>
            ) : (
              <div className="edit-attachment-list">
                {existingFiles.map((file, index) => {
                  const url = getFileUrl(file);
                  const name = getFileName(file);

                  const isImage =
                    /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(name);

                  const isVideo =
                    /\.(mp4|webm|ogg|mov|m4v)$/i.test(name);

                  return (
                    <div
                      className="edit-attachment-item"
                      key={`${url}-${index}`}
                    >
                      {isImage ? (
                        <img src={url} alt={name} />
                      ) : isVideo ? (
                        <video src={url} controls />
                      ) : (
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {name}
                        </a>
                      )}

                      <span>{name}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="edit-attachments">
            <h3>Add More Photos, Videos or Documents</h3>

            <input
              type="file"
              accept="image/*,video/*,.pdf,.doc,.docx,.txt"
              multiple
              onChange={handleFileChange}
              disabled={saving}
            />

            {newFiles.length > 0 && (
              <div className="new-files-list">
                <h4>New Files ({newFiles.length})</h4>

                {newFiles.map((file, index) => (
                  <div
                    className="new-file-row"
                    key={`${file.name}-${file.size}-${index}`}
                  >
                    <span>
                      {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </span>

                    <button
                      type="button"
                      className="remove-new-file"
                      onClick={() => removeNewFile(index)}
                      disabled={saving}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="edit-memory-actions">
            <button
              type="button"
              className="edit-cancel-btn"
              onClick={() => navigate("/mymemories")}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="edit-save-btn"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditMemory;
