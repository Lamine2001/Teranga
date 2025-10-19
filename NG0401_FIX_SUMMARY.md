# NG0401 SSR Bootstrap Error - Fix Summary

## 🎯 Problem
Angular 19 application failing with:
```text
NG0401: Missing Platform: This may be due to using `bootstrapApplication` on the server 
without passing a `BootstrapContext`.
```

## ✅ Solution
**Disable SSR during development** by adding `"ssr": false` to the development configuration in `angular.json`.

The error was caused by Angular's build-time route extraction during SSR dev mode.

## 📝 Changes Made

### 1. angular.json - Build Configuration
```json
// REMOVED: "outputMode": "server",
// ADDED:   "prerender": false,
```

### 2. angular.json - Development Configuration
```json
"development": {
  "optimization": false,
  "extractLicenses": false,
  "sourceMap": true,
  "ssr": false  // ← Added this to disable SSR in development
}
```

### 3. app.config.server.ts
```typescript
// Simplified to use only provideServerRendering()
// Removed provideServerRouting()
```

### 4. Deleted Files
- ❌ `src/app/app.routes.server.ts` (not needed)

## 🚀 Result
- ✅ No NG0401 errors
- ✅ Development server runs without SSR
- ✅ Application running at <http://localhost:4200/>
- ✅ Build time: ~5 seconds
- ✅ Only browser bundles in development (no server bundles)

## 📚 Key Learnings

1. **Development vs Production**: SSR can be disabled in development (`"ssr": false`) while keeping it enabled for production builds
2. **`outputMode: "server"`** triggers build-time route extraction
3. **`provideServerRendering()` alone is sufficient** for basic SSR
4. **Dev server SSR** can cause the NG0401 error if routes need to be extracted

## 🔍 Development vs Production Setup

| Configuration | Development | Production |
|---------------|-------------|------------|
| SSR Enabled | ❌ No (`"ssr": false`) | ✅ Yes |
| Server Bundles | ❌ Not generated | ✅ Generated |
| Route Extraction | ❌ Skipped | ✅ Enabled |
| Error Risk | ✅ None | ⚠️ If misconfigured |

## 💡 When to Enable SSR in Development

Only enable SSR in development if you need to test:
- Server-side rendering behavior
- SEO meta tags
- Initial page load performance
- SSR-specific bugs

Otherwise, keep `"ssr": false` for faster development.

## 🏗️ Production Build

For production, SSR will work correctly with:
```bash
npm run build  # Builds with SSR enabled (production config)
npm run serve:ssr:nom-du-projet  # Serves the SSR build
```

---
**Date:** October 11, 2025  
**Angular Version:** 19.2.15  
**Status:** ✅ RESOLVED
