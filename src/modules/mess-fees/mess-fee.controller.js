import { getAccessContext } from "../../utils/helper-functions.utils.js";
import Responses from "../../utils/responses.utils.js";
import MessFeeService from "./mess-fee.service.js";

const createMonthlyMessBill = async (req, res) => {
  const accessContext = getAccessContext(req);
  const createdMonthlyMessBill = await MessFeeService.createMonthlyMessBill(accessContext, req.body);
  return Responses.successResponse(res, "Monthly mess bill created successfully", createdMonthlyMessBill, 201);
};

const updateMonthlyMessBill = async (req, res) => {
  const accessContext = getAccessContext(req);
  const monthlyMessBillId = Number(req.params.id);
  const updatedMonthlyMessBill = await MessFeeService.updateMonthlyMessBill(accessContext, monthlyMessBillId, req.body);
  return Responses.successResponse(res, "Monthly mess bill updated successfully", updatedMonthlyMessBill);
};

const publishMonthlyMessBill = async (req, res) => {
  const accessContext = getAccessContext(req);
  const monthlyMessBillId = Number(req.params.id);
  const publishedMonthlyMessBill = await MessFeeService.publishMonthlyMessBill(accessContext, monthlyMessBillId);
  return Responses.successResponse(res, "Monthly mess bill published successfully", publishedMonthlyMessBill);
};

const deleteMonthlyMessBill = async (req, res) => {
  const deletedMonthlyMessBill = await MessFeeService.deleteMonthlyMessBill(Number(req.params.id), req.model);
  return Responses.successResponse(res, "Monthly mess bill deleted successfully", deletedMonthlyMessBill);
};

const getMonthlyMessBills = async (req, res) => {
  const accessContext = getAccessContext(req);
  const monthlyMessBills = await MessFeeService.getMonthlyMessBills(accessContext);
  return Responses.successResponse(res, "Monthly mess fills fetched successfully", monthlyMessBills);
};

const getOneMonthlyMessBill = async (req, res) => {
  return Responses.successResponse(res, "Monthly mess bill fetched successfully", req.model);
};

const MessFeeController = {
  createMonthlyMessBill,
  updateMonthlyMessBill,
  publishMonthlyMessBill,
  deleteMonthlyMessBill,
  getMonthlyMessBills,
  getOneMonthlyMessBill
};

export default MessFeeController;