'use strict';

const path = require('path')
module.exports = formatPath;

function formatPath(p) {
    var sep = '';
    if(p && typeof p === 'string') {
        sep = path.sep; //分隔符 mac返回 => / windows返回 => \
    }
    if(sep === '/') {
        return p;
    } else {
        return p.replace(/\\/g, '/'); //替换文件路径
    }
}
