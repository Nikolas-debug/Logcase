"use client";

import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { Icon } from "./icons";
import { useShop } from "./shop-provider";

const SLIDE_MS = 6500;
const REVEAL = { duration: 950, easing: "cubic-bezier(0.77, 0, 0.175, 1)" }; // strong ease-in-out: on-screen movement

// Editorial carousel: the incoming slide wipes in over the current one (clip-path), its photo settles
// from a slight zoom, the outgoing one drifts back (parallax) and the copy rises in with a stagger.
// Autoplay is driven by the progress bar's CSS animation, so pausing it pauses the timer too.
export function Hero() {
  const { shop, slides } = useShop();
  const [{ i, prev, dir }, setPos] = useState({ i: 0, prev: -1, dir: 1 });
  const [hover, setHover] = useState(false);
  const [stopped, setStopped] = useState(false); // explicit pause (WCAG 2.2.2) or reduced motion
  const refs = useRef<(HTMLElement | null)[]>([]);
  const drag = useRef<{ x: number; y: number; t: number } | null>(null);
  const n = slides.length;
  const cur = Math.min(i, n - 1);

  const go = (delta: number) => setPos((s) => ({ i: (s.i + delta + n) % n, prev: s.i, dir: Math.sign(delta) }));
  const goTo = (k: number) => setPos((s) => (k === s.i ? s : { i: k, prev: s.i, dir: k > s.i ? 1 : -1 }));

  useLayoutEffect(() => {
    // After mount so server and client render the same first frame.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) setStopped(true);
  }, []);

  useLayoutEffect(() => {
    const el = refs.current[i];
    if (prev < 0 || !el) return;
    const old = refs.current[prev];
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const anims = reduce
      ? [el.animate({ opacity: [0, 1] }, { duration: 300, easing: "ease" })]
      : [
          el.animate({ clipPath: [dir > 0 ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)", "inset(0 0 0 0)"] }, REVEAL),
          el.querySelector("img")?.animate({ transform: ["scale(1.08)", "scale(1)"] }, { duration: 1600, easing: "cubic-bezier(0.23, 1, 0.32, 1)" }),
          old?.animate({ transform: ["translateX(0)", `translateX(${-14 * dir}%)`], filter: ["brightness(1)", "brightness(0.55)"] }, REVEAL),
        ];
    // Interrupted (fast taps): snap the running reveal to its end; the next one starts from there.
    return () => anims.forEach((a) => a?.finish());
  }, [i, prev, dir]);

  if (!n) return null;
  const paused = stopped || hover;

  return (
    <section
      aria-roledescription="carrusel"
      aria-label="Destacados"
      className="relative mx-auto grid min-h-[clamp(28rem,68svh,52rem)] w-[90%] max-w-[100rem] touch-pan-y select-none overflow-hidden rounded-[1.25rem] bg-black text-white"
      onPointerEnter={(e) => e.pointerType === "mouse" && setHover(true)}
      onPointerLeave={() => setHover(false)}
      onPointerDown={(e) => {
        if (e.pointerType !== "mouse") drag.current = { x: e.clientX, y: e.clientY, t: performance.now() };
      }}
      onPointerUp={(e) => {
        const d = drag.current;
        drag.current = null;
        if (!d) return;
        const dx = e.clientX - d.x;
        const velocity = Math.abs(dx) / (performance.now() - d.t);
        // Distance or a quick flick, as long as the gesture was mostly horizontal.
        if (Math.abs(dx) > Math.abs(e.clientY - d.y) && (Math.abs(dx) > 48 || (Math.abs(dx) > 12 && velocity > 0.3))) go(dx < 0 ? 1 : -1);
      }}
      onPointerCancel={() => (drag.current = null)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
      }}
    >
      {slides.map((s, k) => {
        const active = k === cur;
        return (
          <article
            key={s.id}
            ref={(el) => {
              refs.current[k] = el;
            }}
            data-active={active}
            aria-roledescription="diapositiva"
            aria-label={`${k + 1} de ${n}`}
            aria-hidden={!active}
            inert={!active}
            className={`relative bg-black [grid-area:1/1] md:grid md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] ${active ? "z-20" : k === prev ? "z-10" : "invisible"}`}
          >
            <div className="absolute inset-0 overflow-hidden md:relative md:order-2">
              <Image src={s.image} alt="" fill priority={k === 0} sizes="(min-width: 768px) 55vw, 90vw" className="object-cover" />
              <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgb(0_0_0/0.5),transparent_22%)] md:bg-[linear-gradient(to_bottom,rgb(0_0_0/0.35),transparent_18%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(to_top,rgb(0_0_0/0.85),rgb(0_0_0/0.4)_45%,transparent_70%)] md:hidden" />
            </div>
            <div className="hero-copy relative flex h-full flex-col justify-end gap-4 p-6 pb-8 pt-20 sm:p-10 sm:pt-24 md:justify-center md:p-14 md:pt-24 lg:p-20 lg:pt-24">
              <h2 style={{ "--i": 0 } as React.CSSProperties} className="display max-w-[12ch] text-[clamp(2.5rem,6.2vw,5.75rem)]">
                {s.title}
              </h2>
              {s.text && (
                <p style={{ "--i": 1 } as React.CSSProperties} className="max-w-[34ch] text-base text-white/75 sm:text-lg">
                  {s.text}
                </p>
              )}
              {s.category && (
                <div style={{ "--i": 2 } as React.CSSProperties} className="pt-2">
                  <Link href={`/${shop.slug}?c=${encodeURIComponent(s.category)}#catalogo`} className="btn border-2 border-white text-white hover:bg-white hover:text-black">
                    Ver colección
                    <Icon name="arrow" className="size-4" />
                  </Link>
                </div>
              )}
            </div>
          </article>
        );
      })}

      {n > 1 && (
        <>
          <div className="absolute inset-x-4 top-4 z-30 flex items-center gap-3 sm:inset-x-6 sm:top-6">
            <div className="flex flex-1 gap-1.5">
              {slides.map((s, k) => (
                <button key={s.id} onClick={() => goTo(k)} className="group flex-1 py-2" aria-label={`Ir a ${s.title}`} aria-current={k === cur}>
                  <span className="block h-[3px] overflow-hidden rounded-full bg-white/30 transition-colors group-hover:bg-white/50">
                    <span
                      key={k === cur ? `${i}-${prev}` : undefined}
                      onAnimationEnd={k === cur ? () => go(1) : undefined}
                      style={k === cur ? { animation: `fill ${SLIDE_MS}ms linear both`, animationPlayState: paused ? "paused" : "running" } : undefined}
                      className={`block h-full origin-left rounded-full bg-white ${k > cur ? "scale-x-0" : ""}`}
                    />
                  </span>
                </button>
              ))}
            </div>
            <button onClick={() => setStopped((v) => !v)} className="press grid size-9 place-items-center rounded-full bg-black/30 backdrop-blur" aria-label={stopped ? "Reanudar" : "Pausar"}>
              <Icon name={stopped ? "play" : "pause"} className="size-4" />
            </button>
          </div>
          <div className="absolute bottom-6 right-6 z-30 hidden gap-2 md:flex">
            {(["left", "right"] as const).map((d) => (
              <button
                key={d}
                onClick={() => go(d === "left" ? -1 : 1)}
                className="press grid size-12 place-items-center rounded-full bg-white/15 text-white backdrop-blur-md transition-colors hover:bg-white hover:text-black"
                aria-label={d === "left" ? "Anterior" : "Siguiente"}
              >
                <Icon name={d} />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
