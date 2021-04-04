'use strict';

module.exports = core;
const path = require('path');
const semver = require('semver');
const colors = require('colors/safe');
const userHome = require('user-home');
const pathExists = require('path-exists').sync;
const commander = require('commander');
// require 支持加载 .js/.json/.node文件
// 加载.js 文件，必须输出一个module.export
// .json 文件 会使用 json.parse 对文件进行解析并且输出对象
// .node 文件是c++插件，通过 process.dlopen 打开一个c++插件
// 其他文件默认使用.js 文件解析
const pkg = require('../package.json')
const log = require('@imooc-cli-dev-erica/log');
const init = require('@imooc-cli-dev-erica/init');
const exec = require('@imooc-cli-dev-erica/exec');
const constant = require('./const');
let args;
//  默认js解析
// const file = require('./file.txt');
// file()

const program = new commander.Command(); //实例化脚手架对象
async function core() {
    // 拦截报错信息
    try {
        await prepare(); // 准备阶段
        registerCommand();
    } catch(e) {
        log.error(e.message);
    }
}
/**
 * 获取项目版本号
 */
function checkPkgVersion() {
  
    log.success('test', 'success...');
    log.notice('cli', pkg.version);

}

/**
 * 检查node版本号
 */
function checkNodeVersion() {
    // 第一步，获取当前node版本号
   const currentVersion = process.version;
    //console.log('currentVersion', currentVersion)
    // 第二步，比对最低版本号 gte(v1, v2): v1 >= v2
    const lowestVersion = constant.LOWEST_NODE_VERSION;
    if(!semver.gte(currentVersion, lowestVersion)) {
        throw new Error(colors.red(`imooc-cli-dev-erica 需要安装v${lowestVersion}以上版本的node.js`));
    }

}

/**
 * 检查是否为root账号启动并降级
 */

 function checkRoot() {
    const rootCheck = require('root-check');
    rootCheck(); // 进行权限降级
    //console.log(process.geteuid()); // 非管理员打印501 sudo 管理员打印0
 }

/**
 * 用户目录检查功能
 */
function checkUserHome() {
    //console.log(userHome) // /Users/wangyu
    if(!userHome || !pathExists(userHome)) {
        throw new Error(colors.red('当前登陆用户主目录不存在！'));
    }
}
/**
 * 检查参数（可以删除了）
 */
function checkInputArgs() {

    const minimist = require('minimist');  
    args = minimist(process.argv.slice(2));
    //console.log(args)  // { _: [], debug: true }
    checkArgs()
    log.verbose('debug模式', 'test debug log')
}

/**
 * 检查是否传入 debug 在require log 之前  设置 
 * process.env.LOG_LEVEL /设置log.level
 */
function checkArgs() {
    if(args.debug) {
        process.env.LOG_LEVEL = 'verbose';
    } else {
        process.env.LOG_LEVEL = 'info';
    }
    log.level = process.LOG_LEVEL;
}

/**
 * 检查环境变量
 */
function checkEnv() {
    const dotenv = require('dotenv');
    // 读取用户主目录下，.env文件
    const dotenvPath = path.resolve(userHome, '.env');
    // 主目录下.env路径存在
    if(pathExists(dotenvPath)) {
        config = dotenv.config({
            path: dotenvPath
        });
    }
    createDefaultConfig();
    log.verbose('环境变量', process.env.CLI_HOME_PATH)
}

/**
 * cli默认环境变量创建
 */

function createDefaultConfig() {
    const cliConfig = {
        home: userHome
    }
    if(process.env.CLI_HOME) {
        cliConfig['cliHome'] = path.join(userHome, process.env.CLI_HOME)
    } else {
        cliConfig['cliHome'] = path.join(userHome, constant.DEFAULT_CLI_HOME)
    }
    process.env.CLI_HOME_PATH = cliConfig.cliHome;
}

 /**
  * 检查是否需要进行更新
  */
async function checkClobalUpdate() {
    // 1.获取当前版本号和模块名
    const currentVersion = pkg.version;
    const npmName = pkg.name;
    // 2.调用npm api 获取所有版本号,拿到所有版本信息
    const { getNpmSemverVersion } = require('@imooc-cli-dev-erica/get-npm-info');
    const latestVersion = await getNpmSemverVersion(currentVersion, npmName);
    if(latestVersion && semver.gt(latestVersion, currentVersion)) {
        log.warn(colors.yellow(`请手动更新${npmName}, 当前版本为${currentVersion}, 最新版本${latestVersion}
        更新命令： npm install -g ${npmName}`));
    }
    //http://registry.npmjs.org/@imooc-cli-dev-erica/core 
    // 3.提取版本号，比对哪些版本号大于当前版本号
    // 4.获取最新版本号，提示用户更新
}
/**
 * 命令注册 imooc-cli-dev -h
 * name: 脚手架名称(imooc-cli-dev)
 * name usage通过这两个选项可以修改帮助信息的首行提示，name 属性也可以从参数中推导出来
 */

function registerCommand() {
    //1.注册版本号
    program
    .name(Object.keys(pkg.bin)[0]) //设置名字imooc-cli-dev
    .usage('<command> [options')
    .version(pkg.version)
    .option('-d, --debug', '是否开启调试模式', false) // debug属性注册 default:false
    .option('-tp,  --targetPath <targetPath>', '是否指定本地调试文件路径', ''); // 默认为空


    // 监听 option debug  事件 imooc-cli-dev --debug / imooc-cli-dev -d
    program.on('option:debug', function() {
        if(program.debug) {
            process.env.LOG_LEVEL = 'verbose' //可以使用log.verbos打印
        } else {
            process.env.LOG_LEVEL = 'info'
        }   
        log.level = process.env.LOG_LEVEL; // 修改lo实例中
        log.verbose('test')
    });

    //  指定全局targetPath -- 业务逻辑之前监听
    program.on('option:targetPath', function () {
        //imooc-cli-dev init name --targetPath /xxx
        console.log('program.targetPath', program._optionValues.targetPath);
        // 设置环境变量
        process.env.CLI_TAREGT_PATH = program._optionValues.targetPath;
        
    });

    // 未知命令监听, 没有命中则进入下面逻辑 imooc-cli-dev test
    program.on('command:*', function(obj) {
        // program.commands注册的所有命令
        const availableCommands = program.commands.map(cmd => cmd.name());
        console.log(colors.red('未知命令：' + obj[0]));
        if(availableCommands.length > 0) {
            console.log(colors.red('可用命令：' + availableCommands.join(',')));
        }
    })

    // 命令注册 - init 初始化项目 [init后输入的项目名称] mooc-cli-dev init ex
    program
        .command('init [projectName]')
        .option('-f, --force', '是否强制初始化') // 当前目录不为空时候
        .action(exec)
  


  
    program.parse(process.argv); //参数解析 process.argv 命令数组(放在最后)

    //没有命令输出 node imooc-cli-dev  process.argv.length  ==2
    if(process.args && process.args.length < 1) {
        program.outputHelp(); //打印帮助文档

    }


}

/**
 * 初始化
 */
async function  prepare() {
    checkPkgVersion();
    checkNodeVersion();
    checkRoot();
    checkUserHome();
    //checkInputArgs(); //commander解析就不需要这个了
    checkEnv();
    checkClobalUpdate();
    
}