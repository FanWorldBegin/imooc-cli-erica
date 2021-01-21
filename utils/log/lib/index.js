'use strict';


const log = require('npmlog');
// 从环境变量中获取打印等级 - 判断debug模式
log.level = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'info';
// 打印的前缀
log.heading = "前缀";

log.headingStyle = { fg: 'red', bg: "black"}
// 自定义命令
log.addLevel('success', 2000, { fg: 'green', blod: true })

module.exports = log;