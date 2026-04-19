import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match all paths except API routes, Next internals, and static assets.
  // Non-locale-prefixed paths (e.g. /login) get redirected to the default locale.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
