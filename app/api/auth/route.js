import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_KEY || "placeholder-key",
);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Invalid JSON body",
      }),
      { status: 400 },
    );
  }

  const { email, password, captchaToken, action, name } = body || {};

  if (!email || !EMAIL_REGEX.test(email)) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Valid email address is required",
      }),
      { status: 400 },
    );
  }

  if (!password || typeof password !== "string") {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Password is required",
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

  if (action !== "signup" && action !== "login") {
    return new Response(
      JSON.stringify({ success: false, message: "Invalid action" }),
      { status: 400 },
    );
  }

  // Verify Turnstile token for both signup and login
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

  if (action === "signup") {
    if (password.length < MIN_PASSWORD_LENGTH) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
        }),
        { status: 400 },
      );
    }

    // Create Supabase user with metadata
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: typeof name === "string" ? name.trim() : "" },
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
  } else {
    // action === "login" — captcha already verified above
    return new Response(
      JSON.stringify({
        success: true,
        message: "Captcha verified. You can now login using email/password.",
      }),
      { status: 200 },
    );
  }
}
