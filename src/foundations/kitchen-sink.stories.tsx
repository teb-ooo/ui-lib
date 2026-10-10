import { useMemo, useState } from "react";
import {
  Accordion,
  Alert,
  Avatar,
  Button,
  Card,
  CardGrid,
  Checkbox,
  Chip,
  Combobox,
  ColorPicker,
  rgbToHex,
  ConfirmDialog,
  DataTable,
  Field,
  FieldGrid,
  FieldRow,
  FilterBar,
  Input,
  Kbd,
  LineChart,
  LiveIndicator,
  Menu,
  Meter,
  NumberField,
  PageHeader,
  Popover,
  SearchInput,
  Section,
  Select,
  Slider,
  StatusMark,
  Switch,
  Tabs,
  Textarea,
  ToastProvider,
  ToggleGroup,
  useToast,
} from "@teb-ooo/ui";
import type { Column } from "@teb-ooo/ui";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Kitchen sink",
  group: "Foundations",
  description:
    "Many components together in two whole screens, to see how they sit side by side: a project's settings (tabs, a long form with every kind of field, a colour picker in a popover, a members table, an activity chart, a danger zone with a confirmation) and an operations console (live status, meters, a status table, alerts, cards). Nothing here is a new component: it is the system as an app would use it. Resize the window to see both at phone width.",
  aliases: ["composition", "example screen", "playground", "all components", "demo", "form", "settings page", "dashboard", "showcase"],
} satisfies StoryDefault;

const regions = [
  { value: "eu", label: "Europe (Frankfurt)" },
  { value: "us", label: "US East (Virginia)" },
  { value: "ap", label: "Asia Pacific (Singapore)" },
];
const people = [
  { value: "ada", label: "Ada Okafor", tip: "Maintainer. Reviews every release." },
  { value: "grace", label: "Grace Lindqvist", tip: "On call this week." },
  { value: "linus", label: "Linus Park" },
  { value: "margaret", label: "Margaret Ito" },
  { value: "ken", label: "Ken Alvarez" },
];

interface Member {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Member";
  status: "active" | "invited" | "suspended";
  seen: string;
}
const members: Member[] = [
  { id: "1", name: "Ada Okafor", email: "ada@orbit.example", role: "Owner", status: "active", seen: "now" },
  { id: "2", name: "Grace Lindqvist", email: "grace@orbit.example", role: "Admin", status: "active", seen: "2 min ago" },
  { id: "3", name: "Linus Park", email: "linus@orbit.example", role: "Member", status: "active", seen: "yesterday" },
  { id: "4", name: "Margaret Ito", email: "margaret@orbit.example", role: "Member", status: "invited", seen: "never" },
  { id: "5", name: "Ken Alvarez", email: "ken@orbit.example", role: "Member", status: "suspended", seen: "3 weeks ago" },
  { id: "6", name: "Sam Rivera", email: "sam@orbit.example", role: "Member", status: "active", seen: "1 hour ago" },
];

const memberColumns: Column<Member>[] = [
  {
    id: "name",
    header: "Person",
    sortable: true,
    cell: (m) => (
      <span className="flex items-center gap-2">
        <Avatar name={m.name} size="sm" />
        {m.name}
      </span>
    ),
  },
  { id: "email", header: "Email", hideBelow: "md", cell: (m) => m.email },
  { id: "role", header: "Role", width: "7rem", cell: (m) => m.role },
  {
    id: "status",
    header: "Status",
    width: "8rem",
    cell: (m) => m.status,
    tone: (m) => (m.status === "active" ? "ok" : m.status === "invited" ? "link" : "danger"),
  },
  { id: "seen", header: "Last seen", width: "9rem", hideBelow: "lg", cell: (m) => m.seen },
];

const hours = Array.from({ length: 48 }, (_, i) => ({ time: new Date(Date.UTC(2026, 9, 10, 0, i * 30)).toISOString(), i }));

