import { SendEmailCommand } from "@aws-sdk/client-ses";
import envValues from "../configs/envFile.js";
import sesClient from "../configs/ses.js";

//"Our Hostel <no-reply@ourhostel.in>" - a friendly sender name instead of a bare address
const fromAddress = () => {
  const name = (envValues.AWS_SES_FROM_NAME || "Our Hostel").replace(/["<>]/g, "");
  return `${name} <${envValues.AWS_SES_FROM_EMAIL}>`;
};

const sendEmail = async (toAddress, subject, text, html) => {
  const command = new SendEmailCommand({
    Source: fromAddress(),
    Destination: {
      ToAddresses: [toAddress]
    },
    Message: {
      Subject: {
        Charset: "UTF-8",
        Data: subject,
      },

      Body: {
        Text: {
          Charset: "UTF-8",
          Data: text,
        },

        Html: {
          Charset: "UTF-8",
          Data: html,
        },
      },
    },
  });

  return await sesClient.send(command);
};

//a plain reason an admin can act on, from an Amazon SES error
export const describeEmailError = (err) => {
  const name = err?.name ?? "";
  const message = String(err?.message ?? "");
  if (name === "MessageRejected" && /not verified/i.test(message)) {
    const sender = String(envValues.AWS_SES_FROM_EMAIL ?? "").toLowerCase();
    //SES lists the identities that failed: the sender's address/domain, or (in sandbox) the recipient
    const failed = (message.split(":").pop() ?? "").toLowerCase();
    const senderDomain = sender.split("@")[1] ?? "";
    if (sender && (failed.includes(sender) || (senderDomain && failed.trim() === senderDomain))) {
      return "the sender address isn't verified in Amazon SES";
    }
    return "Amazon SES is still in sandbox (test) mode, so it only sends to verified addresses. Request production access in the SES console";
  }
  if (name === "MessageRejected") return `Amazon SES rejected the email (${message})`;
  if (/Throttling|MaxSendRate|quota/i.test(`${name} ${message}`)) return "the daily email limit was reached, try again later";
  if (/AccessDenied/i.test(name)) return "the AWS user isn't allowed to send email (missing ses:SendEmail permission)";
  if (/CredentialsProviderError|InvalidClientTokenId|UnrecognizedClientException|SignatureDoesNotMatch/.test(name)) return "the AWS credentials for email are missing or invalid";
  return "the email service is unavailable right now";
};

export default sendEmail;
