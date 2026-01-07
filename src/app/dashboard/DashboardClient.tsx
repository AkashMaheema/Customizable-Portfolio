"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button, ButtonSecondary, LinkButton } from "@/components/Buttons";
import { useToast } from "@/components/ToastProvider";

function useDebounced<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}

export function DashboardClient({
  username: initialUsername,
  hasPortfolio,
  isPublished,
  publicUrl,
}: {
  username: string;
  hasPortfolio: boolean;
  isPublished: boolean;
  publicUrl: string;
}) {
  const router = useRouter();
  const toast = useToast();

  const [username, setUsername] = useState(initialUsername);
  const [availability, setAvailability] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid" | "same" | "error"
  >("same");
  const [savingUsername, setSavingUsername] = useState(false);

  const [usernameCache, setUsernameCache] = useState<
    Record<string, "available" | "taken" | "invalid">
  >({});

  const [portfolioExists, setPortfolioExists] = useState(hasPortfolio);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(isPublished);

  const debouncedUsername = useDebounced(username, 180);

  useEffect(() => {
    const u = debouncedUsername.trim();
    if (!u) return;
    if (u === initialUsername) return;

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
  }, [availability, debouncedUsername, initialUsername, usernameCache]);

  const usernameStatus =
    availability === "same"
      ? "Current username"
      : availability === "available"
      ? "Username is available"
      : availability === "taken"
      ? "Username is taken"
      : availability === "invalid"
      ? "3-24 chars: lowercase, numbers, underscores"
      : availability === "checking"
      ? "Checking..."
      : availability === "error"
      ? "Unable to check right now"
      : "";

  const canSaveUsername =
    username.trim() !== initialUsername && availability === "available";

  async function saveUsername() {
    setSavingUsername(true);
    const res = await fetch("/api/username", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim() }),
    });
    setSavingUsername(false);

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      toast.error(
        "Could not update username",
        data?.error ?? "Please try again."
      );
      router.refresh();
      return;
    }

    toast.success("Username updated", "Your public URL was updated.");
    router.refresh();
  }

  async function createPortfolio() {
    const res = await fetch("/api/portfolio", { method: "POST" });
    if (res.ok) {
      setPortfolioExists(true);
      toast.success("Portfolio created", "Open the editor to customize it.");
      router.refresh();
      return;
    }

    const data = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    toast.error(
      "Could not create portfolio",
      data?.error ?? "Please try again."
    );
  }

  async function togglePublish(next: boolean) {
    setPublishing(true);
    const res = await fetch("/api/portfolio/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: next }),
    });
    setPublishing(false);
    if (res.ok) {
      setPublished(next);
      toast.success(next ? "Portfolio is live" : "Portfolio unpublished");
    } else {
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      toast.error(
        "Could not update publishing",
        data?.error ?? "Please try again."
      );
    }
    router.refresh();
  }

  return (
    <div className="grid gap-8">
      <div className="grid gap-3">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="grid gap-2">
            <p className="text-sm font-medium text-zinc-900">Username</p>
            <input
              value={username}
              onChange={(e) => {
                const next = e.target.value.toLowerCase();
                setUsername(next);

                const trimmed = next.trim();
                if (!trimmed) {
                  setAvailability("invalid");
                  return;
                }

                if (trimmed === initialUsername) {
                  setAvailability("same");
                  return;
                }

                const cached = usernameCache[trimmed];
                if (cached) {
                  setAvailability(cached);
                  return;
                }

                if (trimmed.length >= 3) setAvailability("checking");
              }}
              className="h-10 w-full max-w-sm rounded-xl border border-zinc-200 bg-white/80 px-3 text-zinc-950 placeholder:text-zinc-400 outline-none focus:border-zinc-400"
            />
            <p
              className={`text-xs ${
                availability === "available" || availability === "same"
                  ? "text-emerald-700"
                  : availability === "taken" || availability === "invalid"
                  ? "text-red-600"
                  : "text-zinc-600"
              }`}
            >
              {usernameStatus}
            </p>
          </div>

          <Button
            disabled={!canSaveUsername || savingUsername}
            onClick={saveUsername}
          >
            {savingUsername ? "Saving..." : "Save username"}
          </Button>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-zinc-700">
            Public URL:{" "}
            <span className="font-medium text-zinc-950">{publicUrl}</span>
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-zinc-900">Portfolio</p>
          <div className="flex flex-wrap items-center gap-2">
            {portfolioExists ? (
              <LinkButton href="/dashboard/editor">Open editor</LinkButton>
            ) : null}

            <ButtonSecondary onClick={() => signOut({ callbackUrl: "/" })}>
              Sign out
            </ButtonSecondary>
          </div>
        </div>

        {!portfolioExists ? (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div>
              <p className="text-sm font-medium text-zinc-950">
                Create your portfolio
              </p>
              <p className="text-sm text-zinc-600">
                One portfolio per account.
              </p>
            </div>
            <Button onClick={createPortfolio}>Create portfolio</Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div>
              <p className="text-sm font-medium text-zinc-950">
                {published ? "Published" : "Go Live"}
              </p>
              <p className="text-sm text-zinc-600">
                {published
                  ? "Your portfolio is live."
                  : "Publish to make your portfolio live."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {published ? (
                <ButtonSecondary
                  disabled={publishing}
                  onClick={() => togglePublish(false)}
                >
                  Unpublish
                </ButtonSecondary>
              ) : (
                <Button
                  disabled={publishing}
                  onClick={() => togglePublish(true)}
                >
                  Publish
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
