"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { formatCOP } from "@/lib/cart";
import { fold } from "@/lib/search";
import type { Product } from "@/lib/shops";
import { Icon } from "./icons";
import { useShop } from "./shop-provider";

export const container = "mx-auto w-[90%] max-w-[100rem]";

const social = "press grid size-11 place-items-center rounded-full bg-surface ring-1 ring-black/8 transition-colors hover:bg-raised";

export function StoreHeader() {
  const { shop } = useShop();
  return (
    <header className={`${container} flex items-center justify-between gap-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))]`}>
      <Link href={`/${shop.slug}`} className="flex min-w-0 items-center gap-3">
        <Image src={shop.logo} alt="" width={44} height={44} className="size-11 shrink-0 rounded-full" priority />
        <span className="min-w-0">
          <span className="block truncate font-medium leading-tight">{shop.name}</span>
          <span className="block truncate text-sm text-muted">{shop.tagline}</span>
        </span>
      </Link>
      <div className="flex shrink-0 gap-2">
        <a href={`https://instagram.com/${shop.instagram}`} target="_blank" rel="noreferrer" aria-label={`Instagram @${shop.instagram}`} className={social}>
          <Image src="/brand/instagram.webp" alt="" width={24} height={24} className="size-6" />
        </a>
        <a href={`https://wa.me/${shop.whatsapp}`} target="_blank" rel="noreferrer" aria-label="Escribir por WhatsApp" className={social}>
          <Image src="/brand/whatsapp.webp" alt="" width={26} height={26} className="size-[1.625rem]" />
        </a>
      </div>
    </header>
  );
}

export function StoreFooter() {
  const { shop } = useShop();
  return (
    <footer className={`${container} mt-24 flex flex-col gap-6 border-t border-black/8 pt-10 text-sm text-muted sm:flex-row sm:items-end sm:justify-between`}>
      <div className="flex flex-col gap-1">
        <p className="text-base font-medium text-fg">{shop.name}</p>
        <p>{shop.city} · WhatsApp {shop.whatsapp.replace(/^57(\d{3})(\d{3})(\d{4})$/, "$1 $2 $3")}</p>
        <a href={`https://instagram.com/${shop.instagram}`} target="_blank" rel="noreferrer" className="underline-offset-4 hover:text-fg hover:underline">
          @{shop.instagram}
        </a>
      </div>
      <div className="flex gap-5">
        <Link href={`/${shop.slug}/admin`} className="underline-offset-4 hover:text-fg hover:underline">
          Administrar
        </Link>
        <Link href="/" className="underline-offset-4 hover:text-fg hover:underline">
          Hecho con Logcase
        </Link>
      </div>
    </footer>
  );
}

export function Catalog() {
  const { shop, products } = useShop();
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const c = params.get("c") ?? "";
  const shown = products.filter((p) => (!c || p.category === c) && (!q || fold(`${p.name} ${p.ref} ${p.category}`).includes(fold(q))));
  const chip = (active: boolean) =>
    `press shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${active ? "bg-fg text-bg" : "bg-surface ring-1 ring-black/8 hover:bg-raised"}`;

  return (
    <section id="catalogo" className="scroll-mt-4 pt-14 sm:pt-20">
      <div className={`${container} flex flex-wrap items-end justify-between gap-x-6 gap-y-2`}>
        <h1 className="display text-[clamp(2.25rem,5vw,3.5rem)]">{q ? `“${q}”` : c || "Todo el catálogo"}</h1>
        <p className="pb-2 text-muted">
          {shown.length} {shown.length === 1 ? "producto" : "productos"}
          {q && c && ` en ${c}`}
        </p>
      </div>

      <nav className={`${container} mt-6 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]`} aria-label="Categorías">
        <Link href={`/${shop.slug}#catalogo`} scroll={false} className={chip(!c && !q)}>
          Todo
        </Link>
        {shop.categories.map((cat) => (
          <Link key={cat} href={`/${shop.slug}?c=${encodeURIComponent(cat)}`} scroll={false} className={chip(c === cat)}>
            {cat}
          </Link>
        ))}
      </nav>

      {shown.length > 0 ? (
        <ul className={`${container} mt-8 grid grid-cols-2 gap-x-3 gap-y-9 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 2xl:grid-cols-5`}>
          {shown.map((p) => (
            <li key={p.ref}>
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      ) : (
        <div className={`${container} flex flex-col items-center gap-3 py-24 text-center`}>
          <p className="text-xl font-medium">No encontramos productos</p>
          <p className="text-muted">Prueba con otra búsqueda o categoría.</p>
          <Link href={`/${shop.slug}#catalogo`} className="btn mt-3 bg-fg text-bg">
            Ver todo el catálogo
          </Link>
        </div>
      )}
    </section>
  );
}

// Same shape as the grid, shown while the client reads the URL filters.
export function CatalogSkeleton() {
  return (
    <section className="pt-14 sm:pt-20" aria-hidden>
      <div className={`${container} h-12 w-64 max-w-full animate-pulse rounded-full bg-raised`} />
      <ul className={`${container} mt-[5.5rem] grid grid-cols-2 gap-x-3 gap-y-9 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 2xl:grid-cols-5`}>
        {Array.from({ length: 8 }, (_, k) => (
          <li key={k} className="aspect-[4/5] animate-pulse rounded-2xl bg-raised" />
        ))}
      </ul>
    </section>
  );
}

export function ProductCard({ product: p }: { product: Product }) {
  const { shop } = useShop();
  const soldOut = p.stock <= 0;
  return (
    <div className="group relative">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-raised">
        <Image
          src={p.image}
          alt=""
          fill
          sizes="(min-width: 1536px) 18vw, (min-width: 1024px) 22vw, (min-width: 640px) 30vw, 45vw"
          className={`object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] ${soldOut ? "opacity-50 grayscale" : ""}`}
        />
        {soldOut ? <span className="absolute left-3 top-3 rounded-full bg-surface px-3 py-1 text-xs font-medium">Agotado</span> : <QuickAdd product={p} />}
      </div>
      <Link href={`/${shop.slug}/p/${p.ref}`} className="mt-3 line-clamp-2 text-[0.9375rem] font-medium leading-snug after:absolute after:inset-0 after:rounded-2xl">
        {p.name}
      </Link>
      <p className="mt-1 text-sm tabular-nums text-muted">{formatCOP(p.price)}</p>
    </div>
  );
}

// Products with sizes need a choice first, so their button opens the product page instead of adding.
function QuickAdd({ product: p }: { product: Product }) {
  const { shop, add } = useShop();
  const [added, setAdded] = useState(false);
  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1400);
    return () => clearTimeout(t);
  }, [added]);

  const cls = `press absolute bottom-2.5 right-2.5 z-[1] grid size-10 place-items-center rounded-full shadow-[0_4px_12px_rgb(0_0_0/0.18)] transition-[transform,background-color,color] ${
    added ? "bg-accent text-ink" : "bg-surface text-fg hover:bg-fg hover:text-bg"
  }`;
  if (p.sizes?.length) {
    return (
      <Link href={`/${shop.slug}/p/${p.ref}`} className={cls} aria-label={`Elegir talla de ${p.name}`}>
        <Icon name="plus" />
      </Link>
    );
  }
  return (
    <button
      className={cls}
      onClick={() => {
        add(p);
        setAdded(true);
      }}
      aria-label={added ? `${p.name} agregado` : `Agregar ${p.name}`}
    >
      <span key={String(added)} className="motion-safe:animate-[bump_300ms_var(--ease-out)]">
        <Icon name={added ? "check" : "plus"} />
      </span>
    </button>
  );
}
