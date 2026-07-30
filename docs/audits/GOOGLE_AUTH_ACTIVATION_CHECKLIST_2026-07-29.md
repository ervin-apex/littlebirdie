# Google sign-in activation checklist

**Application status:** Implemented and verified in the Little Birdee UI  
**Provider status:** Not yet enabled in the connected Supabase project

The application now uses Supabase's browser OAuth flow and returns through:

`/auth/callback`

New Google users continue to the authenticated business-details screen. Existing Google users continue through the same venue-selection route used by email/password login.

## One-time external setup

1. In Google Auth Platform, create a **Web application** OAuth client.
2. Add the local JavaScript origin:
   - `http://localhost:3000`
3. Add every production application origin once the permanent production URL is confirmed.
4. Add this exact authorized redirect URI:
   - `https://ixnbyfusijjjgualqwov.supabase.co/auth/v1/callback`
5. Configure the consent screen with Little Birdee's application name, support details, and only the required `openid`, email, and profile scopes.
6. In Supabase Dashboard, open **Authentication → Providers → Google**.
7. Enter the Google client ID and client secret, enable the provider, and save.
8. In Supabase Auth URL configuration, allow:
   - `http://localhost:3000/auth/callback`
   - the matching production `/auth/callback` URL

Do not add the Google client secret to the Next.js application or any `NEXT_PUBLIC_` variable. It belongs only in the Supabase provider configuration.

## Acceptance after activation

- Create a new account with Google and confirm it lands on `/onboarding`.
- Complete business details and confirm it lands on `/setup`.
- Log out, then use Google again and confirm it returns to the selected venue rather than creating a second business.
- Confirm the Google consent screen shows the expected Little Birdee identity and domain.
- Repeat once on the permanent production domain.
