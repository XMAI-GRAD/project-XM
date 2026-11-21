import type { CSSProperties } from "react";
import { getPage } from "@/content";
import type { Locale } from "@/i18n/config";
import {
  AboutFieldsLine,
  aboutFieldsLineBox,
  AboutFrameEndLeft,
  aboutFrameEndLeftBox,
  AboutFrameEndRight,
  aboutFrameEndRightBox,
  AboutIntroLine,
  aboutIntroLineBox,
  AboutPetal,
  aboutPetalBox,
  AboutTimelineLine,
  aboutTimelineLineBox,
  AboutWorkLine,
  aboutWorkLineBox,
  pieces,
} from "@/features/home/art";
import h from "@/features/home/home.module.css";
import { at } from "@/features/home/place";
import { RichText } from "@/features/home/rich-text";
import s from "./about.module.css";

const text = `${h.at} ${h.text}`;
const display = `${text} ${h.display}`;

/** A piece named in data/ (a role's mark, a year's shape), or a build failure. */
function piece(name: string) {
  const found = pieces[name];
  if (!found) throw new Error(`data/about.yaml: unknown art "${name}"`);
  return found;
}

/** GIỚI THIỆU, the heading set around the petal, the words beside it, the intro. */
export function Intro({ lang }: { lang: Locale }) {
  const { title, heading, petal, intro } = getPage("about");
  return (
    <section className={`${h.section} ${s.intro}`}>
      <AboutPetal className={h.at} style={at(aboutPetalBox)} />
      <AboutIntroLine className={h.at} style={at(aboutIntroLineBox)} />
      <p className={`${text} ${s.label}`}>{title[lang]}</p>
      <h1 className={s.heading}>
        {heading[lang].split("\n").map((line, i) => (
          <span key={i} className={`${display} ${s.headingLine}`}>
            <RichText text={line} />{" "}
          </span>
        ))}
      </h1>
      <p className={`${text} ${s.note} ${s.petalRight}`}>{petal.right[lang]}</p>
      <p className={`${text} ${s.note} ${s.petalLeft}`}>{petal.left[lang]}</p>
      <p className={`${text} ${s.introBody}`}>
        <RichText text={intro[lang]} />
      </p>
    </section>
  );
}

/** Chứng nhận · Bệ phóng · Kết nối: each with its mark and a hook to its line. */
export function Work({ lang }: { lang: Locale }) {
  const { work } = getPage("about");
  return (
    <section className={`${h.section} ${s.work}`}>
      <h2 className="sr-only">{work.title[lang]}</h2>
      <ol className={s.workList}>
        {work.items.map((item, i) => {
          const mark = piece(item.art);
          const hook = piece(`about-work-hook-${i + 1}`);
          return (
            <li key={item.art}>
              <mark.Art className={h.at} style={at(mark.box)} />
              <hook.Art className={h.at} style={at(hook.box)} />
              <h3 className={`${display} ${s.workName}`}>{item.title[lang]}</h3>
              <p className={`${text} ${s.workBody}`}>{item.body[lang]}</p>
            </li>
          );
        })}
      </ol>
      <AboutWorkLine className={h.at} style={at(aboutWorkLineBox)} />
    </section>
  );
}

/** The five fields, set as one block with icons between the words. */
export function Fields({ lang }: { lang: Locale }) {
  const { fields } = getPage("about");
  return (
    <section className={`${h.section} ${s.fields}`}>
      <h2 className={`${h.at} ${h.display} ${h.capTop} ${s.fieldsDisplay}`}>
        <RichText text={fields.display[lang]} />
      </h2>
      <p className={`${text} ${s.fieldsNote}`}>{fields.note[lang]}</p>
      <AboutFieldsLine className={h.at} style={at(aboutFieldsLineBox)} />
    </section>
  );
}

/** The years along one winding line; a year with a shape sits on it. */
export function Timeline({ lang }: { lang: Locale }) {
  const { timeline } = getPage("about");
  return (
    <section className={`${h.section} ${s.timeline}`}>
      <h2 className={`${text} ${s.label} ${s.timelineLabel}`}>
        {timeline.title[lang]}
      </h2>
      <AboutTimelineLine className={h.at} style={at(aboutTimelineLineBox)} />
      <ol className={s.years}>
        {timeline.items.map((item) => {
          const shape = pieces[`about-year-${item.year}`];
          return (
            <li key={item.year}>
              {shape && <shape.Art className={h.at} style={at(shape.box)} />}
              <span
                className={`${display} ${s.year}`}
                data-on-shape={shape ? "" : undefined}
                style={
                  shape
                    ? ({
                        "--cx": shape.box.x + shape.box.w / 2,
                      } as CSSProperties)
                    : undefined
                }
              >
                {item.year}
              </span>
              <p className={`${text} ${s.yearBody}`}>{item.body[lang]}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/**
 * The frame's bottom corners. The shared frame (home's) runs on past this page's end,
 * so the page closes it with the last slide of its own comp, painted over it.
 */
export function FrameEnd() {
  return (
    <div className={h.frame} aria-hidden="true">
      <AboutFrameEndLeft className={h.at} style={at(aboutFrameEndLeftBox)} />
      <AboutFrameEndRight className={h.at} style={at(aboutFrameEndRightBox)} />
    </div>
  );
}
