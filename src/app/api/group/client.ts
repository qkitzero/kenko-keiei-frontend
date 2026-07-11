import createClient from "openapi-fetch";
import type { paths } from "../../../../gen/group/v1/group.schema";

const USER_SERVICE_URL =
  process.env.USER_SERVICE_URL || "http://localhost:8082";

export const client = createClient<paths>({
  baseUrl: USER_SERVICE_URL,
});
