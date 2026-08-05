import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { name, email, review, rating, to } = body || {};

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json(
      { success: false, error: 'Name is required' },
      { status: 400 }
    );
  }
  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      { success: false, error: 'Valid email is required' },
      { status: 400 }
    );
  }
  const parsedRating = parseInt(rating, 10);
  if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    return NextResponse.json(
      { success: false, error: 'Rating must be an integer between 1 and 5' },
      { status: 400 }
    );
  }
  if (to && typeof to === 'string' && !EMAIL_REGEX.test(to)) {
    return NextResponse.json(
      { success: false, error: 'Invalid recipient email format' },
      { status: 400 }
    );
  }

  const escapeHtml = (str) =>
    String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const safeName = escapeHtml(name.trim());
  const safeReview = escapeHtml(review || '');
  const safeRating = parsedRating;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: to && EMAIL_REGEX.test(to) ? to : 'routsohan2006@gmail.com',
    subject: `New Review Submission from ${safeName}`,
    html: `
      <h2>New Review Received</h2>
      <p><strong>Name:</strong> ${safeName}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Rating:</strong> ${'★'.repeat(safeRating)}${'☆'.repeat(5 - safeRating)}</p>
      <p><strong>Review:</strong></p>
      <p>${safeReview}</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
