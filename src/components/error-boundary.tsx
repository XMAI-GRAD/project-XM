"use client";

import { catchError } from "next/error";
import type { ReactNode } from "react";

/** Renders `fallback` if its children throw. redirect()/notFound() still work. */
export const ErrorBoundary = catchError(
  (props: { fallback: ReactNode }) => props.fallback,
);
