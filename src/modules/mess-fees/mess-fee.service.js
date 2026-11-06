import createHttpError from "http-errors";
import MessFeeRepository from "./mess-fee.repository.js";
import { MESS_FEE_PAYMENT_INFO, MONTHS } from "./mess-fee.constants.js";
import { currentDateForDb, getCurrentAndNextMonth } from "../../utils/dates.utils.js";

//admins can set mess bills only for the current month and the next month (IST)
const allowedBillMonths = () => getCurrentAndNextMonth().map(({ month, year }) => ({ month: MONTHS[month - 1], year }));

const monthLabel = ({ month, year }) => `${month.charAt(0)}${month.slice(1).toLowerCase()} ${year}`;

const isAllowedBillMonth = (month, year) => allowedBillMonths().some(allowed => allowed.month === month && allowed.year === year);

const assertAllowedBillMonth = (month, year, action = "set") => {
  if (isAllowedBillMonth(month, year)) return;
  const [current, next] = allowedBillMonths();
  throw createHttpError(422, `Mess bills can only be ${action} for ${monthLabel(current)} or ${monthLabel(next)}`, { errors: "Only the current or next month is allowed" });
};

//lastDate is a calendar date (UTC midnight): not in the past and not before the bill's month starts
const assertValidLastDate = (lastDate, month, year) => {
  const firstDayOfBillMonth = new Date(Date.UTC(year, MONTHS.indexOf(month), 1));
  if (lastDate < firstDayOfBillMonth) throw createHttpError(422, "Last date to pay can't be before the bill's month starts", { errors: "Invalid last date" });
  if (lastDate < currentDateForDb()) throw createHttpError(422, "Last date to pay can't be in the past", { errors: "Invalid last date" });
};

const assertNoOtherBillForMonth = async (hostelId, month, year, excludeId) => {
  const existing = await MessFeeRepository.findMonthlyMessBillByMonthAndYear(hostelId, month, year);
  if (existing && existing.id !== excludeId) throw createHttpError(409, `A mess bill for ${monthLabel({ month, year })} already exists`, { errors: "Duplicate mess bill" });
};

//what the admin app may do with a bill right now
const withBillActions = (bill) => {
  const editable = bill.status === "DRAFT" && isAllowedBillMonth(bill.month, bill.year);
  return { ...bill, canEdit: editable, canPublish: editable, canDelete: bill.status === "DRAFT" };
};

const createMonthlyMessBill = async (accessContext, createMonthlyMessBillRequestBody) => {
  const {
    month,
    year,
    amount,
    lastDate
  } = createMonthlyMessBillRequestBody;

  assertAllowedBillMonth(month, year);
  assertValidLastDate(lastDate, month, year);
  await assertNoOtherBillForMonth(accessContext.loggedInAdminHostelId, month, year);

  //while creation the status will be draft
  const createdMonthlyMessBill = await MessFeeRepository.createMonthlyMessBill(month, year, amount, lastDate, accessContext.loggedInAdminHostelId);
  return withBillActions(createdMonthlyMessBill);
};

const updateMonthlyMessBill = async (accessContext, monthlyMessBillId, updateMonthlyMessBillRequestBody) => {
  const monthlyMessBill = await MessFeeRepository.getMonthlyMessBillById(monthlyMessBillId);
  if (!monthlyMessBill) throw createHttpError(404, "Monthly mess bill not found", { errors: "Invalid id" });
  if (monthlyMessBill.hostelId !== accessContext.loggedInAdminHostelId) throw createHttpError(403, "This monthly mess bill is not belongs to your hostel", { errors: "Un authorized access" });
  if (monthlyMessBill.status !== "DRAFT") throw createHttpError(409, `Mess bill should be in draft status to edit, but currently its ${monthlyMessBill.status}`, { errors: "Invalid request" });

  //the bill being edited must be for the current or next month, and so must the month it's moved to
  assertAllowedBillMonth(monthlyMessBill.month, monthlyMessBill.year, "edited");

  const {
    month,
    year,
    amount,
    lastDate
  } = updateMonthlyMessBillRequestBody;

  const nextMonth = month ?? monthlyMessBill.month;
  const nextYear = year ?? monthlyMessBill.year;
  assertAllowedBillMonth(nextMonth, nextYear);
  if (nextMonth !== monthlyMessBill.month || nextYear !== monthlyMessBill.year) {
    await assertNoOtherBillForMonth(accessContext.loggedInAdminHostelId, nextMonth, nextYear, monthlyMessBill.id);
    //moving the bill to another month: the existing last date must still make sense for it
    if (!lastDate) assertValidLastDate(monthlyMessBill.lastDate, nextMonth, nextYear);
  }
  if (lastDate) assertValidLastDate(lastDate, nextMonth, nextYear);

  const updatedMonthlyMessBill = await MessFeeRepository.updateMonthlyMessBill(monthlyMessBillId, month, year, amount, lastDate);
  return withBillActions(updatedMonthlyMessBill);
};

const publishMonthlyMessBill = async (accessContext, monthlyMessBillId) => {
  //check monthly mess bill exist or not
  const monthlyMessBill = await MessFeeRepository.findMonthlyMessBillById(monthlyMessBillId);
  if(!monthlyMessBill) throw createHttpError(404, "Monthly mess bill not found", {errors: "Invalid id"});

  if(monthlyMessBill.hostelId !== accessContext.loggedInAdminHostelId) throw createHttpError(403, "This monthly mess bill is not for your hostel", {errors: "Un authorized access"});

  if(monthlyMessBill.status !== "DRAFT") throw createHttpError(409, "Monthly mess bill must be at draft status to publish", {errors: "Invalid request"});

  assertAllowedBillMonth(monthlyMessBill.month, monthlyMessBill.year, "published");

  const publishedMonthlyMessBill = await MessFeeRepository.publishMonthlyMessBill(monthlyMessBillId);
  return withBillActions(publishedMonthlyMessBill);
};

const deleteMonthlyMessBill = async (id, monthlyMessBill) => {
  if (monthlyMessBill.status !== "DRAFT") throw createHttpError(409, "Only draft status monthly mess bill can be deleted", {errors: "Invalid request"});
  return MessFeeRepository.deleteMonthlyMessBill (id);
};

//newest month first
const getMonthlyMessBills = async (accessContext) => {
  const monthlyMessBills = await MessFeeRepository.getMonthlyMessBills(accessContext.loggedInAdminHostelId);
  return monthlyMessBills.map(withBillActions);
};

//student: published bills of their hostel (newest first) with paidAt when a payment is recorded,
//plus how to pay - online payment isn't available yet, so students pay at the hostel office
const getMyMessBills = async (accessContext) => {
  if (!accessContext.loggedInStudentHostelId) return { bills: [], paymentInfo: MESS_FEE_PAYMENT_INFO };
  const bills =await MessFeeRepository.getPublishedMessBillsOfHostel(accessContext.loggedInStudentHostelId, accessContext.loggedInStudentProfileId);
  return {
    bills: bills.map(({ messFeePayments, ...bill }) => ({ ...bill, paidAt: messFeePayments[0]?.paidAt ?? null })),
    paymentInfo: MESS_FEE_PAYMENT_INFO
  };
};

const MessFeeService = {
  createMonthlyMessBill,
  updateMonthlyMessBill,
  publishMonthlyMessBill,
  deleteMonthlyMessBill,
  getMonthlyMessBills,
  getMyMessBills,
  withBillActions,
};

export default MessFeeService;
