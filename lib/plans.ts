export type Plan = "free" | "pro" | "plus";
export const plans = {
  free: {
    name: "Free",
    price: 0,
    shares: 10,
    days: 1,
    description: "For occasional private sharing",
  },
  pro: {
    name: "Pro",
    price: 6,
    shares: 200,
    days: 7,
    description: "For regular client work",
  },
  plus: {
    name: "Plus",
    price: 12,
    shares: 1000,
    days: 30,
    description: "For frequent professional sharing",
  },
} as const;
export function planFromPrice(id: string): Plan | null {
  if (id && id === process.env.PADDLE_PRO_PRICE_ID) return "pro";
  if (id && id === process.env.PADDLE_PLUS_PRICE_ID) return "plus";
  return null;
}
