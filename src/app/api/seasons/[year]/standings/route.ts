// src/app/api/seasons/[year]/standings/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  context: unknown
) {
  const { params } = context as { params: { year: string } };
  const year = parseInt(params.year, 10);

  const standings = await prisma.teamSeasonStats.findMany({
    where: { season_year: year },
    include: {
      team: true, // Include team details like name
    },
    orderBy: {
      actual_rank: 'asc',
    },
  });

  // Add tier logic
  const standingsWithTiers = standings.map(s => {
    let tier = 'Mid-Tier';
    if (s.combined_rank <= 4) tier = 'Contender';
    if (s.combined_rank >= 7 && s.combined_rank <= 9) tier = 'Get On The Stick';
    if (s.combined_rank >= 10) tier = 'Dumpster Fire. Awful.';
    return { ...s, tier };
  });

  return NextResponse.json(standingsWithTiers);
}
