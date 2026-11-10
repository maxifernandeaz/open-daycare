"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getCurrentProfile } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { POST_CATEGORY_VALUES } from "./formatters";
import { isManagerRole, type PostCategory } from "./queries";

export type UploadTarget = {
  path: string;
  token: string;
};

export type PostFormInput = {
  title: string;
  body: string;
  category: PostCategory | null;
  classroomId: string | null;
};

export type CreatePostResult =
  | {
      ok: true;
      postId: string;
      uploadTargets: UploadTarget[];
      warning?: string;
    }
  | { ok: false; error: string };

const TITLE_MAX_LENGTH = 120;
const BODY_MAX_LENGTH = 5000;

const TITLE_REQUIRED_ERROR = "El título es obligatorio.";
const TITLE_TOO_LONG_ERROR = `El título no puede superar los ${TITLE_MAX_LENGTH} caracteres.`;
const BODY_REQUIRED_ERROR = "El contenido es obligatorio.";
const BODY_TOO_LONG_ERROR = `El contenido no puede superar los ${BODY_MAX_LENGTH} caracteres.`;
const CATEGORY_INVALID_ERROR = "Seleccioná una categoría válida.";
const CLASSROOM_REQUIRED_ERROR = "Seleccioná un aula.";
const CLASSROOM_FORBIDDEN_ERROR = "No podés publicar en esa aula.";
const CLASSROOM_INVALID_ERROR = "Seleccioná un aula válida.";
const NO_CLASSROOMS_ERROR = "No tenés aulas asignadas para publicar.";
const PERMISSION_ERROR = "No tenés permiso para publicar.";
const CREATE_ERROR =
  "No se pudo publicar la entrada. Intentá nuevamente en unos minutos.";

export async function createPost(
  input: PostFormInput,
): Promise<CreatePostResult> {
  const title = input.title.trim();
  const body = input.body.trim();
  const classroomId = normalizeClassroomId(input.classroomId);

  if (title.length === 0) {
    return { ok: false, error: TITLE_REQUIRED_ERROR };
  }

  if (title.length > TITLE_MAX_LENGTH) {
    return { ok: false, error: TITLE_TOO_LONG_ERROR };
  }

  if (body.length === 0) {
    return { ok: false, error: BODY_REQUIRED_ERROR };
  }

  if (body.length > BODY_MAX_LENGTH) {
    return { ok: false, error: BODY_TOO_LONG_ERROR };
  }

  if (!isPostCategory(input.category)) {
    return { ok: false, error: CATEGORY_INVALID_ERROR };
  }

  const profile = await getCurrentProfile();

  if (!profile || profile.role === "tutor") {
    return { ok: false, error: PERMISSION_ERROR };
  }

  const supabase = createClient(await cookies());
  const isManager = isManagerRole(profile.role);

  if (!isManager) {
    if (classroomId === null) {
      return { ok: false, error: CLASSROOM_REQUIRED_ERROR };
    }

    const { data: assignment, error: assignmentError } = await supabase
      .from("classroom_educators")
      .select("classroom_id")
      .eq("educator_id", profile.id)
      .eq("classroom_id", classroomId)
      .maybeSingle();

    if (assignmentError) {
      return { ok: false, error: CLASSROOM_FORBIDDEN_ERROR };
    }

    if (!assignment) {
      const { count, error: countError } = await supabase
        .from("classroom_educators")
        .select("classroom_id", { count: "exact", head: true })
        .eq("educator_id", profile.id);

      if (countError) {
        return { ok: false, error: CLASSROOM_FORBIDDEN_ERROR };
      }

      return {
        ok: false,
        error: count === 0 ? NO_CLASSROOMS_ERROR : CLASSROOM_FORBIDDEN_ERROR,
      };
    }
  } else if (classroomId !== null) {
    const { data: classroom, error: classroomError } = await supabase
      .from("classrooms")
      .select("id")
      .eq("id", classroomId)
      .maybeSingle();

    if (classroomError) {
      return { ok: false, error: CLASSROOM_INVALID_ERROR };
    }

    if (!classroom) {
      return { ok: false, error: CLASSROOM_INVALID_ERROR };
    }
  }

  const { data: created, error: insertError } = await supabase
    .from("posts")
    .insert({
      author_id: profile.id,
      title,
      body,
      category: input.category,
      classroom_id: classroomId,
    })
    .select("id")
    .single();

  if (insertError || !created) {
    return { ok: false, error: CREATE_ERROR };
  }

  revalidatePath("/");
  revalidatePath("/panel-aula/entradas");

  return { ok: true, postId: created.id, uploadTargets: [] };
}

function normalizeClassroomId(value: string | null): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function isPostCategory(value: unknown): value is PostCategory | null {
  if (value === null) {
    return true;
  }

  return POST_CATEGORY_VALUES.some((category) => category === value);
}
