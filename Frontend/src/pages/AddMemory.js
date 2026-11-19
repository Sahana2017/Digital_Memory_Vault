import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import "../styles/AddMemory.css";

function AddMemory() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Photo");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const [files, setFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Select multiple photos/videos or one document
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);

    setFiles(selectedFiles);
    setError("");

    // Allow selecting the same files again later
    e.target.value = "";
  };

  // Generate and clean up image previews
  useEffect(() => {
    const previews = files
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
      }));

    setFilePreviews(previews);

    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [files]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login first to add a memory.");
      navigate("/login");
      return;
    }

    if (category !== "Note" && files.length === 0) {
      setError("Please select at least one file.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      formData.append("title", title);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("date", date);

      // Send every selected file using the same field name
      files.forEach((file) => {
        formData.append("files", file);
      });

      await API.post("/memories", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("Memory saved successfully!");
      navigate("/mymemories");
    } catch (err) {
      const msg =
        err.response?.data?.message || "Failed to save memory";

      setError(msg);
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-memory">
      <h2>Add Memory</h2>

      {error && (
        <div
          style={{
            color: "#e11d48",
            textAlign: "center",
            marginBottom: "15px",
            fontWeight: "500",
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <label>Memory Title</label>
        <input
          type="text"
          placeholder="Enter memory title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <label>
          {category === "Note" ? "Write Your Note" : "Description"}
        </label>
        <textarea
          placeholder={
            category === "Note"
              ? "Write your note here..."
              : "Write about your memory"
          }
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        <label>Category</label>
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setFiles([]);
            setFilePreviews([]);
            setError("");
          }}
        >
          <option value="Photo">Photo</option>
          <option value="Video">Video</option>
          <option value="Document">Document</option>
          <option value="Note">Note</option>
        </select>

        <label>Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        {category !== "Note" && (
          <>
            <label>
              {category === "Photo" && "Upload Photos"}
              {category === "Video" && "Upload Videos"}
              {category === "Document" && "Upload Document"}
            </label>

            <input
              type="file"
              accept={
                category === "Photo"
                  ? "image/*"
                  : category === "Video"
                  ? "video/*"
                  : ".pdf,.doc,.docx,.txt"
              }
              multiple={category === "Photo" || category === "Video"}
              onChange={handleFileChange}
            />

            {files.length > 0 && (
              <div
                style={{
                  marginTop: "10px",
                  textAlign: "center",
                  fontWeight: "500",
                }}
              >
                <p>{files.length} file(s) selected</p>

                {files.map((file, index) => (
                  <p key={`${file.name}-${index}`}>
                    {index + 1}. {file.name}
                  </p>
                ))}
              </div>
            )}

            {category === "Photo" && filePreviews.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: "10px",
                  margin: "15px 0",
                }}
              >
                {filePreviews.map((preview, index) => (
                  <img
                    key={`${preview.name}-${index}`}
                    src={preview.url}
                    alt={preview.name}
                    style={{
                      width: "110px",
                      height: "120px",
                      borderRadius: "10px",
                      objectFit: "cover",
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {category === "Note" && (
          <p
            style={{
              textAlign: "center",
              marginTop: "10px",
              color: "#666",
            }}
          >
            Your note will be saved as a memory.
          </p>
        )}

        <div className="buttons">
          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddMemory;
