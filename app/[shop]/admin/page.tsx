import type { Metadata } from "next";
import { Suspense } from "react";
import { Admin } from "@/components/admin";
import { requireShopAccess } from "@/modules/auth/access";

export const metadata: Metadata = { title: "Administrar" };

// The session check reads cookies, so it renders at request time inside Suspense.
export default function AdminPage(props: PageProps<"/[shop]/admin">) {
  return (
    <Suspense>
      <Gate params={props.params} />
    </Suspense>
  );
}

async function Gate({ params }: { params: Promise<{ shop: string }> }) {
  await requireShopAccess((await params).shop);
  return <Admin />;
}
