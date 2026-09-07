//"en-GB" is for formatting , here en-GB is refering british format because they represent time in 24 hour format and dd/mm/yyyy format
////this is just a formatter like i want this format of time, this format of date that's all
const kolkataTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23"
});

//here new Date() return current datetime object -> 2026-09-07T07:23:43.384Z (UTC time) 5:30 hrs behind ist, so formatter only takes time and gives it as string in the format we configured above
export const currentTime = () => kolkataTimeFormatter.format(new Date());

//en-CA format is -> yyyy-mm-dd so that it can be useful in filtering and other db related stuffs
//this is just a formatter like i want this format of time, this format of date that's all
const kolkataDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

//takes date only and gives it as string in the format we configured above
export const currentDate = () => kolkataDateFormatter.format(new Date());

export const getDateRange = (fromDate, toDate = fromDate) => {
  //here fromDate and toDate comes from query param which is string so if we pass that to new Date() we get date object which we can use it for db filters, because prisma expects date object for filtering date type columns
  const startDate = new Date(`${fromDate}T00:00:00.000Z`); //here attaching time as 00 (midnight) so that it converted correctly
  const endDate = new Date(toDate); // if we don't specify 00(midnight) it automatically converts it to midnight only(start of the day)
  // console.log(startDate);
  // console.log(endDate);
  // console.log(typeof startDate);
  // console.log(typeof endDate);
  return {
    startDate,
    endDate
  };
};

// returns array of string of dates between start date and end date
export const getDatesListBetween = (startDate, endDate) => {
  const dates = [];
  //start date and end date are strings so inorder to get next date of one date we need to work with Date object so that these 2 line below
  const curr = new Date(startDate);
  const end = new Date(endDate);

  while(curr <= end) {
    dates.push(curr.toISOString().split("T")[0]);
    curr.setUTCDate(curr.getUTCDate() + 1); //going to next date
  }

  return dates;
};
