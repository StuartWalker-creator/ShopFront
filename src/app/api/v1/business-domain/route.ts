
import { NextRequest, NextResponse } from 'next/server';
import { getBusinessByDomain } from '@/firebase/server';

/**
 * API route to look up a business by its custom domain.
 * This runs in the Node.js runtime, so it can safely use the Firebase Admin SDK.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain');

  if (!domain) {
    return NextResponse.json({ error: 'Domain parameter is required' }, { status: 400 });
  }

  try {
    const business = await getBusinessByDomain(domain);

    if (business) {
      return NextResponse.json({ businessId: business.id });
    } else {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }
  } catch (error) {
    console.error(`API route /api/v1/business-domain failed:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

