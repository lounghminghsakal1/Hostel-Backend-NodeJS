import { SESClient } from "@aws-sdk/client-ses";
import envValues from "./envFile.js";

//email can live in a different region from S3: AWS_SES_REGION (e.g. ap-south-1, Mumbai), falling back to AWS_REGION
const sesClient = new SESClient({
  region: envValues.AWS_SES_REGION || envValues.AWS_REGION
});

export default sesClient;