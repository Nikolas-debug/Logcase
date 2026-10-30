import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { VERSION } from "@/lib/version";
import { getShop } from "@/modules/catalog/queries";
import { listShopSlugs } from "@/modules/tenancy/queries";

const wrap = "mx-auto w-[90%] max-w-[100rem]";

const features = [
  ["Catálogo en el celular", "Tus fotos se vuelven una tienda que tus clientes recorren en segundos, sin descargar nada."],
  ["Pedidos por WhatsApp", "El cliente arma su pedido y te llega listo a tu WhatsApp, con referencias, tallas y total."],
  ["Inventario y ventas", "Próximamente: existencias, ventas y cuentas del negocio en el mismo lugar."],
];

// DESIGN.md cinematic track: black canvas, thin display type, photography doing the work, one CTA.
export default async function Home() {
  const shops = (await Promise.all((await listShopSlugs()).map(getShop))).filter((s) => !!s);
  const featured = shops[0];
  const strip = featured?.slides.map((s) => s.image) ?? [];
  return (
    <main className="min-h-svh bg-black text-white [--text:#ffffff]">
      <header className={`${wrap} flex items-center justify-between pb-6 pt-[max(1.5rem,env(safe-area-inset-top))]`}>
        <span className="flex items-center gap-3">
          <span className="text-xl font-medium">Logcase</span>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/70">{VERSION}</span>
        </span>
        <Link href="/login" className="text-sm text-white/60 transition-colors hover:text-white">
          Entrar
        </Link>
      </header>

      <section className={`${wrap} pb-16 pt-16 sm:pt-28`}>
        <h1 className="display max-w-[14ch] text-[clamp(3rem,9vw,6rem)]">Tu catálogo, listo para vender.</h1>
        <p className="mt-8 max-w-[46ch] text-lg text-white/70">
          Logcase convierte las fotos de tu negocio en un catálogo que tus clientes recorren desde el celular y te piden por WhatsApp.
        </p>
        {featured && (
          <Link href={`/${featured.slug}`} className="btn mt-10 border-2 border-white hover:bg-white hover:text-black">
            Ver {featured.name}
            <Icon name="arrow" className="size-4" />
          </Link>
        )}
      </section>

      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-[5%] pb-4 [scrollbar-width:none] sm:gap-4">
        {strip.map((src, k) => (
          <div key={src} className={`relative aspect-[3/4] w-[62vw] shrink-0 snap-center overflow-hidden rounded-[1.25rem] bg-[#0a0a0a] sm:w-[28vw] lg:w-[19vw] ${k % 2 ? "lg:mt-16" : ""}`}>
            <Image src={src} alt="" fill sizes="(min-width: 1024px) 19vw, (min-width: 640px) 28vw, 62vw" className="object-cover" priority={k < 3} />
          </div>
        ))}
      </div>

      <section className={`${wrap} grid gap-x-10 gap-y-12 py-28 md:grid-cols-3`}>
        {features.map(([title, text]) => (
          <div key={title} className="flex flex-col gap-3 border-t border-white/15 pt-6">
            <h2 className="text-2xl font-[400]">{title}</h2>
            <p className="max-w-[40ch] text-white/60">{text}</p>
          </div>
        ))}
      </section>

      <section className={`${wrap} pb-24`}>
        <h2 className="display text-[clamp(2rem,4vw,3rem)]">Negocios en Logcase</h2>
        <ul className="mt-8 divide-y divide-white/10 border-y border-white/10">
          {shops.map((s) => (
            <li key={s.slug}>
              <Link href={`/${s.slug}`} className="group flex items-center gap-4 py-5">
                <Image src={s.logo} alt="" width={56} height={56} className="size-14 rounded-full" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-lg">{s.name}</span>
                  <span className="block text-sm text-white/55">
                    {s.city} · {s.products.length} productos
                  </span>
                </span>
                <span className="grid size-12 place-items-center rounded-full border border-white/25 transition-colors group-hover:bg-white group-hover:text-black">
                  <Icon name="arrow" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <footer className={`${wrap} flex justify-between border-t border-white/10 py-8 text-sm text-white/50`}>
        <span>© 2026 Stonemills</span>
        <span>Montería, Colombia</span>
      </footer>
    </main>
  );
}
