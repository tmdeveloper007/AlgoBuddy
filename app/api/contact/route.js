import nodemailer from "nodemailer";

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req) {
  try {
    const { name, email, subject, message } = await req.json();

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return Response.json(
        { message: "Name is required" },
        { status: 400 }
      );
    }
    if (!email || !isValidEmail(email)) {
      return Response.json(
        { message: "A valid email address is required" },
        { status: 400 }
      );
    }
    if (!subject || typeof subject !== "string" || subject.trim().length === 0) {
      return Response.json(
        { message: "Subject is required" },
        { status: 400 }
      );
    }
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return Response.json(
        { message: "Message is required" },
        { status: 400 }
      );
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Email options
    const mailOptions = {
      from: email,
      to: process.env.EMAIL_USER,
      subject: `New Contact Form Submission: ${subject}`,
      text: `
        Name: ${name}
        Email: ${email}
        Subject: ${subject}
        Message: ${message}
      `,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return Response.json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    return Response.json({ message: "Error sending email" }, { status: 500 });
  }
}
