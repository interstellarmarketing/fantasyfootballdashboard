import { PrismaClient } from '@prisma/client';
import * as sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function main() {
  const db = await open({
    filename: '../fantasy_league.db',
    driver: sqlite3.Database,
  });

  const tableInfo = await db.all("PRAGMA table_info(teams);");
  console.log(tableInfo);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
