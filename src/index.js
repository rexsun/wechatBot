/**
 * WechatBot
 *  - https://github.com/gengchen528/wechatBot
 */
const _ = require('lodash');
const { Wechaty, Friendship } = require('wechaty');
const schedule = require('./schedule');
const untils = require('./utils');
const config = require('./config');
const superagent = require('./superagent');
const { FileBox } = require('file-box'); //文件读取模块

//  二维码生成
function onScan(qrcode, status) {
	require('qrcode-terminal').generate(qrcode);  // 在console端显示二维码
	const qrcodeImageUrl = [
		'https://api.qrserver.com/v1/create-qr-code/?data=',
		encodeURIComponent(qrcode),
	].join('');
	console.log(qrcodeImageUrl);
}

// 登录
async function onLogin(user) {
	console.log(`---- ${user} logged in ----`);
	// 登陆后创建定时任务
	schedule.setSchedule(config.SENDDATE, () => {
		console.log('==== Starting scheduled task ====');
		timerMessage();
	});
}

//登出
function onLogout(user) {
	console.log(`---- ${user} logged out ----`);
}

// 自动发消息功能
async function timerMessage() {
	let logMsg;
	let contact = await bot.Contact.find({ name: config.NAME }) || await bot.Contact.find({ alias: config.ALIAS }); // 获取你要发送的联系人
	let haha = await superagent.getHaha(); //获取每日一句
	let weather = await superagent.getWeather(); //获取天气信息
	let nowTime = await untils.formatDate(); //获取今天的日期
	let dayNumber = untils.getDayNum(config.MEMORIAL_DAY); //获取纪念日天数
	let message = `现在是${nowTime}
亲爱的，今天是我们的第${dayNumber}天<br>
${weather}<br>
${haha}<br>————想念你的Rex`;
	try {
		logMsg = message;
		await contact.say(message); // 发送消息
	} catch (e) {
		logMsg = e.message;
	}
	console.log(logMsg);
}

// 监听对话 根据关键词自动加群
async function onMessage(msg) {
	const contact = msg.from(); // 发消息人
	const content = msg.text(); //消息内容
	const room = msg.room(); //是否是群消息
	const roomCodeUrl = FileBox.fromUrl(config.ROOMCODEURL); //来自url的文件
	const roomCodeLocal = FileBox.fromFile(config.ROOMLOCALPATH); //添加本地文件

	if (msg.self()) {
		return;
	}

	if (room) { // 如果是群消息
		const topic = await room.topic();
		console.log(`==>[ ${topic} | ${contact.name()} ] ==> ${content}`);
	} else { // 如果非群消息
		console.log(`==>( ${contact.name()} ) ==> ${content}`);
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
					let reply = await superagent.getReply(content)
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
				let reply = await superagent.getReply(content)
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