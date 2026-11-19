import React from "react";
import "../styles/Profile.css";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

function Profile() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  return (
    <div className="profile-page">



      {/* Profile Card */}
      <div className="profile-card">

        <div className="profile-image-wrapper">
          <img
            src={logo}
            alt="Profile"
            className="profile-img"
          />
        </div>

        <h2>{user.name || "User Profile"}</h2>

        <div className="profile-info">
          <p>
            <strong>Email:</strong> {user.email || "Not specified"}
          </p>
        </div>

        <div className="profile-buttons">

          <Link to="/editprofile">
            <button className="edit-profile-btn">
              Edit Profile
            </button>
          </Link>

          <Link to="/changepassword">
            <button className="change-password-btn">
              Change Password
            </button>
          </Link>
          <Link to="/dashboard">
  <button className="cancel-profile-btn">
    Cancel
  </button>
</Link>

        </div>

      </div>

    </div>
  );
}

export default Profile;