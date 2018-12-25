const fs = require('fs-extra');
const path = require('path');
const glob = require('globby');

const commonBadFiles = [
  '.npmignore',
  'yarn.lock',
  'node_modules',
  'npm-debug.log',
  'yarn-error.log',
  '.idea',
  '.remote-sync.json',
  '.editorconfig',
  '.eslintrc.json',
  '.htaccess',
];

async function edenExistsIn(dir) {
  try {
    const olderBundlesPath = path.join(dir, 'app', 'bundles');

    if (await fs.pathExists(olderBundlesPath)) {
      return 'oldApp';
    }

    const configPath = path.join(dir, 'config.js');

    if (await fs.pathExists(configPath)) {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      const configFile = require(configPath);

      // Make sure its edenjs-like first
      if (typeof configFile === 'object' && typeof configFile.domain === 'string' && typeof configFile.version === 'string') {
        return 'app';
      }
    }

    const rootJsPaths = await glob('./*.js');

    const bundlesPath = path.join(dir, 'bundles');

    if (await fs.pathExists(bundlesPath)) {
      if (rootJsPaths.length === 0) {
        return 'module';
      } if (rootJsPaths.length === 1 && rootJsPaths[0] === 'index.js') {
        const indexText = await fs.readFile(path.join(dir, 'index.js'), 'utf8');

        if (indexText.match(/^\/\/ EdenJS module does not require an index$/m)) {
          return 'module';
        }
      }
    }

    const edenStructuredFiles = await glob('./*/{controllers,models,views,daemons,helpers}/*.js');

    if (edenStructuredFiles.length > 3) {
      return 'oldAppBundles';
    }
  } catch (err) { /* */ }

  return 'none';
}

