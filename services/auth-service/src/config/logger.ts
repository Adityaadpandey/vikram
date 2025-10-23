import { getLogger } from "@repo/logger";
import { config } from ".";

const logger: any = getLogger(config.SERVICE_NAME, "debug");

export default logger;
