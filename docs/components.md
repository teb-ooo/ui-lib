# Components

All components are named exports of `@teb-ooo/ui`, each with an exported `*Props` interface. Every component accepts `className` (layout utilities only) and the standard attributes of the element it renders.

## Button
The only button. Extends Base UI `Button` props.
- `intent?: "default" | "solid" | "danger"` (default `"default"`): outlined, primary, destructive.
- `loading?: boolean`: spinner, `aria-busy`, activation blocked, stays focusable.
- `disabled`, `onClick`, `type` (default `"button"`), ref to the `<button>`.

## Input
Text input on Base UI `Input`; ref to the `<input>`. Inside a `Field` it takes id, description and invalid state from the field.

## Field
Label + control + description + error, wired for assistive tech (label association, `aria-describedby`, `aria-invalid`, error in `role="alert"`).
- `label: ReactNode` (required)
- `error?: ReactNode`: when set, the field is invalid.
- `description?: ReactNode`
- `children`: the control, normally an `Input`.

## Dialog
Modal on Base UI `Dialog`: focus moves in, Escape closes, focus returns to the trigger.
- `title: ReactNode` (required; the accessible name), `description?`, `footer?`, `children?`
- `trigger?: ReactElement` (usually a `Button`), or control it with `open` / `onOpenChange(open, details)`; `defaultOpen`.
- `closeLabel?: string` (default `"Close"`).

## Avatar
Square, image with fallback initials.
- `name: string` (required; accessible name and initials), `src?: string`, `size?: "sm" | "md" | "lg"` (default `"md"`; 1.5, 2, 3 rem).
- `initialsOf(name)` is exported.

## Badge
Small uppercase label, e.g. `staging`.
- `tone?: "default" | "accent" | "danger"`; span attributes.

## Theme
Utilities available: colours `ground surface ink muted line accent on-accent danger`, radius `rounded-ctl`, text sizes `text-sm | text-base | text-lg | text-xl` (exactly four), `font-sans` (Geist Mono), control height `h-(--control-h)`. Default Tailwind colours, text sizes and radii are reset, so anything else does not exist. Set `data-theme="light" | "dark"` on `<html>` to override the OS setting.
