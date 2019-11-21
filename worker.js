// worker data
const vm = require('vm');
const { workerData, parentPort } = require('worker_threads');

// get data
global.data = workerData.data;
global.require = require;

// check require
if (global.data.require) {
  // loop
  for (key in global.data.require) {
    // require
    global[key] = require(global.data.require[key]);
  }
}

// do job
const result = vm.runInThisContext(`(async() => { ${workerData.logic} })()`, {
  timeout : 500000,
});

// post message to parent
result.then((r) => {
  // post message to parent
  parentPort.postMessage({
    done : r,
  });
});
