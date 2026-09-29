# Email base layout

`email/base.html.tmpl` and `email/base.txt.tmpl` work with Go `html/template` and `text/template`. Data placeholders:

- `{{.Title}}` page title and heading
- `{{.Preheader}}` hidden inbox preview text (HTML only)
- `{{.FactoryName}}` wordmark text
- `{{.Footer}}` footer line
- `{{template "content" .}}` the body: the caller defines a `content` template

The HTML is table-based with literal inline hex values (light theme), a 560px max width and a `color-scheme` meta with a dark-mode override. The logo slot is marked `LOGO SLOT`. `email/tokens.json` holds the literal values for both themes, derived from `theme.css` by `npm run build:email-tokens`.
