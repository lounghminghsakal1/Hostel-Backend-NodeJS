//en-CA format is -> yyyy-mm-dd so that it can be useful in filtering and other db related stuffs
export const CurrentDateValue = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
}).format(new Date());

// Always append UTC midnight before feeding to Prisma
export const currentDate = new Date(`${CurrentDateValue}T00:00:00.000Z`); //because while storing this we need to change it 

//"en-GB" is for formatting , here en-GB is refering british format because they represent time in 24 hour format and dd/mm/yyyy format
export const currentTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23"
}).format(new Date());


export const getDateRange = (fromDate, toDate = fromDate) => {
  const startDate = new Date(`${fromDate}T00:00:00.000Z`);
  const endDate = new Date(`${toDate}T00:00:00.000Z`);
  endDate.setUTCDate(endDate.getUTCDate() + 1);

  console.log(startDate);
  console.log("end", endDate);
  
  return {
    startDate,
    endDate
  };
};

// --- Helper: Generate array of 'YYYY-MM-DD' strings in range ---
export const getDatesListBetween = (startDate, endDate) => {
  const dates = [];
  const curr = new Date(startDate);
  const end = new Date(endDate);

  //normalize utc hours
  curr.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(0, 0, 0, 0);
  
  while(curr <= end) {
    dates.push(curr.toISOString().split("T")[0]);
    curr.setUTCDate(curr.getUTCDate() + 1);
  }

  return dates;
};

