// Shop types used across the UI, plus the seed data for db/seed.mts (the app itself reads Postgres).

export type Theme = {
  bg: string; // page background
  surface: string; // panels, cards
  raised: string; // hover / elevated
  text: string;
  muted: string;
  accent: string; // functional only: CTAs, active states
  ink: string; // text on accent
};

export type Product = {
  ref: string;
  name: string;
  category: string;
  price: number; // COP
  stock: number;
  sizes?: string[];
  image: string;
  description?: string;
};

// Home carousel slide. Links to a category; editable in admin.
export type Slide = {
  id: string;
  image: string;
  title: string;
  text?: string;
  category?: string;
};

export type Shop = {
  slug: string;
  name: string;
  tagline: string;
  city: string;
  whatsapp: string; // international format, digits only
  instagram: string;
  logo: string;
  theme: Theme;
  categories: string[];
  slides: Slide[];
  products: Product[];
};

const img = (name: string) => `/shops/dulce-amor/${name}.webp`;

const dulceAmor: Shop = {
  slug: "dulce-amor",
  name: "Dulce Amor Buenavista",
  tagline: "Detalles que endulzan tus momentos",
  city: "Montería",
  whatsapp: "573006222300",
  instagram: "dulceamormonteria",
  logo: img("logo"),
  theme: {
    bg: "#fbfbf5",
    surface: "#ffffff",
    raised: "#f3efec",
    text: "#0a0a0a",
    muted: "#5e5860",
    accent: "#c8336f",
    ink: "#ffffff",
  },
  categories: ["Pijamas", "Camisetas", "Fragancias", "Bolsos", "Cabello", "Bisutería", "Peluches", "Detalles", "Infantil"],
  slides: [
    { id: "s1", image: img("slide-arreglo"), title: "Regalos que se recuerdan", text: "Arreglos por encargo con rosas, globo y chocolates.", category: "Detalles" },
    { id: "s2", image: img("kit-splash"), title: "Fragancias para regalar", text: "Kits de splash y perfumes árabes en tendencia.", category: "Fragancias" },
    { id: "s3", image: img("llavero-capibara-abeja"), title: "Llegaron los capibaras", text: "Llaveros de peluche para colgar en todo.", category: "Peluches" },
    { id: "s4", image: img("aretes-dorados"), title: "Brillo de todos los días", text: "Aretes, anillos y pulseras desde $15.000.", category: "Bisutería" },
    { id: "s5", image: img("pinzas-frutas"), title: "Para tu cabello", text: "Pinzas, scrunchies y moños de temporada.", category: "Cabello" },
  ],
  products: [
    { ref: "PSN0098", name: "Pijama Sonic", category: "Pijamas", price: 45000, stock: 6, sizes: ["10", "12"], image: img("pijama-sonic"), description: "Camiseta y short estampados, tela fresca." },
    { ref: "PSG0003", name: "Pijama Labubu niña", category: "Pijamas", price: 42000, stock: 4, sizes: ["2", "4"], image: img("pijama-labubu-nina"), description: "Conjunto de camiseta y short con estampado Labubu." },
    { ref: "BTP0005", name: "Batola corazones", category: "Pijamas", price: 48000, stock: 5, sizes: ["Única", "Plus"], image: img("batola-corazones"), description: "Batola lila de tiras con corazones." },
    { ref: "PDC0007", name: "Pijama Labubu capri", category: "Pijamas", price: 55000, stock: 3, sizes: ["S", "M"], image: img("pijama-labubu-capri"), description: "Esqueleto y pantalón capri." },
    { ref: "CMH0012", name: "Camiseta Monastery Couture", category: "Camisetas", price: 65000, stock: 2, sizes: ["XXL"], image: img("camiseta-monastery") },
    { ref: "CMH0015", name: "Camiseta Puma estampada", category: "Camisetas", price: 70000, stock: 1, sizes: ["XXL"], image: img("camiseta-puma") },
    { ref: "CMH0018", name: "Camiseta blanca logo azul", category: "Camisetas", price: 60000, stock: 2, sizes: ["XL"], image: img("camiseta-blanca-azul") },
    { ref: "CMH0021", name: "Camiseta Hilfiger franja", category: "Camisetas", price: 75000, stock: 8, sizes: ["M", "L", "XL"], image: img("camiseta-hilfiger") },
    { ref: "CMH0024", name: "Camiseta Jordan roja", category: "Camisetas", price: 75000, stock: 0, sizes: ["M", "L", "XL"], image: img("camiseta-jordan") },
    { ref: "FRG0101", name: "Yara Tous · Lattafa 100 ml", category: "Fragancias", price: 180000, stock: 3, image: img("yara-tous") },
    { ref: "FRG0102", name: "212 VIP Rosé 80 ml", category: "Fragancias", price: 160000, stock: 2, image: img("212-vip-rose") },
    { ref: "FRG0103", name: "Pink Sweet edición limitada", category: "Fragancias", price: 85000, stock: 4, image: img("pink-sweet") },
    { ref: "FRG0104", name: "Yara · Lattafa 100 ml", category: "Fragancias", price: 170000, stock: 3, image: img("yara-rosa") },
    { ref: "KSP0201", name: "Kit splash + pinza flor", category: "Fragancias", price: 30000, stock: 10, image: img("kit-splash"), description: "Splash, eau de toilette y pinza en bolsa dorada. Ideal para regalo." },
    { ref: "BRL0301", name: "Brillo labial Labubu", category: "Fragancias", price: 8000, stock: 12, image: img("brillo-labubu"), description: "Miss Betty, 3 colores." },
    { ref: "BLS0401", name: "Morral rosa monograma", category: "Bolsos", price: 120000, stock: 2, image: img("morral-rosa") },
    { ref: "ACC0501", name: "Scrunchies de satín", category: "Cabello", price: 5000, stock: 30, image: img("scrunchies-satin"), description: "Lila, dorado y animal print." },
    { ref: "ACC0502", name: "Pañoleta de satín", category: "Cabello", price: 18000, stock: 6, image: img("panoleta-satin") },
    { ref: "ACC0503", name: "Pinzas frutas y flores", category: "Cabello", price: 10000, stock: 20, image: img("pinzas-frutas") },
    { ref: "ACC0504", name: "Moños para niña", category: "Cabello", price: 12000, stock: 15, image: img("monos-nina") },
    { ref: "ACC0505", name: "Frasco de ligas", category: "Cabello", price: 9000, stock: 10, image: img("ligas-frasco") },
    { ref: "BIS0601", name: "Aretes dorados surtidos", category: "Bisutería", price: 15000, stock: 18, image: img("aretes-dorados") },
    { ref: "BIS0602", name: "Anillos filigrana", category: "Bisutería", price: 18000, stock: 8, image: img("anillos-filigrana") },
    { ref: "BIS0603", name: "Pulseras de cristal x4", category: "Bisutería", price: 20000, stock: 7, image: img("pulseras-cristal") },
    { ref: "BIS0604", name: "Denario tricolor", category: "Bisutería", price: 35000, stock: 5, image: img("denario-tricolor") },
    { ref: "PEL0701", name: "Llavero cerdito", category: "Peluches", price: 22000, stock: 4, image: img("llavero-cerdito") },
    { ref: "PEL0702", name: "Llavero capibara abeja", category: "Peluches", price: 22000, stock: 3, image: img("llavero-capibara-abeja") },
    { ref: "PEL0703", name: "Llavero capibara cocodrilo", category: "Peluches", price: 22000, stock: 3, image: img("llavero-capibara-cocodrilo") },
    { ref: "PEL0704", name: "Llaveros de personajes", category: "Peluches", price: 12000, stock: 14, image: img("llaveros-personajes") },
    { ref: "DET0801", name: "Arreglo de cumpleaños", category: "Detalles", price: 120000, stock: 99, image: img("arreglo-cumpleanos"), description: "Rosas, globo burbuja, chocolates y tarjeta. Por encargo." },
    { ref: "DET0802", name: "Ancheta de dulces", category: "Detalles", price: 65000, stock: 99, image: img("ancheta-dulces") },
    { ref: "DET0803", name: "Bolsa sorpresa", category: "Detalles", price: 15000, stock: 20, image: img("bolsa-sorpresa") },
    { ref: "DET0804", name: "Frascos decorados", category: "Detalles", price: 18000, stock: 8, image: img("frascos-decorados") },
    { ref: "DET0805", name: "Monedas de chocolate en bandeja", category: "Detalles", price: 8000, stock: 25, image: img("monedas-chocolate") },
    { ref: "DET0806", name: "Stickers anime", category: "Detalles", price: 3000, stock: 50, image: img("stickers-anime") },
    { ref: "NIN0901", name: "Reloj Minnie + collar", category: "Infantil", price: 25000, stock: 6, image: img("reloj-minnie") },
  ],
};

export const shops: Record<string, Shop> = { [dulceAmor.slug]: dulceAmor };
