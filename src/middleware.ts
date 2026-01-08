
import {NextRequest, NextResponse} from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - and all top-level routes that are part of the app itself.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|admin|dashboard|login|signup|store|.*\\.png$).*)',
  ],
};

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  let hostname = request.headers.get('host');

  // If there's no hostname, we can't do anything.
  if (!hostname) {
    return NextResponse.next();
  }
  
  // Clean up the hostname to remove port and 'www.'
  hostname = hostname.replace(/:\d+$/, '').replace(/^www\./, '');

  // These are the domains for the main landing page, which should not be rewritten.
  const appDomains = ['localhost', process.env.NEXT_PUBLIC_APP_DOMAIN].filter(Boolean);

  if (appDomains.includes(hostname)) {
    return NextResponse.next();
  }

  // This is a custom domain. We call an internal API route to look up the business ID.
  // This is crucial because it keeps Node.js-specific modules (like firebase-admin)
  // out of the middleware's edge runtime.
  const apiURL = new URL(`/api/v1/business-domain?domain=${hostname}`, request.url);

  try {
    const response = await fetch(apiURL);
    
    if (response.ok) {
      const { businessId } = await response.json();
      if (businessId) {
        // If a business is found, rewrite the URL to the correct store path.
        url.pathname = `/store/${businessId}${url.pathname}`;
        return NextResponse.rewrite(url);
      }
    }
  } catch (error) {
    // If the API call fails, we can't resolve the domain, so we log it and move on.
    console.error("Middleware API call to look up domain failed:", error);
  }

  // If the domain is not a custom domain or the lookup fails, proceed as normal.
  return NextResponse.next();
}