function ProjectSettingsScreen() {
  const toast = useToast();
  const [tab, setTab] = useState("general");
  const [name, setName] = useState("Orbit relay");
  const [slug, setSlug] = useState("Orbit-Relay");
  const [about, setAbout] = useState("Relays telemetry from the field stations to the archive.");
  const [region, setRegion] = useState<string | null>("eu");
  const [owners, setOwners] = useState<string[]>(["ada", "grace"]);
  const [retention, setRetention] = useState<number | null>(30);
  const [rate, setRate] = useState(240);
  const [visibility, setVisibility] = useState<string | null>("team");
  const [failMail, setFailMail] = useState(true);
  const [notify, setNotify] = useState({ deploys: true, alerts: true, digest: false });
  const [accent, setAccent] = useState(rgbToHex(236, 72, 153));
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const slugError = /[A-Z\s]/.test(slug) ? "Use lower-case letters, numbers and hyphens." : undefined;
  const shown = useMemo(
    () => members.filter((m) => (role === null || m.role.toLowerCase() === role) && `${m.name} ${m.email}`.toLowerCase().includes(query.toLowerCase())),
    [query, role],
  );

  return (
    <div className="flex min-w-0 flex-col">
      <PageHeader
        title="Orbit relay"
        description="Project settings. Changes apply to every environment."
        actions={
          <>
            <Menu
              trigger={<Button>More</Button>}
              align="end"
              items={[
                { id: "dup", label: "Duplicate project", onSelect: () => toast.show({ title: "Duplicated" }) },
                { id: "export", label: "Export settings", shortcut: "mod+e", onSelect: () => toast.show({ title: "Exported" }) },
                { type: "separator", id: "sep" },
                { id: "arch", label: "Archive", danger: true, onSelect: () => setConfirm(true) },
              ]}
            />
            <Button intent="solid" tip="Saves the form (Ctrl+S)" onClick={() => toast.show({ title: "Saved", description: "Orbit relay was updated.", tone: "ok" })}>
              Save changes
            </Button>
          </>
        }
      />
      <Tabs
        label="Project sections"
        value={tab}
        onValueChange={setTab}
        gutter
        tabs={[
          {
            value: "general",
            label: "General",
            panel: (
              <div className="grid grid-cols-1 gap-8 px-4 py-6 md:px-6 lg:grid-cols-3">
                <div className="flex min-w-0 flex-col gap-5 lg:col-span-2">
                  <Section title="Identity" description="How the project is named and found." rule="none">
                    <div className="flex flex-col gap-4">
                      <Field label="Project name" description="Shown in the header and in emails.">
                        <Input value={name} onChange={(e) => setName(e.target.value)} />
                      </Field>
                      <Field label="Address" error={slugError} description={slugError ? undefined : "Letters, numbers and hyphens."}>
                        <Input startAdornment="orbit.example/" value={slug} onChange={(e) => setSlug(e.target.value)} />
                      </Field>
                      <Field label="About">
                        <Textarea value={about} onChange={(e) => setAbout(e.target.value)} rows={3} />
                      </Field>
                    </div>
                  </Section>
                  <Section title="Where it runs" rule="none">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Select label="Region" options={regions} value={region} onValueChange={setRegion} className="w-full" />
                      <Combobox label="Owners" multiple options={people} value={owners} onValueChange={setOwners} placeholder="Add an owner" />
                      <NumberField label="Keep data for" unit="days" value={retention} onValueChange={setRetention} min={1} max={365} />
                      <Slider label="Rate limit" unit="/ min" min={60} max={600} step={10} value={rate} onValueChange={setRate} className="w-full" />
                    </div>
                  </Section>
                  <Section title="Access and alerts" rule="none">
                    <div className="flex flex-col gap-4">
                      <ToggleGroup label="Who can see it" options={[{ value: "private", label: "Only me" }, { value: "team", label: "My team" }, { value: "public", label: "Anyone" }]} value={visibility} onValueChange={setVisibility} required />
                      <Switch label="Email me when a deploy fails" description="One email per failed deploy, never more than hourly." checked={failMail} onCheckedChange={setFailMail} />
                      <fieldset className="flex flex-col gap-2">
                        <legend className="text-ink-muted">Notify the channel about</legend>
                        {(
                          [
                            ["deploys", "Deploys"],
                            ["alerts", "Alerts"],
                            ["digest", "A weekly digest"],
                          ] as const
                        ).map(([key, text]) => (
                          <label key={key} className="flex items-center gap-2">
                            <Checkbox aria-label={text} checked={notify[key]} onCheckedChange={(on) => setNotify({ ...notify, [key]: on === true })} />
                            {text}
                          </label>
                        ))}
                      </fieldset>
                      <div className="flex items-center gap-3">
                        <Popover
                          trigger={
                            <Button>
                              <span aria-hidden="true" className="size-3 rounded border border-line" style={{ background: accent }} />
                              Accent {accent}
                            </Button>
                          }
                          title="Accent colour"
                          showClose
                        >
                          <ColorPicker label="Accent colour" value={accent} onValueChange={setAccent} />
                        </Popover>
                        <span className="text-ink-faint">Used for the project's chart lines and badges.</span>
                      </div>
                    </div>
                  </Section>
                </div>
                <aside className="flex min-w-0 flex-col gap-4">
                  <Card title="Health" description="Last 24 hours" meta={<StatusMark status="ok" label="Relay: ok" />} footer="Checked 12 seconds ago" />
                  <Meter label="Storage used" value={71} zones={[{ from: 0, tone: "ok" }, { from: 70, tone: "warning" }, { from: 90, tone: "danger" }]} format={(v) => `${v} %`} />
                  <Meter label="Requests this minute" value={188} min={0} max={240} format={(v) => `${v} of 240`} />
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip tone="ok">production</Chip>
                    <Chip tone="warning">staging</Chip>
                    <Chip color="indigo">telemetry</Chip>
                    <Chip color="teal">archive</Chip>
                    <Chip tone="muted">v2.4.1</Chip>
                  </div>
                  <p className="text-ink-muted">
                    Press <Kbd shortcut="mod+k" /> to jump anywhere, <Kbd shortcut="mod+s" /> to save.
                  </p>
                </aside>
              </div>
            ),
          },
          {
            value: "members",
            label: "Members",
            badge: members.length,
            panel: (
              <div className="flex min-h-0 flex-col gap-3 px-4 py-4 md:px-6">
                <FilterBar
                  primary={<SearchInput label="Search people" value={query} onValueChange={setQuery} className="w-64 max-w-full" />}
                  end={<span className="text-ink-muted">{shown.length} people</span>}
                  aria-label="Filter members"
                >
                  <Select
                    label="Role"
                    placeholder="Any role"
                    value={role}
                    onValueChange={setRole}
                    options={[{ value: "owner", label: "Owner" }, { value: "admin", label: "Admin" }, { value: "member", label: "Member" }]}
                  />
                  <Button intent="solid">Invite</Button>
                </FilterBar>
                <div className="h-80">
                  <DataTable label="Members" columns={memberColumns} rows={shown} rowKey={(m) => m.id} empty="Nobody matches." />
                </div>
              </div>
            ),
          },
          {
            value: "activity",
            label: "Activity",
            panel: (
              <div className="flex flex-col gap-6 px-4 py-6 md:px-6">
                <Alert tone="info" title="A maintenance window is planned" action={<Button>Details</Button>}>
                  Saturday 02:00 to 03:00 UTC. The relay keeps accepting data and replays it afterwards.
                </Alert>
                <LineChart
                  label="Messages per half hour, and errors"
                  series={[
                    { label: "Messages", points: hours.map((h) => ({ time: h.time, value: 400 + 160 * Math.sin(h.i / 5) + (h.i % 7) * 6 })) },
                    { label: "Errors", points: hours.map((h) => ({ time: h.time, value: 12 + 9 * Math.cos(h.i / 4) })) },
                  ]}
                  formatValue={(v) => `${Math.round(v)}`}
                  className="w-full max-w-3xl"
                />
                <Accordion
                  items={[
                    { value: "a", title: "Deploy 2.4.1", trailing: <Chip tone="ok">live</Chip>, content: <p className="text-ink-muted">Rolled out to all regions in 4 minutes. No errors.</p> },
                    { value: "b", title: "Deploy 2.4.0", trailing: <Chip tone="muted">replaced</Chip>, content: <p className="text-ink-muted">Replaced after a slow query was found in the archive step.</p> },
                    { value: "c", title: "Deploy 2.3.9", trailing: <Chip tone="danger">rolled back</Chip>, content: <p className="text-ink-muted">Rolled back after the error rate passed 2 % for ten minutes.</p> },
                  ]}
                  defaultValue={["a"]}
                  multiple
                  className="max-w-3xl"
                />
              </div>
            ),
          },
          {
            value: "danger",
            label: "Danger zone",
            panel: (
              <div className="flex flex-col gap-4 px-4 py-6 md:px-6">
                <Alert tone="danger" title="These actions cannot be undone">
                  Archiving stops the relay and removes its keys. The data stays for 30 days.
                </Alert>
                <FieldGrid label="Danger zone">
                  <FieldRow label="Archive project" actions={<Button intent="danger" onClick={() => setConfirm(true)}>Archive</Button>}>
                    Stops the relay and revokes its keys.
                  </FieldRow>
                  <FieldRow label="Transfer ownership" actions={<Button>Transfer</Button>}>
                    Give the project to another person.
                  </FieldRow>
                </FieldGrid>
              </div>
            ),
          },
        ]}
      />
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={`Archive "${name}"?`}
        description="The relay stops and its keys are revoked. The data stays for 30 days. You can restore the project until then."
        confirmLabel="Archive"
        danger
        onConfirm={() => void toast.show({ title: "Archived", tone: "warning" })}
      />
    </div>
  );
}

