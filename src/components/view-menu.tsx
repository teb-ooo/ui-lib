import { useState } from "react";
import { Menu } from "@base-ui/react/menu";
import { Bookmark, Check } from "lucide-react";
import { Button } from "./button";
import { Dialog } from "./dialog";
import { Field } from "./field";
import { Input } from "./input";

export interface SavedView {
  id: string;
  name: string;
}

export interface ViewMenuProps {
  views: SavedView[];
  /** The view in use, or null for the default. */
  activeId: string | null;
  onSelect: (id: string | null) => void;
  /** Giving this adds "Save current view"; the app stores the filters and calls back with the name. */
  onSave?: (name: string) => void;
  /** Giving this adds "Delete view" for the active view. */
  onDelete?: (id: string) => void;
  /** Label of the default entry. @default "All" */
  defaultLabel?: string;
}

const item =
  "flex h-[var(--control-h)] cursor-pointer items-center gap-2 rounded px-2 outline-none data-[highlighted]:bg-surface-raised";

/** Saved filter views. It only shows them and asks; the app keeps the list and what each view means. */
export function ViewMenu({ views, activeId, onSelect, onSave, onDelete, defaultLabel = "All" }: ViewMenuProps) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const active = views.find((v) => v.id === activeId);
  const submit = () => {
    const trimmed = name.trim();
    if (trimmed === "") return;
    onSave?.(trimmed);
    setName("");
    setSaving(false);
  };
  const entry = (id: string | null, text: string) => (
    <Menu.Item key={id ?? "default"} onClick={() => onSelect(id)} className={item}>
      <span className="flex size-4 items-center justify-center">{activeId === id ? <Check aria-hidden="true" className="size-3" /> : null}</span>
      <span className="truncate">{text}</span>
    </Menu.Item>
  );
  return (
    <>
      <Menu.Root>
        <Menu.Trigger render={<Button icon={<Bookmark aria-hidden="true" className="size-4" />}>{active?.name ?? "Views"}</Button>} />
        <Menu.Portal>
          <Menu.Positioner align="end" sideOffset={4} className="z-50">
            <Menu.Popup className="anim-fade panel-inverse panel-float min-w-48 p-1 text-ink outline-none">
              {entry(null, defaultLabel)}
              {views.map((v) => entry(v.id, v.name))}
              {onSave || (onDelete && active) ? <Menu.Separator className="my-1 h-px bg-line" /> : null}
              {onSave ? (
                <Menu.Item onClick={() => setSaving(true)} className={item}>
                  <span className="size-4" />
                  Save current view
                </Menu.Item>
              ) : null}
              {onDelete && active ? (
                <Menu.Item onClick={() => onDelete(active.id)} className={`${item} text-danger`}>
                  <span className="size-4" />
                  Delete view
                </Menu.Item>
              ) : null}
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      <Dialog
        open={saving}
        onOpenChange={setSaving}
        title="Save current view"
        footer={
          <Button intent="solid" onClick={submit}>
            Save
          </Button>
        }
      >
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} autoComplete="off" />
        </Field>
      </Dialog>
    </>
  );
}
