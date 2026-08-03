import { supabase } from "@/lib/supabase";

const ALLOWED_TYPES = ["site_visit", "module_view", "quiz_attempt", "bookmark"];

const trackActivity = async (userId, type = "site_visit") => {
  // Validate inputs
  if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
    console.warn("[trackActivity] invalid userId:", userId);
    return;
  }
  if (!type || typeof type !== "string" || type.trim().length === 0) {
    console.warn("[trackActivity] invalid type:", type);
    return;
  }

  const today = new Date().toISOString().split("T")[0];

  try {
    const { data, error } = await supabase
      .from("user_activity")
      .select("id")
      .eq("user_id", userId)
      .eq("activity_date", today);

    if (error) {
      console.error("[trackActivity] select error:", error);
      return;
    }

    if (data.length === 0) {
      const { error: insertError } = await supabase
        .from("user_activity")
        .insert([
          { user_id: userId, activity_date: today, type }
        ]);

      if (insertError) {
        console.error("[trackActivity] insert error:", insertError);
      }
    }
  } catch (err) {
    console.error("[trackActivity] unexpected error:", err);
  }
};

export { trackActivity };