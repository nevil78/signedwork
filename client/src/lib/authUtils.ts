export function isUnauthorizedError(error: any): boolean {
  return error?.message?.includes("401") || error?.message?.includes("Unauthorized") || error?.message?.includes("Not authenticated");
}