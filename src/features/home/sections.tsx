import Link from "next/link";
import type { CSSProperties } from "react";
import { getPage, layers } from "@/content";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import {
  FrameLeft,
  frameLeftBox,
  FrameRight,
  frameRightBox,
  HeritageWave,
  heritageWaveBox,
  HeroSkyline,
  heroSkylineBox,
  HeroWave,
  heroWaveBox,
  JoinMark,
  LayerCraftLine,
  layerCraftLineBox,
  LayerCraftShapes,
  layerCraftShapesBox,
  LayerPlaceLine,
  layerPlaceLineBox,
  LayerPlaceShapes,
  layerPlaceShapesBox,
  LayerTasteLine,
  layerTasteLineBox,
  LayerTasteShapes,
  layerTasteShapesBox,
  MapMark,
  pieces,
  RailMark,
  railMarkBox,
  RolesCloud,
  rolesCloudBox,
  RolesCluster,
  rolesClusterBox,
  RolesLine,
  rolesLineBox,
  RolesPetal,
  rolesPetalBox,
  RolesWave,
  rolesWaveBox,
  StatsBand,
  statsBandBox,
  ThreadLine,
  threadLineBox,
  ThreadPattern,
  threadPatternBox,
} from "./art";
import s from "./home.module.css";
import { at } from "./place";
import { CountUp } from "./motion/count-up";
import { HeritageMotion } from "./motion/heritage-motion";
import { HeroMotion } from "./motion/hero-motion";
import { LayersMotion } from "./motion/layers-motion";
import { RolesMotion } from "./motion/roles-motion";
import { ThreadMotion } from "./motion/thread-motion";
import { RichText, toneClass } from "./rich-text";

const text = `${s.at} ${s.text}`;
const display = `${text} ${s.display}`;
/** A display heading whose words move: placed by cap top without text-box trim. */
const movingDisplay = `${s.at} ${s.display} ${s.capTop}`;

/** The lime frame around the card, painted above the drawings it crops. */
export function Frame() {
  return (
    <div className={s.frame} aria-hidden="true">
      <FrameLeft className={s.at} style={at(frameLeftBox)} />
      <FrameRight className={s.at} style={at(frameRightBox)} />
      <RailMark className={s.at} style={at(railMarkBox)} />
    </div>
  );
}

export function Hero({ lang }: { lang: Locale }) {
  const { hero } = getPage("home");
  return (
    <HeroMotion className={`${s.section} ${s.hero}`}>
      <HeroSkyline className={s.at} style={at(heroSkylineBox)} />
      <HeroWave className={s.at} style={at(heroWaveBox)} />
      <h1 className={`${display} ${s.heroTitle}`}>
        <RichText text={hero.title[lang]} split />
      </h1>
      <p className={`${display} ${s.right} ${s.tagline}`} data-motion="tagline">
        <RichText text={hero.tagline[lang]} />
      </p>
    </HeroMotion>
  );
}

/** Mạch nối ——— ngàn năm: the woven pattern and who coordinates the city. */
export function Thread({ lang }: { lang: Locale }) {
  const { thread } = getPage("home");
  const { home } = getDictionary(lang);
  const [start, end] = thread.title[lang];
  return (
    <ThreadMotion className={`${s.section} ${s.thread}`}>
      <h2>
        <span className={`${display} ${s.threadStart}`}>
          <RichText text={start} />
        </span>{" "}
        <span className={`${display} ${s.right} ${s.threadEnd}`}>
          <RichText text={end} />
        </span>
      </h2>
      <ThreadLine className={s.at} style={at(threadLineBox)} />
      <ThreadPattern className={s.at} style={at(threadPatternBox)} />
      <div className={`${text} ${s.threadBody}`} data-motion="thread-body">
        {thread.body[lang].map((p) => (
          <p key={p}>
            <RichText text={p} />
          </p>
        ))}
      </div>
      <Link
        href={`/${lang}/join`}
        className={`${s.at} ${s.joinLink}`}
        data-motion="join"
      >
        <JoinMark />
        <span>{home.joinNetwork}</span>
      </Link>
    </ThreadMotion>
  );
}

