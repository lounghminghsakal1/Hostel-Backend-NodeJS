  const today = new Intl.DateTimeFormat("en-Gb",{
    timZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).format(new Date());

  console.log(today)