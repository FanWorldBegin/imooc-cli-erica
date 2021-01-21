'use strict';

const axios = require('axios');
const urlJoin = require('url-join');
const semver = require('semver');

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
 * 获取默认的registry
 */
function getDefaultRegistry(isOrginal = false) {
    return isOrginal ? 'https://registry.npmjs.org/': 'https://registry.npm.taobao.org/'

}

/**
 * 获取包的版本号
 * @param {*} npmName 
 * @param {*} registry 
 */
async function getNpmVersion(npmName, registry) {
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

async function getNpmSemverVersion(baseVersion, npmName, registry,) {

    const versions = await getNpmVersion(npmName, registry);
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
        //比较大小 v1 > v2
        if(semver.gt(value, lastVersion)) {
            lastVersion = value;
        }
    })
    return lastVersion
}
module.exports = {
    getNpmInfo,
    getNpmVersion,
    getNpmSemverVersion

};