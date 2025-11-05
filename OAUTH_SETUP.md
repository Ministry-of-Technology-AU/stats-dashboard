# Google OAuth Setup Instructions

## Add Authorized Redirect URI to Google Cloud Console

To enable Google OAuth authentication, you need to add the callback URL to your Google Cloud project:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or the project with ID: `304100220971`)
3. Navigate to **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID
5. Click on it to edit
6. Under **Authorized redirect URIs**, add:
   ```
   http://localhost:3001/api/auth/callback/google
   ```
7. Click **Save**

## Testing Locally

The app runs on port 3001. Make sure to use:
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
GOOGLE_CLIENT_ID=304100220971-qpr61ggq9jfp0tqc1iqpefoa1mrgki0f.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
AUTH_SECRET=CduNQQ20zrCNel8wORO5oMwWFBtSwwa4SVvpqv9qBQA=
NEXTAUTH_URL=http://localhost:3001
```
