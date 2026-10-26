import * as opaque from "@serenity-kit/opaque";
import { randomBytes } from "node:crypto";
await opaque.ready;
console.log("OPAQUE_SERVER_SETUP=" + opaque.server.createSetup());
console.log("RATE_LIMIT_PEPPER=" + randomBytes(32).toString("hex"));
console.log("CRON_SECRET=" + randomBytes(32).toString("hex"));
