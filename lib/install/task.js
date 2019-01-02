'use strict';

const { startInstallationContainer } = require('../docker');

class Task {
  constructor(name, runtime, codeUri, context) {
    this.name = name;
    this.runtime = runtime;
    this.codeUri = codeUri;
    this.context = context || {};
  }

  async run() {
    await this.beforeRun();
    await this.doRun();
    await this.afterRun();
  }

  async beforeRun() {
    if (!this.context.runner) {
      this.runner = await startInstallationContainer({ runtime: this.runtime, codeUri: this.codeUri });
    } else {
      this.runner = this.context.runner;
    }

  }

  async afterRun() {
    if (!this.context.runner) {
      await this.runner.stop();
    }
  }

  async doRun() {
    console.log('Task => %s', this.name);
  }
}

class InstallTask extends Task {

  constructor(name, runtime, codeUri, pkgName, local, context) {
    super(name, runtime, codeUri, context);
    this.pkgName = pkgName;
    this.local = local;
    this.cacheDir = '/code/.fun/tmp/';
  }

  async beforeRun() {
    await super.beforeRun();
    await this.runner.exec(['bash', '-c', `mkdir -p ${this.cacheDir}`]);
  }

  async afterRun() {
    await this.runner.exec(['bash', '-c', `rm -rf ${this.cacheDir}`]);
    await super.afterRun();
  }

}
/**
 * install location: .fun/python/lib/python3.7/site-packages
 */
class PipTask extends InstallTask {
  async doRun() {
    await super.doRun();
    if (this.local){
      const folder = `/code/.fun/python/lib/${this.runtime}/site-packages/`;
      console.log('     => pip install -t %s %s', folder, this.pkgName);
      await this.runner.exec(['pip', 'install', '-t', folder, this.pkgName]);
    } else {
      console.log('     => pip install %s', this.pkgName);
      await this.runner.exec(['pip', 'install', this.pkgName]);
    }
  }
}

class AptTask extends InstallTask {

  async doRun() {
    await super.doRun();
    if (this.local) {
      await this.dlPkg(this.pkgName);
      await this.instDeb();
      await this.cleanup();
    } else {
      console.log('     => apt-get install -y %s', this.pkgName);
      await this.runner.exec(['apt-get', 'install', '-y', this.pkgName]);
    }
  }

  async dlPkg(pkgName) {
    console.log('     => apt-get install -y -d -o=dir::cache=%s %s', this.cacheDir, pkgName);
    await this.runner.exec(['apt-get', 'install', '-y', '-d', `-o=dir::cache=${this.cacheDir}`, pkgName]);
  }

  async instDeb() {
    const instDir = '/code/.fun/root';
    await this.runner.exec(['bash', '-c', `for f in $(ls ${this.cacheDir}/archives/*.deb); do dpkg -x $f ${instDir} ; done;`]);
  }

  async cleanup() {
    await this.runner.exec(['bash', '-c', `rm -rf ${this.cacheDir}/archives`]);
  }
}

class ShellTask extends Task {
  constructor(name, runtime, codeUri, script, context){
    super(name, runtime, codeUri, context);
    this.script = script;
  }

  async doRun(){
    console.log('     => bash -c  \'%s\'', this.script);
    await this.runner.exec(['bash', '-c', this.script]);
  }
}

module.exports = {
  Task, InstallTask, PipTask, AptTask, ShellTask
};