
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/MyMemories.css";

const API_URL = "http://localhost:5000";

function MyMemories() {
  const navigate = useNavigate();

  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Get uploaded media URL
  const getMediaUrl = (path) => {
    if (!path) return "";

    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }

    return `${API_URL}/${path.replace(/\\/g, "/").replace(/^\/+/, "")}`;
  };

  // Get the first uploaded file (supports old and new records)
  const getFirstFile = (memory) => {
    if (Array.isArray(memory.files) && memory.files.length > 0) {
      return memory.files[0];
    }

    return memory.file || "";
  };

  // Load memories
  const fetchMemories = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/api/memories`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error(
          "Unable to load memories. Please log in again if needed."
        );
      }

      const data = await response.json();

      const memoryList = Array.isArray(data)
        ? data
        : Array.isArray(data.memories)
        ? data.memories
        : [];

      setMemories(memoryList);
    } catch (err) {
      console.error("FETCH MEMORIES ERROR:", err);
      setError(err.message || "Something went wrong while loading memories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  // Delete the entire memory
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this entire memory and all its attachments?"
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/api/memories/${id}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete memory.");
      }

      setMemories((previousMemories) =>
        previousMemories.filter((memory) => memory._id !== id)
      );

      alert("Memory deleted successfully!");
    } catch (err) {
      console.error("DELETE MEMORY ERROR:", err);
      alert(err.message || "Could not delete memory.");
    }
  };

  // Loading screen
  if (loading) {
    return (
      <div className="my-memories-page">
        <h2>My Memories</h2>
        <p className="memory-message">Loading memories...</p>
      </div>
    );
  }

  return (
    <div className="my-memories-page">
      <h2>My Memories</h2>

      {error && <p className="memory-error">{error}</p>}

      {!error && memories.length === 0 && (
        <div className="empty-memories">
          <p>No memories found.</p>

          <button
            className="memory-btn"
            onClick={() => navigate("/addmemory")}
          >
            Add Memory
          </button>
        </div>
      )}

      <div className="memories-container">
        {memories.map((memory) => {
          const firstFile = getFirstFile(memory);
          const mediaUrl = getMediaUrl(firstFile);
          const category = (memory.category || "").toLowerCase();

          const isVideo =
            category === "video" ||
            /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(firstFile);

          const isPhoto =
            category === "photo" ||
            /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(
              firstFile
            );

          return (
            <div className="memory-card" key={memory._id}>
              {/* Photo or video preview */}
              {mediaUrl && isVideo && (
                <video
                  className="memory-card-media"
                  src={mediaUrl}
                  controls
                  preload="metadata"
                >
                  Your browser does not support video playback.
                </video>
              )}

              {mediaUrl && isPhoto && (
                <img
                  className="memory-card-media"
                  src={mediaUrl}
                  alt={memory.title || "Memory"}
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              )}

              {!mediaUrl && (
                <div className="memory-no-media">
                  {category === "note"
                    ? "📝 Note"
                    : category === "document"
                    ? "📄 Document"
                    : "No media uploaded"}
                </div>
              )}

              {/* Memory details */}
              <h3>{memory.title || "Untitled Memory"}</h3>

              {memory.description && (
                <p className="memory-description">
                  {memory.description}
                </p>
              )}

              <p>
                <strong>Category:</strong>{" "}
                {memory.category || "Not specified"}
              </p>

              <p>
                <strong>Date:</strong>{" "}
                {memory.date
                  ? new Date(memory.date).toLocaleDateString()
                  : "Not specified"}
              </p>

              {/* Action buttons */}
              <div className="memory-actions">
                <button
                  className="memory-btn"
                  onClick={() =>
                    navigate("/viewmemory", {
                      state: { memory },
                    })
                  }
                >
                  View
                </button>

                <button
                  className="memory-btn"
                  onClick={() =>
                    navigate(`/editmemory/${memory._id}`, {
                      state: { memory },
                    })
                  }
                >
                  Edit
                </button>

                <button
                  className="memory-btn delete-btn"
                  onClick={() => handleDelete(memory._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button
        className="dashboard-btn"
        onClick={() => navigate("/dashboard")}
      >
        Back to Dashboard
      </button>
    </div>
  );
}

export default MyMemories;
