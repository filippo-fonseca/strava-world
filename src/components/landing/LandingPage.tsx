"use client";

import { motion } from "framer-motion";
import {
  Camera,
  Flame,
  Globe2,
  ImageOff,
  MapPinned,
  Sparkles,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { NeuButton } from "@/components/ui/NeuButton";
import { NeuPanel } from "@/components/ui/NeuPanel";

type Props = {
  stravaConfigured: boolean;
};

export function LandingPage({ stravaConfigured }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [demoLoading, setDemoLoading] = useState(false);

  async function startDemo() {
    setDemoLoading(true);
    try {
      const res = await fetch("/api/auth/demo", { method: "POST" });
      if (!res.ok) throw new Error("Demo session failed");
      router.push("/map");
      router.refresh();
    } catch {
      setDemoLoading(false);
    }
  }

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-white/40 blur-3xl" />
        <div className="absolute right-[-4rem] top-24 h-80 w-80 rounded-full bg-[rgba(228,87,46,0.12)] blur-3xl" />
      </div>

      <main className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-16 pt-6 md:px-8 md:pt-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="neu-convex grid h-12 w-12 place-items-center rounded-2xl">
              <Sparkles className="text-[var(--neu-accent)]" size={20} />
            </div>
            <span className="font-[family-name:var(--font-display)] text-2xl tracking-tight">
              Strava World
            </span>
          </div>
          <a
            href="https://github.com/filippo-fonseca/strava-world"
            target="_blank"
            rel="noreferrer"
            className="text-sm text-[var(--neu-muted)] transition hover:text-[var(--neu-ink)]"
          >
            GitHub
          </a>
        </header>

        <section className="mt-10 grid flex-1 items-center gap-10 lg:mt-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--neu-muted)]"
            >
              Soft atlas for hard miles
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="mt-4 max-w-xl font-[family-name:var(--font-display)] text-5xl leading-[0.95] tracking-tight md:text-7xl"
            >
              Strava World
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.12 }}
              className="mt-5 max-w-lg text-lg leading-relaxed text-[var(--neu-muted)] md:text-xl"
            >
              A neumorphic world map of where you&apos;ve run — heatmaps, routes,
              and photo memories from Strava, with gentle markers when a run has
              no camera roll.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.18 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              {stravaConfigured ? (
                <a href="/api/auth/strava">
                  <NeuButton variant="accent" size="lg" leftIcon={<Flame size={18} />}>
                    Connect Strava
                  </NeuButton>
                </a>
              ) : (
                <NeuButton variant="accent" size="lg" disabled leftIcon={<Flame size={18} />}>
                  Add Strava env to connect
                </NeuButton>
              )}
              <NeuButton
                size="lg"
                leftIcon={<Globe2 size={18} />}
                onClick={startDemo}
                disabled={demoLoading}
              >
                {demoLoading ? "Opening atlas…" : "Explore demo world"}
              </NeuButton>
            </motion.div>

            {error && (
              <p className="mt-4 text-sm text-[var(--neu-accent)]">
                Sign-in issue: {error.replaceAll("_", " ")}. You can still explore
                the demo atlas.
              </p>
            )}

            {!stravaConfigured && (
              <p className="mt-4 max-w-md text-sm text-[var(--neu-muted)]">
                Set <code className="text-[var(--neu-ink)]">STRAVA_CLIENT_ID</code>{" "}
                and <code className="text-[var(--neu-ink)]">STRAVA_CLIENT_SECRET</code>{" "}
                in <code className="text-[var(--neu-ink)]">.env.local</code> to
                unlock live data.
              </p>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative"
          >
            <div className="neu-convex animate-float-soft relative overflow-hidden rounded-[36px] p-3 md:p-4">
              <div className="neu-concave relative aspect-[4/5] overflow-hidden rounded-[28px] md:aspect-[5/4]">
                <div
                  className="absolute inset-0 opacity-90"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 20% 20%, rgba(228,87,46,0.22), transparent 28%), radial-gradient(circle at 70% 35%, rgba(63,125,90,0.18), transparent 24%), radial-gradient(circle at 45% 75%, rgba(228,87,46,0.28), transparent 20%), linear-gradient(160deg,#d9d1c4,#ebe5db 55%,#d2c7b6)",
                  }}
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(44,41,36,0.08))]" />

                <div className="absolute left-[18%] top-[28%] h-16 w-16 rounded-full bg-[rgba(228,87,46,0.35)] blur-xl" />
                <div className="absolute right-[22%] top-[42%] h-24 w-24 rounded-full bg-[rgba(228,87,46,0.25)] blur-2xl" />

                <div className="absolute left-[22%] top-[30%] photo-pulse">
                  <div
                    className="h-14 w-14 rounded-full border-[3px] border-white/80 shadow-lg"
                    style={{
                      backgroundImage:
                        "url(https://images.unsplash.com/photo-1505761671935-60b3a7483660?auto=format&fit=crop&w=200&q=80)",
                      backgroundSize: "cover",
                    }}
                  />
                </div>

                <div className="absolute right-[26%] top-[48%]">
                  <div className="grid h-12 w-12 place-items-center rounded-full border-2 border-dashed border-[rgba(84,72,56,0.45)] bg-[#ebe4d8] text-[var(--neu-muted)] shadow">
                    <ImageOff size={18} />
                  </div>
                </div>

                <div className="absolute bottom-4 left-4 right-4">
                  <NeuPanel className="!rounded-2xl !p-3 backdrop-blur">
                    <div className="flex items-center gap-3">
                      <MapPinned className="text-[var(--neu-accent)]" size={18} />
                      <div>
                        <p className="text-sm font-semibold">Lisbon · Alfama Sunrise</p>
                        <p className="text-xs text-[var(--neu-muted)]">
                          Heatmap + photo memory pinned
                        </p>
                      </div>
                    </div>
                  </NeuPanel>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="mt-14 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Flame,
              title: "Global heatmap",
              copy: "See density of where your legs have been — soft orange glow across the planet.",
            },
            {
              icon: Camera,
              title: "Run photos",
              copy: "Pull Strava photos onto the map. Tap a pin to relive the miles.",
            },
            {
              icon: ImageOff,
              title: "No-photo markers",
              copy: "Runs without photos still matter — dashed indicators keep the atlas honest.",
            },
          ].map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.45, delay: index * 0.06 }}
            >
              <NeuPanel className="h-full">
                <div className="neu-concave mb-3 grid h-11 w-11 place-items-center rounded-2xl text-[var(--neu-accent)]">
                  <item.icon size={18} />
                </div>
                <h3 className="font-[family-name:var(--font-display)] text-xl tracking-tight">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--neu-muted)]">
                  {item.copy}
                </p>
              </NeuPanel>
            </motion.div>
          ))}
        </section>
      </main>
    </div>
  );
}
