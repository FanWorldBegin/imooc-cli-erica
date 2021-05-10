



module.exports = exec;


const cp = require('child_process')
const path = require('path');
const Package = require("@imooc-cli-dev-erica/Package")
const log = require("@imooc-cli-dev-erica/log")


// 获取本地代码
// 1.根据targetPath 拿到 modulePath
// 2.将modulePath生成一个模块(package)
// 3. package.getRootFile(获取入口文件) 封装 =》 复用
// 4.当init不在本地而是下载来来的，则需要初始化init  package.update /package.install


//对应字典
const SETTINGS = {
    init: '@imooc-cli-dev-erica/utils', //将命令信息和包名结合
}

const CACHE_DIR= 'dependencies'

var pkg = {};
async function exec() {
    let targetPath = process.env.CLI_TAREGT_PATH;
    const homePath = process.env.CLI_HOME_PATH
    var storeDir = '';
    //debuge 模式打印
    log.verbose('targetPath', targetPath);
    log.verbose('targetPath', homePath);

    // 获取包名
    const cmdObj = arguments[arguments.length - 1]; //获取传入的参数对象
    const cmdName = cmdObj.name();
    const packageName = SETTINGS[cmdName]; //从映射表中获取包名
    const packageVersion = 'latest'; // 最新版
    // targetPath 不存在的时候
    if(!targetPath) {
        //生成缓存路径
        targetPath = path.resolve(homePath, CACHE_DIR); // 生成缓存路径
        storeDir = path.resolve(targetPath, 'node_modules');
        // --debug
        log.verbose('targetPath', targetPath);
        log.verbose('storeDir', storeDir);


        pkg = new Package({
            targetPath, 
            packageName, 
            packageVersion,
            storeDir
        });

        if(await pkg.exists()) {
           // pacakge 存在 更新package
           pkg.update();

        } else {
            // 安装pacakge
            console.log('安装package')
            await pkg.install()
        }
    } else {
        // 调用
        pkg = new Package({
            targetPath, 
            packageName, 
            packageVersion,
        });
        
    }

    const rootFile = pkg.getRootFilePath();
    // 传入targetPath 执行引入相应的包
    // > 运行命令imooc-cli-dev init --targetPath /Users/wangyu/work/架构师/2.lerna/imooc-cli-dev/commands/init
    console.log('rootFile',rootFile)
    if(rootFile) {
        try {
            //在node 子进程调用
            const args = Array.from(arguments)
            const cmd = args[args.length -1];
            const o = Object.create(null);
            Object.keys(cmd).forEach(key => {
                // startsWith 以_开头的都是内置属性
                if(cmd.hasOwnProperty(key) && !key.startsWith('_') && key !== 'parent') { 
                    o[key] = cmd[key];
                }
            })
            args[args.length -1] = o;
            const code =  `require('${rootFile}').call(null, ${JSON.stringify(args)})`;

            const child = spawn('node', ['-e', code], { // 执行代码
                cwd: process.cwd(),
                stdio: 'inherit', //父进程也会打印
            });

            child.on('error', e => {
                log.error(e.message);
                process.exit(1)
            })
            child.on('exit', e => {
                log.verbose('命令执行成功' + e);
                process.exit(e)
            })

        } catch (e) {
            log.error(e.message);
        }


    }

}

// windows 兼容
// cp.spawn('cmd', ['/c', 'node', '-e', code]) windows 下执行
function spawn(command, args, options) {
    const win32 =  process.platform === 'win32'; // 判断是否为windows
    const cmd = win32 ? 'cmd' :command; // windows中需要cmd执行
    const cmdArgs = win32 ? ['/c'].concat(command, args) : args; // windows下拼接/c

    return cp.spawn(cmd, cmdArgs, options || {});

}
// if(rootFile) {
//     try {
//     在当前进程中调用
//         // Array.from  将类数组转化为数组 
//         require(rootFile).call(null, Array.from(arguments)) //  执行  targetPath 传入地址的包
//         // arguments 是数组 apply(this, 数组参数将arguments转为参数)
//     } catch (e) {
//         log.error(e.message);
//     }


// }

