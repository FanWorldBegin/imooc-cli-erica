
function isObject(obj) {
	return Object.prototype.toString.call(obj) === "[object Object]"
}

function spinnerStart(msg="", setSpinnerString = '|/-\\') {
	var Spinner = require('cli-spinner').Spinner;
	
	var spinner = new Spinner(msg + 'processing.. %s');
	spinner.setSpinnerString(setSpinnerString); // Loading 的符号
	spinner.start();
	return spinner;
}

// 阻塞当前进程
function sleep(timeout = 1000) {
	return new Promise(resolve => setTimeout(resolve,timeout));

}

module.exports = {
	isObject,
	spinnerStart,
}