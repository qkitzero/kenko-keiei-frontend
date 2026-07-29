import createClient from "openapi-fetch";
import type { paths as customerPaths } from "../../../../gen/customer/v1/customer.schema";
import type { paths as organizationPaths } from "../../../../gen/organization/v1/organization.schema";

const FITNESS_SERVICE_URL =
  process.env.FITNESS_SERVICE_URL || "http://localhost:8083";

export const customerClient = createClient<customerPaths>({
  baseUrl: FITNESS_SERVICE_URL,
});

export const organizationClient = createClient<organizationPaths>({
  baseUrl: FITNESS_SERVICE_URL,
});
