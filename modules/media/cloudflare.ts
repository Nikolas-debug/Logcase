// Cloudflare Images API. Server only: uses CF_IMAGES_TOKEN.
// Metadata tags each image with its shop so the dashboard stays filterable per tenant.
type Meta = { shop: string; kind: "product" | "slide" | "logo" };

const api = (path: string, init: RequestInit) =>
  fetch(`https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/images/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${process.env.CF_IMAGES_TOKEN}` },
  }).then(async (r) => {
    const body = await r.json();
    if (!body.success) throw new Error(`Cloudflare Images ${path}: ${JSON.stringify(body.errors)}`);
    return body.result;
  });

function form(fields: Record<string, string | Blob>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.append(k, v);
  return f;
}

// One-time URL the browser POSTs the file to (field "file"). Caller must check the session owns meta.shop.
export const createUpload = (meta: Meta): Promise<{ id: string; uploadURL: string }> =>
  api("v2/direct_upload", { method: "POST", body: form({ metadata: JSON.stringify(meta) }) });

// Server-side upload, used by the migration script.
export const uploadFile = (file: Blob, name: string, meta: Meta): Promise<{ id: string }> =>
  api("v1", { method: "POST", body: form({ file: new File([file], name), metadata: JSON.stringify(meta) }) });

export const deleteImage = (id: string) => api(`v1/${id}`, { method: "DELETE" });
