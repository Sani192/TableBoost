import { Client as PgClient } from 'pg';
import * as sqlite3 from 'sqlite3';
import * as path from 'path';

export interface DbRecord {
  [key: string]: any;
}

export class DatabaseClient {
  private pgClient: PgClient | null = null;
  private sqliteDb: sqlite3.Database | null = null;
  private dbType: 'postgres' | 'sqlite' = 'sqlite';

  constructor() {
    const dbUrl = process.env.DATABASE_URL || 'sqlite://' + path.resolve(__dirname, '../../sentinel_test.db');
    if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
      this.dbType = 'postgres';
      this.pgClient = new PgClient({ connectionString: dbUrl });
    } else {
      this.dbType = 'sqlite';
      let dbPath = dbUrl.replace(/^sqlite:\/\/\/?/, '');
      if (!dbPath || dbPath === ':memory:') {
        dbPath = ':memory:';
      } else {
        dbPath = path.resolve(dbPath);
      }
      this.sqliteDb = new sqlite3.Database(dbPath);
    }
  }

  async connect(): Promise<void> {
    if (this.dbType === 'postgres' && this.pgClient) {
      await this.pgClient.connect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.dbType === 'postgres' && this.pgClient) {
      await this.pgClient.end();
    } else if (this.dbType === 'sqlite' && this.sqliteDb) {
      await new Promise<void>((resolve, reject) => {
        this.sqliteDb!.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  }

  async query(sql: string, params: any[] = []): Promise<DbRecord[]> {
    if (this.dbType === 'postgres' && this.pgClient) {
      let pgSql = sql;
      if (sql.includes('?')) {
        let paramCount = 1;
        pgSql = sql.replace(/\?/g, () => `$${paramCount++}`);
      }
      const res = await this.pgClient.query(pgSql, params);
      return res.rows;
    } else if (this.dbType === 'sqlite' && this.sqliteDb) {
      return new Promise<DbRecord[]>((resolve, reject) => {
        this.sqliteDb!.all(sql, params, (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });
    }
    return [];
  }

  async execute(sql: string, params: any[] = []): Promise<void> {
    await this.query(sql, params);
  }
}
