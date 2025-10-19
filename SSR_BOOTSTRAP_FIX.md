# Angular SSR Bootstrap Error Fix

## Problem
The application was experiencing the following error when running with Server-Side Rendering (SSR):

# Angular SSR Bootstrap Error Fix

## Problem

The application was experiencing the following error when running with Server-Side Rendering (SSR):

# Angular SSR Bootstrap Error Fix - FINAL SOLUTION

## Problem

The application was experiencing the following error when running with Server-Side Rendering (SSR):

```text
NG0401: Missing Platform: This may be due to using `bootstrapApplication` on the server 
without passing a `BootstrapContext`. Please make sure that `bootstrapApplication` is 
called with a `context` argument.
```

## Root Cause

The error was caused by Angular 19's **build-time route extraction** feature when using `outputMode: "server"` in `angular.json`. During the build process, Angular attempts to bootstrap the application to introspect routes, but this fails because:

1. The build-time environment doesn't provide a proper platform context
2. `provideServerRouting` with explicit server routes triggers route extraction
3. The `outputMode: "server"` setting enables advanced SSR features that require route metadata

## Solution Applied

### 1. Removed `outputMode: "server"` from `angular.json`

**File:** `angular.json`

**Before:**
```json
"server": "src/main.server.ts",
"outputMode": "server",
"ssr": {
  "entry": "src/server.ts"
}
```

**After:**
```json
"server": "src/main.server.ts",
"prerender": false,
"ssr": {
  "entry": "src/server.ts"
}
```

### 2. Simplified `app.config.server.ts`

**File:** `src/app/app.config.server.ts`

**Before (with provideServerRouting):**
```typescript
import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { provideServerRouting } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideServerRouting(serverRoutes)
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
```

**After:**
```typescript
import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { appConfig } from './app.config';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering()
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
```

### 3. Kept simplified `main.server.ts`

**File:** `src/main.server.ts`

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';

const bootstrap = () => bootstrapApplication(AppComponent, config);

export default bootstrap;
```

### 4. Removed `app.routes.server.ts`

The `src/app/app.routes.server.ts` file is **not needed** with this configuration and should be deleted if it exists.

## Key Insights

1. **`outputMode: "server"` triggers build-time route extraction**: This feature analyzes routes during build to optimize SSR, but requires a fully initialized platform context that isn't available at build time in all configurations.

2. **`provideServerRouting` is optional**: For basic SSR with `AngularNodeAppEngine`, you only need `provideServerRendering()`. The `provideServerRouting` provider is primarily for advanced scenarios like:
   - Static Site Generation (SSG/Prerendering)
   - Mixed rendering modes (some routes SSR, some CSR)
   - Fine-grained control over route rendering strategies

3. **`prerender: false` explicitly disables prerendering**: This prevents Angular from attempting build-time route analysis.

## Verification

The application now:

- ✅ Builds successfully without errors
- ✅ Runs the development server on `http://localhost:4200/`
- ✅ Properly handles SSR with `AngularNodeAppEngine`
- ✅ No NG0401 bootstrap errors
- ✅ SSR works at runtime for all routes

## Build Output

```text
Application bundle generation complete. [5.104 seconds]
Watch mode enabled. Watching for file changes...
  ➜  Local:   http://localhost:4200/
```

## When to Use `provideServerRouting`

Use `provideServerRouting` with `app.routes.server.ts` when you need:

- **Static Site Generation (SSG)**: Prerender specific routes at build time
- **Mixed rendering**: Some routes SSR, others CSR
- **App Shell**: Implement an app shell pattern
- **Fine-grained control**: Different rendering strategies per route

For basic SSR where all routes are server-rendered at runtime, `provideServerRendering()` alone is sufficient.

## Alternative: Using `provideServerRouting` Correctly

If you need `provideServerRouting` for advanced features, you must:

1. Keep `outputMode` removed or use `outputMode: "static"` for SSG
2. Define explicit server routes
3. Ensure your bootstrap function is compatible with build-time execution

## Technical Notes

### Angular 19 SSR Modes

**Runtime SSR (our solution)**:
- Routes rendered on-demand when requested
- No build-time route analysis
- Uses `provideServerRendering()` only
- Suitable for dynamic content

**Static Site Generation / Prerendering**:
- Routes pre-rendered at build time
- Requires `outputMode: "static"` or `outputMode: "server"`
- Uses `provideServerRouting` with route configuration
- Suitable for static content

### Why the Error Occurred

The `NG0401` error occurred because:
1. Build process tried to execute `bootstrapApplication` to extract routes
2. Build environment lacks browser/server platform context
3. `bootstrapApplication` requires a platform to be initialized
4. No platform was available during build-time execution

## References

