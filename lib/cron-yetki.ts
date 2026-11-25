import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

/** Vercel Cron, CRON_SECRET tanımlıysa isteğe "Authorization: Bearer <secret>" ekler. */
export function cronYetkiliMi(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  const gelen = req.headers.get("authorization") ?? "";
  const beklenen = `Bearer ${secret}`;
  return (
    !!secret &&
    gelen.length === beklenen.length &&
    timingSafeEqual(Buffer.from(gelen), Buffer.from(beklenen))
  );
}