export const ProjectSettings = () => (
  <ToastProvider>
    <div className="-mx-3 -mb-3 overflow-hidden">
      <ProjectSettingsScreen />
    </div>
  </ToastProvider>
);
ProjectSettings.storyMeta = {
  description:
    "A project's settings: a header with a menu and a save button, tabs, a long form (text, an address with an error, a textarea, select, multi-select with tips, number, slider, toggle group, switch, checkboxes, a colour picker in a popover), a members table with filters and status cells, a chart and an accordion, and a danger zone with a confirmation.",
} satisfies StoryMeta;

interface Service {
  id: string;
  name: string;
  region: string;
  latency: number;
  state: "ok" | "fail" | "info" | "none";
}
const services: Service[] = [
  { id: "api", name: "api", region: "eu", latency: 42, state: "ok" },
  { id: "relay", name: "relay", region: "eu", latency: 118, state: "info" },
  { id: "archive", name: "archive", region: "us", latency: 0, state: "fail" },
  { id: "search", name: "search", region: "ap", latency: 67, state: "ok" },
  { id: "mailer", name: "mailer", region: "us", latency: 0, state: "none" },
];

function ConsoleScreen() {
  const [range, setRange] = useState<string | null>("24h");
  const [live, setLive] = useState(true);
  return (
    <div className="flex min-w-0 flex-col gap-6 px-4 py-6 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="display-lg text-ink">Operations</h2>
          <LiveIndicator status={live ? "live" : "reconnecting"} tip />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ToggleGroup label="Range" options={[{ value: "1h", label: "1 h" }, { value: "24h", label: "24 h" }, { value: "7d", label: "7 d" }]} value={range} onValueChange={setRange} required />
          <Switch label="Live" checked={live} onCheckedChange={setLive} />
        </div>
      </div>
      <Alert tone="warning" title="The archive is down" action={<Button intent="danger">Page on call</Button>}>
        Writes are queued. 14,200 messages are waiting.
      </Alert>
      <CardGrid label="Key numbers">
        <Card title="Requests" description="1.2 M today" meta={<Chip tone="ok">+4 %</Chip>} />
        <Card title="Errors" description="0.4 %" meta={<Chip tone="warning">watch</Chip>} />
        <Card title="Queue" description="14,200 waiting" meta={<Chip tone="danger">growing</Chip>} marker={<Chip tone="danger">Needs you</Chip>} />
        <Card title="Deploys" description="3 this week" footer="Last one 2 hours ago" />
      </CardGrid>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-3 lg:col-span-2">
          <Section title="Services" rule="none" description="Where each one runs and how it answers.">
            <div className="h-64">
              <DataTable
                label="Services"
                columns={[
                  { id: "name", header: "Service", cell: (s: Service) => s.name },
                  { id: "region", header: "Region", width: "6rem", hideBelow: "sm", cell: (s: Service) => s.region },
                  { id: "latency", header: "Latency", width: "7rem", align: "end", cell: (s: Service) => (s.latency ? `${s.latency} ms` : "n/a") },
                  { id: "state", header: "State", width: "7rem", cell: (s: Service) => (s.state === "ok" ? "healthy" : s.state === "fail" ? "down" : s.state === "info" ? "slow" : "idle"), tone: (s: Service) => (s.state === "ok" ? "ok" : s.state === "fail" ? "danger" : s.state === "info" ? "warning" : "muted") },
                  { id: "mark", header: "Check", width: "5rem", align: "center", hideBelow: "sm", cell: (s: Service) => <StatusMark status={s.state} label={`${s.name}: ${s.state}`} /> },
                ]}
                rows={services}
                rowKey={(s) => s.id}
              />
            </div>
          </Section>
          <LineChart
            label="Latency"
            series={[
              { label: "api", points: hours.map((h) => ({ time: h.time, value: 40 + 12 * Math.sin(h.i / 6) })) },
              { label: "relay", points: hours.map((h) => ({ time: h.time, value: 100 + 30 * Math.cos(h.i / 7) + (h.i % 5) * 4 })) },
            ]}
            formatValue={(v) => `${Math.round(v)} ms`}
            className="w-full"
          />
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <Meter label="CPU" value={46} zones={[{ from: 0, tone: "ok" }, { from: 70, tone: "warning" }, { from: 90, tone: "danger" }]} format={(v) => `${v} %`} />
          <Meter label="Memory" value={82} zones={[{ from: 0, tone: "ok" }, { from: 70, tone: "warning" }, { from: 90, tone: "danger" }]} format={(v) => `${v} %`} />
          <Meter label="Disk" value={94} zones={[{ from: 0, tone: "ok" }, { from: 70, tone: "warning" }, { from: 90, tone: "danger" }]} format={(v) => `${v} %`} />
          <Field label="Note for the next person" description="Shown on the status page.">
            <Textarea rows={3} defaultValue="Archive disk is nearly full; a larger volume is on order." />
          </Field>
          <div className="flex gap-2">
            <Button intent="solid">Post note</Button>
            <Button>Clear</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export const OperationsConsole = () => (
  <ToastProvider>
    <div className="-mx-3 -mb-3 overflow-hidden">
      <ConsoleScreen />
    </div>
  </ToastProvider>
);
OperationsConsole.storyMeta = {
  description:
    "An operations console: a title with a live indicator, a range toggle and a switch, a warning alert with an action, key-number cards, a services table with a status column and marks, a latency chart, meters in their zones, and a note form.",
} satisfies StoryMeta;
