"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { formatCOP, whatsappUrl } from "@/lib/cart";
import { container, ProductCard, ShopLogo } from "./catalog";
import { Icon } from "./icons";
import { openSheet, SHEETS, useShop } from "./shop-provider";

export function ProductView() {
  const { shop, products, add } = useShop();
  const { ref } = useParams<{ ref: string }>();
  const p = products.find((x) => x.ref === decodeURIComponent(ref));
  const [size, setSize] = useState<string>();

  if (!p) {
    return (
      <div className={`${container} flex flex-col items-center gap-4 py-32 text-center`}>
        <p className="display text-4xl">Producto no encontrado</p>
        <p className="text-muted">Puede que se haya agotado o cambiado de referencia.</p>
        <Link href={`/${shop.slug}`} className="btn mt-2 bg-fg text-bg">
          Volver al catálogo
        </Link>
      </div>
    );
  }

  const soldOut = p.stock <= 0;
  const needsSize = !!p.sizes?.length && !size;
  const item = { ref: p.ref, name: p.name, price: p.price, size, qty: 1 };
  const related = products.filter((x) => x.category === p.category && x.ref !== p.ref).slice(0, 4);

  return (
    <>
      <nav className={`${container} flex items-center justify-between pb-4 pt-[max(1rem,env(safe-area-inset-top))]`}>
        <Link href={`/${shop.slug}`} className="press flex h-11 items-center gap-2 rounded-full bg-surface pl-3 pr-4 text-sm font-medium ring-1 ring-black/8 hover:bg-raised">
          <Icon name="back" className="size-4" />
          Catálogo
        </Link>
        <Link href={`/${shop.slug}`} aria-label={shop.name}>
          <ShopLogo name={shop.name} logo={shop.logo} accent={shop.theme.accent} size={44} />
        </Link>
      </nav>

      <article className={`${container} grid gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:items-start lg:gap-16`}>
        <div className="relative aspect-[4/5] overflow-hidden rounded-[1.25rem] bg-raised md:sticky md:top-6">
          <Image src={p.image} alt={p.name} fill priority sizes="(min-width: 768px) 50vw, 90vw" className={`object-cover ${soldOut ? "opacity-60 grayscale" : ""}`} />
        </div>

        <div className="flex flex-col gap-6 md:py-6">
          <div className="flex flex-col gap-3">
            <Link href={`/${shop.slug}?c=${encodeURIComponent(p.category)}#catalogo`} className="w-fit rounded-full bg-surface px-3 py-1 text-xs font-medium ring-1 ring-black/8 hover:bg-raised">
              {p.category}
            </Link>
            <h1 className="display text-[clamp(2.25rem,4.5vw,3.75rem)]">{p.name}</h1>
            <p className="text-sm text-muted">Ref. {p.ref}</p>
          </div>
          <p className="text-3xl font-[400] tabular-nums">{formatCOP(p.price)}</p>
          {p.description && <p className="max-w-[60ch] text-lg leading-relaxed text-muted">{p.description}</p>}

          {!!p.sizes?.length && (
            <fieldset>
              <legend className="mb-3 text-sm font-medium">Talla</legend>
              <div className="flex flex-wrap gap-2">
                {p.sizes.map((s) => (
                  <label
                    key={s}
                    className="press grid h-12 min-w-12 cursor-pointer place-items-center rounded-full bg-surface px-5 font-medium ring-1 ring-black/12 transition-colors hover:ring-fg has-checked:bg-fg has-checked:text-bg has-checked:ring-fg has-focus-visible:outline-2 has-focus-visible:outline-offset-2"
                  >
                    <input type="radio" name="size" value={s} checked={size === s} onChange={() => setSize(s)} className="sr-only" />
                    {s}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {soldOut ? (
            <p className="btn w-fit bg-raised text-muted">Agotado por ahora</p>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                className="btn bg-fg text-bg hover:bg-[#3f3f46]"
                disabled={needsSize}
                onClick={() => {
                  add(p, size);
                  openSheet(SHEETS.cart);
                }}
              >
                <Icon name="bag" />
                Agregar al pedido
              </button>
              <a
                className="btn border border-fg hover:bg-raised"
                aria-disabled={needsSize}
                href={whatsappUrl(shop.whatsapp, shop.name, [item])}
                target="_blank"
                rel="noreferrer"
              >
                <Image src="/brand/whatsapp.webp" alt="" width={20} height={20} className="size-5" />
                Pedir solo este
              </a>
            </div>
          )}
          {needsSize && !soldOut && <p className="-mt-2 text-sm text-muted">Elige una talla para continuar.</p>}
        </div>
      </article>

      {related.length > 0 && (
        <section className={`${container} mt-24`}>
          <h2 className="display text-3xl">Más en {p.category.toLowerCase()}</h2>
          <ul className="mt-8 grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-5 lg:grid-cols-4">
            {related.map((x) => (
              <li key={x.ref}>
                <ProductCard product={x} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
