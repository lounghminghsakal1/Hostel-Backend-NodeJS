import express from "express";
import authenticateUserMiddleware from "../../middlewares/authentication.middleware.js";
import authorizeUserMiddleware from "../../middlewares/authorization.middleware.js";
import validateRequestMiddleware from "../../middlewares/validate-request.middleware.js";
import { createMonthlyMessBillRequestBodySchema, updateMonthlyMessBillRequestBodySchema } from "./mess-fee.request-schema.js";
import MessFeeController from "./mess-fee.controller.js";
import validateHostelAdminAccessScope from "../../middlewares/validate-admin-access-scope.middleware.js";

const MessFeeRouter = express.Router();

const hostelAdminRole = "HOSTEL_ADMIN";

MessFeeRouter.post("/mess_bill", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), validateRequestMiddleware({body: createMonthlyMessBillRequestBodySchema}), MessFeeController.createMonthlyMessBill);

MessFeeRouter.patch("/mess_bill/:id", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), validateRequestMiddleware({body: updateMonthlyMessBillRequestBodySchema}), MessFeeController.updateMonthlyMessBill);

MessFeeRouter.post("/mess_bill/:id/publish", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), MessFeeController.publishMonthlyMessBill);

MessFeeRouter.delete("/mess_bill/:id", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), validateHostelAdminAccessScope("monthlyMessBill") ,MessFeeController.deleteMonthlyMessBill);

MessFeeRouter.get("/mess_bill", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), MessFeeController.getMonthlyMessBills);

MessFeeRouter.get("/mess_bill/:id", authenticateUserMiddleware, authorizeUserMiddleware(hostelAdminRole), validateHostelAdminAccessScope("monthlyMessBill"), MessFeeController.getOneMonthlyMessBill);

export default MessFeeRouter;
