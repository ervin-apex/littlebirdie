# Little Birdee auth email templates

These six Supabase Auth templates use the signed-off brand system:

- Sunflower yellow `#fcb400`, Ink `#10203c`, Paper `#f9f9f9`
- Rounded, tactile primary actions with the Yellow Edge `#c88400`
- Short, plain-spoken copy with profit kept front and centre
- Birdee as a warm guide, without turning security emails into marketing blasts

## Hosted setup

The Supabase project is on the Free plan and was created after June 3, 2026.
Supabase therefore requires custom SMTP before hosted auth templates can be
edited. Once SMTP is connected, publish each subject and HTML body from
`supabase/config.toml` and this directory in:

`Authentication > Emails > Templates`

The logo is loaded from the stable production alias:

`https://littlebirdie-gray.vercel.app/brand/birdee-face-square.png`

## Template variables

- Link-based templates use `{{ .ConfirmationURL }}`.
- Reauthentication uses `{{ .Token }}`.
- Account context uses `{{ .Email }}` and the email-change template also uses
  `{{ .NewEmail }}`.

Keep email-provider click tracking disabled so confirmation links are not
rewritten.
