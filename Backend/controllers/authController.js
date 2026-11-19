
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

// Remove password and reset-token fields from user responses
const getSafeUser = (user) => {
  const safeUser = user.toObject();

  delete safeUser.password;
  delete safeUser.passwordResetToken;
  delete safeUser.passwordResetExpires;

  return safeUser;
};

// Register User
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Please fill in all required fields",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const userExists = await User.findOne({
      email: normalizedEmail,
    });

    if (userExists) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "User registered successfully",
      user: getSafeUser(user),
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};

// Login User
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email: email?.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid Email or Password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid Email or Password",
      });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login Successful",
      token,
      user: getSafeUser(user),
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};

// Google Login / Register
const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        message: "Google token is required",
      });
    }

    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`
    );

    const googleData = await response.json();

    if (!response.ok || googleData.error || !googleData.email) {
      return res.status(400).json({
        message: "Invalid Google token",
      });
    }

    const email = googleData.email.trim().toLowerCase();
    const name = googleData.name;

    let user = await User.findOne({ email });

    if (!user) {
      const randomPassword = await bcrypt.hash(
        crypto.randomBytes(32).toString("hex"),
        10
      );

      user = await User.create({
        name: name || email.split("@")[0],
        email,
        password: randomPassword,
      });
    }

    const appToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Google Login Successful",
      token: appToken,
      user: getSafeUser(user),
    });
  } catch (error) {
    console.error("GOOGLE LOGIN ERROR:", error);
    res.status(500).json({
      message: "Google login failed",
    });
  }
};

// Forgot Password
const forgotPassword = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        message: "Please enter your email",
      });
    }

    const user = await User.findOne({ email });

    // Do not reveal whether an email is registered.
    const successMessage =
      "If an account exists with this email, a password reset link will be sent.";

    if (!user) {
      return res.status(200).json({
        message: successMessage,
      });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("EMAIL_USER or EMAIL_PASS is missing in Backend/.env");

      return res.status(500).json({
        message: "Email service is not configured. Please check the backend email settings.",
      });
    }

    // Generate a secure random token.
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Store only the SHA-256 hash in MongoDB.
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 15 * 60 * 1000;

    await user.save();

    const frontendUrl =
      process.env.FRONTEND_URL || "http://localhost:3000";

    const resetLink =
      `${frontendUrl.replace(/\/$/, "")}/reset-password/${resetToken}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: "Digital Memory Vault - Password Reset",
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #6950a1;">Password Reset</h2>

            <p>Hello ${String(user.name || "User").replace(/[&<>"']/g, "")},</p>

            <p>
              You requested to reset your password for
              <b>Digital Memory Vault</b>.
            </p>

            <p>Click the button below to create a new password:</p>

            <a
              href="${resetLink}"
              style="
                display: inline-block;
                padding: 12px 24px;
                background: linear-gradient(90deg, #8e70d6, #5599e8);
                color: white;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
              "
            >
              Reset Password
            </a>

            <p style="margin-top: 20px;">
              This link expires in 15 minutes and can only be used once.
            </p>

            <p>
              If you did not request this, you can ignore this email.
            </p>

            <p>Digital Memory Vault Team</p>
          </div>
        `,
      });
    } catch (emailError) {
      // Remove the unused token if the email could not be sent.
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      throw emailError;
    }

    return res.status(200).json({
      message: successMessage,
    });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);

    return res.status(500).json({
      message: "Failed to send reset email. Please check your email configuration.",
    });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, newPassword } = req.body;

    const newPasswordValue = password || newPassword;

    if (!token) {
      return res.status(400).json({
        message: "Password reset token is missing",
      });
    }

    if (!newPasswordValue || newPasswordValue.length < 6) {
      return res.status(400).json({
        message: "Password must contain at least 6 characters",
      });
    }

    // Hash the token received from the reset link.
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find a matching token that has not expired.
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Password reset link is invalid or expired. Please request a new link.",
      });
    }

    // Hash and save the new password.
    user.password = await bcrypt.hash(newPasswordValue, 10);

    // Make the reset link unusable after successful reset.
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    return res.status(200).json({
      message: "Password reset successful. You can now log in with your new password.",
    });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);

    return res.status(500).json({
      message: "Unable to reset password. Please try again.",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  googleLogin,
  forgotPassword,
  resetPassword,
};
