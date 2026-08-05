import nodemailer from "nodemailer";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json({ message: "Invalid JSON body" }, { status: 400 });
    }

    const { name, email, subject, message } = body || {};

    if (!email || !EMAIL_REGEX.test(email)) {
      return Response.json({ message: "Valid email address is required" }, { status: 400 });
    }
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return Response.json({ message: "Name is required" }, { status: 400 });
    }
    if (!subject || typeof subject !== "string" || subject.trim().length === 0) {
      return Response.json({ message: "Subject is required" }, { status: 400 });
    }
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return Response.json({ message: "Message is required" }, { status: 400 });
    }

    const escapeHtml = (str) =>
      String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const escapedMessage = escapeHtml(message);

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const safeName = escapeHtml(name.trim());
    const safeSubject = escapeHtml(subject.trim());

    // Email options
    const mailOptions = {
      from: email,
      to: process.env.EMAIL_USER,
      subject: `New Contact Form Submission: ${safeSubject}`,
      text: `
        Name: ${name.trim()}
        Email: ${email}
        Subject: ${subject.trim()}
        Message: ${message}
      `,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Subject:</strong> ${safeSubject}</p>
        <p><strong>Message:</strong></p>
        <p>${escapedMessage.replace(/\n/g, "<br>")}</p>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return Response.json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(JSON.stringify({ message: "Error sending email" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
