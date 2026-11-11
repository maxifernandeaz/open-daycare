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

export type AttachPostImagesInput = {
  postId: string;
  images: Array<{ path: string; altText: string }>;
};

export type AttachPostImagesResult =
  | { ok: true; attached: number; failed: number }
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

const ALT_TEXT_MAX_LENGTH = 160;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const ATTACH_ERROR =
  "No se pudieron registrar las imágenes. Intentá nuevamente en unos minutos.";
const ATTACH_PERMISSION_ERROR =
  "No tenés permiso para editar esta publicación.";
const ATTACH_POST_MISSING_ERROR =
  "La publicación no existe o no tenés acceso.";
const ATTACH_PATH_ERROR = "La ruta de imagen no es válida.";
const ATTACH_IMAGE_MISSING_ERROR =
  "No se encontró la imagen en el almacenamiento.";
const ATTACH_ALT_TEXT_ERROR = `La descripción de la imagen no puede superar los ${ALT_TEXT_MAX_LENGTH} caracteres.`;

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

export async function attachPostImages(
  input: AttachPostImagesInput,
): Promise<AttachPostImagesResult> {
  const postId = typeof input.postId === "string" ? input.postId.trim() : "";

  if (!UUID_PATTERN.test(postId)) {
    return { ok: false, error: ATTACH_PATH_ERROR };
  }

  const rawImages = Array.isArray(input.images) ? input.images : [];

  if (rawImages.length > MAX_POST_IMAGES) {
    return { ok: false, error: IMAGES_LIMIT_ERROR };
  }

  const pathPattern = new RegExp(
    `^${postId}/[0-9a-f-]{36}\\.(jpg|png|webp)$`,
  );
  const images: Array<{ path: string; altText: string | null }> = [];
  const seenPaths = new Set<string>();

  for (const image of rawImages) {
    const path = typeof image?.path === "string" ? image.path : "";
    const altText =
      typeof image?.altText === "string" ? image.altText.trim() : "";

    if (!pathPattern.test(path) || seenPaths.has(path)) {
      return { ok: false, error: ATTACH_PATH_ERROR };
    }

    if (altText.length > ALT_TEXT_MAX_LENGTH) {
      return { ok: false, error: ATTACH_ALT_TEXT_ERROR };
    }

    seenPaths.add(path);
    images.push({ path, altText: altText.length > 0 ? altText : null });
  }

  const profile = await getCurrentProfile();

  if (!profile || profile.role === "tutor") {
    return { ok: false, error: ATTACH_PERMISSION_ERROR };
  }

  const supabase = createClient(await cookies());
  const editable = await resolveEditablePost(supabase, profile, postId);

  if (!editable.ok) {
    return { ok: false, error: editable.error };
  }

  if (images.length === 0) {
    return { ok: true, attached: 0, failed: 0 };
  }

  const { data: objects, error: listError } = await supabase.storage
    .from(POST_IMAGES_BUCKET)
    .list(postId);

  if (listError || !objects) {
    return { ok: false, error: ATTACH_ERROR };
  }

  const storedPaths = new Set(
    objects.map((object) => `${postId}/${object.name}`),
  );

  for (const image of images) {
    if (!storedPaths.has(image.path)) {
      return { ok: false, error: ATTACH_IMAGE_MISSING_ERROR };
    }
  }

  const { data: existingRows, error: existingError } = await supabase
    .from("post_images")
    .select("storage_path, sort_order")
    .eq("post_id", postId);

  if (existingError || !existingRows) {
    return { ok: false, error: ATTACH_ERROR };
  }

  const existingPaths = new Set(existingRows.map((row) => row.storage_path));
  const usedSlots = new Set(existingRows.map((row) => row.sort_order));
  const pendingImages = images.filter(
    (image) => !existingPaths.has(image.path),
  );

  if (existingRows.length + pendingImages.length > MAX_POST_IMAGES) {
    return { ok: false, error: IMAGES_LIMIT_ERROR };
  }

  const freeSlots: number[] = [];

  for (let slot = 0; slot < MAX_POST_IMAGES; slot += 1) {
    if (!usedSlots.has(slot)) {
      freeSlots.push(slot);
    }
  }

  if (pendingImages.length > freeSlots.length) {
    return { ok: false, error: IMAGES_LIMIT_ERROR };
  }

  let insertedCount = 0;

  if (pendingImages.length > 0) {
    const rows = pendingImages.map((image, index) => ({
      post_id: postId,
      storage_path: image.path,
      alt_text: image.altText,
      sort_order: freeSlots[index],
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("post_images")
      .upsert(rows, {
        onConflict: "storage_path",
        ignoreDuplicates: true,
      })
      .select("storage_path");

    if (insertError) {
      return { ok: false, error: ATTACH_ERROR };
    }

    insertedCount = inserted?.length ?? 0;
  }

  const alreadyAttached = images.length - pendingImages.length;
  const attached = alreadyAttached + insertedCount;
  const failed = images.length - attached;

  revalidatePath("/");
  revalidatePath("/panel-aula/entradas");

  return { ok: true, attached, failed };
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

type EditablePostResolution = { ok: true } | { ok: false; error: string };

async function resolveEditablePost(
  supabase: SupabaseServerClient,
  profile: CurrentProfile,
  postId: string,
): Promise<EditablePostResolution> {
  const { data: post, error } = await supabase
    .from("posts")
    .select("author_id, classroom_id")
    .eq("id", postId)
    .maybeSingle();

  if (error) {
    return { ok: false, error: ATTACH_ERROR };
  }

  if (!post) {
    return { ok: false, error: ATTACH_POST_MISSING_ERROR };
  }

  if (isManagerRole(profile.role)) {
    return { ok: true };
  }

  if (post.author_id !== profile.id || post.classroom_id === null) {
    return { ok: false, error: ATTACH_PERMISSION_ERROR };
  }

  const { data: assignment, error: assignmentError } = await supabase
    .from("classroom_educators")
    .select("classroom_id")
    .eq("educator_id", profile.id)
    .eq("classroom_id", post.classroom_id)
    .maybeSingle();

  if (assignmentError || !assignment) {
    return { ok: false, error: ATTACH_PERMISSION_ERROR };
  }

  return { ok: true };
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
