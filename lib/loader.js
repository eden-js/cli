const Path = require('path');
const fs   = require('fs-extra');
const glob = require('@edenjs/glob');

exports.getImportLocations = function getImportLocations(modules) {
  // set file paths
  const filePaths = [];

  // Eden and app locations
  filePaths.push(global.edenRoot);
  filePaths.push(global.appRoot);

  // Core edenjs modules
  filePaths.push(`${global.edenRoot}/node_modules`);
  // App modules
  filePaths.push(`${global.appRoot}/node_modules`);

  // loop locations
  for (const location of glob.sync(exports.getLocations(modules, 'bundles'))) {
    // set location
    let base = location.split('/bundles/');
    base = base.slice(0, -1);
    base = base.join('/bundles/');

    // locations
    if (!location.includes('bundles')) base = location;

    // check if app root
    if (base === global.appRoot) continue;

    // add file paths
    filePaths.push(...[
      ...glob.sync(Path.join(base, 'bundles/*/')),
      Path.join(base, 'aliases'),
      Path.join(base, 'bundles'),
    ]);
  }

  // App bundles and data
  filePaths.push(`${global.appRoot}/bundles`);
  filePaths.push(`${global.appRoot}/data`);

  // Core eden files
  filePaths.push(`${global.edenRoot}/lib/aliases`);
  filePaths.push(`${global.edenRoot}/lib/core`);

  // push node_modules
  for (const path of modules) {
    filePaths.push(Path.join(path, 'node_modules'));
    filePaths.push(Path.resolve(path));
  }

  // reverse
  return filePaths.reverse().reduce((accum, item) => {
    // includes
    if (!accum.includes(item)) accum.push(item);

    // return accumulator
    return accum;
  }, []);
};

exports.getLocations = function getLocations(modules, type) {
  let appendage = null;

  if (type === 'bundle') {
    appendage = 'bundles/*/';
  } else if (type === 'bundles') {
    appendage = 'bundles/*/';
  } else {
    throw new Error('invalid location type');
  }

  // Get config
  const locals = [].concat(...(modules.map((p) => {
    // Get paths
    const fullP = Path.resolve(p);

    // Return path
    return [
      `${fullP}/node_modules/*/${appendage}`,
      `${fullP}/node_modules/*/*/${appendage}`,

      `${fullP}/${appendage}`,
    ];
  })));

  const filePaths = [];

  if (type === 'bundle') filePaths.push(`${global.edenRoot}/core/`);

  if (fs.existsSync(`${global.appRoot}/node_modules`)) {
    filePaths.push(...[
      `${global.appRoot}/node_modules/*/${appendage}`,
      `${global.appRoot}/node_modules/*/*/${appendage}`,
    ]);
  }

  filePaths.push(...locals);

  if (fs.existsSync(`${global.appRoot}/bundles`)) {
    if (type !== 'none') filePaths.push(`${global.appRoot}/${appendage}`);

    // Legacy format
    if (fs.existsSync(`${global.appRoot}/bundles/node_modules`)) {
      filePaths.push(...[
        `${global.appRoot}/bundles/node_modules/*/${appendage}`,
        `${global.appRoot}/bundles/node_modules/*/*/${appendage}`,
      ]);
    }
  }

  return filePaths;
};

// Combine file(s) with locations and reverse deduplicate
exports.getFiles = function getFiles(files, locations = null) {
  // Ensure files is an array
  const filesArr = !Array.isArray(files) ? [files] : files;

  let filtered = [];

  if (locations !== null) {
    // Combine locations with the searched files
    locations.forEach((loc) => {
      filesArr.forEach((file) => {
        filtered.push(Path.join(loc, file));
      });
    });
  } else {
    filtered = files;
  }

  // Return reverse-deduplicated files
  filtered = filtered.reduceRight((accum, loc) => {
    if (!accum.includes(loc)) accum.unshift(loc);
    return accum;
  }, []);

  return filtered;
};
