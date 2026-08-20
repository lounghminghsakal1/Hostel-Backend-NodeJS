import { connectDB } from "./configs/db.js";
import envValues from "./configs/envFile.js";

export default async function startServerAndConnectDB(app) {
  try {
    const port = envValues.PORT ?? 9895;
    await connectDB();
    app.listen(port, () => {
      console.log("SERVER IS RUNNING ON PORT "+port);
    });
  } catch (err) {
    console.error(err);
    // throw error
  }
};