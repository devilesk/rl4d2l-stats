const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const hours = [];
for (let i = 0; i <= 23; i++) {
    hours.push(i.toString());
}

const timezones = ['est', 'cst', 'mst', 'pst'];

const getDayHourMap = date => {
    const estDate = new Date(date.toLocaleString("en-US", {timeZone: "America/New_York"}));
    const cstDate = new Date(date.toLocaleString("en-US", {timeZone: "America/Chicago"}));
    const mstDate = new Date(date.toLocaleString("en-US", {timeZone: "America/Denver"}));
    const pstDate = new Date(date.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
    const dayHourMap = {
        est: {
            day: days[estDate.getDay()],
            hour: estDate.getHours().toString(),
        },
        cst: {
            day: days[cstDate.getDay()],
            hour: cstDate.getHours().toString(),
        },
        mst: {
            day: days[mstDate.getDay()],
            hour: mstDate.getHours().toString(),
        },
        pst: {
            day: days[pstDate.getDay()],
            hour: pstDate.getHours().toString(),
        },
    }
    return dayHourMap;
};

module.exports = {
    days,
    hours,
    timezones,
    getDayHourMap
};
