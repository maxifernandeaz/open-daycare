/* eslint-disable @next/next/no-img-element */

import Icon from "@/app/components/Icons";
import Tag from "@/app/components/panel-aula/Tag";
import type { Tone } from "@/data/mock-classroom";
import type { StaffPost } from "@/app/panel-aula/entradas/queries";
import {
  formatPostDate,
  getCategoryLabel,
  getPostExcerpt,
  getPostImageAlt,
} from "@/app/panel-aula/entradas/formatters";

const CARD_CLASSES =
  "rounded-xl bg-surface-container-lowest p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4";

const META_CLASSES =
  "flex flex-wrap items-center gap-x-3 gap-y-1 font-body-sm text-body-sm text-on-surface-variant";

const ACTION_CLASSES =
  "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors active:scale-95";

const CATEGORY_TONES: Record<string, Tone> = {
  actividad: "primary",
  aviso: "tertiary",
  menu: "secondary",
  foto: "secondary",
  espacio: "surface",
};

type PostCardProps = {
  post: StaffPost;
  imageUrls: Record<string, string>;
};

export default function PostCard({ post, imageUrls }: PostCardProps) {
  const categoryLabel = getCategoryLabel(post.category);
  const categoryTone = post.category
    ? (CATEGORY_TONES[post.category] ?? "surface")
    : "surface";
  const dateLabel = formatPostDate(post.createdAt);
  const classroomLabel = post.classroomName ?? "Todas las aulas";
  const totalImages = post.images.length;

  return (
    <article className={CARD_CLASSES}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0 space-y-1">
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
          <h2 className="font-title-md text-title-md text-on-surface break-words">
            {post.title}
          </h2>
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

        {post.canEdit ? (
          <a
            className={`${ACTION_CLASSES} self-start shrink-0`}
            href={`/panel-aula/entradas/${post.id}/editar`}
          >
            <Icon name="edit" size={18} />
            <span>Editar</span>
          </a>
        ) : null}
      </div>

      {post.body.trim() ? (
        <p className="font-body-md text-body-md text-on-surface-variant whitespace-pre-line break-words">
          {getPostExcerpt(post.body)}
        </p>
      ) : null}

      {totalImages > 0 ? (
        <ul
          className={`grid gap-2 ${
            totalImages === 1 ? "grid-cols-1" : "grid-cols-2"
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
              <li className="min-w-0" key={image.id}>
                {url ? (
                  <img
                    alt={alt}
                    className={`w-full rounded-lg object-cover ${
                      totalImages === 1 ? "max-h-64" : "h-28"
                    }`}
                    src={url}
                  />
                ) : (
                  <div
                    aria-label={alt}
                    className={`w-full rounded-lg bg-surface-container-low flex items-center justify-center text-on-surface-variant ${
                      totalImages === 1 ? "h-40" : "h-28"
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
