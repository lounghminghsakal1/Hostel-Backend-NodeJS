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

const getMonthlyMessBills = async (hostelId) => {
  return await prisma.monthlyMessBill.findMany({
    where: {
      hostelId: hostelId
    }
  });
};

const MessFeeRepository = {
  createMonthlyMessBill,
  getMonthlyMessBillById,
  updateMonthlyMessBill,
  findMonthlyMessBillById,
  publishMonthlyMessBill,
  deleteMonthlyMessBill,
  getMonthlyMessBills,
};

export default MessFeeRepository;