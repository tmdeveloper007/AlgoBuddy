import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_KEY || "placeholder-key",
);

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(String(email).trim());
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password, captchaToken, action, name } = body || {};

    // Validate required fields
    if (!email || !password) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Email and password are required",
        }),
        { status: 400 },
      );
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid email address format",
        }),
        { status: 400 },
      );
    }

    // Validate password length for signup
    if (action === "signup") {
      if (password.length < 8) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Password must be at least 8 characters long",
          }),
          { status: 400 },
        );
      }
      if (!captchaToken) {
        return new Response(
          JSON.stringify({ success: false, message: "Captcha token missing" }),
          { status: 400 },
        );
      }

      const verifyRes = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            secret: process.env.TURNSTILE_SECRET_KEY,
            response: captchaToken,
          }),
        },
      );
      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Captcha verification failed",
          }),
          { status: 400 },
        );
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: name },
        },
      });
      if (error) {
        return new Response(
          JSON.stringify({ success: false, message: error.message }),
          { status: 400 },
        );
      }
      return new Response(
        JSON.stringify({
          success: true,
          message: "Signup successful. Verification email sent.",
          trigger: true,
        }),
        { status: 200 },
      );
    } else if (action === "login") {
      if (!captchaToken) {
        return new Response(
          JSON.stringify({ success: false, message: "Captcha token missing" }),
          { status: 400 },
        );
      }

      const verifyRes = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            secret: process.env.TURNSTILE_SECRET_KEY,
            response: captchaToken,
          }),
        },
      );
      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Captcha verification failed",
          }),
          { status: 400 },
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Captcha verified. You can now login using email/password.",
        }),
        { status: 200 },
      );
    } else {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid action" }),
        { status: 400 },
      );
    }
  } catch (err) {
    console.error("API Error:", err);
    return new Response(
      JSON.stringify({ success: false, message: "Internal server error" }),
      { status: 500 },
    );
  }
}
