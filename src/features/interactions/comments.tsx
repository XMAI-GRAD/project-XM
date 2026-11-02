import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { getCurrentUser } from "@/features/auth/queries";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { CommentForm } from "./comment-form";
import { DeleteCommentButton } from "./delete-comment-button";
import { type Comment, getComments } from "./queries";

/** Comments on a heritage or article page; `path` is where login returns to. */
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
    <section>
      <h2>{comments.title}</h2>
      <ErrorBoundary fallback={<p role="alert">{comments.loadError}</p>}>
        <Suspense fallback={<p>{comments.loading}</p>}>
          <CommentList lang={lang} slug={slug} path={path} />
        </Suspense>
      </ErrorBoundary>
    </section>
  );
}

// ponytail: dates in Vietnam time for everyone; use the viewer's zone if the audience widens.
const dateFormat = (lang: Locale) =>
  new Intl.DateTimeFormat(lang, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  });

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
  const dict = { comments, errors };
  const format = dateFormat(lang);
  return (
    <>
      {user ? (
        <CommentForm slug={slug} dict={dict} />
      ) : (
        <Link href={`/${lang}/login?next=${encodeURIComponent(path)}`}>
          {comments.login}
        </Link>
      )}
      {list.length === 0 ? (
        <p>{comments.empty}</p>
      ) : (
        <ul>
          {list.map((top) => (
            <li key={top.id}>
              {item(top)}
              {top.replies.length > 0 && (
                <ul>
                  {top.replies.map((reply) => (
                    <li key={reply.id}>{item(reply)}</li>
                  ))}
                </ul>
              )}
              {/* One level only: every reply in this thread attaches to `top`. */}
              {user && (
                <details>
                  <summary>{comments.reply}</summary>
                  <CommentForm slug={slug} parentId={top.id} dict={dict} />
                </details>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );

  function item(c: Comment) {
    return (
      <>
        {c.author.avatarUrl && (
          <Image src={c.author.avatarUrl} alt="" width={32} height={32} />
        )}
        <strong>{c.author.displayName || comments.anonymous}</strong>{" "}
        <time dateTime={c.createdAt}>
          {format.format(new Date(c.createdAt))}
        </time>
        <p className="whitespace-pre-line">{c.body}</p>
        {/* UI hint only: the delete policy is the real check. */}
        {(user?.id === c.author.id || user?.isAdmin) && (
          <DeleteCommentButton id={c.id} dict={dict} />
        )}
      </>
    );
  }
}
