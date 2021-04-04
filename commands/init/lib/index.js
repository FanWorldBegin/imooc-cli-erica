'use strict';

module.exports = init;

/**
 * 
 * @param {*} projectName 
 * @param {*} option 
 * @param {*} command 
 */
function init(projectName, options, command) {

    //imooc-cli-dev init name --targetPath /xxx (command.parent._optionValues.targetPath)
    // process.env.CLI_TAREGT_PATH 环境变量
    //console.log('init', projectName, options, command.parent._optionValues.targetPath,  process.env.CLI_TAREGT_PATH);
}
