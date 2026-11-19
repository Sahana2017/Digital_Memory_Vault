import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import API from "../api/api";
import "../styles/Login.css";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await API.post("/auth/login", { email, password });
      if (res.data && res.data.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        navigate("/dashboard");
      } else {
        setError("Login succeeded but no token received");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loginPage">
      <div className="loginCard">
        <h1>Welcome</h1>
        <p>Sign In to access your Digital Memory Vault</p>

        {error && (
          <div style={{ color: "#e11d48", textAlign: "center", marginBottom: "15px", fontWeight: "500" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="inputBox">
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="inputBox">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Link to="/forgot-password" className="forgot-link">
            Forgot Password?
          </Link>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="links">
          <div className="google-btn-container">
            <GoogleLogin
              shape="pill"
              theme="outline"
              size="large"
              width="100%"
              text="signin_with"
              onSuccess={async (credentialResponse) => {
                setError("");
                setLoading(true);
                try {
                  const res = await API.post("/auth/google", {
                    token: credentialResponse.credential,
                  });
                  if (res.data && res.data.token) {
                    localStorage.setItem("token", res.data.token);
                    localStorage.setItem("user", JSON.stringify(res.data.user));
                    navigate("/dashboard");
                  } else {
                    setError("Google Sign-In succeeded but no token was returned");
                  }
                } catch (err) {
                  setError(err.response?.data?.message || "Google Sign-In failed");
                } finally {
                  setLoading(false);
                }
              }}
              onError={() => {
                setError("Google Sign-In was cancelled or failed");
              }}
            />
          </div>

          <p>
            Don't have an account?
            <Link to="/register">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;