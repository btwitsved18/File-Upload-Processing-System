// import sqlite3 from 'sqlite3';
// import { open } from 'sqlite';

// export async function initDB() {
//   const db = await open({
//     filename: './uploads.db',
//     driver: sqlite3.Database
//   });

//   await db.exec(`
//     CREATE TABLE IF NOT EXISTS uploads (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       filename TEXT,
//       originalname TEXT,
//       metadata TEXT,
//       status TEXT,
//       created_at TEXT
//     );
//   `);

//   return db;
// }
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export async function initDB() {
  const db = await open({
    filename: './db/uploads.db',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS uploads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT,
      originalname TEXT,
      metadata TEXT,
      status TEXT,
      progress TEXT,
      error TEXT,
      created_at TEXT
    )
  `);

  return db;
}
