const _ = require('lodash');
const moment = require('moment');
const cheerio = require('cheerio');
const xml2js = require('xml2js').parseString;
const superagent = require('superagent');

const config = require('./config');

//请求
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

async function getOne() { // 获取每日一句
  let res = await superReq(config.ONE, 'GET');
  let $ = cheerio.load(res.text);
  let todayOneList = $('#carousel-one .carousel-inner .item');
  let todayOne = $(todayOneList[0]).find('.fp-one-cita').text().replace(/(^\s*)|(\s*$)/g, "");
  return todayOne;
}

async function getHaha() { // 获取笑话
  try {
    let res = await superReq(`${config.HAHA}/text`, 'GET');
    let $ = cheerio.load(res.text);

    const hahaLink = $('#content-left .article .contentHerf');
    const hahaUrl = $(hahaLink[0]).attr('href');

    res = await superReq(`${config.HAHA}${hahaUrl}`);
    $ = cheerio.load(res.text);
    let hahaArticle = $('#single-next-link');
    let hahaText = $(hahaArticle[0]).find('.content').text().replace(/(^\s*)|(\s*$)/g, "");

    return `[开心一刻]<br>${hahaText}`;
  } catch (ex) {
    console.log(ex);
    return '';
  }
}

async function getNews() {
  try {
    const res = await superReq(`${config.NEWS}`, 'GET');
    const json = await new Promise((resolve, reject) => xml2js(res.text, (err, ret) => {
      !err ? resolve(ret) : reject(err);
    }));
    const news = _.get(json, ['rss', 'channel', 0, 'item'], {});
    const newsTemp = _.template('<%=num%>. <%=title%> @ <%=time%>');
    const pickNews = (i) => {
      const item = _.get(news, i, {});
      return newsTemp({
        num: i + 1 + '',
        time: moment(_.get(item, ['pubDate', 0])).tz('Asia/Shanghai').format('MM-DD h:mm a'),
        title: _.get(item, 'title', '-- Sorry, an empty news --')
      });
    };
    const content = _.join(_.map(_.range(5), (o) => pickNews(o)), '<br><br>');
    return `[CNN News]<br>${content}`;
  } catch (ex) {
    console.log(ex);
    return '';
  }
}

async function getWeather() { //获取墨迹天气
  try {
    let url = config.MOJI_HOST + config.CITY + '/' + config.LOCATION
    let res = await superReq(url, 'GET')
    let $ = cheerio.load(res.text)
    let weatherTips = $('.wea_tips em').text()
    const today = $('.forecast .days').first().find('li');
    let todayInfo = {
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
    return `[天气预报]<br>${weatherTips}<br>${todayWeather}`;
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
module.exports = {
  getOne,
  getHaha,
  getNews,
  getWeather,
  getReply,
}
