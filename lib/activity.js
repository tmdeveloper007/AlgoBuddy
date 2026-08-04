import { supabase } from "@/lib/supabase";

const trackActivity = async (userId, type = "site_visit") => {
  if (!userId || typeof userId !== "string") {
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
      console.error("[trackActivity] select error:", error.message);
      return;
    }

    if (data && data.length === 0) {
      const { error: insertError } = await supabase
        .from("user_activity")
        .insert([{ user_id: userId, activity_date: today, type }]);

      if (insertError) {
        console.error("[trackActivity] insert error:", insertError.message);
      }
    }
  } catch (err) {
    console.error("[trackActivity] unexpected error:", err?.message || err);
  }
};

export { trackActivity };
