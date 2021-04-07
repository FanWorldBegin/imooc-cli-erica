'use strict';

module.exports = core;
const path = require('path');
const semver = require('semver');
const colors = require('colors/safe');
const userHome = require('user-home'); // 返回用户主目录路径
const pathExists = require('path-exists').sync; //判断文件是否存在

// require 支持加载 .js/.json/.node文件
// 加载.js 文件，必须输出一个module.export
// .json 文件 会使用 json.parse 对文件进行解析并且输出对象
// .node 文件是c++插件，通过 process.dlopen 打开一个c++插件
// 其他文件默认使用.js 文件解析
const pkg = require('../package.json')
const log = require('@imooc-cli-dev-erica/log');
const constant = require('./const');
let args;
async function core() {
    // 拦截报错信息
    try {
        checkPkgVersion();
        checkNodeVersion();
        checkRoot();
        checkUserHome();
        checkInputArgs();
        checkEnv();
        checkClobalUpdate();
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
    console.log('currentVersion', currentVersion)
    // 第二步，比对最低版本号 gte(v1, v2): v1 >= v2
    const lowestVersion = constant.LOWEST_NODE_VERSION;
    if(!semver.gte(currentVersion, lowestVersion)) {  // semver对比版本号
        throw new Error(colors.red(`imooc-cli-dev-erica 需要安装v${lowestVersion}以上版本的node.js`));
    }

}

/**
 * 检查是否为root账号启动并降级
 */

 function checkRoot() {
    const rootCheck = require('root-check');
    rootCheck(); // 进行权限降级
    console.log(process.geteuid()); // 非管理员打印501 sudo 管理员打印0
 }

/**
 * 用户目录检查功能
 */
function checkUserHome() {
    console.log(userHome) // /Users/wangyu
    if(!userHome || !pathExists(userHome)) {
        throw new Error(colors.red('当前登陆用户主目录不存在！'));  // 没有主目录不能继续
    }
}
/**
 * 检查参数
 */
function checkInputArgs() {

    const minimist = require('minimist');
    args = minimist(process.argv.slice(2));
    console.log(args)  // { _: [], debug: true }
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
        // 默认配置，用户没有在.env 文件配置
        cliConfig['cliHome'] = path.join(userHome, constant.DEFAULT_CLI_HOME)
    }
    // 设置全局的环境变量
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
const file = require('./file.txt');
file()