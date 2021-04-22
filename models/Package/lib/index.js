'use strict';

const path = require('path');
const pkgDir = require('pkg-dir').sync;
const fse = require("fs-extra");
const pathExists = require('path-exists').sync
const {isObject} = require("@imooc-cli-dev-erica/utils")
const formatPath = require("@imooc-cli-dev-erica/format-path")
const npminstall = require('npminstall');
const {getDefaultRegistry, getNpmLatestVersion} = require("@imooc-cli-dev-erica/get-npm-info")

class Package {

    constructor(options) {
        if(!options) {
            throw new Error("package类的options参数不能为空！")
        }
        if(!isObject(options)) {
            throw new Error("package类的options参数必须为对象！")
        }
        // package的目标路径
        this.targetPath = options.targetPath;
        // 缓存package的路径
        this.storeDir = options.storeDir;
        this.packageName = options.packageName; //package.json name
        this.packageVersion = options.packageVersion
        // package的缓存目录前缀 / 转化为 _
        this.cacheFilePathPrefix  = this.packageName.replace('/', '_')
    }
    async prepare() {
        // 缓存路径存在，但路径所指向的文件夹不存在
        if(this.storeDir && !pathExists(this.storeDir)) {
            //mkdirpSync 创建全部目录
            fse.mkdirpSync(this.storeDir);

        }
        if(this.packageVersion == 'latest') {
            this.packageVersion = await getNpmLatestVersion(this.packageName)
        }
        // _@imooc-cli-dev-erica_utils@1.0.4@@imooc-cli-dev-erica/ node_modules下的包名
        // 实际的包名 @imooc-cli-dev-erica/utils
        console.log('this.packageVersion', this.packageVersion)

    }
    // get 修饰调用 catchFilePath时候会动态调用路径
    get catchFilePath() {
        return path.resolve(this.storeDir, `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`)
    }
    // 生成指定的缓存路径
    get getSpecificCacheFilePath() {
        return path.resolve(this.storeDir, `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`)
    }
    // 判断当前package是否存在
    async exists() {
        // 判断是缓存还是使用targetPath
        if(this.storeDir) {
            await this.prepare();
            console.log('this.catchFilePath', this.catchFilePath)
            return pathExists(this.catchFilePath);
           
        } else {
            return pathExists(this.targetPath)
        }
    
    }

    //安装
    async install() {
        // promise对象
        await this.prepare()
        return npminstall({
            root: this.targetPath,
            storeDir: this.storeDir,
            registry: getDefaultRegistry(),
            targetDir: this.targetPath,
            pkgs: [
                {
                    name: this.packageName,
                    version: this.packageVersion
                }
            ]

        }).catch(err => {
            console.error(err);
        });
    }

    //更新
    async update() {
        await this.prepare();
        // 1. 拿到最新的版本号
        const latestPackagrversion = await getNpmLatestVersion(this.packageName)
        // 2. 查询最新版本号对应路径是否存在
        const latestFilePath = this.getSpecificCacheFilePath(latestPackagrversion)
        // 3. 不存在则直接安装最新版本
        if(!pathExists(latestFilePath)) {
            await npminstall({
                root: this.targetPath,
                storeDir: this.storeDir,
                registry: getDefaultRegistry(),
                targetDir: this.targetPath,
                pkgs: [
                    {
                        name: this.packageName,
                        version: latestPackagrversion
                    }
                ]
    
            }).catch(err => {
                console.error(err);
            });
            this.packageVersion = latestPackagrversion
        }

        return latestFilePath;


    }

    //获取传入的项目的入口文件的路径
    getRootFilePath() {

        function _getRootFile(targetPath) {
            // 1. 获取Package.json 所在目录 - pkg-dir 库
            const dir = pkgDir(targetPath) //查找 node.js 项目或者npm包的root 目录
            console.log('targetPath', targetPath)
            console.log('dir', dir)
            if(!dir) return null
            // 2. 读取 Package.json - require
            const pkgFile = require(path.resolve(dir, 'package.json'))
            // 3. 寻找main
            if(pkgFile && pkgFile.main) {
                // 4. 路径兼容（macOS/windows)
                return formatPath(path.resolve(dir, pkgFile.main)); // 入口文件的绝对路径 
            }
        }
        if(this.storeDir) {
            return _getRootFile(this.catchFilePath); 
            
        } else {
            // 缓存不存在
            return _getRootFile(this.targetPath);
        }
        return null;

    }
}


module.exports = Package;