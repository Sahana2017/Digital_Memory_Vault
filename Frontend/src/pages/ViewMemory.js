
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import API from "../api/api";
import "../styles/ViewMemory.css";

const API_URL = "http://localhost:5000";

function ViewMemory() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();

  const [memory, setMemory] = useState(location.state?.memory || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deletingFile, setDeletingFile] = useState("");

  const memoryId = id || location.state?.memory?._id;

  const fetchMemory = async () => {
    try {
      setLoading(true);
      setError("");

      if (!memoryId) {
        setError("Memory ID not found. Please open a memory from My Memories.");
        return;
      }

      const response = await API.get(`/memories/${memoryId}`);

      setMemory(response.data.memory || response.data);
    } catch (err) {
      console.error("FETCH MEMORY ERROR:", err);

      setError(
        err.response?.data?.message ||
        "Unable to load the latest memory."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemory();
  }, [memoryId]);

  const getMediaUrl = (filePath) => {
    if (!filePath) return "";

    if (
      filePath.startsWith("http://") ||
      filePath.startsWith("https://")
    ) {
      return filePath;
    }

    return `${API_URL}/${filePath
      .replace(/\\/g, "/")
      .replace(/^\/+/, "")}`;
  };

  const getFileName = (filePath) => {
    return filePath.split("/").pop();
  };

  const getFileExtension = (filePath) => {
    return filePath
      .split("?")[0]
      .split(".")
      .pop()
      .toLowerCase();
  };

  const handleDeleteFile = async (filePath) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this attachment? This cannot be undone."
    );

    if (!confirmed) return;

    try {
      setDeletingFile(filePath);
      setError("");
      setSuccess("");

      const response = await API.delete(
        `/memories/${memoryId}/files`,
        {
          data: {
            filePath: filePath,
          },
        }
      );

      setMemory(response.data.memory);

      setSuccess("Attachment deleted successfully!");
    } catch (err) {
      console.error("DELETE ATTACHMENT ERROR:", err);

      setError(
        err.response?.data?.message ||
        "Unable to delete this attachment."
      );
    } finally {
      setDeletingFile("");
    }
  };

  if (loading) {
    return (
      <div className="view-memory-page">
        <div className="view-memory-card">
          <p>Loading memory...</p>
        </div>
      </div>
    );
  }

  if (error && !memory) {
    return (
      <div className="view-memory-page">
        <div className="view-memory-card">
          <h2>Memory Not Found</h2>
          <p>{error}</p>

          <button
            className="view-memory-back"
            onClick={() => navigate("/mymemories")}
          >
            Back to Memories
          </button>
        </div>
      </div>
    );
  }

  if (!memory) return null;

  const files =
    Array.isArray(memory.files) && memory.files.length > 0
      ? memory.files
      : memory.file
      ? [memory.file]
      : [];

  return (
    <div className="view-memory-page">
      <div className="view-memory-card">

        <h2>{memory.title || "Untitled Memory"}</h2>

        {success && (
          <p className="attachment-success">
            {success}
          </p>
        )}

        {error && (
          <p className="attachment-error">
            {error}
          </p>
        )}

        {files.length > 0 ? (
          <div className="view-memory-files">
            {files.map((file, index) => {
              const url = getMediaUrl(file);
              const extension = getFileExtension(file);

              const isVideo = [
                "mp4",
                "webm",
                "ogg",
                "mov",
                "m4v",
              ].includes(extension);

              const isImage = [
                "jpg",
                "jpeg",
                "png",
                "gif",
                "webp",
                "bmp",
                "svg",
              ].includes(extension);

              return (
                <div
                  className="view-memory-file-item"
                  key={`${file}-${index}`}
                >

                  {isVideo ? (
                    <video
                      className="view-memory-media"
                      src={url}
                      controls
                      preload="metadata"
                    >
                      Your browser does not support video playback.
                    </video>
                  ) : isImage ? (
                    <img
                      className="view-memory-media"
                      src={url}
                      alt={memory.title || "Memory"}
                    />
                  ) : (
                    <div className="view-memory-document">
                      <p>
                        <strong>Document {index + 1}</strong>
                      </p>

                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open {getFileName(file)}
                      </a>
                    </div>
                  )}

                  <button
                    type="button"
                    className="delete-attachment-btn"
                    onClick={() => handleDeleteFile(file)}
                    disabled={deletingFile === file}
                  >
                    {deletingFile === file
                      ? "Deleting..."
                      : "Delete This Attachment"}
                  </button>

                </div>
              );
            })}
          </div>
        ) : (
          <p className="no-attachments">
            No attachments available for this memory.
          </p>
        )}

        <div className="view-memory-details">
          <p>
            <strong>Description:</strong>{" "}
            {memory.description || "No description"}
          </p>

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

          {memory.notes && (
            <p>
              <strong>Notes:</strong>{" "}
              {memory.notes}
            </p>
          )}
        </div>

        <button
          className="view-memory-back"
          onClick={() => navigate("/mymemories")}
        >
          Back to Memories
        </button>

      </div>
    </div>
  );
}

export default ViewMemory;
