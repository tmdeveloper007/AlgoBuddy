import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request) {
  const body = await request.json();
  const { name, email, review, rating, to } = body || {};

  // Validate required fields
  if (!name || !email || !review || rating === undefined) {
    return NextResponse.json(
      { success: false, error: 'Missing required fields: name, email, review, rating' },
      { status: 400 }
    );
  }

  // Validate rating range
  const ratingNum = Number(rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return NextResponse.json(
      { success: false, error: 'Rating must be an integer between 1 and 5' },
      { status: 400 }
    );
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const safeName = String(name).replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const safeEmail = String(email).replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const safeReview = String(review).replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to || 'routsohan2006@gmail.com',
      subject: `New Review Submission from ${safeName}`,
      html: `
        <h2>New Review Received</h2>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Rating:</strong> ${'\u2605'.repeat(ratingNum)}${'\u2606'.repeat(5 - ratingNum)}</p>
        <p><strong>Review:</strong></p>
        <p>${safeReview}</p>
      `,
    };

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
