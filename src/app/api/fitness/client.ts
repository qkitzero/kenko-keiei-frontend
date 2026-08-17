import createClient from "openapi-fetch";
import type { paths as customerPaths } from "../../../../gen/customer/v1/customer.schema";
import type { paths as judgmentPaths } from "../../../../gen/judgment/v1/judgment.schema";
import type { paths as measurementPaths } from "../../../../gen/measurement/v1/measurement.schema";
import type { paths as measurementItemPaths } from "../../../../gen/measurementitem/v1/measurement_item.schema";
import type { paths as organizationPaths } from "../../../../gen/organization/v1/organization.schema";
import type { paths as tenantProfilePaths } from "../../../../gen/tenant/v1/profile.schema";
import type { paths as trainingMenuPaths } from "../../../../gen/training/v1/training_menu.schema";

const FITNESS_SERVICE_URL =
  process.env.FITNESS_SERVICE_URL || "http://localhost:8083";

export const customerClient = createClient<customerPaths>({
  baseUrl: FITNESS_SERVICE_URL,
});

export const organizationClient = createClient<organizationPaths>({
  baseUrl: FITNESS_SERVICE_URL,
});

export const tenantProfileClient = createClient<tenantProfilePaths>({
  baseUrl: FITNESS_SERVICE_URL,
});

export const measurementItemClient = createClient<measurementItemPaths>({
  baseUrl: FITNESS_SERVICE_URL,
});

export const measurementClient = createClient<measurementPaths>({
  baseUrl: FITNESS_SERVICE_URL,
});

export const judgmentClient = createClient<judgmentPaths>({
  baseUrl: FITNESS_SERVICE_URL,
});

export const trainingMenuClient = createClient<trainingMenuPaths>({
  baseUrl: FITNESS_SERVICE_URL,
});
