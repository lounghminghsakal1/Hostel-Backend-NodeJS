import { S3Client } from "@aws-sdk/client-s3";
import envValues from "./envFile.js";

const s3Client = new S3Client({
  region: envValues.AWS_REGION
});

export default s3Client;