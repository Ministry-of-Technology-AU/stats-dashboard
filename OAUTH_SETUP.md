# Google OAuth Setup Instructions

## Add Authorized Redirect URI to Google Cloud Console

To enable Google OAuth authentication, you need to add the callback URL to your Google Cloud project:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or the project with ID: `903251927516`)
3. Navigate to **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID
5. Click on it to edit
6. Under **Authorized redirect URIs**, add:
   ```
   http://localhost:3002/api/auth/callback/google
   ```
7. Click **Save**

## Testing Locally

The app runs on port 3002 (since ports 3000 and 3001 are in use). Make sure to use:
- Local URL: `http://localhost:3002`
- Callback URL: `http://localhost:3002/api/auth/callback/google`

## Adding More Authorized Emails

Edit `/lib/allowed-emails.ts` and add emails to the array:

```typescript
export const ALLOWED_EMAILS = [
  "nitin.s_ug2025@ashoka.edu.in",
  "sports@ashoka.edu.in",
  "newuser@ashoka.edu.in",  // Add new emails here
];
```

## Environment Variables

Make sure `.env.local` has:
```
GOOGLE_CLIENT_ID=903251927516-ju6itfhq3qfqf7p82g519gpgubj1e9ue.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
AUTH_SECRET=CduNQQ20zrCNel8wORO5oMwWFBtSwwa4SVvpqv9qBQA=
NEXTAUTH_URL=http://localhost:3002
```
