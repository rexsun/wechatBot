// 配置文件
module.exports = {
  TIMER_MESSAGER: [
    {
      ENABLED: 1,
      NAME: '萍踪侠影',
      ALIAS: '萍踪侠影',
      CRON: '59 59 * * * *',
      CHANNELS: {
        nowTime: {
          template: '现在时刻<%=content%>',
          timeZone: 'Asia/Shanghai',
        },
        countDay: {
          template: '亲爱的，今天是我们的第<%=content%>天<br>',
          from: '2018-10-07',
          timeZone: 'Asia/Shanghai',
        },
        weatherMoji: {
          template: '[天气预报]<br><%=content%><br>',
          url: 'https://tianqi.moji.com/weather/china/hebei/langfang',
        },
        newsCnn: {
          template: '[CNN News]<br><%=content%><br>',
          timeZone: 'Asia/Shanghai',
          count: 5,
        },
        footer: '————思念你的Rex',
      },
    }, {
      ENABLED: 0,
      NAME: '镜风',
      ALIAS: '镜风',
      CRON: '*/30 * * * * *',
      CHANNELS: {
        nowTime: {
          template: '现在时刻<%=content%>',
          timeZone: 'Asia/Shanghai',
        },
        countDay: {
          template: '亲爱的，今天是我们的第<%=content%>天<br>',
          from: '2018-10-07',
          timeZone: 'Asia/Shanghai',
        },
        weatherMoji: {
          template: '[天气预报]<br><%=content%><br>',
          url: 'https://tianqi.moji.com/weather/china/shanghai/pudong-new-district',
        },
        newsCnn: {
          template: '[CNN News]<br><%=content%><br>',
          timeZone: 'Asia/Shanghai',
          count: 5,
        },
        footer: '————思念你的Rex',
      },
    }, {
      ENABLED: 0,
      NAME: 'SUNSEA',
      ALIAS: 'SUNSEA',
      CRON: '*/30 * * * * *',
      CHANNELS: {
        nowTime: {
          template: '现在时刻<%=content%>',
          timeZone: 'Asia/Los_Angeles',
        },
        countDay: {
          template: '我们相识的第<%=content%>天<br>',
          from: '2015-03-14',
          timeZone: 'Asia/Los_Angeles',
        },
        weatherMoji: {
          template: '[天气预报]<br><%=content%><br>',
          url: 'https://tianqi.moji.com/weather/china/shanghai/pudong-new-district',
        },
        dailySaying: {
          template: '[今日金句]<br><%=content%><br>',
        },
        footer: '————Rex的微信小管家',
      },
    }
  ],

  ONE: 'http://wufazhuce.com/',////ONE的web版网站
  HAHA: 'https://www.qiushibaike.com',//笑话网站
  NEWS: 'http://rss.cnn.com/rss/cnn_latest.rss',//新闻网站

  //高级功能配置项（非必填项）
  AUTOADDFRIEND: false,//自动加好友功能  默认关闭
  AUTOADDROOM: false,//自动拉群功能 默认关闭
  AUTOREPLY: false,//自动聊天功能 默认关闭
  AIBOTAPI: 'http://www.tuling123.com/openapi/api',//图灵机器人API 注册地址http://www.turingapi.com/
  APIKEY: '你的图灵机器人apikey',//图灵机器人apikey
  ROOMNAME: '/^SUN/i', //群名(请只修改中文，不要删除符号，这是正则)
  ADDFRIENDWORD: '/你要触发的关键词/i',//自动加好友触发的关键词(请只修改中文，不要删除符号，这是正则)
  ADDROOMWORD: '/加群/',//自动发送群图片触发关键词(请只修改中文，不要删除符号，这是正则)
  ROOMCODEURL: 'http://image.bloggeng.com/qun.png',//群二维码url链接(与本地群二维码路径选填一个)
  ROOMLOCALPATH: './static/qun.png',//本地群二维码图片路径（与群url选填一个）
}
