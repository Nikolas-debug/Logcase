"use client";

import Form from "next/form";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";
import { formatCOP, setQty, total, whatsappUrl } from "@/lib/cart";
import { fold } from "@/lib/search";
import { authClient } from "@/modules/auth/client";
import { Icon } from "./icons";
import { closeSheets, SHEETS, useShop } from "./shop-provider";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg pb-[calc(var(--dock-gap)+var(--dock-h)+2rem)] text-fg">
      {children}
      {/* usePathname suspends in the fallback shell of unlisted product refs: render the dock without the active state meanwhile. */}
      <Suspense fallback={<Dock home={false} />}>
        <DockAtPath />
      </Suspense>
      <CategoriesSheet />
      <SearchSheet />
      <CartSheet />
    </div>
  );
}

const dockItem =
  // Five items share the screen minus ~14px margins each side: 56px on a 320px phone, up to 72px on large ones.
  "press relative flex h-full w-[clamp(3.5rem,calc((100vw-3rem)/5),4.5rem)] flex-col items-center justify-center gap-1 rounded-full text-[0.6875rem] font-medium text-white/70 transition-colors hover:text-white sm:w-20";

// Floating dock, same on every screen size. Drop-ups are native popovers (light-dismiss + Esc for free).
function DockAtPath() {
  const { shop } = useShop();
  return <Dock home={usePathname() === `/${shop.slug}`} />;
}

function Dock({ home }: { home: boolean }) {
  const { shop, cart } = useShop();
  const count = cart.reduce((n, i) => n + i.qty, 0);
  return (
    <nav
      aria-label="Navegación"
      className="fixed bottom-[var(--dock-gap)] left-1/2 z-40 flex h-[var(--dock-h)] -translate-x-1/2 gap-0.5 rounded-full bg-[#0a0a0a]/92 p-1.5 shadow-[0_12px_32px_-8px_rgb(0_0_0/0.45),inset_0_1px_0_rgb(255_255_255/0.08)] backdrop-blur-xl"
    >
      <Link href={`/${shop.slug}`} onClick={() => home && scrollTo({ top: 0, behavior: "smooth" })} className={`${dockItem} ${home ? "bg-white/12 text-white" : ""}`} aria-current={home ? "page" : undefined}>
        <Icon name="home" />
        Inicio
      </Link>
      <button popoverTarget={SHEETS.categories} className={dockItem}>
        <Icon name="grid" />
        Categorías
      </button>
      <button popoverTarget={SHEETS.search} className={dockItem}>
        <Icon name="search" />
        Buscar
      </button>
      <button popoverTarget={SHEETS.cart} className={dockItem} aria-label={`Pedido, ${count} productos`}>
        <span className="relative">
          <Icon name="bag" />
          {count > 0 && (
            <span
              key={count}
              className="absolute -right-2.5 -top-1.5 grid h-[1.125rem] min-w-[1.125rem] place-items-center rounded-full bg-accent px-1 text-[0.625rem] font-semibold tabular-nums text-ink motion-safe:animate-[bump_360ms_var(--ease-out)]"
            >
              {count}
            </span>
          )}
        </span>
        Pedido
      </button>
      <AccountItem />
    </nav>
  );
}

// Signed out → sign in (and come back to this shop's admin). Staff → their panel; anyone else → this shop's admin,
// which sends members of other shops on to their own. The session loads client-side so the storefront stays static:
// signed-in users see "Entrar" for a moment first.
function AccountItem() {
  const { shop } = useShop();
  const { data } = authClient.useSession();
  const staff = data?.user.role === "admin";
  const [href, label] = !data ? [`/login?next=/${shop.slug}/admin`, "Entrar"] : staff ? ["/panel", "Panel"] : [`/${shop.slug}/admin`, "Mi tienda"];
  return (
    <Link href={href} prefetch={false} className={dockItem}>
      <Icon name="user" />
      {label}
    </Link>
  );
}

function SheetHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-surface/90 px-5 pb-3 pt-5 backdrop-blur">
      <h2 className="text-xl font-medium">{title}</h2>
      {children}
      <button onClick={closeSheets} className="press grid size-9 place-items-center rounded-full bg-raised" aria-label="Cerrar">
        <Icon name="close" className="size-4" />
      </button>
    </header>
  );
}

