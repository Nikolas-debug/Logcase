"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { VERSION } from "@/lib/version";
import { authClient } from "@/modules/auth/client";
import { createLogoUpload, createShop, updateShop, type ShopInput } from "@/modules/tenancy/actions";
import { EditDialog, field, PhotoField, uploadPhoto } from "./admin";
import { Icon } from "./icons";

export type PanelShop = {
  slug: string;
  name: string;
  tagline: string;
  city: string;
  whatsapp: string;
  instagram: string;
  logo: string;
  accent: string;
  plan: string;
  createdAt: string;
  categories: string[];
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

// Logcase staff dashboard. Today: shops and their catalog health; later: billing, usage and activity per shop.
export function Panel({ shops, email }: { shops: PanelShop[]; email: string }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [editing, setEditing] = useState<PanelShop | null>(null); // null = new shop
  const [logo, setLogo] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState("");

  const open = (s: PanelShop | null) => {
    setEditing(s);
    setLogo(s?.logo ?? "");
    setSlug(s?.slug ?? "");
    setSlugTouched(false);
    setError("");
    dialog.current?.showModal();
  };

  const submit = async (f: FormData) => {
    const input: ShopInput = {
      name: String(f.get("name")),
      tagline: String(f.get("tagline")),
      city: String(f.get("city")),
      whatsapp: String(f.get("whatsapp")),
      instagram: String(f.get("instagram")),
      accent: String(f.get("accent")),
      logo,
      categories: String(f.get("categories")).split(","),
    };
    const owner = { name: String(f.get("ownerName")), email: String(f.get("ownerEmail")), password: String(f.get("ownerPassword")) };
    const { error } = editing ? await updateShop(editing.slug, input, owner) : await createShop(slug, input, owner);
    if (error) return setError(error);
    dialog.current?.close();
    router.refresh();
  };

  const totals = shops.reduce((t, s) => ({ products: t.products + s.products, soldOut: t.soldOut + s.soldOut }), { products: 0, soldOut: 0 });

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
              {plural(shops.length, "tienda", "tiendas")} · {plural(totals.products, "producto", "productos")} · {plural(totals.soldOut, "agotado", "agotados")}
            </p>
          </div>
          <button className="btn bg-fg text-bg hover:bg-[#3f3f46]" onClick={() => open(null)}>
            <Icon name="plus" />
            Nueva tienda
          </button>
        </div>

        <ul className="grid gap-3 lg:grid-cols-2">
          {shops.map((s) => (
            <li key={s.slug} className="flex min-w-0 flex-col gap-5 rounded-[1.25rem] bg-surface p-5 ring-1 ring-black/6">
              <div className="flex items-center gap-4">
                <Image src={s.logo} alt="" width={56} height={56} className="size-14 shrink-0 rounded-full ring-1 ring-black/8" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-medium">{s.name}</p>
                  <p className="truncate text-sm text-muted">
                    /{s.slug}
                    {s.city && ` · ${s.city}`}
                  </p>
                </div>
                <span className="flex items-center gap-2 rounded-full bg-raised px-3 py-1 text-xs font-medium capitalize">
                  <span className="size-2 rounded-full" style={{ background: s.accent }} />
                  {s.plan}
                </span>
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
                    <dd className={`text-2xl tabular-nums ${label === "Agotados" && n > 0 ? "text-[#b42318]" : ""}`}>{n}</dd>
                  </div>
                ))}
              </dl>

              <div className="flex flex-col gap-1 text-sm text-muted">
                <p className="truncate">{s.owners.length ? s.owners.join(", ") : "Sin usuarios"}</p>
                <p>Desde {date.format(new Date(s.createdAt))}</p>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-black/6 pt-4">
                <Link href={`/${s.slug}`} className="btn border border-black/15 text-sm hover:bg-raised">
                  Ver tienda
                </Link>
                <Link href={`/${s.slug}/admin`} className="btn border border-black/15 text-sm hover:bg-raised">
                  Administrar
                </Link>
                <button className="btn text-sm hover:bg-raised" onClick={() => open(s)}>
                  Editar datos
                </button>
              </div>
            </li>
          ))}
          {shops.length === 0 && (
            <li className="flex flex-col items-center gap-4 rounded-[1.25rem] bg-surface p-12 text-center ring-1 ring-black/6 lg:col-span-2">
              <p className="text-lg font-medium">Todavía no hay tiendas</p>
              <p className="max-w-[40ch] text-muted">Crea la primera con su logo, categorías y el usuario del dueño.</p>
            </li>
          )}
        </ul>
      </div>

      <EditDialog dialog={dialog} title={editing ? `Editar ${editing.name}` : "Nueva tienda"} error={error} onSubmit={submit}>
        <div key={editing?.slug ?? "new"} className="-mx-1 flex max-h-[65dvh] flex-col gap-4 overflow-y-auto overscroll-contain p-1">
          <PhotoField upload={(f) => uploadPhoto(f, createLogoUpload)} image={logo} setImage={setLogo} setError={setError} />
          <label className="text-sm font-medium">
            Nombre
            <input
              name="name"
              required
              defaultValue={editing?.name}
              onChange={(e) => !editing && !slugTouched && setSlug(slugify(e.target.value))}
              className={field}
            />
          </label>
          {!editing && (
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
          )}
          <label className="text-sm font-medium">
            Eslogan <span className="font-normal text-muted">(opcional)</span>
            <input name="tagline" defaultValue={editing?.tagline} className={field} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm font-medium">
              Ciudad
              <input name="city" defaultValue={editing?.city} className={field} />
            </label>
            <label className="text-sm font-medium">
              Color de acento
              <input name="accent" type="color" defaultValue={editing?.accent ?? "#c8336f"} className={`${field} h-[46px] cursor-pointer p-1`} />
            </label>
            <label className="text-sm font-medium">
              WhatsApp
              <input name="whatsapp" type="tel" inputMode="numeric" required placeholder="573001234567" defaultValue={editing?.whatsapp} className={field} />
            </label>
            <label className="text-sm font-medium">
              Instagram
              <input name="instagram" autoCapitalize="none" placeholder="@tienda" defaultValue={editing?.instagram} className={field} />
            </label>
          </div>
          <label className="text-sm font-medium">
            Categorías <span className="font-normal text-muted">(separadas por coma, en orden)</span>
            <textarea name="categories" rows={2} required defaultValue={editing?.categories.join(", ")} placeholder="Ropa, Accesorios, Regalos" className={field} />
          </label>
          <fieldset className="flex flex-col gap-3 rounded-xl bg-bg p-4">
            <legend className="float-left mb-1 text-sm font-medium">{editing ? "Dar acceso a otra persona" : "Usuario del dueño"}</legend>
            <p className="text-sm text-muted">
              {editing ? (editing.owners.length ? `Ya tienen acceso: ${editing.owners.join(", ")}. ` : "Nadie tiene acceso todavía. ") : ""}
              Con este correo y contraseña entra a administrar la tienda. Si el correo ya existe, solo se le da acceso.
            </p>
            <label className="text-sm font-medium">
              Nombre
              <input name="ownerName" className={field} />
            </label>
            <label className="text-sm font-medium">
              Correo
              <input name="ownerEmail" type="email" required={!editing} autoCapitalize="none" className={field} />
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
