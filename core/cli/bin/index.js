#!/usr/bin/env node

// const utils = require('@imooc-cli-dev-erica/utils');
// utils();

const importLocal = require('import-local');
if(importLocal(__filename)) {
	require('npmlog').info('cli', '正在使用imooc-cli-dev-erica 本地版本(远程安装)')
} else {
	require("../lib/index.js")(process.argv.slice(2)) // 传入参数，从第三位传入
}