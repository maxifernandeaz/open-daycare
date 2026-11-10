"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getCurrentProfile, type CurrentProfile } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { POST_CATEGORY_VALUES } from "./formatters";
import {
  isManagerRole,
  type PostCategory,
  type SupabaseServerClient,
} from "./queries";

export type PostImageMime = "image/jpeg" | "image/png" | "image/webp";

export type UploadTarget = {
  path: string;
  token: string;
};

export type PostFormInput = {
  title: string;
  body: string;
  category: PostCategory | null;
  classroomId: string | null;
  imageTypes: PostImageMime[];
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
const MAX_POST_IMAGES = 4;
const POST_IMAGES_BUCKET = "post-images";

const IMAGE_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} satisfies Record<PostImageMime, string>;

const IMAGE_MIME_SET: ReadonlySet<string> = new Set(
  Object.keys(IMAGE_EXTENSIONS),
);

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
const IMAGES_LIMIT_ERROR = "Podés adjuntar hasta 4 imágenes.";
const IMAGE_TYPE_INVALID_ERROR =
  "Formato de imagen no permitido. Usá JPG, PNG o WebP.";
const IMAGE_SIGN_WARNING =
  "La entrada se publicó, pero no se pudieron preparar todas las imágenes. Podés agregar las que faltan desde Editar.";

const POST_CATEGORY_SET: ReadonlySet<string> = new Set(POST_CATEGORY_VALUES);

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

  const imageTypes = resolveImageTypes(input.imageTypes);

  if (!imageTypes.ok) {
    return { ok: false, error: imageTypes.error };
  }

  const profile = await getCurrentProfile();

  if (!profile || profile.role === "tutor") {
    return { ok: false, error: PERMISSION_ERROR };
  }

  const supabase = createClient(await cookies());
  const classroom = await resolveClassroomId(supabase, profile, classroomId);

  if (!classroom.ok) {
    return { ok: false, error: classroom.error };
  }

  const { data: created, error: insertError } = await supabase
    .from("posts")
    .insert({
      author_id: profile.id,
      title,
      body,
      category: input.category,
      classroom_id: classroom.classroomId,
    })
    .select("id")
    .single();

  if (insertError || !created) {
    return { ok: false, error: CREATE_ERROR };
  }

  const uploadTargets = await createUploadTargets(
    supabase,
    created.id,
    imageTypes.imageTypes,
  );

  revalidatePath("/");
  revalidatePath("/panel-aula/entradas");

  return {
    ok: true,
    postId: created.id,
    uploadTargets: uploadTargets.targets,
    ...(uploadTargets.failed ? { warning: IMAGE_SIGN_WARNING } : {}),
  };
}

type ImageTypesResolution =
  | { ok: true; imageTypes: PostImageMime[] }
  | { ok: false; error: string };

function resolveImageTypes(value: unknown): ImageTypesResolution {
  if (!Array.isArray(value)) {
    return { ok: false, error: IMAGE_TYPE_INVALID_ERROR };
  }

  if (value.length > MAX_POST_IMAGES) {
    return { ok: false, error: IMAGES_LIMIT_ERROR };
  }

  const imageTypes: PostImageMime[] = [];

  for (const item of value) {
    if (!isPostImageMime(item)) {
      return { ok: false, error: IMAGE_TYPE_INVALID_ERROR };
    }

    imageTypes.push(item);
  }

  return { ok: true, imageTypes };
}

type UploadTargetsResult = {
  targets: UploadTarget[];
  failed: boolean;
};

async function createUploadTargets(
  supabase: SupabaseServerClient,
  postId: string,
  imageTypes: PostImageMime[],
): Promise<UploadTargetsResult> {
  const targets: UploadTarget[] = [];

  for (const mime of imageTypes) {
    const extension = IMAGE_EXTENSIONS[mime];
    const path = `${postId}/${crypto.randomUUID()}.${extension}`;
    const { data, error } = await supabase.storage
      .from(POST_IMAGES_BUCKET)
      .createSignedUploadUrl(path);

    if (error || !data) {
      return { targets, failed: true };
    }

    targets.push({ path, token: data.token });
  }

  return { targets, failed: false };
}

type ClassroomResolution =
  | { ok: true; classroomId: string | null }
  | { ok: false; error: string };

async function resolveClassroomId(
  supabase: SupabaseServerClient,
  profile: CurrentProfile,
  requestedClassroomId: string | null,
): Promise<ClassroomResolution> {
  if (isManagerRole(profile.role)) {
    if (requestedClassroomId === null) {
      return { ok: true, classroomId: null };
    }

    const { data: classroom, error } = await supabase
      .from("classrooms")
      .select("id")
      .eq("id", requestedClassroomId)
      .maybeSingle();

    if (error || !classroom) {
      return { ok: false, error: CLASSROOM_INVALID_ERROR };
    }

    return { ok: true, classroomId: requestedClassroomId };
  }

  if (requestedClassroomId === null) {
    return { ok: false, error: CLASSROOM_REQUIRED_ERROR };
  }

  const { data: assignment, error: assignmentError } = await supabase
    .from("classroom_educators")
    .select("classroom_id")
    .eq("educator_id", profile.id)
    .eq("classroom_id", requestedClassroomId)
    .maybeSingle();

  if (assignmentError) {
    return { ok: false, error: CLASSROOM_FORBIDDEN_ERROR };
  }

  if (assignment) {
    return { ok: true, classroomId: requestedClassroomId };
  }

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

function normalizeClassroomId(value: string | null): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function isPostImageMime(value: unknown): value is PostImageMime {
  return typeof value === "string" && IMAGE_MIME_SET.has(value);
}

function isPostCategory(value: unknown): value is PostCategory | null {
  if (value === null) {
    return true;
  }

  return typeof value === "string" && POST_CATEGORY_SET.has(value);
}
