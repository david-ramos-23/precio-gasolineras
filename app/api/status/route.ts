import { NextResponse } from 'next/server';
import { getLastCheckedAt } from '@/lib/db';

export async function GET() {
  const lastCheckedAt = await getLastCheckedAt();
  return NextResponse.json({ lastCheckedAt });
}
