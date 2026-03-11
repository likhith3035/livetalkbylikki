# 🛠️ Livetalk Development & Maintenance Guide

This document contains critical setup information to prevent common configuration errors.

## 🔑 Environment Variables (.env)

Ensure your `.env` file contains **both** Supabase and Firebase keys. If you add new services, **append** them to the file instead of overwriting.

```env
# Supabase
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...

# Firebase
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_DATABASE_URL=...
# ... other VITE_FIREBASE_* keys
```

## 🛡️ Firebase Security Rules

If you see `permission_denied` errors in the console, your Security Rules are likely too strict. Ensure they are set in the [Firebase Console](https://console.firebase.google.com/) under **Realtime Database > Rules**:

```json
{
  "rules": {
    "presence": { ".read": true, "$user_id": { ".write": "true" } },
    "lobby": { ".read": true, "$user_id": { ".write": "true" } },
    "matches": { ".read": true, "$match_id": { ".write": "true" } },
    "rooms": { "$room_id": { "signaling": { ".read": true, "$message_id": { ".write": "true" } } } }
  }
}
```

## 🚀 Pre-Deployment Checklist

1. **Firebase Database Enabled**: Ensure the database is "Enabled" and not just created in the console.
2. **App Check**: If using a custom domain, add it to Firebase App Check to prevent unauthorized access.
3. **PWA Assets**: Run `npm run build` locally to verify Service Worker generation doesn't have syntax errors.

## 🐞 Common Gotchas

- **SyntaxErrors in SW**: Never use TypeScript syntax (`as`, `interface`, etc.) in `public/sw-custom.js`.
- **0 Online**: Usually means the Firebase initialization failed or rules are blocking `.info/connected`.
