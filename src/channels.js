const _ = require('lodash');
const moment = require('moment');
const cheerio = require('cheerio');
const xml2js = require('xml2js').parseString;
const superagent = require('superagent');

const config = require('./config');

function superReq(url, method, params, data, cookies) {
  return new Promise(function (resolve, reject) {
    superagent(method, url)
      .query(params)
      .send(data)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .end(function (err, response) {
        if (err) {
          reject(err)
        }
        resolve(response)
      })
  })
}

async function nowTime(params) {
  const timeZone = _.get(params, 'timeZone');
  const now = moment();
  return now.tz(timeZone).format('YYYY-MM-DD h:mm a');
}

async function countDay(params) {
  const date = _.get(params, 'from');
  const timeZone = _.get(params, 'timeZone');
  return moment().diff(moment.tz(date, timeZone), 'days') + '';
}

async function dailySaying(params) {
  let res = await superReq(config.ONE, 'GET');
  let $ = cheerio.load(res.text);
  let todayOneList = $('#carousel-one .carousel-inner .item');
  let todayOne = $(todayOneList[0]).find('.fp-one-cita').text().replace(/(^\s*)|(\s*$)/g, "");
  return todayOne;
}

async function hahaQiubai(params) {
  try {
    let res = await superReq(`${config.HAHA}/text`, 'GET');
    let $ = cheerio.load(res.text);

    const hahaLink = $('#content-left .article .contentHerf');
    const hahaUrl = $(hahaLink[0]).attr('href');

    res = await superReq(`${config.HAHA}${hahaUrl}`);
    $ = cheerio.load(res.text);
    let hahaArticle = $('#single-next-link');
    return $(hahaArticle[0]).find('.content').text().replace(/(^\s*)|(\s*$)/g, "");
  } catch (ex) {
    console.log(ex);
    return '';
  }
}

async function newsCnn(params) {
  try {
    const timeZone = _.get(params, 'timeZone', 'Asia/Shanghai');
    const count = _.toSafeInteger(_.get(params, 'count', 3));
    const res = await superReq(`${config.NEWS}`, 'GET');
    const json = await new Promise((resolve, reject) => xml2js(res.text, (err, ret) => {
      !err ? resolve(ret) : reject(err);
    }));
    const news = _.get(json, ['rss', 'channel', 0, 'item'], {});
    const newsTemp = _.template('<%=num%>. <%=title%> -- <%=body%> @ <%=time%>');
    const pickNews = (i) => {
      const item = _.get(news, i, {});
      const body = _.get(item, ['description', 0], 
        _.get(item, 'description', '<div'));
      return newsTemp({
        num: i + 1 + '',
        time: moment(_.get(item, ['pubDate', 0])).tz(timeZone).format('MM-DD h:mm a'),
        body: body.substring(0, body.indexOf('<div')),
        title: _.get(item, 'title', '-- Sorry, an empty news --')
      });
    };
    return _.join(_.map(_.range(count), (o) => pickNews(o)), '<br><br>');
  } catch (ex) {
    console.log(ex);
    return '';
  }
}

async function weatherMoji(params) {
  try {
    const url = _.get(params, 'url', 'https://tianqi.moji.com/weather/china/shanghai/pudong-new-district');
    const res = await superReq(url, 'GET')
    const $ = cheerio.load(res.text)
    const weatherTips = $('.wea_tips em').text()
    const today = $('.forecast .days').first().find('li');
    const todayInfo = {
      Day: $(today[0]).text().replace(/(^\s*)|(\s*$)/g, ""),
      WeatherText: $(today[1]).text().replace(/(^\s*)|(\s*$)/g, ""),
      Temp: $(today[2]).text().replace(/(^\s*)|(\s*$)/g, ""),
      Wind: $(today[3]).find('em').text().replace(/(^\s*)|(\s*$)/g, ""),
      WindLevel: $(today[3]).find('b').text().replace(/(^\s*)|(\s*$)/g, ""),
      PollutionLevel: $(today[4]).find('strong').text().replace(/(^\s*)|(\s*$)/g, "")
    }
    const todayWeather = todayInfo.Day + ' ' + todayInfo.WeatherText + '<br>'
      + '气温:' + todayInfo.Temp + ' ' + todayInfo.Wind + todayInfo.WindLevel + '<br>'
      + '空气质量:' + todayInfo.PollutionLevel;
    return `${weatherTips}<br>${todayWeather}`;
  } catch (ex) {
    console.log(ex);
    return '';
  }
}

async function getReply(word) { // 青云api，智能聊天机器人
  let url = config.AIBOTAPI
  let res = await superReq(url, 'GET', { key: config.APIKEY, info: word })
  let content = JSON.parse(res.text)
  if (content.code === 100000) {
    return content.text
  } else {
    return '我好像迷失在无边的网络中了，你能找回我么'
  }
}

const handlers = {
  nowTime,
  countDay,
  dailySaying,
  hahaQiubai,
  newsCnn,
  weatherMoji,
};

async function getChannelMessages(params) {
  const result = [];
  for (const key in params) {
    const val = params[key];
    if (_.isString(val)) {
      result.push(val);
    } else {
      const tmpl = _.template(_.get(val, 'template', '<%=content%>'));
      const content = await handlers[key](val);
      result.push(tmpl({ content }));
    }
  }
  return _.join(result, '<br>');
}

module.exports = {
  getChannelMessages,
  getReply,
}
