'use strict';

module.exports = init;

function init(projectName, cmdObj) {
    // imooc-cli-dev init ex --force  ==> init ex { force: true }
    console.log('init', projectName, cmdObj);
}
