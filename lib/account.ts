import type { PoolClient } from "pg";
import { plans, type Plan } from "./plans";
export async function accountPlan(
  client: PoolClient,
  userId: string,
): Promise<Plan> {
  const r = await client.query(
    "SELECT plan FROM billing_entitlements WHERE user_id=$1 AND status IN ('active','trialing') ORDER BY CASE plan WHEN 'plus' THEN 2 ELSE 1 END DESC LIMIT 1",
    [userId],
  );
  return r.rows[0]?.plan === "plus"
    ? "plus"
    : r.rows[0]?.plan === "pro"
      ? "pro"
      : "free";
}
export { plans };
