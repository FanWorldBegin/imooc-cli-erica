const request = require("@imooc-cli-dev-erica/request")

module.exports = function () {
	return request({
		url:  '/project/template'
	})
}