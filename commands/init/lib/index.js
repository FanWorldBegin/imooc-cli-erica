'use strict';


const Command = require('@imooc-cli-dev-erica/command');
const log = require("@imooc-cli-dev-erica/log")

class InitCommand extends Command{
    constructor(argv) {
      super(argv)  // 传入参数
    }


    init() {
      this.projectName = this._argv[0] || ''; // init 命令后的值
      this.force = !!this._cmd.force;
      log.verbose
    }
}


function init(argv) {
   // console.log('command', command.parent._optionValues.targetPath)
    //imooc-cli-dev init name --targetPath /xxx (command.parent._optionValues.targetPath)
    // process.env.CLI_TAREGT_PATH 环境变量
    //console.log('init', projectName, options, command.parent._optionValues.targetPath,  process.env.CLI_TAREGT_PATH);

    return new InitCommand(argv); // 执行Command 中Constructor
}

module.exports = init
module.exports.InitCommand = InitCommand;