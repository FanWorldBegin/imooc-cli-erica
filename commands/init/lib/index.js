'use strict';


const Command = require('@imooc-cli-dev-erica/command');
const log = require("@imooc-cli-dev-erica/log");
const Package = require("@imooc-cli-dev-erica/Package");
const fs = require('fs');
const fes = require('fs-extra')
const path = require('path');
const inquirer = require("inquirer")
const semver = require('semver')
const userHome = require('user-home');
const { spinnerStart } = require('@imooc-cli-dev-erica/utils')
const TYPE_PROJECT = 'project';
const TYPE_COMPONENT = 'component';

const getProjectTemplate = require('./getProjectTemplate')
class InitCommand extends Command{
    constructor(argv) {
      super(argv)  // 传入参数
    }


    init() {
      this.projectName = this._argv[0] || ''; // init 命令后的值
      this.force = !!this._cmd.force;
    }

    async exec() {
      // 1.准备阶段 
      try {
        const projectInfo = await this.prepare();
        if(projectInfo) {
          log.verbose('projectInfo', projectInfo);
          this.projectInfo = projectInfo;
          //2.下载模板 3.安装模板
          await this.downloadTemplate();
        }
      } catch(e) {
        log.error(e.message);
      }

    }

    async prepare() {
      // 判断项目模板是否存在
      const template = await getProjectTemplate();
      if(!template || template.length === 0) {
        throw new Error("项目不存在");
      }
      this.template = template; // 作为实例保存
      const  localPath = process.cwd(); //当前文件目录 或者 path.resolve('.')
      // 1. 判断当前目录是否为空 
      if(!this.isDirEmpty(localPath)) {
        //1.1 不为空，询问是否继续创建 -命令行
        var ifContinue = false;
        // 2.是否启动强制更新
          if(!this.force) { //没有--force
            var obj = await inquirer.prompt({
              type: 'confirm',
              name: 'ifContinue',
              default: false,
              message: '当前文件夹不为空，是否继续创建项目？'
            });
            ifContinue =obj.ifContinue;

            if(!ifContinue) return;
          }
          console.log('ifContinue', ifContinue)
          if(ifContinue || this.force) {
            //二次确认
            const { confirmDelete } = await inquirer.prompt({
              type: 'confirm',
              name: 'confirmDelete',
              default: false,
              message: '是否确认清空当前目录下文件'
          })
          console.log('confirmDelete',confirmDelete)
          if(confirmDelete) {
            // 清空当前目录
            fes.emptyDirSync(localPath); //清空
          }
        }
      }
      //3.选择创建项目或组建 4.获取项目基本信息返回Object

      return this.getProjectInfo();

    }
    // 通过项目补办API获取项目模板信息
    // 1. 通过egg.js 搭建一套后端系统
    // 2. 通过npm 存储项目模板
    // 3. 将项目模板信息存储到mongodb数据库中
    // 4. 通过egg.js获取mongodb中的数据并且通过API返回
    async downloadTemplate() {
      console.log(' this.projectInfo',  this.projectInfo)
      const { projectTemplate } = this.projectInfo;
      const templateInfo = this.template.find(item => item.npmName === projectTemplate); // 
      // 下载项目
      const targetPath = path.resolve(userHome, 'work/架构师/imooc-cli-dev', 'template'); // 创建缓存目录
      const storeDir = path.resolve(userHome, 'work/架构师/imooc-cli-dev', 'template', 'node_modules');
      const { npmName, version } = templateInfo;
      const templateNpm = new Package({
        targetPath,
        storeDir,
        packageName: npmName,
        packageVersion: version,
      })
      if(! await templateNpm.exists()) {
        const spinner = spinnerStart('正在下载模板');
        // 不存在就安装
        try {
          await templateNpm.install();
          log.success('下载模板成功')
        } catch(e) {
          throw e; // 外层接收
        } finally {
          spinner.stop(true);
        }
      } else {
        await templateNpm.update();
      }
      
    }

    
    // 返回符合inquirer 要求的格式
    createTemplateChoice() {
      return this.template.map(item => (
        {
          value: item.npmName,
          name: item.name
        })
      )
    }

    async getProjectInfo() {
      let projectInfo = {};
    //1.选择创建项目或组件
      const {type} = await inquirer.prompt({
        type:'list',
        name: 'type',
        message: '请选择初始化类型',
        default: TYPE_PROJECT,
        choices: [{
          name: '项目',
          value: TYPE_PROJECT
        }, {
          name: '组件',
          value: TYPE_COMPONENT
        }]
      });

      log.verbose(type, type)
      // 获取项目基本信息
      if(type == TYPE_PROJECT) {
        const project = await inquirer.prompt([
          {
            type: 'input',
            name: 'projectName',
            message: '请输入项目的名称',
            default: '',
            validate: function (v) {
              // 进行校验 1.首字符为英文字符 2.尾字符为应为或数字 3.字符仅允许 - _
              //合法 a， a-b, 不合法 a_ a-
              // 使用分组方法
              // 1. - 后一定要有字符
              // 2. _ 后必须包含字母

              // 错误提示
              const done = this.async();
              // Do async stuff
              setTimeout(function() {
                if (!/^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(v)) {
                  // Pass the return value in the done callback
                  done('请输入合法的项目名称');
                  return;
                }
                // Pass the return value in the done callback
                done(null, true);
              }, 0);

            }
          }, {
            type: 'input',
            name: 'projectVersion',
            message: '请输入项目版本号',
            default: '1.0.0',
            validate: function (v) {

              // 错误提示
              const done = this.async();
              // Do async stuff
              setTimeout(function() {
                if (!(!!semver.valid(v))) {
                  // Pass the return value in the done callback
                  done('请输入合法的版本号');
                  return;
                }
                // Pass the return value in the done callback
                done(null, true);
              }, 0);
            },
            filter: function (v) {
              // 进行校验
              if(!!semver.valid(v)) {
                return semver.valid(v); //格式化版本号
              } else {
                return v; // 当不是合法版本号semver.valid 返回build
              }
            }
          },{
            type: 'list',
            name: 'projectTemplate',
            message: '请选择项目模版',
            choices: this.createTemplateChoice()


          }
        ])

        projectInfo = {
          type,
          ...project
        };

        //console.log('project', project)  //{ projectName: 'aaa', projectVersion: '111' }

      } else if(type == 'component') {
        
      }

      return projectInfo

    }
    isDirEmpty(localPath) {
      let fileList = fs.readdirSync(localPath); // 获取所有的文件
      fileList = fileList.filter(file => (
        // 返回不以.开头 且不为node_modules
        !file.startsWith('.') && ['node_modules'].indexOf(file) < 0 )
      );
      console.log('fileList2', fileList)
      return fileList && fileList.length <=0 ; //返回true false
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