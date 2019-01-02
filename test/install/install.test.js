'use strict';

const path = require('path'), 
  util = require('util'),
  fs = require('fs');


const { installPackage, installFromYaml } = require('../../lib/install/install');
const tempDir = require('temp-dir');
const mkdirp = require('mkdirp-promise');
const rimraf = util.promisify(require('rimraf'));

const chai = require('chai');
const expect = chai.expect;
chai.use(require('chai-fs'));

describe('install', () => {

  const funTempDir = path.join(tempDir, 'funtemp');
  const ymlPath = path.join(funTempDir, 'fun.yml');

  beforeEach(async () => {
    console.log('tempDir: %s', funTempDir);
    await mkdirp(funTempDir);
  });

  afterEach(async () => {
    await rimraf(funTempDir + '/{*,.*}');
  });

  it('install_apt', async function () {
    this.timeout(20000);
    await installPackage('python2.7', 'apt', 'libzbar0', {
      packageType: 'apt',
      codeUri: funTempDir,
      local: true
    });

    expect(path.join(funTempDir, '.fun/root/usr/lib/x86_64-linux-gnu/libzbar.so.0')).to.be.a.path();

  });

  it('install_pip', async function () {
    this.timeout(20000);
    await installPackage('python2.7', 'pip', 'pymssql', {
      packageType: 'pip',
      codeUri: funTempDir,
      local: true
    });

    expect(path.join(funTempDir, '.fun/python/lib/python2.7/site-packages/pymssql.so')).to.be.a.path();

  });

  it('install_from_yaml', async function () {
    this.timeout(20000);
    fs.writeFileSync(ymlPath, `
runtime: python2.7
tasks:
  - name: install pymssql localy by pip
    pip: pymssql
    local: true
  - name: install libzbar-dev localy by apt-get
    apt: libzbar-dev
    local: true 
  - shell: echo '111' > 1.txt
`);

    await installFromYaml(ymlPath);

  });


});