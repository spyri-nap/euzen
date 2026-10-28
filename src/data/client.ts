import { accountClient } from "./auth";
export const client = accountClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
);

// Enable only after integrated browser acceptance; default builds keep guest data separate.
export const accountSyncEnabled =
  import.meta.env.VITE_ACCOUNT_SYNC_ENABLED === "true";
