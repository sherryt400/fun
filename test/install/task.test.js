'use strict';

const {PipTask, AptTask, ShellTask} = require('../../lib/install/task');
const Context = require('../../lib/install/context');
// const { startInstallationContainer } = require('../../lib/docker');
const tempDir = require('temp-dir');
const fs = require('fs'), path = require('path');
const mkdirp = require('mkdirp-promise');
const util = require('util');
const rimraf = util.promisify(require('rimraf'));
const chai = require('chai');
const expect = chai.expect;
chai.use(require('chai-fs'));


describe('task', async ()=> {
  var funTempDir;

  beforeEach(async () => {
    funTempDir = path.join(tempDir, 'funtemp');
    await mkdirp(funTempDir);
  });

  afterEach(async () => {
    await rimraf(funTempDir + '/{*,.*}');
  });

  it('pip_local', async function () {
    this.timeout(10000);
    const installedDir = path.join(funTempDir, '.fun/python/lib/python2.7/site-packages/');

    expect(funTempDir).to.be.a.directory().and.empty;
        
    const pipTask = new PipTask('install pymssql', 'python2.7', funTempDir, 'pymssql', true);
    await pipTask.run();

    expect(installedDir).to.be.a.directory().with.files(['pymssql.so', '_mssql.so']);
    expect(installedDir).to.be.a.directory().with.subDirs(['.libs_mssql', '.libspymssql', 'pymssql-2.1.4.dist-info']);

  });

  it('pip_gloabl', async function () {
    this.timeout(10000);
    const context = await new Context('python2.7', funTempDir);
    const pipTask = new PipTask('install pymssql', 'python2.7', funTempDir, 'pymssql', false, context);
    await pipTask.run();

    await context.teardown();
  });

  it('apt_local', async function () {
    this.timeout(10000);

    const aptTask = new AptTask('install libsybdb5', 'python3', funTempDir, 'libsybdb5', true);
    await aptTask.run();

    const installedDir = path.join(funTempDir, '.fun/root/usr/lib/x86_64-linux-gnu/');

    expect(installedDir).to.be.a.directory().with.files(['libsybdb.so.5', 'libsybdb.so.5.0.0']);

    // fs.readdirSync(path.join(funTempDir, '.fun')).forEach(file => {
    //   console.log(file);
    // });

  });

  it('apt_global', async function () {
    this.timeout(10000);

    const context = await new Context('python3', funTempDir);

    const aptTask = new AptTask('install libsybdb5', 'python3', funTempDir, 'libsybdb5', false, context);
    await aptTask.run();

    await context.teardown();

  });

  it('shell', async function() {
    this.timeout(10000);

    const context = await new Context('python3', funTempDir);

    const shellTask = new ShellTask(undefined, 'python3', funTempDir, "echo 'aa' > 1.txt", context);

    await shellTask.run();

    expect(path.join(funTempDir, '1.txt')).to.be.a.file().with.content('aa\n');

    await context.teardown();

  })
});