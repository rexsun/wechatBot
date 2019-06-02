const _ = require('lodash');
const moment = require('moment');
const targetTimeZone = 'Asia/Shanghai';

function getDayNum(date) {
    return moment().diff(moment.tz(date, targetTimeZone), 'days');
}

function formatDate(date) {
    const now = !date ? moment() : moment(date);
    const bjTime = now.tz(targetTimeZone).format('YYYY-MM-DD h:mm a');
    return bjTime;
}

function formatMessage(text) {
    let result = text;
    if (_.startsWith(text, '&lt;')) {
        try {
            result = _.unescape(text);
        } catch (ex) {
        }
    }
    return result;
}

module.exports = {
    getDayNum,
    formatDate,
    formatMessage,
};
