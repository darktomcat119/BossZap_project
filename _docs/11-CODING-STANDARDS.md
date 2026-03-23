# BossZap — Coding Standards

## Hard Limits (NEVER EXCEED)
- **500 lines per file.** Split if exceeded.
- **80 characters per line.** Wrap long lines.
- **30 lines per function.** Extract sub-functions.
- **5 parameters per function.** Use config objects/DTOs.
- **3 levels of nesting.** Use early returns/guard clauses.

## General Rules
- No magic numbers/strings. Use named constants.
- No commented-out code. Git has history.
- No console.log in production. Use logger (winston/pino).
- No `any` type in TypeScript. Type everything. Use `unknown` then narrow.
- One class per file. One service per file. One entity per file.
- Index files for module re-exports.

## Naming
| Element | Convention | Example |
|---|---|---|
| Files (backend) | kebab-case | `webhook.controller.ts` |
| Files (frontend) | kebab-case for utils, PascalCase for components | `DashboardHome.tsx` |
| Classes | PascalCase | `WhatsAppService` |
| Interfaces | PascalCase, no `I` prefix | `SubscriberProfile` |
| Types | PascalCase | `PaymentStatus` |
| Functions | camelCase | `createEvent()` |
| Variables | camelCase | `subscriberId` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES` |
| Database tables | snake_case (plural) | `financial_records` |
| Database columns | snake_case | `subscriber_id` |
| API endpoints | kebab-case | `/api/v1/financial-records` |
| Environment variables | UPPER_SNAKE_CASE | `DATABASE_URL` |
| Translation keys | dot.notation | `dashboard.revenue.title` |

## Backend (NestJS)

### Architecture Layers
```
Controller → Service → Repository → Database
```
- **Controllers:** HTTP handling only. Validate input, call service, return response. No business logic.
- **Services:** All business logic. One service per domain (agenda, financial, budget, etc.).
- **Repositories:** Database access only. Raw queries or TypeORM repository pattern.
- **DTOs:** Validate all input with `class-validator`. One DTO per endpoint.
- **Entities:** TypeORM entities. One per table. Match database schema exactly.

### API Design
- RESTful endpoints: `GET /api/v1/events`, `POST /api/v1/events`, etc.
- Version prefix: `/api/v1/`.
- Pagination: `?page=1&limit=20` on all list endpoints.
- Response format:
  ```json
  {
    "success": true,
    "data": {},
    "meta": { "page": 1, "limit": 20, "total": 100 }
  }
  ```
- Error format:
  ```json
  {
    "success": false,
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Human-readable message",
      "details": []
    }
  }
  ```

### Error Handling
- Global exception filter catches all unhandled errors.
- Business errors: custom exception classes (e.g., `SubscriberNotFoundException`).
- Validation errors: automatic from class-validator decorators.
- Never expose stack traces in production.
- Log all errors with context (subscriber_id, request_id, module).

### Security
- Helmet.js for HTTP security headers.
- CORS: whitelist only known frontend domains.
- Rate limiting: per-IP and per-subscriber.
- Input sanitization on all text inputs.
- SQL injection prevention: always use parameterized queries.
- JWT tokens: short-lived access (15min), long-lived refresh (7d).
- Webhook signature verification on all incoming webhooks.

### Logging
- Use structured JSON logger (pino or winston).
- Log levels: error, warn, info, debug.
- Every log entry includes: timestamp, level, module, subscriber_id (when available), request_id.
- Never log sensitive data: passwords, tokens, full credit card numbers.
- Log all external API calls with duration and status.

## Frontend (Next.js)

### Component Structure
```tsx
// 1. Imports (external, then internal, then types)
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import type { Event } from '@/types';

// 2. Types/interfaces (if component-specific)
interface EventCardProps {
  event: Event;
  onComplete: (id: string) => void;
}

// 3. Component
export function EventCard({ event, onComplete }: EventCardProps) {
  const t = useTranslations('agenda');
  // ... component logic
  return (/* JSX */);
}
```

### State Management
- Server state: React Query (TanStack Query) for API data.
- Local state: React useState/useReducer.
- No Redux, Zustand, or other global state libraries unless justified.
- Cache invalidation: invalidate queries after mutations.

### Data Fetching
- Use Next.js App Router data fetching patterns.
- Server components where possible. Client components only when needed (interactivity).
- Loading states: skeleton components (never blank screens).
- Error states: user-friendly error messages with retry button.

### Styling Rules
- Tailwind CSS classes only. No inline styles. No CSS modules.
- Mobile-first: base classes for mobile, responsive prefixes for larger screens.
- Use design system tokens from `tailwind.config.ts`.
- Component variants via `cva` (class-variance-authority) or conditional classes.

## Testing
- Backend: Jest for unit tests, Supertest for integration tests.
- Frontend: Jest + React Testing Library.
- Minimum coverage target: 80% for services, 60% for components.
- Test naming: `describe('ServiceName')` → `it('should do specific thing')`.
- Mock external APIs (OpenAI, WhatsApp, Stripe) in tests.
- Never test implementation details. Test behavior and outputs.

## Git Conventions
- Branch naming: `feature/module-name`, `fix/bug-description`, `chore/task-name`.
- Commit messages: conventional commits format.
  - `feat: add agenda reminder service`
  - `fix: correct financial calculation for monthly totals`
  - `chore: update dependencies`
- PR: one feature/fix per PR. Descriptive title and description.
- Never commit: `.env`, `node_modules/`, build artifacts, secrets.

## Documentation
- JSDoc on all public service methods.
- OpenAPI/Swagger decorators on all controller endpoints.
- README.md in each major module folder with setup instructions.
- Keep `_docs/` files updated as implementation progresses.
