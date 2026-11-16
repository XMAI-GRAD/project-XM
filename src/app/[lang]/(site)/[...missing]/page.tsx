import { notFound } from "next/navigation";

// Unmatched paths under a locale render that locale's not-found.tsx.
export default function Missing() {
  notFound();
}
