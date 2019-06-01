const moment = require('moment');

function getDayNum(date) {
    var date2 = new Date();
    var date1 = new Date(date);
    var iDays = parseInt(Math.abs(date2.getTime() - date1.getTime()) / 1000 / 60 / 60 / 24);
    return iDays;
}

function formatDate(date) {
    const now = !date ? moment() : moment(date);
    const bjTime = now.tz('Asia/Shanghai').format('YYYY-MM-DD h:mm:ss a');
    return bjTime;
}

module.exports = {
    getDayNum,
    formatDate,
};
