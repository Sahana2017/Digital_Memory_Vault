const nodemailer = require("nodemailer");

const sendContactMessage = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        message: "Please fill in all fields"
      });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.CONTACT_EMAIL,
      replyTo: email,
      subject: `New Contact Message from ${name}`,
      text: `
Name: ${name}
Email: ${email}

Message:
${message}
      `
    };

    await transporter.verify();
console.log("Gmail login successful");

await transporter.sendMail(mailOptions);

    res.status(200).json({
      message: "Message sent successfully!"
    });

  } catch (error) {
    console.error("Contact Email Error:", error);

    res.status(500).json({
      message: "Failed to send message"
    });
  }
};

module.exports = {
  sendContactMessage
};