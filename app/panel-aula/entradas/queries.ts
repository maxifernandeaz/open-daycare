import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import { getCurrentProfile, type CurrentProfile } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";

export type PostCategory = Database["public"]["Enums"]["post_category"];
export type SupabaseServerClient = ReturnType<typeof createClient>;

export const STAFF_PAGE_SIZE = 20;
export const FEED_PAGE_SIZE = 10;

const SIGNED_URL_TTL_SECONDS = 3600;
const MANAGER_ROLES: ReadonlyArray<CurrentProfile["role"]> = [
  "admin",
  "director",
];

const LOAD_POSTS_ERROR = "No se pudieron cargar las publicaciones.";
const LOAD_FORM_ERROR = "No se pudieron cargar las aulas.";
const LOAD_POST_ERROR = "No se pudo cargar la publicación.";

export type PostImageSummary = {
  id: string;
  path: string;
  altText: string | null;
  sortOrder: number;
};

export type StaffPost = {
  id: string;
  title: string;
  body: string;
  category: PostCategory | null;
  classroomId: string | null;
  classroomName: string | null;
  authorId: string | null;
  authorName: string;
  createdAt: string;
  canEdit: boolean;
  images: PostImageSummary[];
};

export type StaffPostsData = {
  posts: StaffPost[];
  imageUrls: Record<string, string>;
  page: number;
  totalPages: number;
  hasMore: boolean;
  error: string | null;
};

export type ClassroomOption = {
  id: string;
  name: string;
};

export type PostFormOptions = {
  classrooms: ClassroomOption[];
  isManager: boolean;
  error: string | null;
};

export type PostEditData = {
  post: StaffPost | null;
  imageUrls: Record<string, string>;
  error: string | null;
};

export type FeedPost = {
  id: string;
  title: string;
  body: string;
  category: PostCategory | null;
  classroomName: string | null;
  authorName: string;
  createdAt: string;
  images: Array<{
    path: string;
    altText: string | null;
    sortOrder: number;
  }>;
};

export type FamilyFeedData = {
  posts: FeedPost[];
  imageUrls: Record<string, string>;
  page: number;
  hasMore: boolean;
  error: string | null;
};

type PostImageRow = {
  id: string;
  post_id: string;
  storage_path: string;
  alt_text: string | null;
  sort_order: number;
};

type PostImagesResult = {
  imagesByPost: Map<string, PostImageSummary[]>;
  error: boolean;
};

type ClassroomNamesResult = {
  namesById: Map<string, string>;
  error: boolean;
};

type EditablePostRow = {
  author_id: string | null;
  classroom_id: string | null;
};

const EMPTY_STAFF_POSTS: StaffPostsData = {
  posts: [],
  imageUrls: {},
  page: 1,
  totalPages: 1,
  hasMore: false,
  error: null,
};

const EMPTY_FEED: FamilyFeedData = {
  posts: [],
  imageUrls: {},
  page: 1,
  hasMore: false,
  error: null,
};

export function isManagerRole(role: CurrentProfile["role"]): boolean {
  return MANAGER_ROLES.includes(role);
}

export async function signPostImages(
  supabase: SupabaseServerClient,
  paths: string[],
): Promise<Record<string, string>> {
  const uniquePaths = Array.from(new Set(paths));

  if (uniquePaths.length === 0) {
    return {};
  }

  const { data, error } = await supabase.storage
    .from("post-images")
    .createSignedUrls(uniquePaths, SIGNED_URL_TTL_SECONDS);

  if (error || !data) {
    return {};
  }

  const imageUrls: Record<string, string> = {};

  for (const item of data) {
    if (item.path && item.signedUrl) {
      imageUrls[item.path] = item.signedUrl;
    }
  }

  return imageUrls;
}

