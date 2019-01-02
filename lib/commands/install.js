'use strict';

// const findit = require('findit2');
const inquirer = require('inquirer');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

const { installPackage, installFromYaml } = require('../install/install');
const { FunModule, FunTask } = require('../install/module');


async function installAll(recursive) {
  const cd = process.cwd();
  const ymlPath = path.join(cd, 'fun.yml');

  if (!recursive) {
    if (fs.existsSync(ymlPath)) {
      installFromYaml(ymlPath);
    } else {
      console.error("Can't find 'fun.yml' in current dir.");
      return;
    }
  } else {
    //TODO
    console.error('unsupport now.');
    return;
    // const finder = findit(cd, { followSymlinks: 'true' });

    // finder.on('directory', function (dir, stat, stop, linkPath) {

    // });
  }

}

async function install(packages, options) {
  const runtime = getRuntime(options);
  const pkgType = options.packageType;

  for (const pkg of packages) {
    await installPackage(runtime, pkgType, pkg, options);
  }

  if (options.save) {
    const ymlPath = path.join(options.codeUri, 'fun.yml');
    var funModule;
    if (fs.existsSync(ymlPath)) {
      funModule = FunModule.load(ymlPath);
    } else {
      funModule = new FunModule(runtime);
    }

    for (const pkg of packages) {
      switch (pkgType) {
        case 'pip':
          funModule.addTask(new FunTask('pip', {
            pip: pkg,
            local: true
          }));
          break;
        case 'apt':
          funModule.addTask(new FunTask('apt', {
            apt: pkg,
            local: true
          }))
        default:
          console.error('unknow task %s => %s', pkgType, pkg);
      }
    }

    FunModule.store(ymlPath, funModule);
  }
}

function getRuntime(options) {
  if (options.runtime) {
    return options.runtime;
  }

  if (fs.existsSync('./fun.yml')) {
    const funModule = FunModule.load('./fun.yml');
    if (funModule.runtime) {
      return funModule.runtime;
    } else {
      throw new Error("fun.yml missing 'runtime' properties.")
    }
  } else {
    throw new Error("'runtime' is missing, you can specify it by --runtime options or create a fun.yml with 'runtime' properties.")
  }

}

async function init() {
  const answers = await inquirer.prompt([{
    type: 'list',
    message: 'Select runtime',
    name: 'runtime',
    choices: ['python2.7', 'python3', 'nodejs6', 'nodejs8', 'java8', 'php7.2']
  }]);

  const funModule = new FunModule(answers.runtime);

  FunModule.store("./fun.yml", funModule);
}

module.exports = {
  install,
  installAll,
  init,
};