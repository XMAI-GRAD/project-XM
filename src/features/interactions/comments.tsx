import { Suspense } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { getCurrentUser } from "@/features/auth/queries";
import { PlaceMark } from "@/features/explore/place/art";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import type { DisplayComment } from "./comment-list-state";
import s from "./comments.module.css";
import { CommentsThread } from "./comments-thread";
import { type Comment, getComments } from "./queries";

/** Comments on a point page; `path` is where login returns to. */
export function Comments({
  lang,
  slug,
  path,
}: {
  lang: Locale;
  slug: string;
  path: string;
}) {
  const { comments } = getDictionary(lang);
  return (
    <section className={s.section} aria-labelledby="comments-heading">
      <div className={s.header}>
        <PlaceMark className={s.placeMark} />
        <h2 id="comments-heading" className={s.title}>
          {comments.title}
        </h2>
      </div>
      <ErrorBoundary
        fallback={
          <div className={s.columns}>
            <div className={s.left}>
              <p className={s.invitation}>{comments.invitation}</p>
            </div>
            <div className={s.right}>
              <p role="alert" className={s.note}>
                {comments.loadError}
              </p>
            </div>
          </div>
        }
      >
        <Suspense
          fallback={
            <CommentsSkeleton
              label={comments.loading}
              invitation={comments.invitation}
            />
          }
        >
          <CommentList lang={lang} slug={slug} path={path} />
        </Suspense>
      </ErrorBoundary>
    </section>
  );
}

function CommentsSkeleton({
  label,
  invitation,
}: {
  label: string;
  invitation: string;
}) {
  return (
    <div className={s.columns} aria-busy="true">
      <span className="sr-only">{label}</span>
      <div className={s.left}>
        <p className={s.invitation}>{invitation}</p>
        <span className={s.skeletonPill} aria-hidden="true" />
      </div>
      <div className={s.right} aria-hidden="true">
        <div className={s.skeletonEmpty}>
          <span className={s.skeletonMark} />
          <div className={s.skeletonLines}>
            <span className={s.skeletonLine} />
            <span className={s.skeletonLineShort} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ponytail: dates in Vietnam time for everyone; use the viewer's zone if the audience widens.
const dateFormat = (lang: Locale) =>
  new Intl.DateTimeFormat(lang, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  });

function toDisplay(c: Comment, format: Intl.DateTimeFormat): DisplayComment {
  return {
    id: c.id,
    body: c.body,
    createdAt: c.createdAt,
    formattedDate: format.format(new Date(c.createdAt)),
    author: c.author,
    replies: c.replies.map((reply) => toDisplay(reply, format)),
  };
}

async function CommentList({
  lang,
  slug,
  path,
}: {
  lang: Locale;
  slug: string;
  path: string;
}) {
  const [user, list] = await Promise.all([getCurrentUser(), getComments(slug)]);
  const { comments, errors } = getDictionary(lang);
  const format = dateFormat(lang);
  const displayComments = list.map((c) => toDisplay(c, format));

  return (
    <CommentsThread
      lang={lang}
      slug={slug}
      path={path}
      user={user}
      initialComments={displayComments}
      dict={{ comments, errors }}
    />
  );
}
