"use client";

import Image from "next/image";
import Link from "next/link";
import { useOptimistic, useRef, useState } from "react";
import type { CurrentUser } from "@/features/auth/queries";
import { FactMark } from "@/features/explore/art";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { CommentForm } from "./comment-form";
import {
  appendOptimisticComment,
  type DisplayComment,
} from "./comment-list-state";
import s from "./comments.module.css";
import { DeleteCommentButton } from "./delete-comment-button";

// Matches the server formatter in comments.tsx for newly submitted optimistic entries.
const formatClientDate = (lang: Locale, date: Date) =>
  new Intl.DateTimeFormat(lang, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);

/** Two-column memory prompt (left) and thread/empty state (right) with optimistic posting. */
export function CommentsThread({
  lang,
  slug,
  path,
  user,
  initialComments,
  dict,
}: {
  lang: Locale;
  slug: string;
  path: string;
  user: CurrentUser | null;
  initialComments: DisplayComment[];
  dict: Pick<Dictionary, "comments" | "errors">;
}) {
  const [optimisticComments, addOptimistic] = useOptimistic(
    initialComments,
    appendOptimisticComment,
  );
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const nextTempId = useRef(-1);

  const handleOptimisticAdd = (body: string, parentId?: number) => {
    if (!user) return;
    const now = new Date();
    addOptimistic({
      tempId: nextTempId.current--,
      body,
      parentId,
      createdAt: now.toISOString(),
      formattedDate: formatClientDate(lang, now),
      author: {
        id: user.id,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
    });
  };

  return (
    <div className={s.columns}>
      <div className={s.left}>
        <p className={s.invitation}>{dict.comments.invitation}</p>
        {user ? (
          <CommentForm
            slug={slug}
            dict={dict}
            onOptimisticAdd={handleOptimisticAdd}
          />
        ) : (
          <Link
            href={`/${lang}/login?next=${encodeURIComponent(path)}`}
            className={s.login}
          >
            {dict.comments.login} <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>

      <div className={s.right}>
        {optimisticComments.length === 0 ? (
          <div className={s.empty}>
            <FactMark className={s.emptyMark} />
            <p className={s.emptyText}>{dict.comments.empty}</p>
          </div>
        ) : (
          <ul className={s.list} aria-label={dict.comments.title}>
            {optimisticComments.map((top) => (
              <li key={top.id} className={s.thread}>
                {renderItem(top, true)}
                {(top.replies.length > 0 ||
                  (user && !top.pending && replyingTo === top.id)) && (
                  <div className={s.repliesBlock}>
                    {top.replies.length > 0 && (
                      <ul className={s.replies}>
                        {top.replies.map((reply) => (
                          <li key={reply.id} className={s.replyItem}>
                            {renderItem(reply, false)}
                          </li>
                        ))}
                      </ul>
                    )}
                    {/* One level only: every reply in this thread attaches to `top`. */}
                    {user && !top.pending && replyingTo === top.id && (
                      <div className={s.replyFormWrap}>
                        <CommentForm
                          slug={slug}
                          parentId={top.id}
                          dict={dict}
                          onOptimisticAdd={handleOptimisticAdd}
                          onSuccess={() => setReplyingTo(null)}
                        />
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  function renderItem(c: DisplayComment, isTopLevel: boolean) {
    const canReply = Boolean(user && isTopLevel && !c.pending);
    const canDelete = Boolean(
      !c.pending && (user?.id === c.author.id || user?.isAdmin),
    );
    return (
      <div
        className={c.pending ? `${s.item} ${s.itemPending}` : s.item}
        aria-busy={c.pending || undefined}
      >
        <p className={s.body}>{c.body}</p>
        <div className={s.metaRow}>
          <div className={s.byline}>
            {c.author.avatarUrl && (
              <Image
                src={c.author.avatarUrl}
                alt=""
                width={24}
                height={24}
                className={s.avatar}
              />
            )}
            <span className={s.author}>
              {c.author.displayName || dict.comments.anonymous}
            </span>
            <span className={s.sep} aria-hidden="true">
              ·
            </span>
            <time dateTime={c.createdAt} className={s.date}>
              {c.formattedDate}
            </time>
          </div>
          {(canReply || canDelete) && (
            <div className={s.actions}>
              {canReply && (
                <button
                  type="button"
                  className={s.textAction}
                  aria-expanded={replyingTo === c.id}
                  onClick={() =>
                    setReplyingTo((cur) => (cur === c.id ? null : c.id))
                  }
                >
                  {dict.comments.reply}
                </button>
              )}
              {/* UI hint only: the delete policy is the real check. */}
              {canDelete && <DeleteCommentButton id={c.id} dict={dict} />}
            </div>
          )}
        </div>
      </div>
    );
  }
}
