import { SendEmailCommand } from "@aws-sdk/client-ses";
import envValues from "../configs/envFile.js";
import sesClient from "../configs/ses.js";

const sendEmail = async (toAddress, subject, text, html) => {
  const command = new SendEmailCommand({
    Source: envValues.AWS_SES_FROM_EMAIL,
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

export default sendEmail;