export async function getStaffPosts(page: number): Promise<StaffPostsData> {
  const supabase = createClient(await cookies());
  const profile = await getCurrentProfile();

  if (!profile) {
    return { ...EMPTY_STAFF_POSTS, error: LOAD_POSTS_ERROR };
  }

  const assignedClassroomIds = await getAssignedClassroomIds(supabase, profile);
  const requestedPage = normalizeRequestedPage(page);

  const fetchPage = (targetPage: number) =>
    supabase
      .from("posts")
      .select(
        "id, title, body, category, classroom_id, author_id, author_name, created_at",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(
        (targetPage - 1) * STAFF_PAGE_SIZE,
        targetPage * STAFF_PAGE_SIZE - 1,
      );

  let result = await fetchPage(requestedPage);

  if (result.error) {
    return { ...EMPTY_STAFF_POSTS, error: LOAD_POSTS_ERROR };
  }

  const total = result.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / STAFF_PAGE_SIZE));
  const safePage = Math.min(requestedPage, totalPages);

  if (safePage !== requestedPage) {
    result = await fetchPage(safePage);

    if (result.error) {
      return { ...EMPTY_STAFF_POSTS, error: LOAD_POSTS_ERROR };
    }
  }

  const rows = result.data ?? [];
  const postIds = rows.map((row) => row.id);
  const { imagesByPost, error: imagesError } =
    postIds.length > 0
      ? await fetchPostImages(supabase, postIds)
      : { imagesByPost: new Map<string, PostImageSummary[]>(), error: false };

  if (imagesError) {
    return { ...EMPTY_STAFF_POSTS, error: LOAD_POSTS_ERROR };
  }

  const classroomIds = collectClassroomIds(rows);
  const { namesById: classroomNames, error: classroomsError } =
    await fetchClassroomNames(supabase, classroomIds);

  if (classroomsError) {
    return { ...EMPTY_STAFF_POSTS, error: LOAD_POSTS_ERROR };
  }

  const paths = rows.flatMap((row) =>
    (imagesByPost.get(row.id) ?? []).map((image) => image.path),
  );
  const imageUrls = await signPostImages(supabase, paths);

  const posts: StaffPost[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    category: row.category,
    classroomId: row.classroom_id,
    classroomName: getClassroomName(classroomNames, row.classroom_id),
    authorId: row.author_id,
    authorName: row.author_name,
    createdAt: row.created_at,
    canEdit: canEditPost(row, profile, assignedClassroomIds),
    images: imagesByPost.get(row.id) ?? [],
  }));

  return {
    posts,
    imageUrls,
    page: safePage,
    totalPages,
    hasMore: safePage < totalPages,
    error: null,
  };
}

export async function getPostFormOptions(
  profile: CurrentProfile,
): Promise<PostFormOptions> {
  const supabase = createClient(await cookies());
  const isManager = isManagerRole(profile.role);

  if (!isManager) {
    const assignedClassroomIds = await getAssignedClassroomIds(
      supabase,
      profile,
    );

    if (assignedClassroomIds.size === 0) {
      return { classrooms: [], isManager, error: null };
    }

    const { data, error } = await supabase
      .from("classrooms")
      .select("id, name")
      .in("id", Array.from(assignedClassroomIds))
      .order("name", { ascending: true });

    if (error) {
      return { classrooms: [], isManager, error: LOAD_FORM_ERROR };
    }

    return { classrooms: data ?? [], isManager, error: null };
  }

  const { data, error } = await supabase
    .from("classrooms")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    return { classrooms: [], isManager, error: LOAD_FORM_ERROR };
  }

  return { classrooms: data ?? [], isManager, error: null };
}

export async function getPostForEdit(id: string): Promise<PostEditData> {
  const supabase = createClient(await cookies());
  const profile = await getCurrentProfile();

  if (!profile) {
    return { post: null, imageUrls: {}, error: LOAD_POST_ERROR };
  }

  const { data: row, error } = await supabase
    .from("posts")
    .select(
      "id, title, body, category, classroom_id, author_id, author_name, created_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return { post: null, imageUrls: {}, error: LOAD_POST_ERROR };
  }

  if (!row) {
    return { post: null, imageUrls: {}, error: null };
  }

  const assignedClassroomIds = await getAssignedClassroomIds(supabase, profile);
  const { imagesByPost, error: imagesError } = await fetchPostImages(supabase, [
    row.id,
  ]);

  if (imagesError) {
    return { post: null, imageUrls: {}, error: LOAD_POST_ERROR };
  }

  const { namesById: classroomNames, error: classroomsError } =
    await fetchClassroomNames(supabase, collectClassroomIds([row]));

  if (classroomsError) {
    return { post: null, imageUrls: {}, error: LOAD_POST_ERROR };
  }

  const images = imagesByPost.get(row.id) ?? [];
  const imageUrls = await signPostImages(
    supabase,
    images.map((image) => image.path),
  );

  const post: StaffPost = {
    id: row.id,
    title: row.title,
    body: row.body,
    category: row.category,
    classroomId: row.classroom_id,
    classroomName: getClassroomName(classroomNames, row.classroom_id),
    authorId: row.author_id,
    authorName: row.author_name,
    createdAt: row.created_at,
    canEdit: canEditPost(row, profile, assignedClassroomIds),
    images,
  };

  return { post, imageUrls, error: null };
}

