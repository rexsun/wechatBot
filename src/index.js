/**
 * WechatBot
 *  - original https://github.com/gengchen528/wechatBot
 *  - modified https://github.com/rexsun/wechatBot
 */
const _ = require('lodash');
const { Wechaty, Friendship } = require('wechaty');
const { FileBox } = require('file-box'); //文件读取模块
const xml2js = require('xml2js').parseString;
const schedule = require('node-schedule');

// See details: https://www.npmjs.com/package/node-schedule
// s m H d M w
// * * * * * *
// ┬ ┬ ┬ ┬ ┬ ┬
// │ │ │ │ │ │
// │ │ │ │ │ └ day of week (0 - 7) (0 or 7 is Sun)
// │ │ │ │ └───── month (1 - 12)
// │ │ │ └────────── day of month (1 - 31)
// │ │ └─────────────── hour (0 - 23)
// │ └──────────────────── minute (0 - 59)
// └───────────────────────── second (0 - 59, OPTIONAL)

const config = require('./config');
const channels = require('./channels');

function onScan(qrcode, status) {
	require('qrcode-terminal').generate(qrcode);  // 在console端显示二维码
	const qrcodeImageUrl = [
		'https://api.qrserver.com/v1/create-qr-code/?data=',
		encodeURIComponent(qrcode),
	].join('');
	console.log(qrcodeImageUrl);
}

async function onLogin(user) {
	console.log(`---- ${user} logged in ----`);
	setTimers();
}

function onLogout(user) {
	console.log(`---- ${user} logged out ----`);
}

function setTimers() {
	_.each(config.TIMER_MESSAGER, (params) => {
		if (!!_.get(params, 'ENABLED', false)) {
			schedule.scheduleJob(params.CRON, () => {
				sendMessage(params);
			});
			const target = !params.ROOM ? `${params.NAME}(${params.ALIAS})`
			 : `ROOM [${params.ROOM}]`;
			console.log(`scheduled: ${target} - ${params.CRON}`);
		}
	});
}

async function sendMessage(params) {
	if (!params.ROOM) {
		console.log(`==== Starting scheduled task ${params.NAME}(${params.ALIAS}) ====`);

		const contact = await bot.Contact.find({ name: params.NAME })
			|| await bot.Contact.find({ alias: params.ALIAS });
		if (!contact) {
			console.log(`!!!! Contact ${params.NAME}(${params.ALIAS}) not found, SKIP message !!!!`);
			return;
		}

		const message = await channels.getChannelMessages(params.CHANNELS);

		try {
			await contact.say(message);
			console.log(message);
		} catch (ex) {
			console.log('sendMessage ERROR:: ', ex);
		}
	} else {
		console.log(`==== Starting scheduled task ROOM [${params.ROOM}] ====`);
		const room = await bot.Room.find({topic: params.ROOM});

		if (!room) {
			console.log(`!!!! ROOM [${params.ROOM})] not found, SKIP message !!!!`);
			return;
		}

		const message = await channels.getChannelMessages(params.CHANNELS);

		try {
			await room.say(message);
			console.log(message);
		} catch (ex) {
			console.log('sendMessage ERROR:: ', ex);
		}
	}
}

async function formatMessage(text) {
	let result = text;

	try {
		if (_.startsWith(text, '&lt;')) {
			result = _.unescape(text);
		}
		switch (true) {
			case !!(/^@[a-f0-9]+$/img.test(result)):
				result = '[[ 图片 ]]';
				break;
			case _.startsWith(result, '<msg>'):
				const json = await new Promise((resolve, reject) => xml2js(result, (err, ret) => {
					!err ? resolve(ret) : reject(err);
				}));

				const msgJson = _.get(json, ['msg', 'appmsg'], {});

				switch (true) {
					case !!_.get(msgJson, 'url'):
						result = `[[ 链接 ]]
${_.get(msgJson, 'title', '')}
${_.get(msgJson, 'desc', '')}
${_.get(msgJson, 'url', '')}
${_.get(json, ['msg', 'appinfo', 'appname'], '')}`;
						break;
					case !!_.get(json, ['msg', 'emoji']):
						result = `[[ 表情 ]] ${_.get(json, ['msg', 'emoji', '$', 'cdnurl'], '')}`;
						break;
				}
				break;
		}
	} catch (ignored) {
	}

	return result;
}

