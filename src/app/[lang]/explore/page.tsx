import { redirect } from "next/navigation";
import { getLocale } from "@/i18n/server";

/** Explore has a page per layer; the bare path opens the first, ĐỊA. */
export default async function ExplorePage() {
  redirect(`/${await getLocale()}/explore/place`);
}
