import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { setAdminLocation, getAdminLocation } from '@/lib/db';

function isAdmin(email: string | null | undefined): boolean {
  const adminEmail = process.env.ADMIN_EMAIL ?? 'andara14@gmail.com';
  return email === adminEmail;
}

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const loc = await getAdminLocation();
  return NextResponse.json(loc ?? { lat: null, lng: null, radiusKm: 10 });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { lat, lng, radiusKm = 10 } = await req.json();
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  }
  await setAdminLocation(lat, lng, radiusKm);
  return NextResponse.json({ ok: true, lat, lng, radiusKm });
}
