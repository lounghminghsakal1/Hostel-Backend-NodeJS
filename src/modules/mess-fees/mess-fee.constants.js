export const MONTHS = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];

//shown to students when they tap "Pay" - online payment isn't built yet, so they pay at the hostel office
//(office timings depend on the student's college shift; change them here)
export const MESS_FEE_PAYMENT_INFO = {
  onlinePaymentAvailable: false,
  message: "Online mess fee payment will be available soon. For now, please visit the hostel office and pay there.",
  officeHours: [
    { shift: "SHIFT_1", label: "Shift 1 students", opensAt: "14:00", closesAt: "16:00" },
    { shift: "SHIFT_2", label: "Shift 2 students", opensAt: "09:00", closesAt: "11:00" }
  ]
};
