import React, { useState, useEffect } from "react";
import "../styles/Dashboard.css";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/api";

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error(e);
    }

    API.get("/memories")
      .then((res) => {
        setMemories(res.data || []);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const photosCount = memories.filter(
    (m) => (m.category || "Photo").toLowerCase() === "photo"
  ).length;
  const notesCount = memories.filter(
    (m) => (m.category || "").toLowerCase() === "note"
  ).length;
  const docsCount = memories.filter(
    (m) => (m.category || "").toLowerCase() === "document"
  ).length;
  const videosCount = memories.filter(
    (m) => (m.category || "").toLowerCase() === "video"
  ).length;

  const recentMemories = memories.slice(0, 3);

  return (
    <div className="dashboard">

      {/* Sidebar */}
      <div className="sidebar">
        <h2>💜 Memory Vault</h2>

        <ul>
          <li onClick={() => navigate("/dashboard")} style={{ cursor: "pointer" }}>🏠 Dashboard</li>
          <li onClick={() => navigate("/mymemories")} style={{ cursor: "pointer" }}>📷 Photos ({photosCount})</li>
          <li onClick={() => navigate("/mymemories")} style={{ cursor: "pointer" }}>📝 Notes ({notesCount})</li>
          <li onClick={() => navigate("/mymemories")} style={{ cursor: "pointer" }}>📄 Documents ({docsCount})</li>
          <li onClick={() => navigate("/mymemories")} style={{ cursor: "pointer" }}>🎥 Videos ({videosCount})</li>
          <li onClick={() => navigate("/profile")} style={{ cursor: "pointer" }}>⚙️ Profile</li>
          <li onClick={handleLogout} style={{ cursor: "pointer" }}>🚪 Logout</li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="mainContent">

        <div className="header">
          <h1>Welcome Back, {user?.name || "Friend"} 👋</h1>
          <p>Your memories are safe and organized.</p>
          <Link to="/addmemory">
             <button className="add-btn">+ Add Memory</button>
        </Link>
        <Link to="/mymemories">
            <button className="memory-btn">My Memories</button>
        </Link>
        <Link to="/profile">
             <button className="profile-btn">Profile</button>
        </Link>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>

        {/* Cards */}
        <div className="cards">

          <div className="card" onClick={() => navigate("/mymemories")} style={{ cursor: "pointer" }}>
            <h2>📷 Photos</h2>
            <h3>{loading ? "..." : photosCount}</h3>
            <p>Total Photos</p>
          </div>

          <div className="card" onClick={() => navigate("/mymemories")} style={{ cursor: "pointer" }}>
            <h2>📝 Notes</h2>
            <h3>{loading ? "..." : notesCount}</h3>
            <p>Saved Notes</p>
          </div>

          <div className="card" onClick={() => navigate("/mymemories")} style={{ cursor: "pointer" }}>
            <h2>📄 Documents</h2>
            <h3>{loading ? "..." : docsCount}</h3>
            <p>Uploaded Files</p>
          </div>

          <div className="card" onClick={() => navigate("/mymemories")} style={{ cursor: "pointer" }}>
            <h2>🎥 Videos</h2>
            <h3>{loading ? "..." : videosCount}</h3>
            <p>Stored Videos</p>
          </div>

        </div>

        {/* Recent Memories */}
        <div className="recent">

          <h2>✨ Recent Memories</h2>

          {loading ? (
            <p style={{ color: "#666", padding: "10px" }}>Loading memories...</p>
          ) : recentMemories.length === 0 ? (
            <p style={{ color: "#666", padding: "10px" }}>
              No memories yet. Click "+ Add Memory" to create your first one!
            </p>
          ) : (
            recentMemories.map((m) => (
              <div
                className="memoryBox"
                key={m._id}
                style={{ cursor: "pointer" }}
                onClick={() => navigate("/viewmemory", { state: { memory: m } })}
              >
                <p>🌸 {m.title}</p>
                <span>{m.date ? new Date(m.date).toLocaleDateString() : "Recent"}</span>
              </div>
            ))
          )}

        </div>

      </div>

    </div>
  );
}

export default Dashboard;