# Email base layout

`email/base.html.tmpl` and `email/base.txt.tmpl` work with Go `html/template` and `text/template`. Data placeholders:

- `{{.Title}}` page title and heading
- `{{.Preheader}}` hidden inbox preview text (HTML only)
- `{{.FactoryName}}` wordmark text
- `{{.Footer}}` footer line
- `{{template "content" .}}` the body: the caller defines a `content` template

The HTML is table-based with literal inline hex values from the light token set, a 560px max width, and a `prefers-color-scheme: dark` override that swaps in the dark literals for mail clients that support it. Type is exactly the two sizes as literals: body 14px/1.6 and display 32px/1.3 (the title). The logo slot is marked `LOGO SLOT`. `email/tokens.json` holds the literal light and dark sets and the two type sizes, derived from `theme.css` by `npm run build:email-tokens`.
