"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/modules/auth/client";
import { field } from "./admin";

export function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setBusy(true);
        setError("");
        const { error } = await authClient.signIn.email({ email: String(f.get("email")), password: String(f.get("password")) });
        if (error) {
          setBusy(false);
          return setError(error.status === 401 ? "Correo o contraseña incorrectos." : "No se pudo entrar. Inténtalo de nuevo.");
        }
        // Only same-site paths; /panel sends shop owners on to their own admin.
        router.push(next?.startsWith("/") && !next.startsWith("//") ? next : "/panel");
      }}
    >
      <label className="text-sm font-medium">
        Correo
        <input name="email" type="email" autoComplete="email" autoCapitalize="none" required className={field} />
      </label>
      <label className="text-sm font-medium">
        Contraseña
        <input name="password" type="password" autoComplete="current-password" required minLength={8} className={field} />
      </label>
      {error && (
        <p role="alert" className="text-sm font-medium text-[#b42318]">
          {error}
        </p>
      )}
      <button className="btn mt-2 bg-fg text-bg hover:bg-[#3f3f46]" disabled={busy}>
        {busy ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
