import createHttpError from "http-errors";
import { prisma } from "../configs/db.js";
import { getAccessContext } from "../utils/helper-functions.utils.js";

const validateHostelAdminAccessScope = (model) => {
  return async (req, res, next) => {
    const accessContext = getAccessContext(req);
    const modelRecordId = Number(req.params.id);
    const modelRecord = await prisma[`${model}`].findFirst({
      where: {
        id: modelRecordId
      }
    });

    if (!modelRecord) throw createHttpError(404, `${model} not found with id as ${modelRecordId}`, { errors: "Invalid id" });

    if(!modelRecord.hostelId) {
      throw createHttpError(500, `The model ${model} has no hostelId column`, {errors: "Internal server error"});
    }

    if (modelRecord.hostelId !== accessContext.loggedInAdminHostelId) {
      throw createHttpError(403, "You don't have access to this record", { errors: 'Unauthorized access' });
    }
    req.model = modelRecord;
    next();
  };
};

export default validateHostelAdminAccessScope;