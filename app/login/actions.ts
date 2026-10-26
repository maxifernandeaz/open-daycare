"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export type LoginState = {
  error?: string;
  email?: string;
};

const CREDENTIALS_ERROR = "Email o contraseña incorrectos.";
const PENDING_ERROR = "Tu cuenta está pendiente de activación.";

export async function login(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: CREDENTIALS_ERROR, email };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: authData, error: signInError } =
    await supabase.auth.signInWithPassword({ email, password });

  if (signInError || !authData.user) {
    return { error: CREDENTIALS_ERROR, email };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (profileError || !profile) {
    await supabase.auth.signOut({ scope: "local" });
    return { error: CREDENTIALS_ERROR, email };
  }

  if (profile.status !== "active") {
    await supabase.auth.signOut({ scope: "local" });
    return { error: PENDING_ERROR, email };
  }

  redirect(profile.role === "tutor" ? "/" : "/panel-aula");
}
