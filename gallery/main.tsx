import { StrictMode, useState } from "react";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { Avatar, Badge, Button, Dialog, Field, Input } from "../src/index";
import "./gallery.css";

type Mode = "system" | "light" | "dark";

function applyMode(mode: Mode): void {
  if (mode === "system") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", mode);
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-t border-line py-6">
      <h2 className="text-lg">{title}</h2>
      <div className="flex flex-wrap items-start gap-3">{children}</div>
    </section>
  );
}

function Gallery() {
  const [mode, setMode] = useState<Mode>("system");
  const [busy, setBusy] = useState(false);
  const pick = (m: Mode) => {
    setMode(m);
    applyMode(m);
  };
  return (
    <main className="mx-auto flex max-w-3xl flex-col p-6">
      <header className="flex items-center justify-between gap-4 pb-6">
        <h1 className="text-xl">@teb-ooo/ui</h1>
        <div className="flex gap-2" role="group" aria-label="Theme">
          {(["system", "light", "dark"] as const).map((m) => (
            <Button key={m} intent={mode === m ? "solid" : "default"} onClick={() => pick(m)}>
              {m}
            </Button>
          ))}
        </div>
      </header>
      <Section title="Type scale">
        <p className="text-sm">sm 0.75rem</p>
        <p className="text-base">base 0.875rem</p>
        <p className="text-lg">lg 1.125rem</p>
        <p className="text-xl">xl 1.5rem</p>
      </Section>
      <Section title="Colour tokens">
        {(["ground", "surface", "ink", "muted", "line", "accent", "danger"] as const).map((c) => (
          <div key={c} className="flex flex-col items-center gap-1 text-sm">
            <div className={`size-12 rounded-ctl border border-line bg-${c}`} style={{ background: `var(--${c})` }} />
            {c}
          </div>
        ))}
      </Section>
      <Section title="Button">
        <Button>Default</Button>
        <Button intent="solid">Solid</Button>
        <Button intent="danger">Danger</Button>
        <Button disabled>Disabled</Button>
        <Button intent="solid" loading={busy} onClick={() => { setBusy(true); setTimeout(() => setBusy(false), 1500); }}>
          Loading
        </Button>
      </Section>
      <Section title="Input and Field">
        <div className="flex w-64 flex-col gap-4">
          <Input placeholder="Plain input" aria-label="Plain input" />
          <Field label="Username" description="3 to 32 characters">
            <Input defaultValue="alex" />
          </Field>
          <Field label="Email" error="Enter a valid email address">
            <Input defaultValue="alex@" />
          </Field>
        </div>
      </Section>
      <Section title="Dialog">
        <Dialog
          trigger={<Button>Open dialog</Button>}
          title="Remove passkey"
          description="You will no longer be able to sign in with it."
          footer={<Button intent="danger">Remove</Button>}
        />
      </Section>
      <Section title="Avatar">
        <Avatar name="alex" size="sm" />
        <Avatar name="alex" size="md" />
        <Avatar name="alex_tebbs" size="lg" />
      </Section>
      <Section title="Badge">
        <Badge>default</Badge>
        <Badge tone="accent">staging</Badge>
        <Badge tone="danger">danger</Badge>
      </Section>
    </main>
  );
}

const el = document.getElementById("root");
if (!el) throw new Error("no #root");
createRoot(el).render(
  <StrictMode>
    <Gallery />
  </StrictMode>,
);
