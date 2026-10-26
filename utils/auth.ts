import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Database } from "@/types/database";
import { createClient } from "@/utils/supabase/server";

export type CurrentProfile = {
  id: string;
  role: Database["public"]["Enums"]["user_role"];
  status: Database["public"]["Enums"]["user_status"];
};

export const getCurrentProfile = cache(
  async (): Promise<CurrentProfile | null> => {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();
    const userId = claimsData?.claims.sub;

    if (claimsError || !userId) {
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role, status")
      .eq("id", userId)
      .maybeSingle();

    if (profileError || !profile) {
      return null;
    }

    return profile;
  },
);

export const requireStaff = async (): Promise<CurrentProfile> => {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role === "tutor") {
    redirect("/");
  }

  return profile;
};
