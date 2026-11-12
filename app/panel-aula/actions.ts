"use server";

import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import { sendInvitationEmail } from "@/utils/email";
import { createClient } from "@/utils/supabase/server";

export type InviteFamilyResult =
  | { success: true; emailSent: boolean; code: string }
  | { success: false; error: string };

type TutorInvitation =
  Database["public"]["Functions"]["create_tutor_invitation"]["Returns"][number];

const GENERIC_ERROR =
  "No se pudo crear la invitación. Intentá nuevamente en unos minutos.";
const CHILD_FALLBACK_NAME = "tu hijo/a";
const CHILD_MISSING_ERROR = "No se identificó al niño.";
const EMAIL_REQUIRED_ERROR = "El email es obligatorio.";
const EMAIL_INVALID_ERROR = "Email inválido.";
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function inviteFamily(
  childId: string,
  email: string,
  relationship?: string,
): Promise<InviteFamilyResult> {
  const trimmedEmail = email.trim();

  if (!childId) {
    return { success: false, error: CHILD_MISSING_ERROR };
  }

  if (!trimmedEmail) {
    return { success: false, error: EMAIL_REQUIRED_ERROR };
  }

  if (!EMAIL_PATTERN.test(trimmedEmail)) {
    return { success: false, error: EMAIL_INVALID_ERROR };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: child } = await supabase
    .from("children")
    .select("full_name")
    .eq("id", childId)
    .maybeSingle();

  const trimmedRelationship = relationship?.trim() || undefined;

  const { data, error } = await supabase.rpc("create_tutor_invitation", {
    p_child_id: childId,
    p_email: trimmedEmail,
    p_relationship: trimmedRelationship,
  });

  if (error) {
    return { success: false, error: error.message || GENERIC_ERROR };
  }

  const invitation: TutorInvitation | undefined = data?.[0];

  if (!invitation) {
    return { success: false, error: GENERIC_ERROR };
  }

  const emailResult = await sendInvitationEmail(
    trimmedEmail,
    invitation.code,
    child?.full_name ?? CHILD_FALLBACK_NAME,
  );

  if (!emailResult.success) {
    return { success: true, emailSent: false, code: invitation.code };
  }

  return { success: true, emailSent: true, code: invitation.code };
}
