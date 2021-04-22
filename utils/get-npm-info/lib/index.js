'use strict';

const axios = require('axios');
const urlJoin = require('url-join');
const semver = require('semver');

/**
 * 
 * @param {包名} npmName 
 * @param {npm官方名} registry 
 */
function getNpmInfo(npmName, registry) {
    if(!npmName) {
        return null
    }
    const registryNew = registry || getDefaultRegistry(true);
    const npmInfoUrl = urlJoin(registryNew, npmName);
    // console.log(npmInfoUrl) // https://registry.npmjs.org/@imooc-cli-dev-erica/core
    return axios.get(npmInfoUrl).then(response => {
        if(response.status == 200) {
            return response.data

        } else {
            return null;
        }
    }).catch(err => {
        return Promise.reject(err)
    })
}

/**
 * 获取默认的registry 淘宝源或者原生的
 */
function getDefaultRegistry(isOrginal = false) {
    return isOrginal ? 'https://registry.npmjs.org/': 'https://registry.npm.taobao.org/'

}

/**
 * 获取包的版本号
 * @param {*} npmName 
 * @param {*} registry 没有的话会使用默认的
 */
async function getNpmVersions(npmName, registry) {
    const data = await getNpmInfo(npmName, registry);
    if(data) {
        return Object.keys(data.versions);
    } else {
        return []
    }

}

/**
 * 获取满足条件的版本号数组（大于基础版本号）
 */

function getNpmSemverVersions(baseVersion, versions) {
    var versionNew = versions.filter(version => {
        return semver.satisfies(version, `>${baseVersion}`)
    })
    return versionNew;

}



/**
 * 
 * @param {基础版本号} baseVersion 
 * @param {npm 包名} npmName 
 * @param {仓库地址} registry 
 */
async function getNpmSemverVersion(baseVersion, npmName, registry,) {

    const versions = await getNpmVersions(npmName, registry);
    const newVersions = getNpmSemverVersions(baseVersion, versions);
    if(newVersions && newVersions.length > 0) {
        return semverSort(newVersions, baseVersion); 
    }
}

/**
 * 排序获取最新version
 * @param {*} versionArray 
 * @param {*} baseVersion 
 */
function semverSort(versionArray, baseVersion) {
    let lastVersion = baseVersion;
    versionArray.map(value => {
        //比较大小 gt(v1, v2): v1 > v2
        if(semver.gt(value, lastVersion)) {
            lastVersion = value;
        }
    })
    return lastVersion
}

async function getNpmLatestVersion(npmName, registry) {
    const versions = await getNpmVersions(npmName, registry);
    if(versions) {
        return semverSort(versions, '1.0.0');
    }

    return null;
}


module.exports = {
    getNpmInfo,
    getNpmVersions,
    getNpmSemverVersion,
    getDefaultRegistry,
    getNpmLatestVersion

};