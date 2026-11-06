import { prisma } from "../../configs/db.js";

const createMonthlyMessBill = async (month, year, amount, lastDate, hostelId) => {
  return await prisma.monthlyMessBill.create({
    data: {
      month,
      year,
      amount,
      lastDate,
      hostelId
    }
  });
};

const getMonthlyMessBillById = async (id) => {
  return await prisma.monthlyMessBill.findUnique({
    where: {
      id
    }
  });
};

const updateMonthlyMessBill = async (monthlyMessBillId, month, year, amount, lastDate) => {
  return await prisma.monthlyMessBill.update({
    where: {
      id: monthlyMessBillId
    },
    data: {
      month: month ?? undefined,
      year: year ?? undefined,
      amount: amount ?? undefined,
      lastDate: lastDate ?? undefined
    }
  });
};

const findMonthlyMessBillById = async (id) => {
  return await prisma.monthlyMessBill.findUnique({
    where: {
      id
    }
  });
};

const publishMonthlyMessBill = async (id) => {
  return await prisma.monthlyMessBill.update({
    where: {
      id: id
    },
    data: {
      status: "PUBLISHED"
    }
  });
};

const deleteMonthlyMessBill = async (id) => {
  return await prisma.monthlyMessBill.delete({
    where: {
      id
    }
  });
};

//MonthEnum is declared JANUARY..DECEMBER, so ordering by it sorts by calendar month
const getMonthlyMessBills = async (hostelId) => {
  return await prisma.monthlyMessBill.findMany({
    where: {
      hostelId: hostelId
    },
    orderBy: [{ year: "desc" }, { month: "desc" }]
  });
};

const findMonthlyMessBillByMonthAndYear = async (hostelId, month, year) => {
  return await prisma.monthlyMessBill.findFirst({
    where: { hostelId, month, year },
    select: { id: true }
  });
};

//students only see bills the admin has published (or that have expired), never drafts
const getPublishedMessBillsOfHostel = async (hostelId, studentProfileId) => {
  return await prisma.monthlyMessBill.findMany({
    where: {
      hostelId,
      status: { in: ["PUBLISHED", "EXPIRED"] }
    },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    select: {
      id: true,
      month: true,
      year: true,
      amount: true,
      lastDate: true,
      status: true,
      messFeePayments: {
        where: { studentProfileId },
        select: { paidAt: true }
      }
    }
  });
};

const MessFeeRepository = {
  findMonthlyMessBillByMonthAndYear,
  getPublishedMessBillsOfHostel,
  createMonthlyMessBill,
  getMonthlyMessBillById,
  updateMonthlyMessBill,
  findMonthlyMessBillById,
  publishMonthlyMessBill,
  deleteMonthlyMessBill,
  getMonthlyMessBills,
};

export default MessFeeRepository;