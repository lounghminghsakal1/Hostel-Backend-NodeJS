import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import envValues from "./envFile.js";


const adapter = new PrismaPg({
  connectionString: envValues.DATABASE_URL
});

export const prisma = new PrismaClient({
  adapter
});

export async function connectDB() {
  try {
    await prisma.$connect();
    console.log("DB CONNECTED SUCCESSFULLY");
  } catch(err) {
    console.error(err);
    //throw APP ERROR
  }
};
