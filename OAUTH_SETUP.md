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
   http://localhost:3001/api/auth/callback/google
   ```
7. Click **Save**

## Testing Locally

The app runs on port 3001 (since port 3000 is in use). Make sure to use:
- Local URL: `http://localhost:3001`
- Callback URL: `http://localhost:3001/api/auth/callback/google`

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
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
AUTH_SECRET=
NEXTAUTH_URL=http://localhost:3001
```
