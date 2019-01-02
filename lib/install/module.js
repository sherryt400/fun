'use strict';

const yaml = require('js-yaml');
const fs = require('fs');

class FunModule {
    constructor(runtime) {
        this.runtime = runtime;
        this.tasks = [];
        this.modules = [];
    }

    addTask(task) {
        this.tasks.push(task);
    }

    addModule(moduleName) {
        this.modules.push(moduleName);
    }

    static load(file) {
        var doc = yaml.safeLoad(fs.readFileSync(file, 'utf8'));
        if(!doc.runtime){
            throw new Error('fun.yml must be have a runtime.');
        }
        const funModule = new FunModule(doc.runtime);
        
        if(doc.modules){
            if(!Array.isArray(doc.modules)){
                throw new Error('modules must be a array.');
            }
            doc.modules.forEach((m) => {
                funModule.addModule(m);
            });           
        }

        if(doc.tasks){
            if(!Array.isArray(doc.tasks)){
                throw new Error('tasks must be a array.');
            }
            doc.tasks.forEach((t) => {
                if (t instanceof Object){
                    funModule.addTask(FunTask.parse(t));
                } else {
                    throw new Error('task must be a object.');
                }
            });
        }
        return funModule;
    }

    static store(file, funModule){
        const doc = {
            runtime: funModule.runtime
        }
        if(funModule.modules){
            doc.modules = funModule.modules;
        }

        if(funModule.tasks){
            doc.tasks = [];
            funModule.tasks.forEach((t) => {
                doc.tasks.push(t.attrs);
            });
        }
        fs.writeFileSync(file, yaml.safeDump(doc));
    }
}

class FunTask {

    constructor(type, attrs) {
        this.type = type;
        this.attrs = attrs;
    }

    static parse(attrs) {
        if (attrs.pip) {
            return new FunTask("pip", attrs);
        } else if (attrs.apt) {
            return new FunTask("apt", attrs);
        } else if (attrs.shell) {
            return new FunTask("shell", attrs);
        } else {
            throw new Error('Unknown task.');
        }
    }
}

module.exports = {
    FunModule,
    FunTask
}