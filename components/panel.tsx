"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { VERSION } from "@/lib/version";
import { authClient } from "@/modules/auth/client";
import { createShop, grantAccess, setShopActive } from "@/modules/tenancy/actions";
import { EditDialog, field } from "./admin";
import { ShopLogo } from "./catalog";
import { Icon } from "./icons";

export type PanelShop = {
  slug: string;
  name: string;
  city: string;
  logo: string;
  accent: string;
  plan: string;
  active: boolean;
  createdAt: string;
  owners: string[];
  products: number;
  soldOut: number;
  slides: number;
};

const wrap = "mx-auto w-[90%] max-w-[90rem]";
const date = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", year: "numeric" });
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const slugify = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Logcase staff: which shops exist, which are active, and who can manage them. The catalog itself belongs to
// each owner (/[shop]/admin); staff never edit it. Later: billing and usage per shop.
export function Panel({ shops, email }: { shops: PanelShop[]; email: string }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [granting, setGranting] = useState<PanelShop | null>(null); // null = new shop
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState("");

  const open = (s: PanelShop | null) => {
    setGranting(s);
    setSlug("");
    setSlugTouched(false);
    setError("");
    dialog.current?.showModal();
  };

  const submit = async (f: FormData) => {
    const owner = { name: String(f.get("ownerName")), email: String(f.get("ownerEmail")), password: String(f.get("ownerPassword")) };
    const { error } = granting
      ? await grantAccess(granting.slug, owner)
      : await createShop(slug, { name: String(f.get("name")), whatsapp: String(f.get("whatsapp")) }, owner);
    if (error) return setError(error);
    dialog.current?.close();
    router.refresh();
  };

  const toggle = async (s: PanelShop) => {
    if (s.active && !confirm(`¿Pausar ${s.name}? Su catálogo y su administración dejan de estar disponibles hasta que la actives.`)) return;
    await setShopActive(s.slug, !s.active);
    router.refresh();
  };

  const active = shops.filter((s) => s.active).length;

  return (
    <main className="min-h-svh bg-bg pb-24">
      <header className="border-b border-black/8 bg-surface">
        <div className={`${wrap} flex items-center justify-between gap-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))]`}>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-medium">
              Logcase
            </Link>
            <span className="rounded-full bg-raised px-2.5 py-1 text-xs font-medium text-muted">{VERSION}</span>
            <span className="hidden text-sm text-muted sm:inline">· Panel</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden max-w-[24ch] truncate text-sm text-muted md:inline">{email}</span>
            <button className="btn text-sm hover:bg-raised" onClick={() => authClient.signOut().then(() => router.push("/login"))}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <div className={`${wrap} flex flex-col gap-10 pt-10`}>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-col gap-3">
            <h1 className="display text-[clamp(2.75rem,5vw,4rem)]">Tiendas</h1>
            <p className="text-muted">
              {plural(active, "activa", "activas")}
              {shops.length > active && ` · ${plural(shops.length - active, "pausada", "pausadas")}`}
            </p>
          </div>
          <button className="btn bg-fg text-bg hover:bg-[#3f3f46]" onClick={() => open(null)}>
            <Icon name="plus" />
            Nueva tienda
          </button>
        </div>

        <ul className="grid gap-3 lg:grid-cols-2">
          {shops.map((s) => (
            <li key={s.slug} className={`flex min-w-0 flex-col gap-5 rounded-[1.25rem] bg-surface p-5 ring-1 ring-black/6 ${s.active ? "" : "opacity-70"}`}>
              <div className="flex items-center gap-4">
                <ShopLogo name={s.name} logo={s.logo} accent={s.accent} size={56} className="ring-1 ring-black/8" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-medium">{s.name}</p>
                  <p className="truncate text-sm text-muted">
                    /{s.slug}
                    {s.city && ` · ${s.city}`}
                  </p>
                  <span className="mt-2 inline-flex items-center gap-2 rounded-full bg-raised px-3 py-1 text-xs font-medium">
                    <span className={`size-2 rounded-full ${s.active ? "bg-[#16a34a]" : "bg-[#a1a1aa]"}`} />
                    {s.active ? "Activa" : "Pausada"} · <span className="capitalize">{s.plan}</span>
                  </span>
                </div>
              </div>

              <dl className="grid grid-cols-3 divide-x divide-black/8 rounded-xl bg-bg py-3 text-center">
                {(
                  [
                    ["Productos", s.products],
                    ["Agotados", s.soldOut],
                    ["Carrusel", s.slides],
                  ] as const
                ).map(([label, n]) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <dt className="text-xs text-muted">{label}</dt>
                    <dd className="text-2xl tabular-nums">{n}</dd>
                  </div>
                ))}
              </dl>

              <div className="flex flex-col gap-1 text-sm text-muted">
                <p className="truncate">{s.owners.length ? s.owners.join(", ") : "Sin usuarios"}</p>
                <p>Desde {date.format(new Date(s.createdAt))}</p>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-black/6 pt-4">
                {s.active && (
                  <Link href={`/${s.slug}`} className="btn border border-black/15 text-sm hover:bg-raised">
                    Ver tienda
                  </Link>
                )}
                <button className="btn border border-black/15 text-sm hover:bg-raised" onClick={() => open(s)}>
                  Dar acceso
                </button>
                <button className="btn text-sm hover:bg-raised" onClick={() => toggle(s)}>
                  {s.active ? "Pausar" : "Activar"}
                </button>
              </div>
            </li>
          ))}
          {shops.length === 0 && (
            <li className="flex flex-col items-center gap-4 rounded-[1.25rem] bg-surface p-12 text-center ring-1 ring-black/6 lg:col-span-2">
              <p className="text-lg font-medium">Todavía no hay tiendas</p>
              <p className="max-w-[40ch] text-muted">Crea la primera con su nombre, WhatsApp y el usuario del dueño.</p>
            </li>
          )}
        </ul>
      </div>

      <EditDialog dialog={dialog} title={granting ? `Dar acceso a ${granting.name}` : "Nueva tienda"} error={error} onSubmit={submit}>
        <div key={granting?.slug ?? "new"} className="-mx-1 flex max-h-[65dvh] flex-col gap-4 overflow-y-auto overscroll-contain p-1">
          {!granting && (
            <>
              <label className="text-sm font-medium">
                Nombre
                <input name="name" required onChange={(e) => !slugTouched && setSlug(slugify(e.target.value))} className={field} />
              </label>
              <label className="text-sm font-medium">
                Dirección <span className="font-normal text-muted">(logcase.app/{slug || "mi-tienda"})</span>
                <input
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(slugify(e.target.value));
                  }}
                  required
                  autoCapitalize="none"
                  className={field}
                />
              </label>
              <label className="text-sm font-medium">
                WhatsApp
                <input name="whatsapp" type="tel" inputMode="numeric" required placeholder="573001234567" className={field} />
              </label>
            </>
          )}
          <fieldset className="flex flex-col gap-3 rounded-xl bg-bg p-4">
            <legend className="float-left mb-1 text-sm font-medium">{granting ? "Persona con acceso" : "Usuario del dueño"}</legend>
            <p className="text-sm text-muted">
              {granting && (granting.owners.length ? `Ya tienen acceso: ${granting.owners.join(", ")}. ` : "Nadie tiene acceso todavía. ")}
              {!granting && "El dueño sube su logo, colores, categorías y productos desde su tienda. "}
              Si el correo ya existe, solo se le da acceso.
            </p>
            <label className="text-sm font-medium">
              Nombre
              <input name="ownerName" className={field} />
            </label>
            <label className="text-sm font-medium">
              Correo
              <input name="ownerEmail" type="email" required autoCapitalize="none" className={field} />
            </label>
            <label className="text-sm font-medium">
              Contraseña inicial
              <input name="ownerPassword" type="text" autoComplete="off" minLength={8} className={field} />
            </label>
          </fieldset>
        </div>
      </EditDialog>
    </main>
  );
}
