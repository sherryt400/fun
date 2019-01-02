'use strict';

const path = require('path'), 
    fs = require('fs'),
    util = require('util');

const tempDir = require('temp-dir');
const {FunModule, FunTask} = require('../../lib/install/module');
const mkdirp = require('mkdirp-promise');
const rimraf = util.promisify(require('rimraf'));
const chai = require('chai');
const expect = chai.expect;
chai.use(require('chai-fs'));

describe('module', async ()=> {
    const funTempDir = path.join(tempDir, 'funtemp');
    const ymlPath = path.join(funTempDir, 'fun.yml');

    beforeEach(async () => {
      console.log("tempDir: %s", funTempDir);
      await mkdirp(funTempDir);
      await rimraf(funTempDir + '/{*,.*}');
    });

    it('create', () => {
        const funModule = new FunModule('python2.7');
        
        FunModule.store(ymlPath, funModule);
        
        expect(ymlPath).to.be.a.file().with.content("runtime: python2.7\nmodules: []\ntasks: []\n");
    });

    it('load', () => {
        fs.writeFileSync(ymlPath, `
runtime: python2.7
modules:
  - test_module1
tasks:
  - name: install pymssql localy by pip
    pip: pymssql
    local: true
    `);
        const funModule = FunModule.load(ymlPath);

        expect(funModule).to.have.property('runtime', 'python2.7');
        expect(funModule).to.have.property('modules').that.to.include.members(['test_module1']);
        expect(funModule).to.have.property('tasks').that.have.lengthOf(1);
        expect(funModule.tasks[0]).to.have.property('type', 'pip');
        expect(funModule.tasks[0]).to.have.property('attrs').that.to.eql({
            name: 'install pymssql localy by pip',
            pip: 'pymssql',
            local: true
        })

    });

    it('store', () => {
        const funModule = new FunModule("python2.7");
        funModule.addModule("test1");
        funModule.addTask(FunTask.parse({
            name: 'install pymssql localy by pip',
            pip: 'pymssql',
            local: true
        }))

        FunModule.store(ymlPath, funModule);

        expect(ymlPath).to.be.a.file().with.content(`runtime: python2.7
modules:
  - test1
tasks:
  - name: install pymssql localy by pip
    pip: pymssql
    local: true
`);
    });

});