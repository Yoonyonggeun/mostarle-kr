import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// #region agent log
fetch('http://127.0.0.1:7243/ingest/d92fd54a-1149-48d6-8cbd-932ddbbf4a74',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'drizzle-client.server.ts:5',message:'Initializing database connection',data:{hasDatabaseUrl:!!process.env.DATABASE_URL,databaseUrlLength:process.env.DATABASE_URL?.length || 0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
// #endregion

const client = postgres(process.env.DATABASE_URL!, { prepare: false });

const db = drizzle({ client });

export default db;
