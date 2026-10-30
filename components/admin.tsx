"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { formatCOP } from "@/lib/cart";
import type { Product, Slide } from "@/lib/shops";
import { authClient } from "@/modules/auth/client";
import { createPhotoUpload, deleteProduct, saveProduct, saveSlides } from "@/modules/catalog/actions";
import { container } from "./catalog";
import { Icon } from "./icons";
import { useShop } from "./shop-provider";

// Downscale on the phone (saves data), then upload straight to Cloudflare. Returns the image ID.
function downscale(file: File, max: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob"))), "image/webp", 0.85);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

// ponytail: a photo uploaded and then cancelled stays on Cloudflare unused; add a periodic cleanup if that adds up.
export async function uploadPhoto(file: File, getUrl: () => Promise<{ id: string; uploadURL: string }>) {
  const [blob, { id, uploadURL }] = await Promise.all([downscale(file, 2000), getUrl()]);
  const form = new FormData();
  form.append("file", blob, "foto.webp");
  const r = await fetch(uploadURL, { method: "POST", body: form });
  if (!r.ok) throw new Error(`upload ${r.status}`);
  return id;
}

export const field = "mt-1.5 w-full rounded-lg bg-surface px-3 py-2.5 outline-none ring-1 ring-black/12 transition-shadow focus:ring-2 focus:ring-fg";
const rowBtn = "press rounded-full px-3 py-2 text-sm font-medium transition-colors hover:bg-raised disabled:opacity-30";

export function Admin() {
  const { shop, products, slides } = useShop();
  const [tab, setTab] = useState<"products" | "slides">("products");
  const router = useRouter();
  return (
    <div className={`${container} flex flex-col gap-8 pt-[max(1.5rem,env(safe-area-inset-top))]`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href={`/${shop.slug}`} className="press flex h-11 items-center gap-2 rounded-full bg-surface pl-3 pr-4 text-sm font-medium ring-1 ring-black/8 hover:bg-raised">
          <Icon name="back" className="size-4" />
          Ver tienda
        </Link>
        <button className="btn text-sm text-muted hover:bg-raised hover:text-fg" onClick={() => authClient.signOut().then(() => router.push("/login"))}>
          Cerrar sesión
        </button>
      </div>
      <div className="flex flex-col gap-5">
        <h1 className="display text-[clamp(2.5rem,5vw,3.75rem)]">Administrar</h1>
        <div role="tablist" className="flex w-fit gap-1 rounded-full bg-raised p-1">
          {(
            [
              ["products", `Productos · ${products.length}`],
              ["slides", `Carrusel · ${slides.length}`],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`press rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${tab === id ? "bg-surface shadow-[0_1px_3px_rgb(0_0_0/0.12)]" : "text-muted hover:text-fg"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {tab === "products" ? <ProductsAdmin /> : <SlidesAdmin />}
    </div>
  );
}

// upload: file → Cloudflare image ID.
export function PhotoField({ upload, image, setImage, setError }: { upload: (f: File) => Promise<string>; image: string; setImage: (s: string) => void; setError: (s: string) => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <label aria-busy={busy} className="flex cursor-pointer items-center gap-4 rounded-xl p-2 ring-1 ring-black/12 transition-colors hover:bg-raised aria-busy:cursor-progress">
      <span className="relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-lg bg-raised text-xs text-muted">
        {image ? <Image src={image} alt="" fill sizes="80px" className={`object-cover transition-opacity ${busy ? "opacity-40" : ""}`} /> : busy ? "Subiendo…" : "Sin foto"}
      </span>
      <span className="flex flex-col gap-1 text-sm">
        <span className="font-medium">{busy ? "Subiendo foto…" : image ? "Cambiar foto" : "Subir foto"}</span>
        <span className="text-muted">JPG, PNG o WebP. Se reduce automáticamente.</span>
      </span>
      <input
        type="file"
        accept="image/*"
        disabled={busy}
        className="sr-only"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setBusy(true);
          setError("");
          try {
            setImage(await upload(file));
          } catch {
            setError("No se pudo subir la foto. Revisa tu conexión e inténtalo de nuevo.");
          } finally {
            setBusy(false);
          }
        }}
      />
    </label>
  );
}

export function EditDialog({ dialog, title, error, onSubmit, children }: { dialog: React.RefObject<HTMLDialogElement | null>; title: string; error: string; onSubmit: (f: FormData) => Promise<void>; children: React.ReactNode }) {
  const [saving, setSaving] = useState(false);
  return (
    <dialog ref={dialog} className="m-auto w-[calc(100%-1rem)] max-w-lg rounded-[1.5rem] bg-surface p-0 text-fg shadow-[0_25px_50px_-12px_rgb(0_0_0/0.35)]">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          await onSubmit(new FormData(e.currentTarget)).finally(() => setSaving(false));
        }}
        className="flex flex-col gap-4 p-6"
      >
        <h2 className="text-2xl font-medium">{title}</h2>
        {children}
        {error && (
          <p role="alert" className="text-sm font-medium text-accent">
            {error}
          </p>
        )}
        <div className="mt-2 flex justify-end gap-2">
          <button type="button" className="btn hover:bg-raised" onClick={() => dialog.current?.close()}>
            Cancelar
          </button>
          <button className="btn bg-fg text-bg hover:bg-[#3f3f46]" disabled={saving}>
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

function ProductsAdmin() {
  const { shop, products } = useShop();
  const dialog = useRef<HTMLDialogElement>(null);
  const [editing, setEditing] = useState<Product | null>(null); // null = new product
  const [image, setImage] = useState("");
  const [error, setError] = useState("");

  const open = (p: Product | null) => {
    setEditing(p);
    setImage(p?.image ?? "");
    setError("");
    dialog.current?.showModal();
  };

  const submit = async (f: FormData) => {
    const ref = String(f.get("ref")).trim().toUpperCase();
    if (!image) return setError("Agrega una foto.");
    const sizes = String(f.get("sizes")).split(",").map((s) => s.trim()).filter(Boolean);
    const product: Product = {
      ref,
      name: String(f.get("name")).trim(),
      category: String(f.get("category")),
      price: Number(f.get("price")),
      stock: Number(f.get("stock")),
      sizes: sizes.length ? sizes : undefined,
      image,
      description: String(f.get("description")).trim() || undefined,
    };
    const { error } = await saveProduct(shop.slug, product, editing?.ref);
    if (error) return setError(error);
    dialog.current?.close();
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap justify-end gap-2">
        <button className="btn bg-fg text-bg hover:bg-[#3f3f46]" onClick={() => open(null)}>
          <Icon name="plus" />
          Nuevo producto
        </button>
      </div>

      <ul className="divide-y divide-black/6 rounded-[1.25rem] bg-surface px-3 ring-1 ring-black/6">
        {products.map((p) => (
          <li key={p.ref} className="flex items-center gap-3 py-3">
            <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-raised">
              <Image src={p.image} alt="" fill sizes="56px" className="object-cover" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{p.name}</p>
              <p className="truncate text-sm text-muted">
                {p.ref} · {p.category} · <span className="tabular-nums">{formatCOP(p.price)}</span> ·{" "}
                <span className={p.stock <= 0 ? "font-medium text-accent" : ""}>{p.stock <= 0 ? "Agotado" : `${p.stock} en stock`}</span>
              </p>
            </div>
            <button className={rowBtn} onClick={() => open(p)}>
              Editar
            </button>
            <button className={`${rowBtn} text-muted hover:text-fg`} onClick={() => confirm(`¿Eliminar ${p.name}?`) && deleteProduct(shop.slug, p.ref)}>
              Eliminar
            </button>
          </li>
        ))}
      </ul>

      <EditDialog dialog={dialog} title={editing ? "Editar producto" : "Nuevo producto"} error={error} onSubmit={submit}>
        {/* key remounts the inputs so defaultValues reset per product */}
        <div key={editing?.ref ?? "new"} className="flex flex-col gap-4">
          <PhotoField upload={(f) => uploadPhoto(f, () => createPhotoUpload(shop.slug, "product"))} image={image} setImage={setImage} setError={setError} />
          <label className="text-sm font-medium">
            Nombre
            <input name="name" required defaultValue={editing?.name} className={field} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm font-medium">
              Referencia
              <input name="ref" required autoCapitalize="characters" defaultValue={editing?.ref} className={`${field} uppercase`} />
            </label>
            <label className="text-sm font-medium">
              Categoría
              <select name="category" defaultValue={editing?.category ?? shop.categories[0]} className={field}>
                {shop.categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              Precio (COP)
              <input name="price" type="number" inputMode="numeric" min={0} step={100} required defaultValue={editing?.price} className={field} />
            </label>
            <label className="text-sm font-medium">
              Stock
              <input name="stock" type="number" inputMode="numeric" min={0} required defaultValue={editing?.stock ?? 1} className={field} />
            </label>
          </div>
          <label className="text-sm font-medium">
            Tallas <span className="font-normal text-muted">(separadas por coma)</span>
            <input name="sizes" placeholder="S, M, L" defaultValue={editing?.sizes?.join(", ")} className={field} />
          </label>
          <label className="text-sm font-medium">
            Descripción
            <textarea name="description" rows={3} defaultValue={editing?.description} className={field} />
          </label>
        </div>
      </EditDialog>
    </section>
  );
}

function SlidesAdmin() {
  const { shop, slides } = useShop();
  const dialog = useRef<HTMLDialogElement>(null);
  const [editing, setEditing] = useState<Slide | null>(null); // null = new slide
  const [image, setImage] = useState("");
  const [error, setError] = useState("");

  const open = (s: Slide | null) => {
    setEditing(s);
    setImage(s?.image ?? "");
    setError("");
    dialog.current?.showModal();
  };

  const save = async (next: Slide[]) => {
    const { error } = await saveSlides(shop.slug, next);
    if (error) alert(error);
    return error;
  };

  const submit = async (f: FormData) => {
    if (!image) return setError("Agrega una foto.");
    const slide: Slide = {
      id: editing?.id ?? crypto.randomUUID(),
      image,
      title: String(f.get("title")).trim(),
      text: String(f.get("text")).trim() || undefined,
      category: String(f.get("category")) || undefined,
    };
    const { error } = await saveSlides(shop.slug, editing ? slides.map((s) => (s === editing ? slide : s)) : [...slides, slide]);
    if (error) return setError(error);
    dialog.current?.close();
  };

  const move = (k: number, by: number) => {
    const next = [...slides];
    [next[k], next[k + by]] = [next[k + by], next[k]];
    save(next);
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-[52ch] text-muted">Las diapositivas se muestran en este orden en la portada de la tienda. Usa fotos verticales u horizontales con buena luz.</p>
        <div className="flex flex-wrap gap-2">
          <button className="btn bg-fg text-bg hover:bg-[#3f3f46]" onClick={() => open(null)}>
            <Icon name="plus" />
            Nueva diapositiva
          </button>
        </div>
      </div>

      <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {slides.map((s, k) => (
          <li key={s.id} className="flex flex-col overflow-hidden rounded-[1.25rem] bg-surface ring-1 ring-black/6">
            <div className="relative aspect-[16/10] bg-black">
              <Image src={s.image} alt="" fill sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 90vw" className="object-cover opacity-80" />
              <div className="absolute inset-0 flex flex-col justify-end gap-1 bg-[linear-gradient(to_top,rgb(0_0_0/0.7),transparent_60%)] p-4 text-white">
                <span className="text-xs tabular-nums text-white/70">
                  {k + 1} / {slides.length}
                </span>
                <span className="display text-2xl">{s.title}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 p-2">
              <span className="min-w-0 flex-1 truncate px-2 text-sm text-muted">{s.category ? `Enlaza a ${s.category}` : "Sin enlace"}</span>
              <button className={`${rowBtn} px-2.5`} disabled={k === 0} onClick={() => move(k, -1)} aria-label="Subir">
                <Icon name="up" className="size-4" />
              </button>
              <button className={`${rowBtn} px-2.5`} disabled={k === slides.length - 1} onClick={() => move(k, 1)} aria-label="Bajar">
                <Icon name="down" className="size-4" />
              </button>
              <button className={rowBtn} onClick={() => open(s)}>
                Editar
              </button>
              <button className={`${rowBtn} px-2.5 text-muted hover:text-fg`} onClick={() => confirm(`¿Eliminar “${s.title}”?`) && save(slides.filter((x) => x !== s))} aria-label={`Eliminar ${s.title}`}>
                <Icon name="trash" className="size-4" />
              </button>
            </div>
          </li>
        ))}
        {slides.length === 0 && <li className="rounded-[1.25rem] bg-surface p-10 text-center text-muted ring-1 ring-black/6">Sin diapositivas: la portada muestra solo el catálogo.</li>}
      </ol>

      <EditDialog dialog={dialog} title={editing ? "Editar diapositiva" : "Nueva diapositiva"} error={error} onSubmit={submit}>
        <div key={editing?.id ?? "new"} className="flex flex-col gap-4">
          <PhotoField upload={(f) => uploadPhoto(f, () => createPhotoUpload(shop.slug, "slide"))} image={image} setImage={setImage} setError={setError} />
          <label className="text-sm font-medium">
            Título
            <input name="title" required maxLength={40} defaultValue={editing?.title} placeholder="Nueva colección" className={field} />
          </label>
          <label className="text-sm font-medium">
            Texto <span className="font-normal text-muted">(opcional)</span>
            <input name="text" maxLength={80} defaultValue={editing?.text} className={field} />
          </label>
          <label className="text-sm font-medium">
            Botón lleva a
            <select name="category" defaultValue={editing?.category ?? ""} className={field}>
              <option value="">Sin botón</option>
              {shop.categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
      </EditDialog>
    </section>
  );
}
