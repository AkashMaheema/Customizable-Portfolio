"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/Buttons";

function useDebounced<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [usernameCache, setUsernameCache] = useState<
    Record<string, "available" | "taken" | "invalid">
  >({});

  const [availability, setAvailability] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid" | "error"
  >("idle");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const debouncedUsername = useDebounced(username, 180);

  useEffect(() => {
    const u = debouncedUsername.trim();
    if (!u) return;

    const cached = usernameCache[u];
    if (cached) return;
    if (availability !== "checking") return;
    const controller = new AbortController();

    fetch(`/api/username/check?username=${encodeURIComponent(u)}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((data: { available?: boolean; reason?: string }) => {
        if (controller.signal.aborted) return;
        if (data.reason === "invalid") {
          setUsernameCache((prev) => ({ ...prev, [u]: "invalid" }));
          setAvailability("invalid");
          return;
        }
        if (data.reason === "error") {
          setAvailability("error");
          return;
        }
        const next = data.available ? "available" : "taken";
        setUsernameCache((prev) => ({ ...prev, [u]: next }));
        setAvailability(next);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (err && typeof err === "object" && "name" in err) {
          if ((err as { name?: unknown }).name === "AbortError") return;
        }
        setAvailability("error");
      });

    return () => controller.abort();
  }, [availability, debouncedUsername, usernameCache]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        username: username.trim(),
        password,
      }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setLoading(false);
      setError(data?.error ?? "Registration failed.");
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/dashboard",
    });

    setLoading(false);

    if (!result?.ok) {
      window.location.href = "/login";
      return;
    }

    window.location.href = result.url ?? "/dashboard";
  }

  const usernameHint =
    availability === "available"
      ? "Username is available"
      : availability === "taken"
      ? "Username is taken"
      : availability === "invalid"
      ? "3-24 chars: lowercase, numbers, underscores"
      : availability === "checking"
      ? "Checking..."
      : availability === "error"
      ? "Unable to check right now"
      : "Used for your public URL: /[username]";

  return (
    <Shell
      title="Create account"
      subtitle="Build your single-template portfolio."
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
          <span className="text-sm font-medium text-zinc-900">Username</span>
          <input
            value={username}
            onChange={(e) => {
              const next = e.target.value.toLowerCase();
              setUsername(next);
              const trimmed = next.trim();
              if (!trimmed) {
                setAvailability("idle");
                return;
              }

              const cached = usernameCache[trimmed];
              if (cached) {
                setAvailability(cached);
                return;
              }

              if (trimmed.length >= 3) setAvailability("checking");
            }}
            type="text"
            required
            className="h-10 rounded-xl border border-zinc-200 bg-white/80 px-3 text-zinc-950 placeholder:text-zinc-400 outline-none focus:border-zinc-400"
          />
          <span
            className={`text-xs ${
              availability === "available"
                ? "text-emerald-700"
                : availability === "taken" || availability === "invalid"
                ? "text-red-600"
                : availability === "error"
                ? "text-zinc-600"
                : "text-zinc-600"
            }`}
          >
            {usernameHint}
          </span>
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium text-zinc-900">Password</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            minLength={8}
            className="h-10 rounded-xl border border-zinc-200 bg-white/80 px-3 text-zinc-950 placeholder:text-zinc-400 outline-none focus:border-zinc-400"
          />
        </label>

        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <p className="text-sm text-zinc-600">
            Already have an account?{" "}
            <Link href="/login" className="text-zinc-950 underline">
              Sign in
            </Link>
            .
          </p>
        )}

        <div className="flex items-center justify-end">
          <Button
            type="submit"
            disabled={
              loading ||
              availability === "taken" ||
              availability === "invalid" ||
              availability === "checking" ||
              availability === "error"
            }
          >
            {loading ? "Creating..." : "Create account"}
          </Button>
        </div>
      </form>
    </Shell>
  );
}
