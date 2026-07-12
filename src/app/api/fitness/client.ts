import createClient from "openapi-fetch";
import type { paths } from "../../../../gen/customer/v1/customer.schema";

const FITNESS_SERVICE_URL =
  process.env.FITNESS_SERVICE_URL || "http://localhost:8083";

export const client = createClient<paths>({
  baseUrl: FITNESS_SERVICE_URL,
});
