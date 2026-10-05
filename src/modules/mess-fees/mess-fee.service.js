import createHttpError from "http-errors";
import MessFeeRepository from "./mess-fee.repository.js";
import { updateMonthlyMessBillRequestBodySchema } from "./mess-fee.request-schema.js";

const createMonthlyMessBill = async (accessContext, createMonthlyMessBillRequestBody) => {
  const {
    month,
    year,
    amount,
    lastDate
  } = createMonthlyMessBillRequestBody;
  //while creation the status will be draft
  const createdMonthlyMessBill = await MessFeeRepository.createMonthlyMessBill(month, year, amount, lastDate, accessContext.loggedInAdminHostelId);
  return createdMonthlyMessBill;
};

const updateMonthlyMessBill = async (accessContext, monthlyMessBillId, updateMonthlyMessBillRequestBody) => {
  const monthlyMessBill = await MessFeeRepository.getMonthlyMessBillById(monthlyMessBillId);
  if (!monthlyMessBill) throw createHttpError(404, "Monthly mess bill not found", { errors: "Invalid id" });

  if (monthlyMessBill.status !== "DRAFT") throw createHttpError(409, `Mess bill should be in draft status to edit, but currently its ${monthlyMessBill.status}`, { errors: "Invalid request" });
  if (monthlyMessBill.hostelId !== accessContext.loggedInAdminHostelId) throw createHttpError(403, "This monthly mess bill is not belongs to your hostel", { errors: "Un authorized access" });

  const {
    month,
    year,
    amount,
    lastDate
  } = updateMonthlyMessBillRequestBody;

  const updatedMonthlyMessBill = await MessFeeRepository.updateMonthlyMessBill(monthlyMessBillId, month, year, amount, lastDate);

  return updatedMonthlyMessBill;

};

const publishMonthlyMessBill = async (accessContext, monthlyMessBillId) => {
  //check monthly mess bill exist or not
  const monthlyMessBill = await MessFeeRepository.findMonthlyMessBillById(monthlyMessBillId);
  if(!monthlyMessBill) throw createHttpError(404, "Monthly mess bill not found", {errors: "Invalid id"});

  if(monthlyMessBill.hostelId !== accessContext.loggedInAdminHostelId) throw createHttpError(403, "This monthly mess bill is not for your hostel", {errors: "Un authorized access"});

  if(monthlyMessBill.status !== "DRAFT") throw createHttpError(409, "Monthly mess bill must be at draft status to publish", {errors: "Invalid request"});

  const publishedMonthlyMessBill = await MessFeeRepository.publishMonthlyMessBill(monthlyMessBillId);
  return publishedMonthlyMessBill;
};

const deleteMonthlyMessBill = async (id, monthlyMessBill) => {
  if (monthlyMessBill.status !== "DRAFT") throw createHttpError(409, "Only draft status monthly mess bill can be deleted", {erros: "Invalid request"});
  return MessFeeRepository.deleteMonthlyMessBill (id);
};

const getMonthlyMessBills = async (accessContext) => {
  return await MessFeeRepository.getMonthlyMessBills(accessContext.loggedInAdminHostelId);
};

const MessFeeService = {
  createMonthlyMessBill,
  updateMonthlyMessBill,
  publishMonthlyMessBill,
  deleteMonthlyMessBill,
  getMonthlyMessBills,
};

export default MessFeeService;