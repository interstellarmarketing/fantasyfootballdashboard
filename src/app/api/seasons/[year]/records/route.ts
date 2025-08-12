// src/app/api/seasons/[year]/records/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  context: unknown
) {
  const { params } = context as { params: { year: string } };
  const year = parseInt(params.year, 10);

  const records = await prisma.leagueRecord.findMany({
    where: { season_year: year },
  });

  return NextResponse.json(records);
}