export async function getFamilyFeed(page: number): Promise<FamilyFeedData> {
  const supabase = createClient(await cookies());
  const requestedPage = normalizeRequestedPage(page);

  const fetchPage = (targetPage: number) =>
    supabase
      .from("posts")
      .select(
        "id, title, body, category, classroom_id, author_name, created_at",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(
        (targetPage - 1) * FEED_PAGE_SIZE,
        targetPage * FEED_PAGE_SIZE - 1,
      );

  let result = await fetchPage(requestedPage);

  if (result.error) {
    return { ...EMPTY_FEED, error: LOAD_POSTS_ERROR };
  }

  const total = result.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / FEED_PAGE_SIZE));
  const safePage = Math.min(requestedPage, totalPages);

  if (safePage !== requestedPage) {
    result = await fetchPage(safePage);

    if (result.error) {
      return { ...EMPTY_FEED, error: LOAD_POSTS_ERROR };
    }
  }

  const rows = result.data ?? [];
  const postIds = rows.map((row) => row.id);
  const { imagesByPost, error: imagesError } =
    postIds.length > 0
      ? await fetchPostImages(supabase, postIds)
      : { imagesByPost: new Map<string, PostImageSummary[]>(), error: false };

  if (imagesError) {
    return { ...EMPTY_FEED, error: LOAD_POSTS_ERROR };
  }

  const classroomIds = collectClassroomIds(rows);
  const { namesById: classroomNames, error: classroomsError } =
    await fetchClassroomNames(supabase, classroomIds);

  if (classroomsError) {
    return { ...EMPTY_FEED, error: LOAD_POSTS_ERROR };
  }

  const paths = rows.flatMap((row) =>
    (imagesByPost.get(row.id) ?? []).map((image) => image.path),
  );
  const imageUrls = await signPostImages(supabase, paths);

  const posts: FeedPost[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    category: row.category,
    classroomName: getClassroomName(classroomNames, row.classroom_id),
    authorName: row.author_name,
    createdAt: row.created_at,
    images: (imagesByPost.get(row.id) ?? []).map((image) => ({
      path: image.path,
      altText: image.altText,
      sortOrder: image.sortOrder,
    })),
  }));

  return {
    posts,
    imageUrls,
    page: safePage,
    hasMore: safePage < totalPages,
    error: null,
  };
}

async function getAssignedClassroomIds(
  supabase: SupabaseServerClient,
  profile: CurrentProfile,
): Promise<Set<string>> {
  if (isManagerRole(profile.role)) {
    return new Set();
  }

  const { data, error } = await supabase
    .from("classroom_educators")
    .select("classroom_id")
    .eq("educator_id", profile.id);

  if (error || !data) {
    return new Set();
  }

  return new Set(data.map((row) => row.classroom_id));
}

async function fetchPostImages(
  supabase: SupabaseServerClient,
  postIds: string[],
): Promise<PostImagesResult> {
  const { data, error } = await supabase
    .from("post_images")
    .select("id, post_id, storage_path, alt_text, sort_order")
    .in("post_id", postIds)
    .order("sort_order", { ascending: true });

  if (error || !data) {
    return { imagesByPost: new Map(), error: true };
  }

  const imagesByPost = new Map<string, PostImageSummary[]>();

  for (const row of data as PostImageRow[]) {
    const images = imagesByPost.get(row.post_id) ?? [];

    images.push({
      id: row.id,
      path: row.storage_path,
      altText: row.alt_text,
      sortOrder: row.sort_order,
    });

    imagesByPost.set(row.post_id, images);
  }

  return { imagesByPost, error: false };
}

async function fetchClassroomNames(
  supabase: SupabaseServerClient,
  classroomIds: string[],
): Promise<ClassroomNamesResult> {
  if (classroomIds.length === 0) {
    return { namesById: new Map(), error: false };
  }

  const { data, error } = await supabase
    .from("classrooms")
    .select("id, name")
    .in("id", classroomIds);

  if (error || !data) {
    return { namesById: new Map(), error: true };
  }

  const namesById = new Map<string, string>();

  for (const classroom of data) {
    namesById.set(classroom.id, classroom.name);
  }

  return { namesById, error: false };
}

function collectClassroomIds(
  rows: ReadonlyArray<{ classroom_id: string | null }>,
): string[] {
  const ids = new Set<string>();

  for (const row of rows) {
    if (row.classroom_id !== null) {
      ids.add(row.classroom_id);
    }
  }

  return Array.from(ids);
}

function getClassroomName(
  namesById: Map<string, string>,
  classroomId: string | null,
): string | null {
  if (classroomId === null) {
    return null;
  }

  return namesById.get(classroomId) ?? null;
}

function canEditPost(
  post: EditablePostRow,
  profile: CurrentProfile,
  assignedClassroomIds: Set<string>,
): boolean {
  if (isManagerRole(profile.role)) {
    return true;
  }

  return (
    post.author_id === profile.id &&
    post.classroom_id !== null &&
    assignedClassroomIds.has(post.classroom_id)
  );
}

function normalizeRequestedPage(page: number): number {
  if (!Number.isFinite(page)) {
    return 1;
  }

  const floored = Math.floor(page);

  return floored < 1 ? 1 : floored;
}
