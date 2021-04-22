
const semver = require('semver');
const colors = require('colors/safe');

const log = require("@imooc-cli-dev-erica/log")

// 最低版本node
const LOWEST_NODE_VERSION = "12.0.0";

class Command {
    constructor(argv) {
        console.log('command-constructor')
        this._argv = argv;
        if(!argv) {
            throw new Error("参数不能为空");
        }
        if(!Array.isArray(argv)) {
            throw new Error("必须为数组");
        }
        if(argv.length < 1) {
            throw new Error("参数列表")
        }
        let runner = new Promise((resolve, reject) => {
            let chain = Promise.resolve(); // promise兑现
            chain = chain.then(() => 
                //1.检查弄的版本
                this.checkNodeVersion()
            );
            // 参数操作
            chain = chain.then(() => this.initArgs())
            chain = chain.then(() => this.init());
            chain = chain.then(() => this.exec());
            // 捕获错误
            chain.catch(err => {
                log.error(err.message);
            })
        })
    }
    //参数初始化
    initArgs() {
        // 取最后一个
        this._cmd = this._argv[this._argv.length - 1];
        // 其他参数
        this._argv = this._argv.slice(0, this._argv.length - 1);


    }

    /**
     * 检查node版本号
     */
    checkNodeVersion() {
        // 第一步，获取当前node版本号
        const currentVersion = process.version;
        //console.log('currentVersion', currentVersion)
        // 第二步，比对最低版本号 gte(v1, v2): v1 >= v2
        const lowestVersion = LOWEST_NODE_VERSION;
        if(!semver.gte(currentVersion, lowestVersion)) {  // semver对比版本号
            throw new Error(colors.red(`imooc-cli-dev-erica 需要安装v${lowestVersion}以上版本的node.js`));
        }

    }
    init() {
        throw new Error("init 必须实现")
    }
    // 执行阶段
    exec() {
        throw new Error("exec 必须实现")
    }
}


module.exports = Command;