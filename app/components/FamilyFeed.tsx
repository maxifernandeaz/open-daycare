/* eslint-disable @next/next/no-img-element */

import Icon from "@/app/components/Icons";
import Tag from "@/app/components/panel-aula/Tag";
import type { Tone } from "@/data/mock-classroom";
import type {
  FamilyFeedData,
  FeedPost,
  PostCategory,
} from "@/app/panel-aula/entradas/queries";
import {
  formatPostDate,
  getCategoryLabel,
  getPostImageAlt,
} from "@/app/panel-aula/entradas/formatters";

const SECTION_CLASSES =
  "bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-6";

const CARD_CLASSES =
  "rounded-2xl bg-surface-container-low p-4 sm:p-5 flex flex-col gap-4";

const META_CLASSES =
  "flex flex-wrap items-center gap-x-3 gap-y-1 font-body-sm text-body-sm text-on-surface-variant";

const CATEGORY_TONES: Record<PostCategory, Tone> = {
  actividad: "primary",
  aviso: "tertiary",
  menu: "secondary",
  foto: "secondary",
  espacio: "surface",
};

type FamilyFeedProps = {
  data: FamilyFeedData;
};

function FeedPostCard({
  post,
  imageUrls,
}: {
  post: FeedPost;
  imageUrls: Record<string, string>;
}) {
  const categoryLabel = getCategoryLabel(post.category);
  const categoryTone = post.category
    ? CATEGORY_TONES[post.category]
    : "surface";
  const dateLabel = formatPostDate(post.createdAt);
  const classroomLabel = post.classroomName ?? "Todas las aulas";
  const totalImages = post.images.length;
  const isSingleImage = totalImages === 1;

  return (
    <article className={CARD_CLASSES}>
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          {categoryLabel ? (
            <Tag tone={categoryTone} shape="soft" size="xs">
              {categoryLabel}
            </Tag>
          ) : null}
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            {classroomLabel}
          </span>
        </div>
        <h3 className="font-title-md text-title-md text-on-surface break-words">
          {post.title}
        </h3>
        <p className={META_CLASSES}>
          <span>{post.authorName}</span>
          {dateLabel ? (
            <>
              <span aria-hidden="true">·</span>
              <time dateTime={post.createdAt}>{dateLabel}</time>
            </>
          ) : null}
        </p>
      </div>

      {post.body.trim() ? (
        <p className="font-body-md text-body-md text-on-surface-variant whitespace-pre-line break-words">
          {post.body}
        </p>
      ) : null}

      {totalImages > 0 ? (
        <ul
          className={`grid gap-2 ${
            isSingleImage ? "grid-cols-1" : "grid-cols-2"
          }`}
        >
          {post.images.map((image, index) => {
            const alt = getPostImageAlt(
              image.altText,
              post.title,
              index,
              totalImages,
            );
            const url = imageUrls[image.path];

            return (
              <li className="min-w-0" key={image.path}>
                {url ? (
                  <img
                    alt={alt}
                    className={`w-full rounded-xl object-cover ${
                      isSingleImage ? "max-h-80" : "h-32"
                    }`}
                    src={url}
                  />
                ) : (
                  <div
                    aria-label={alt}
                    className={`w-full rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant ${
                      isSingleImage ? "h-40" : "h-32"
                    }`}
                    role="img"
                  >
                    <Icon name="image" size={24} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </article>
  );
}

export default function FamilyFeed({ data }: FamilyFeedProps) {
  return (
    <section aria-labelledby="family-feed-title" className={SECTION_CLASSES}>
      <div className="flex flex-col gap-1">
        <h2
          className="font-headline-sm text-headline-sm text-on-surface"
          id="family-feed-title"
        >
          Publicaciones del aula
        </h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Novedades y avisos del equipo educativo
        </p>
      </div>

      {data.error ? (
        <p className="font-body-md text-body-md text-on-surface-variant" role="alert">
          {data.error}
        </p>
      ) : null}

      {!data.error && data.posts.length === 0 ? (
        <p className="font-body-md text-body-md text-on-surface-variant">
          Todavía no hay publicaciones.
        </p>
      ) : null}

      {data.posts.length > 0 ? (
        <div className="flex flex-col gap-4">
          {data.posts.map((post) => (
            <FeedPostCard
              imageUrls={data.imageUrls}
              key={post.id}
              post={post}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
