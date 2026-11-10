"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export type ActivateAccountState = {
  error?: string;
  success?: boolean;
};

const INVALID_INVITATION =
  "Esta invitación no es válida o ya venció.";
const EMAIL_MISMATCH = "El email no coincide con la invitación.";
const STAFF_EMAIL =
  "Este email ya pertenece a una cuenta de staff. Contactá a la guardería.";
const WRONG_PASSWORD = "Contraseña incorrecta.";
const GENERIC_ERROR =
  "No se pudo activar la cuenta. Intentá nuevamente en unos minutos.";
const REQUIRED_FIELDS_ERROR =
  "Completá el código de invitación, el email y la contraseña.";
const CONFIG_ERROR =
  "La activación no está disponible: falta configuración del servidor (SUPABASE_SERVICE_ROLE_KEY). Contactá a la guardería.";

export async function activateAccount(
  _previousState: ActivateAccountState,
  formData: FormData,
): Promise<ActivateAccountState> {
  const rawCode = String(formData.get("inviteCode") ?? "");
  const normalizedCode = rawCode.replace(/\s+/g, "").toUpperCase();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const photoConsent = formData.get("photoConsent") === "on";

  if (!normalizedCode || !email || !password) {
    return { error: REQUIRED_FIELDS_ERROR };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: previews, error: previewError } = await supabase.rpc(
    "get_invitation_preview",
    { p_code: normalizedCode },
  );

  const preview = previews?.[0];

  if (previewError || !preview) {
    return { error: INVALID_INVITATION };
  }

  if (preview.email.trim().toLowerCase() !== email.toLowerCase()) {
    return { error: EMAIL_MISMATCH };
  }

  let admin: ReturnType<typeof createAdminClient>;

  try {
    admin = createAdminClient();
  } catch {
    return { error: CONFIG_ERROR };
  }

  const { data: existingProfile, error: profileError } = await admin
    .from("profiles")
    .select("id, role, status")
    .ilike("email", email)
    .maybeSingle();

  if (profileError) {
    return { error: GENERIC_ERROR };
  }

  if (existingProfile && existingProfile.role !== "tutor") {
    return { error: STAFF_EMAIL };
  }

  let profileId: string;
  let wasActive = false;

  if (existingProfile) {
    profileId = existingProfile.id;
    wasActive = existingProfile.status === "active";

    if (!wasActive) {
      const { error: updateAuthError } = await admin.auth.admin.updateUserById(
        existingProfile.id,
        { password, email_confirm: true },
      );

      if (updateAuthError) {
        return { error: GENERIC_ERROR };
      }
    }
  } else {
    const { data: createdUser, error: createUserError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (createUserError || !createdUser.user) {
      return { error: GENERIC_ERROR };
    }

    profileId = createdUser.user.id;
  }

  const { error: statusError } = await admin
    .from("profiles")
    .update({ status: "active" })
    .eq("id", profileId);

  if (statusError) {
    return { error: GENERIC_ERROR };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return { error: wasActive ? WRONG_PASSWORD : GENERIC_ERROR };
  }

  const { error: acceptError } = await supabase.rpc(
    "accept_tutor_invitation",
    { p_code: normalizedCode, p_photo_consent: photoConsent },
  );

  if (acceptError) {
    return { error: acceptError.message || GENERIC_ERROR };
  }

  redirect("/");
}
