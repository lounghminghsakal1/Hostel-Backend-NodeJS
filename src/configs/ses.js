import { SESClient } from "@aws-sdk/client-ses";
import envValues from "./envFile.js";

const sesClient = new SESClient({
  region: envValues.AWS_REGION
});

export default sesClient;