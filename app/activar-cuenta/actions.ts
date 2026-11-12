"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export type ActivateAccountState = {
  error?: string;
};

type AdminClient = ReturnType<typeof createAdminClient>;

type ProfileResolution =
  | { status: "ok"; profileId: string; wasActive: boolean }
  | { status: "error"; message: string };

const ACTIVATION_FIELDS = {
  inviteCode: "inviteCode",
  email: "email",
  password: "password",
  photoConsent: "photoConsent",
} as const;

const CHECKBOX_CHECKED_VALUE = "on";
const TUTOR_ROLE = "tutor";
const ACTIVE_STATUS = "active";

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

function readFormField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function getAdminClient(): AdminClient | null {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

async function resolveProfile(
  admin: AdminClient,
  email: string,
  password: string,
): Promise<ProfileResolution> {
  const { data: existingProfile, error: profileError } = await admin
    .from("profiles")
    .select("id, role, status")
    .ilike("email", email)
    .maybeSingle();

  if (profileError) {
    return { status: "error", message: GENERIC_ERROR };
  }

  if (!existingProfile) {
    const { data: createdUser, error: createUserError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (createUserError || !createdUser.user) {
      return { status: "error", message: GENERIC_ERROR };
    }

    return {
      status: "ok",
      profileId: createdUser.user.id,
      wasActive: false,
    };
  }

  if (existingProfile.role !== TUTOR_ROLE) {
    return { status: "error", message: STAFF_EMAIL };
  }

  const wasActive = existingProfile.status === ACTIVE_STATUS;

  if (!wasActive) {
    const { error: updateAuthError } = await admin.auth.admin.updateUserById(
      existingProfile.id,
      { password, email_confirm: true },
    );

    if (updateAuthError) {
      return { status: "error", message: GENERIC_ERROR };
    }
  }

  return { status: "ok", profileId: existingProfile.id, wasActive };
}

export async function activateAccount(
  _previousState: ActivateAccountState,
  formData: FormData,
): Promise<ActivateAccountState> {
  const rawCode = readFormField(formData, ACTIVATION_FIELDS.inviteCode);
  const normalizedCode = rawCode.replace(/\s+/g, "").toUpperCase();
  const email = readFormField(formData, ACTIVATION_FIELDS.email).trim();
  const password = readFormField(formData, ACTIVATION_FIELDS.password);
  const photoConsent =
    readFormField(formData, ACTIVATION_FIELDS.photoConsent) ===
    CHECKBOX_CHECKED_VALUE;

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

  const admin = getAdminClient();

  if (!admin) {
    return { error: CONFIG_ERROR };
  }

  const profile = await resolveProfile(admin, email, password);

  if (profile.status === "error") {
    return { error: profile.message };
  }

  const { error: statusError } = await admin
    .from("profiles")
    .update({ status: ACTIVE_STATUS })
    .eq("id", profile.profileId);

  if (statusError) {
    return { error: GENERIC_ERROR };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return { error: profile.wasActive ? WRONG_PASSWORD : GENERIC_ERROR };
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
