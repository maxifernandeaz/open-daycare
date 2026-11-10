import Link from "next/link";
import Icon from "@/app/components/Icons";
import type { StaffPostsData } from "@/app/panel-aula/entradas/queries";
import PostCard from "./PostCard";

const LIST_CLASSES = "space-y-4";
const EMPTY_CLASSES =
  "rounded-xl bg-surface-container-lowest p-6 text-center font-body-sm text-body-sm text-on-surface-variant shadow-sm";
const ERROR_CLASSES =
  "rounded-xl border border-error/30 bg-error-container px-4 py-3 font-body-sm text-body-sm text-on-error-container";
const PAGINATION_CLASSES =
  "flex flex-wrap items-center justify-between gap-2 pt-2 font-body-sm text-body-sm text-on-surface-variant";
const PAGE_LINK_CLASSES =
  "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors";

type PostListProps = {
  data: StaffPostsData;
};

export default function PostList({ data }: PostListProps) {
  if (data.error) {
    return (
      <p className={ERROR_CLASSES} role="alert">
        {data.error}
      </p>
    );
  }

  if (data.posts.length === 0) {
    return <p className={EMPTY_CLASSES}>Todavía no hay publicaciones.</p>;
  }

  const previousPage = data.page - 1;
  const nextPage = data.page + 1;

  return (
    <div className={LIST_CLASSES}>
      <ul className="space-y-4">
        {data.posts.map((post) => (
          <li key={post.id}>
            <PostCard imageUrls={data.imageUrls} post={post} />
          </li>
        ))}
      </ul>

      {data.page > 1 || data.hasMore ? (
        <nav aria-label="Paginación de publicaciones" className={PAGINATION_CLASSES}>
          {data.page > 1 ? (
            <Link
              className={PAGE_LINK_CLASSES}
              href={`/panel-aula/entradas?page=${previousPage}`}
            >
              <Icon name="chevron_left" size={18} />
              <span>Anteriores</span>
            </Link>
          ) : (
            <span />
          )}

          <span>
            Página {data.page} de {data.totalPages}
          </span>

          {data.hasMore ? (
            <Link
              className={PAGE_LINK_CLASSES}
              href={`/panel-aula/entradas?page=${nextPage}`}
            >
              <span>Siguientes</span>
              <Icon name="chevron_right" size={18} />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  );
}
