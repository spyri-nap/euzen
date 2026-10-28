export type SyncFailure =
  | "offline"
  | "auth"
  | "quota"
  | "validation"
  | "generation"
  | "error";
export function classifySyncFailure(
  error: unknown,
  online: boolean,
): SyncFailure {
  if (!online) return "offline";
  const failure = error as { code?: string; message?: string };
  if (failure?.message?.includes("Stale generation")) return "generation";
  if (["PGRST301", "PGRST302", "42501"].includes(failure?.code ?? ""))
    return "auth";
  if (failure?.code === "54000") return "quota";
  if (
    ["22023", "23514", "22007", "22008", "22P02", "P0001"].includes(
      failure?.code ?? "",
    )
  )
    return "validation";
  return "error";
}