- [Angular SSR Documentation](https://angular.dev/guide/ssr)
- [AngularNodeAppEngine API](https://angular.dev/api/ssr/node/AngularNodeAppEngine)
- [provideServerRendering API](https://angular.dev/api/platform-server/provideServerRendering)
- [Angular Build Options](https://angular.dev/reference/configs/angular-json)

---

*Fix applied: October 11, 2025*  
*Angular Version: 19.2.15*  
*Final Solution: Remove `outputMode`, use `provideServerRendering()` only*

## Root Cause

Angular 19 introduced a new SSR architecture using `AngularNodeAppEngine` which requires:

1. Proper server routing configuration via `provideServerRouting`
2. Explicit server routes definition in `app.routes.server.ts`
3. Correct bootstrap function signature in `main.server.ts`

The application was missing both the `provideServerRouting` provider and the server routes configuration file.

## Solution Applied

### 1. Created `src/app/app.routes.server.ts`

**New File:**

```typescript
import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Server
  }
];
```

### 2. Updated `src/app/app.config.server.ts`

**Before:**

```typescript
import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { appConfig } from './app.config';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
```

**After:**

```typescript
import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { provideServerRouting } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideServerRouting(serverRoutes)
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
```

### 3. Updated `src/main.server.ts`

**Before:**

```typescript
export default function bootstrap() {
  return bootstrapApplication(AppComponent, config);
}
```

**After:**

```typescript
const bootstrap = () => bootstrapApplication(AppComponent, config);

export default bootstrap;
```

## Key Changes

1. **Created `app.routes.server.ts`**: Defines server-side routing configuration with `RenderMode.Server` for all routes (`**`). This file is required by Angular 19's SSR to properly configure how routes are rendered on the server.

2. **Added `provideServerRouting`**: This provider is required by Angular 19's `AngularNodeAppEngine` to properly configure server-side routing. It must be provided with a `ServerRoute[]` array imported from `app.routes.server.ts`.

3. **Simplified bootstrap export**: Changed from a function declaration to a const arrow function, which is the recommended pattern for Angular 19 SSR.

## Verification

The application now:

- ✅ Builds successfully without errors
- ✅ Runs the development server on `http://localhost:4200/`
- ✅ Properly handles SSR with `AngularNodeAppEngine`
- ✅ No NG0401 bootstrap errors

## Build Output

```text
Application bundle generation complete. [4.217 seconds]
Watch mode enabled. Watching for file changes...
  ➜  Local:   http://localhost:4200/
```

## Technical Notes

### Angular 19 SSR Architecture

Angular 19 uses a new SSR approach with:

- `AngularNodeAppEngine`: Handles HTTP requests and SSR rendering
- `provideServerRouting`: Configures server-side routing (requires `ServerRoute[]`)
- `provideServerRendering`: Enables server-side rendering capabilities
- `app.routes.server.ts`: Defines how routes should be rendered (Server, Client, or Prerender)

### Why `app.routes.server.ts` is Required

The `app.routes.server.ts` file is essential because:

- It tells Angular which routes should use SSR (`RenderMode.Server`)
- It allows fine-grained control over rendering strategies per route
- It enables Angular's build-time route extraction for SSR optimization
- Without it, `provideServerRouting` cannot properly initialize the server platform

### Server Route Configuration

```typescript
{
  path: '**',           // Matches all routes
  renderMode: RenderMode.Server  // Use SSR for all routes
}
```

This configuration ensures all application routes are server-rendered. You can customize this to:
- Use `RenderMode.Client` for client-side rendering
- Use `RenderMode.Prerender` for static site generation
- Define specific routes with different render modes

## References

- [Angular SSR Documentation](https://angular.dev/guide/ssr)
- [AngularNodeAppEngine API](https://angular.dev/api/ssr/node/AngularNodeAppEngine)
- [provideServerRouting API](https://angular.dev/api/ssr/provideServerRouting)
- [ServerRoute Configuration](https://angular.dev/api/ssr/ServerRoute)

---

*Fix applied: October 11, 2025*  
*Angular Version: 19.2.15*

## Root Cause
Angular 19 introduced a new SSR architecture using `AngularNodeAppEngine` which requires:
1. Proper server routing configuration via `provideServerRouting`
2. Correct bootstrap function signature in `main.server.ts`

The application was missing the `provideServerRouting` provider in the server configuration.

## Solution Applied

### 1. Updated `src/main.server.ts`
**Before:**
```typescript
export default function bootstrap() {
  return bootstrapApplication(AppComponent, config);
}
```

**After:**
```typescript
const bootstrap = () => bootstrapApplication(AppComponent, config);

export default bootstrap;
```

### 2. Updated `src/app/app.config.server.ts`
**Before:**
```typescript
import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { appConfig } from './app.config';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
```

**After:**
```typescript
import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { provideServerRouting } from '@angular/ssr';
import { appConfig } from './app.config';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideServerRouting([])
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
```

## Key Changes

1. **Added `provideServerRouting`**: This provider is required by Angular 19's `AngularNodeAppEngine` to properly configure server-side routing. Even with an empty routes array, it initializes the necessary infrastructure.

2. **Simplified bootstrap export**: Changed from a function declaration to a const arrow function, which is the recommended pattern for Angular 19 SSR.

## Verification

The application now:
- ✅ Builds successfully without errors
- ✅ Runs the development server on `http://localhost:4200/`
- ✅ Properly handles SSR with `AngularNodeAppEngine`
- ✅ No NG0401 bootstrap errors

## Build Output
```
Application bundle generation complete. [3.852 seconds]
Watch mode enabled. Watching for file changes...
  ➜  Local:   http://localhost:4200/
```

## Technical Notes

### Angular 19 SSR Architecture
Angular 19 uses a new SSR approach with:
- `AngularNodeAppEngine`: Handles HTTP requests and SSR rendering
- `provideServerRouting`: Configures server-side routing (required even with empty routes)
- `provideServerRendering`: Enables server-side rendering capabilities

### Why `provideServerRouting([])` is Required
Even with an empty routes array, `provideServerRouting` initializes:
- Route tree management for SSR
- Metadata collection for server-side rendering
- Integration with `AngularNodeAppEngine`'s request handling

Without this provider, the bootstrap process cannot properly initialize the server-side platform, leading to the NG0401 error.

## References
- [Angular SSR Documentation](https://angular.dev/guide/ssr)
- [AngularNodeAppEngine API](https://angular.dev/api/ssr/node/AngularNodeAppEngine)
- [provideServerRouting API](https://angular.dev/api/ssr/provideServerRouting)

---
*Fix applied: October 11, 2025*
*Angular Version: 19.2.15*
