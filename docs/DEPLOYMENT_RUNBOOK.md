# TableBoost Operational Runbook

This guide covers deployment procedures, database backups, rollbacks, and recovery protocols for the TableBoost platform. It is designed to be lightweight, straightforward, and production-safe without relying on enterprise orchestration frameworks.

## 1. Environment & Startup Validation

Before launching TableBoost in a production environment, ensure the following environment variables are explicitly set:
* `ENVIRONMENT=production`
* `DATABASE_URL`
* `SECRET_KEY` (must not be the default value)
* `ALLOWED_ORIGINS` (must match the production frontend UI)

If `ENVIRONMENT=production` is set, the FastAPI server will proactively crash on startup if `SECRET_KEY` or `DATABASE_URL` is unsafe, preventing insecure environments from inadvertently booting.

## 2. Standard Deployment Flow

1. **Pull Latest Changes**: `git pull origin main`
2. **Backup the Database**: Run `./scripts/backup.sh` to take a snapshot of the current state before migrations.
3. **Run Migrations and Seeding**: Execute the prestart sequence. In local or manual VPS environments, run:
   ```bash
   cd backend && python prestart.py
   ```
   For Render.com, setting the start command to `cd backend && bash start.sh` handles this step automatically upon deployment.
4. **Deploy Backend**: The start script will automatically check migrations, seed default plans/users, and launch the Uvicorn application server.
5. **Deploy Frontend**: Run `npm run build` followed by a restart of the Node.js server.
6. **Verify Health**: Visit `https://your-api-domain.com/api/health` to confirm `status: ok` and that `database` and `scheduler_running` both report `ok`.

## 3. Rollback Procedures

If a deployment introduces a critical regression or failure, follow these rollback steps:

1. **Revert Application Code**: `git checkout <previous_stable_commit>`
2. **Revert Database Migrations**: `cd backend && alembic downgrade <previous_revision_id>`
   * *Note: If the migration cannot be safely downgraded, you will need to utilize the database backup instead (see Section 4).*
3. **Restart the Application**: Restart the backend server.
4. **Verify Health**: Ensure the `/api/health` endpoint responds correctly.

## 4. Backup & Recovery

### Backups
A lightweight, dependency-free script utilizes `pg_dump` to safely snapshot the database structure and data.
Run: `./scripts/backup.sh`
*Backups are saved to the `backups/` directory with a timestamped filename.*

### Restore
In the event of a catastrophic failure or an unrecoverable database state, you can restore a backup snapshot.
Run: `./scripts/restore.sh <path_to_backup_file.sql>`

> **WARNING**: The restore script executes a `DROP SCHEMA public CASCADE` operation. It completely wipes the existing active database before restoring. Ensure you genuinely intend to perform a full restore.

## 5. Scheduler & Automation Continuity

The background automation engine (APScheduler) handles long-running jobs (SMS sending, analytics calculation).
* **Startup Safety**: The scheduler will safely wait and connect to the database even if the database is experiencing transient connection delays during startup (built-in exponential backoff).
* **Idempotency**: All periodic intelligence generation tasks (e.g. `compute_daily_business_summary`) and SMS messaging sequences are strictly idempotent. If the backend server abruptly crashes and restarts, the scheduler will not duplicate intelligence metrics or resend the same SMS blasts for that operational period.