function CategoriesSheet() {
  const { shop, products, slides } = useShop();
  // Cover per category = its first product photo; "Todo" uses the first slide.
  const tiles = [
    { label: "Todo", href: `/${shop.slug}#catalogo`, count: products.length, image: slides[0]?.image ?? products[0]?.image },
    ...shop.categories.map((c) => {
      const inCat = products.filter((p) => p.category === c);
      return { label: c, href: `/${shop.slug}?c=${encodeURIComponent(c)}#catalogo`, count: inCat.length, image: inCat[0]?.image };
    }),
  ];
  return (
    <div popover="auto" id={SHEETS.categories} className="sheet" aria-label="Categorías">
      <SheetHeader title="Categorías" />
      <ul className="grid grid-cols-2 gap-2 px-3 pb-3 sm:grid-cols-3">
        {tiles.map((t) => (
          <li key={t.label}>
            <Link href={t.href} onClick={closeSheets} className="press group flex items-center gap-3 rounded-2xl bg-raised p-2 pr-3">
              <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-bg">
                {t.image && <Image src={t.image} alt="" fill sizes="48px" className="object-cover" />}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[0.9375rem] font-medium">{t.label}</span>
                <span className="block text-xs text-muted">{t.count} {t.count === 1 ? "producto" : "productos"}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SearchSheet() {
  const { shop, products } = useShop();
  const [q, setQ] = useState("");
  const hits = q.trim() ? products.filter((p) => fold(`${p.name} ${p.ref} ${p.category}`).includes(fold(q.trim()))) : [];
  return (
    <div popover="auto" id={SHEETS.search} className="sheet" aria-label="Buscar">
      <Form action={`/${shop.slug}`} onSubmit={closeSheets} className="sticky top-0 z-10 flex items-center gap-2 bg-surface/90 p-3 backdrop-blur" role="search">
        <label className="flex h-12 flex-1 items-center gap-2 rounded-full bg-raised px-4 focus-within:ring-2 focus-within:ring-fg">
          <Icon name="search" className="size-5 shrink-0 text-muted" />
          <input
            type="search"
            name="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
            enterKeyHint="search"
            placeholder="Pijamas, perfume, capibara…"
            aria-label="Buscar productos"
            className="w-full bg-transparent outline-none placeholder:text-muted"
          />
        </label>
        <button type="button" onClick={closeSheets} className="press h-12 rounded-full px-3 text-[0.9375rem] font-medium">
          Cerrar
        </button>
      </Form>
      {q.trim() &&
        (hits.length ? (
          <ul className="px-2 pb-2">
            {hits.slice(0, 8).map((p) => (
              <li key={p.ref}>
                <Link href={`/${shop.slug}/p/${p.ref}`} onClick={closeSheets} className="flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-raised">
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-raised">
                    <Image src={p.image} alt="" fill sizes="56px" className="object-cover" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{p.name}</span>
                    <span className="block text-sm text-muted">{p.category}</span>
                  </span>
                  <span className="text-sm font-medium tabular-nums">{formatCOP(p.price)}</span>
                </Link>
              </li>
            ))}
            {hits.length > 8 && (
              <li className="p-2">
                <Link href={`/${shop.slug}?q=${encodeURIComponent(q.trim())}#catalogo`} onClick={closeSheets} className="btn w-full bg-raised">
                  Ver los {hits.length} resultados
                </Link>
              </li>
            )}
          </ul>
        ) : (
          <p className="px-5 pb-8 pt-4 text-center text-muted">Nada con “{q.trim()}”. Prueba con otra palabra.</p>
        ))}
    </div>
  );
}

function CartSheet() {
  const { shop, products, cart, setCart } = useShop();
  const count = cart.reduce((n, i) => n + i.qty, 0);
  return (
    <div popover="auto" id={SHEETS.cart} className="sheet" aria-label="Tu pedido">
      <SheetHeader title="Tu pedido">
        {count > 0 && <span className="mr-auto text-sm text-muted">{count} {count === 1 ? "producto" : "productos"}</span>}
      </SheetHeader>
      {cart.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-5 pb-10 pt-6 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-raised text-muted">
            <Icon name="bag" className="size-6" />
          </span>
          <p className="mt-2 font-medium">Tu pedido está vacío</p>
          <p className="text-sm text-muted">Agrega productos y envíalo por WhatsApp a {shop.name}.</p>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-black/6 px-5">
            {cart.map((i) => {
              const image = products.find((p) => p.ref === i.ref)?.image;
              return (
                <li key={i.ref + i.size} className="flex items-center gap-3 py-3">
                  <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-raised">
                    {image && <Image src={image} alt="" fill sizes="64px" className="object-cover" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{i.name}</p>
                    <p className="text-xs text-muted">
                      Ref. {i.ref}
                      {i.size && ` · Talla ${i.size}`}
                    </p>
                    <p className="mt-0.5 text-sm tabular-nums">{formatCOP(i.price * i.qty)}</p>
                  </div>
                  <div className="flex items-center rounded-full bg-raised">
                    <button className="press grid size-10 place-items-center rounded-full" onClick={() => setCart(setQty(cart, i.ref, i.size, i.qty - 1))} aria-label={`Quitar uno de ${i.name}`}>
                      <Icon name={i.qty === 1 ? "trash" : "minus"} className="size-4" />
                    </button>
                    <span className="w-5 text-center text-sm font-medium tabular-nums">{i.qty}</span>
                    <button className="press grid size-10 place-items-center rounded-full" onClick={() => setCart(setQty(cart, i.ref, i.size, i.qty + 1))} aria-label={`Agregar uno de ${i.name}`}>
                      <Icon name="plus" className="size-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          <footer className="sticky bottom-0 flex flex-col gap-3 border-t border-black/6 bg-surface/95 p-5 backdrop-blur">
            <div className="flex items-baseline justify-between">
              <span className="text-muted">Total</span>
              <span className="text-2xl font-medium tabular-nums">{formatCOP(total(cart))}</span>
            </div>
            <a className="btn bg-accent text-ink" href={whatsappUrl(shop.whatsapp, shop.name, cart)} target="_blank" rel="noreferrer">
              <Image src="/brand/whatsapp.webp" alt="" width={20} height={20} className="size-5" />
              Enviar pedido por WhatsApp
            </a>
            <button className="text-sm text-muted transition-colors hover:text-fg" onClick={() => setCart([])}>
              Vaciar pedido
            </button>
          </footer>
        </>
      )}
    </div>
  );
}