async function initEden(suppliedDirType = null, migrateGit = false) {
  let dirType = await edenExistsIn(process.cwd());

  // If no type manually specified, and nothing existing found, do nothing
  if (suppliedDirType === null && dirType === 'none') {
    return null;
  }

  const shouldMakeIntoApp = (suppliedDirType === null && (dirType === 'app' || dirType === 'oldApp' || dirType === 'oldAppBundles')) || suppliedDirType === 'app';
  const shouldMakeIntoModule = (suppliedDirType === null && dirType === 'module') || suppliedDirType === 'module';

  let hasConfig = false;

  // oldApp => app
  if (dirType === 'oldApp' && shouldMakeIntoApp) {
    // Move config and bundles to correct place
    await fs.copy(path.join(process.cwd(), 'app', 'bundles'), path.join(process.cwd(), 'bundles'));

    if (dirType !== 'none' && await fs.pathExists(path.join(process.cwd(), 'app', 'config.js'))) {
      await fs.copy(path.join(process.cwd(), 'app', 'config.js'), path.join(process.cwd(), 'config.js'));
      hasConfig = true;
    }

    // Remove edenjs install and junk
    await Promise.all([
      fs.remove(path.join(process.cwd(), 'CONTRIBUTING.md')),
      fs.remove(path.join(process.cwd(), 'LICENSE')),
      fs.remove(path.join(process.cwd(), 'README.md')),
      fs.remove(path.join(process.cwd(), 'TUTORIAL.md')),
      fs.remove(path.join(process.cwd(), 'app.js')),
      fs.remove(path.join(process.cwd(), 'gulpfile.js')),
      fs.remove(path.join(process.cwd(), 'lib')),
      fs.remove(path.join(process.cwd(), 'tests')),
      fs.remove(path.join(process.cwd(), 'package.json')),
      fs.remove(path.join(process.cwd(), 'package-lock.json')),
      fs.remove(path.join(process.cwd(), 'www')),
      fs.remove(path.join(process.cwd(), 'app')),
      fs.remove(path.join(process.cwd(), '.git')),
      fs.remove(path.join(process.cwd(), '.gitignore')),
      fs.remove(path.join(process.cwd(), '.gitattributes')),

      ...commonBadFiles.map(file => fs.remove(path.join(process.cwd(), file))),
    ]);

    dirType = 'app';
  }

  // oldAppBundles => app
  if (dirType === 'oldAppBundles' && shouldMakeIntoApp) {
    const paths = await glob(['./*'], {
      onlyFiles : false,
    });

    await fs.ensureDir(path.join(process.cwd(), 'bundles'));

    for (const p of paths) {
      await fs.move(path.join(process.cwd(), p), path.join(process.cwd(), 'bundles', p));
    }

    dirType = 'app';
  }

  // Remove common junk
  await Promise.all([
    ...commonBadFiles.map(file => fs.remove(path.join(process.cwd(), file))),
  ]);

  // Make sure data directory is clean
  if (!shouldMakeIntoModule) {
    await fs.ensureDir(path.join(process.cwd(), 'data'));
  }

  if (dirType === 'module' || dirType === 'app') {
    // Remove junk files in bundles/
    await Promise.all([
      fs.remove(path.join(process.cwd(), 'bundles', 'package.json')),
      ...commonBadFiles.map(file => fs.remove(path.join(process.cwd(), 'bundles', file))),
    ]);
  }

  // Put standard edenjs files into place
  await fs.copy(path.join(__dirname, '..', '..', '.eslintrc.json'), path.join(process.cwd(), '.eslintrc.json'));
  await fs.copy(path.join(__dirname, '..', '..', '.editorconfig'), path.join(process.cwd(), '.editorconfig'));

  // Put standard edenjs files into place if they dont exist
  if (!(await fs.pathExists(path.join(process.cwd(), '.gitignore')))) {
    await fs.copy(path.join(__dirname, '..', '..', '.gitignore_screwnpm'), path.join(process.cwd(), '.gitignore'));
  }

  if (!(await fs.pathExists(path.join(process.cwd(), '.gitattributes')))) {
    await fs.copy(path.join(__dirname, '..', '..', '.gitattributes'), path.join(process.cwd(), '.gitattributes'));
  }

  if (shouldMakeIntoApp && !hasConfig && !(await fs.pathExists(path.join(process.cwd(), 'config.js')))) {
    await fs.copy(path.join(__dirname, '..', '..', 'config.example.js'), path.join(process.cwd(), 'config.js'));
  }

  // Add to or create package.json
  let hadPackageData = true;
  let packageData = null;

  if (dirType !== 'none' && await fs.pathExists(path.join(process.cwd(), 'bundles', 'package.json'))) {
    packageData = await fs.readJSON(path.join(process.cwd(), 'bundles', 'package.json'));
    await fs.remove(path.join(process.cwd(), 'bundles', 'package.json'));
  } else if (dirType !== 'none' && await fs.pathExists(path.join(process.cwd(), 'package.json'))) {
    // Read existing package data
    packageData = await fs.readJSON(path.join(process.cwd(), 'package.json'));
  } else {
    hadPackageData = false;

    // Default package data
    packageData = {
      name        : path.basename(process.cwd()),
      description : 'nothing yet',
      version     : '1.0.0',
      engines     : {
        node : '>= 8.0.0',
      },
    };
  }

  const edenPackageData = await fs.readJSON(path.join(__dirname, '..', '..', 'package.json'));

  // Add our dev dependencies for eslint
  packageData.devDependencies = Object.assign({}, packageData.devDependencies, {
    '@edenjs/eslint-config-eden' : edenPackageData.devDependencies['@edenjs/eslint-config-eden'],
    eslint                       : edenPackageData.devDependencies.eslint,
    'eslint-config-airbnb'       : edenPackageData.devDependencies['eslint-config-airbnb'],
    'eslint-plugin-import'       : edenPackageData.devDependencies['eslint-plugin-import'],
    'eslint-plugin-jsx-a11y'     : edenPackageData.devDependencies['eslint-plugin-jsx-a11y'],
    'eslint-plugin-react'        : edenPackageData.devDependencies['eslint-plugin-react'],
  });

  if (shouldMakeIntoApp && !hadPackageData) {
    packageData.dependencies = Object.assign({}, packageData.dependencies, {
      '@edenjs/core' : 'latest',
    });
  }

  // Save new package data
  await fs.writeJSON(path.join(process.cwd(), 'package.json'), packageData, {
    spaces : 2,
  });

  // Migrate .git from bundles to cwd if requested
  if (migrateGit && dirType !== 'none' && await fs.pathExists(path.join(process.cwd(), 'bundles', '.git')) && !(await fs.pathExists(path.join(process.cwd(), '.git')))) {
    await fs.move(path.join(process.cwd(), 'bundles', '.git'), path.join(process.cwd(), '.git'));
  }

  return (suppliedDirType || dirType);
}

module.exports = initEden;
