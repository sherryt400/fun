'use strict';

const path = require('path');
const fs = require('fs');
const tempDir = require('temp-dir');

const proxyquire = require('proxyquire');
const { init, install } = proxyquire('../../lib/commands/install', {
  inquirer: {
    prompt: async () => Promise.resolve({ runtime: 'python2.7' })
  }
});

const chai = require('chai');
const expect = chai.expect;
chai.use(require('chai-fs'));

describe('install', async () => {
  const funTempDir = path.join(tempDir, 'funtemp');
  const ymlPath = path.join(funTempDir, 'fun.yml');

  var prevCWD;
  beforeEach(() => {
    prevCWD = process.cwd();
  });
  afterEach(() => {
    process.chdir(prevCWD);
    fs.unlinkSync(ymlPath);
  });

  it('init', async () => {
    process.chdir(funTempDir);
    await init();

    expect(ymlPath).to.be.a.file().with.content('runtime: python2.7\nmodules: []\ntasks: []\n');
  });

  it('install_save', async function () {
    this.timeout(20000);

    process.chdir(funTempDir);

    await install(['pymssql'], {
      runtime: 'python2.7',
      packageType: 'pip',
      codeUri: process.cwd(),
      save: true
    });

    expect(ymlPath).to.be.a.file().with.content(`runtime: python2.7
modules: []
tasks:
  - pip: pymssql
    local: true
`);
    
    await install(['libzbar0'], {
      runtime: 'python2.7',
      packageType: 'apt',
      codeUri: process.cwd(),
      save: true
    });

    expect(ymlPath).to.be.a.file().with.content(`runtime: python2.7
modules: []
tasks:
  - pip: pymssql
    local: true
  - apt: libzbar0
    local: true
`);
  });
});