// 监听对话 根据关键词自动加群
async function onMessage(msg) {
	const contact = msg.from(); // 发消息人
	const content = await formatMessage(msg.text()); //消息内容
	const room = msg.room(); //是否是群消息
	const roomCodeUrl = FileBox.fromUrl(config.ROOMCODEURL); //来自url的文件
	const roomCodeLocal = FileBox.fromFile(config.ROOMLOCALPATH); //添加本地文件

	if (msg.self()) {
		return;
	}

	if (room) { // 如果是群消息
		const topic = await room.topic();
		console.log(`>>R>> [ ${topic} | ${contact.name()} ] ==> ${content}`);
	} else { // 如果非群消息
		console.log(`>>C>> ( ${contact.name()} ) ==> ${content}`);
		if (config.AUTOADDROOM) { //判断是否开启自动加群功能
			let addRoomReg = eval(config.ADDROOMWORD);
			let roomReg = eval(config.ROOMNAME);
			if (addRoomReg.test(content) && !room) {
				let keyRoom = await this.Room.find({ topic: roomReg })
				if (keyRoom) {
					try {
						await contact.say('你好，由于目前群里人数超过100，群主将会看到消息后，第一时间把你拉入群中！')
						await contact.say('谢谢理解^_^')
						// await contact.say(roomCodeLocal||roomCodeUrl)
					} catch (e) {
						console.error(e)
					}
				}
			} else {
				if (config.AUTOREPLY) { // 如果开启自动聊天
					let reply = await channels.getReply(content)
					console.log('图灵机器人回复：', reply)
					try {
						await contact.say(reply)
					} catch (e) {
						console.error(e)
					}
				}
			}
		} else {
			if (config.AUTOREPLY) { // 如果开启自动聊天
				let reply = await channels.getReply(content)
				console.log('图灵机器人回复：', reply)
				try {
					await contact.say(reply)
				} catch (e) {
					console.error(e)
				}
			}
		}
	}
}

// 自动加好友功能
async function onFriendShip(friendship) {
	let logMsg
	try {
		logMsg = '添加好友' + friendship.contact().name()
		console.log(logMsg)

		switch (friendship.type()) {
			/**
			 *
			 * 1. New Friend Request
			 *
			 * when request is set, we can get verify message from `request.hello`,
			 * and accept this request by `request.accept()`
			 */
			case Friendship.Type.Receive:
				let addFriendReg = eval(config.ADDFRIENDWORD)
				if (addFriendReg.test(friendship.hello()) && config.AUTOADDFRIEND) { //判断是否开启自动加好友功能
					logMsg = '自动添加好友，因为验证信息中带关键字‘每日说’'
					await friendship.accept()
				} else {
					logMsg = '没有通过验证 ' + friendship.hello()
				}
				break
			/**
			 *
			 * 2. Friend Ship Confirmed
			 *
			 */
			case Friendship.Type.Confirm:
				logMsg = 'friend ship confirmed with ' + friendship.contact().name()
				break
		}
	} catch (e) {
		logMsg = e.message
	}
	console.log(logMsg)
}

// 加群提醒
function roomJoin(room, inviteeList, inviter) {
	const nameList = inviteeList.map(c => c.name()).join(',')
	room.topic().then(function (res) {
		const roomNameReg = eval(config.ROOMNAME)
		if (roomNameReg.test(res)) {
			console.log(`群名： ${res} ，加入新成员： ${nameList}, 邀请人： ${inviter}`)
			room.say(`${res}：欢迎新朋友 @${nameList}，<br>使用过程中有什么问题都可以在群里提出`)
		}
	})
}

const bot = ((b) => {
	b.on('scan', onScan);
	b.on('login', onLogin);
	b.on('logout', onLogout);
	b.on('message', onMessage);
	b.on('friendship', onFriendShip);
	b.on('room-join', roomJoin);

	b.start()
		.then(() => console.log('---- START ----'))
		.catch(e => console.error(e));

	return b;
})(new Wechaty({ name: 'WechatEveryDay' }));