/** The band of four counts, each centred under its icon. */
export function Stats({ lang }: { lang: Locale }) {
  const { stats } = getPage("home");
  return (
    <section className={`${s.section} ${s.stats} ${s.rule}`}>
      <StatsBand className={s.at} style={at(statsBandBox)} />
      <ul className={s.statList}>
        {stats.map((count) => {
          const piece = pieces[count.art];
          if (!piece)
            throw new Error(`data/home.yaml: unknown art "${count.art}"`);
          const { Art, box } = piece;
          const style = { "--cx": box.x + box.w / 2 } as CSSProperties;
          return (
            <li key={count.art} style={style} className={toneClass(count.tone)}>
              <Art className={s.at} style={at(box)} />
              <span className={s.statValue}>
                <CountUp to={count.value} />
              </span>{" "}
              <span className={s.statLabel}>{count.label[lang]}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** The motto, and the state, the artists and the public drawn as linked buildings. */
export function Roles({ lang }: { lang: Locale }) {
  const { roles } = getPage("home");
  return (
    <RolesMotion className={`${s.section} ${s.roles}`}>
      <h2 className={`${movingDisplay} ${s.rolesTitle}`}>
        <RichText text={roles.title[lang]} split />
      </h2>
      <RolesPetal className={s.at} style={at(rolesPetalBox)} />
      <RolesCluster className={s.at} style={at(rolesClusterBox)} />
      <RolesCloud className={s.at} style={at(rolesCloudBox)} />
      <RolesWave className={s.at} style={at(rolesWaveBox)} />
      <RolesLine className={s.at} style={at(rolesLineBox)} />
      <ul className={s.roleList}>
        <li className={`${display} ${s.state}`} data-role="state">
          {roles.state[lang]}
        </li>
        <li className={`${display} ${s.artists}`} data-role="artists">
          {roles.artists[lang]}
        </li>
        <li className={`${display} ${s.public}`} data-role="public">
          {roles.public[lang]}
        </li>
      </ul>
    </RolesMotion>
  );
}

/** Từ 2019: what Hanoi already has, in two paragraphs and four numbers. */
export function Heritage({ lang }: { lang: Locale }) {
  const { heritage } = getPage("home");
  const [left, right] = heritage.body[lang];
  return (
    <HeritageMotion className={`${s.section} ${s.heritage} ${s.rule}`}>
      <HeritageWave className={s.at} style={at(heritageWaveBox)} />
      <p className={`${text} ${s.since}`} data-motion="since">
        {heritage.since[lang]}
      </p>
      <h2 className={`${movingDisplay} ${s.heritageTitle}`}>
        <RichText text={heritage.title[lang]} split />
      </h2>
      <p
        className={`${text} ${s.heritageBody} ${s.heritageLeft}`}
        data-motion="heritage-body"
      >
        <RichText text={left} />
      </p>
      <p
        className={`${text} ${s.heritageBody} ${s.heritageRight}`}
        data-motion="heritage-body"
      >
        <RichText text={right} />
      </p>
      <ul className={s.numbers} data-motion="numbers">
        {heritage.numbers.map((n) => {
          const [, digits, plus] = n.value.match(/^(.*?)(\+?)$/)!;
          return (
            <li
              key={n.value}
              className={`${s.at} ${s.number} ${toneClass(n.tone)}`}
              data-motion="number"
            >
              <span className={s.numberValue}>
                {digits}
                {plus && <span className={s.plus}>{plus}</span>}
              </span>{" "}
              <span className={s.numberLabel}>{n.label[lang]}</span>
            </li>
          );
        })}
      </ul>
    </HeritageMotion>
  );
}

const layerArt = {
  place: {
    Line: LayerPlaceLine,
    line: layerPlaceLineBox,
    Shapes: LayerPlaceShapes,
    shapes: layerPlaceShapesBox,
  },
  taste: {
    Line: LayerTasteLine,
    line: layerTasteLineBox,
    Shapes: LayerTasteShapes,
    shapes: layerTasteShapesBox,
  },
  craft: {
    Line: LayerCraftLine,
    line: layerCraftLineBox,
    Shapes: LayerCraftShapes,
    shapes: layerCraftShapesBox,
  },
};

/** Ba mạch của thành phố: ĐỊA · VỊ · NGHỀ, and the way into the map. */
export function Layers({ lang }: { lang: Locale }) {
  const { layers: copy } = getPage("home");
  const { layers: names, home } = getDictionary(lang);
  return (
    <LayersMotion className={`${s.section} ${s.layers} ${s.rule}`}>
      <h2>
        <span className={`${display} ${s.layersKicker}`}>
          {copy.kicker[lang]}
        </span>{" "}
        <span className={`${display} ${s.layersTitle}`}>
          <RichText text={copy.title[lang]} />
        </span>
      </h2>
      <ul className={s.layerList}>
        {layers.map((layer) => {
          const { Line, line, Shapes, shapes } = layerArt[layer];
          return (
            <li key={layer} data-layer={layer}>
              <Line className={s.at} style={at(line)} />
              <Shapes className={s.at} style={at(shapes)} />
              <span
                className={`${display} ${s.layerName}`}
                data-motion="layer-name"
              >
                {names[layer]}
              </span>{" "}
              <span
                className={`${text} ${s.layerCaption}`}
                data-motion="layer-caption"
              >
                {copy[layer][lang]}
              </span>
            </li>
          );
        })}
      </ul>
      <Link href={`/${lang}/maps`} className={`${s.at} ${s.mapLink}`}>
        <MapMark />
        <span>{home.openMap}</span>
      </Link>
    </LayersMotion>
  );
}
