import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";
import { VERSION } from "@/lib/version";

export const metadata: Metadata = { title: "Entrar · Logcase" };

export default function LoginPage() {
  return (
    <main className="grid min-h-svh place-items-center bg-bg px-4 py-[max(2rem,env(safe-area-inset-top))]">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-medium">Logcase</span>
          <span className="rounded-full bg-raised px-2.5 py-1 text-xs font-medium text-muted">{VERSION}</span>
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="display text-5xl">Entrar</h1>
          <p className="text-muted">Administra tu tienda o el panel de Logcase.</p>
        </div>
        {/* useSearchParams (?next=) needs a Suspense boundary under cacheComponents */}
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
