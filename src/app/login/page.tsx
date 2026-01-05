"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/Buttons";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/dashboard",
    });

    setLoading(false);

    if (!result?.ok) {
      setError("Invalid email or password.");
      return;
    }

    window.location.href = result.url ?? "/dashboard";
  }

  return (
    <Shell
      title="Sign in"
      subtitle="Access your dashboard to edit and publish your portfolio."
    >
      <form onSubmit={onSubmit} className="grid gap-4">
        <label className="grid gap-1">
          <span className="text-sm font-medium text-zinc-900">Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            className="h-10 rounded-xl border border-zinc-200 bg-white/80 px-3 text-zinc-950 placeholder:text-zinc-400 outline-none focus:border-zinc-400"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium text-zinc-900">Password</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            className="h-10 rounded-xl border border-zinc-200 bg-white/80 px-3 text-zinc-950 placeholder:text-zinc-400 outline-none focus:border-zinc-400"
          />
        </label>

        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <p className="text-sm text-zinc-600">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-zinc-950 underline">
              Create one
            </Link>
            .
          </p>
        )}

        <div className="flex items-center justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </div>
      </form>
    </Shell>
  );
}
