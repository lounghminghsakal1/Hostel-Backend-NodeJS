import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import envValues from "./envFile.js";


const adapter = new PrismaPg({
  connectionString: envValues.DATABASE_URL,
  options: "-c timezone=UTC"  //-c timezone=UTC sets that database connection’s session timezone to UTC.   DB uses local computer timezone which is Asia/Calcuta so created at 10am ist but this driver can see it as in utc like 10:00utc which is wrong instant. 
  //so now the db session itself set to utc meaning if i created any record at 10 am in ist , it stores it as 4:30 am in utc and by default pg driver (prisma pg) sees time fields as in utc so 4:30utc so correct and since its in utc , we will deal with utc fully in backend and frontend will handle display purpose, which is correct approach
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
