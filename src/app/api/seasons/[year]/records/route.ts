// src/app/api/seasons/[year]/records/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ year: string }> }
) {
  const resolvedParams = await params;
  const year = parseInt(resolvedParams.year, 10);

  const records = await prisma.leagueRecord.findMany({
    where: { season_year: year },
  });

  return NextResponse.json(records);
}
