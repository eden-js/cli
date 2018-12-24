
// require colors
const colors = require('colors');

// create header
const header = `
  ███████╗██████╗ ███████╗███╗   ██╗     ██╗███████╗
  ██╔════╝██╔══██╗██╔════╝████╗  ██║     ██║██╔════╝
  █████╗  ██║  ██║█████╗  ██╔██╗ ██║     ██║███████╗
  ██╔══╝  ██║  ██║██╔══╝  ██║╚██╗██║██   ██║╚════██║
  ███████╗██████╔╝███████╗██║ ╚████║╚█████╔╝███████║
  ╚══════╝╚═════╝ ╚══════╝╚═╝  ╚═══╝ ╚════╝ ╚══════╝
`;

// create usage
const usage = [
  {
    raw     : true,
    content : colors.green(header),
  },
  {
    header  : 'EdenJS',
    content : 'Awesome isomorphic NodeJS skeleton for structured applications. Just have a look at the "bundles" that make up an EdenJS application.',
  },
  {
    header  : 'Synopsis',
    content : '$ edenjs <options> <command>',
  },
  {
    header  : 'Command List',
    content : [
      {
        name    : 'help',
        summary : 'Display help information about EdenJS.',
      },
      {
        name    : 'start',
        summary : 'Starts EdenJS in production.',
      },
      {
        name    : 'run <function>',
        summary : 'Runs EdenJS gulp function.',
      },
      {
        name    : 'init <name>',
        summary : 'Generates new EdenJS directory.',
      },
    ],
  },
];

// export usage config
exports = module.exports = usage;
