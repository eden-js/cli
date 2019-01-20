const Path = require('path');
const fs   = require('fs-extra');
const glob = require('@edenjs/glob');

exports.getImportLocations = function getImportLocations(modules) {
  const filePaths = [];

  // Eden and app locations
  filePaths.push(global.edenRoot);
  filePaths.push(global.appRoot);

  // Core edenjs modules
  filePaths.push(`${global.edenRoot}/node_modules`);

  // App modules (legacy)
  filePaths.push(`${global.appRoot}/bundles/node_modules`);
  // App modules
  filePaths.push(`${global.appRoot}/node_modules`);

  for (let location of glob.sync(exports.getLocations(modules, 'bundles'))) {
    location = location.slice(0, -'bundles/'.length);

    // Avoid double including global.appRoot (only non-module directory with bundles/)
    if (location.slice(0, -1) === global.appRoot) {
      continue;
    }

    filePaths.push(...[
      ...glob.sync(Path.join(location, 'bundles/*/')),
      Path.join(location, 'aliases'),
      Path.join(location, 'bundles'),
    ]);
  }

  // App bundles and data
  filePaths.push(`${global.appRoot}/bundles`);
  filePaths.push(`${global.appRoot}/data`);

  // Core eden files
  filePaths.push(`${global.edenRoot}/lib/aliases`);
  filePaths.push(`${global.edenRoot}/lib/core`);

  for (const path of modules) {
    filePaths.push(Path.join(path, 'node_modules'));
    filePaths.push(Path.resolve(path));
  }

  return filePaths.reverse();
};

exports.getLocations = function getLocations(modules, type) {
  let appendage = null;

  if (type === 'bundle') {
    appendage = 'bundles/*/';
  } else if (type === 'bundles') {
    appendage = 'bundles/';
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

exports.getFiles = function getFiles(locations, files) {
  // Ensure files is an array
  const filesArr = !Array.isArray(files) ? [files] : files;

  let filtered = [];

  // Combine locations with the searched files
  locations.forEach((loc) => {
    filesArr.forEach((file) => {
      filtered.push(Path.join(loc, file));
    });
  });

  // Return reverse-deduplicated files
  filtered = filtered.reduceRight((accum, loc) => {
    if (!accum.includes(loc)) accum.unshift(loc);
    return accum;
  }, []);

  return filtered;
};
