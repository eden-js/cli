const path = require('path');
const fs   = require('fs-extra');

exports.getLocations = function getLocations(modules, bundles = false) {
  // Get config
  const locals = [].concat(...(modules.map((p) => {
    // Get paths
    const fullP = path.resolve(p);

    // Return path
    return [
      `${fullP}/node_modules/*/${bundles ? 'bundles/*/' : ''}`,
      `${fullP}/node_modules/*/*/${bundles ? 'bundles/*/' : ''}`,

      `${fullP}/${bundles ? 'bundles/*/' : ''}`,
    ];
  })));

  const filePaths = [];

  if (fs.existsSync(`${global.appRoot}/node_modules`)) {
    filePaths.push(...[
      `${global.appRoot}/node_modules/*/${bundles ? 'bundles/*/' : ''}`,
      `${global.appRoot}/node_modules/*/*/${bundles ? 'bundles/*/' : ''}`,
    ]);
  }

  filePaths.push(...locals);

  if (!bundles || fs.existsSync(`${global.appRoot}/bundles`)) {
    filePaths.push(`${global.appRoot}/${bundles ? 'bundles/*/' : ''}`);
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
      filtered.push(loc + file);
    });
  });

  // Return reverse-deduplicated files
  filtered = filtered.reduceRight((accum, loc) => {
    if (!accum.includes(loc)) accum.unshift(loc);
    return accum;
  }, []);

  return filtered;
};
