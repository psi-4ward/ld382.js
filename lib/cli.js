'use strict';
const program = require('commander');
const pkg = require('../package.json');
const async = require('async');

function collect(val, memo) {
  memo.push(val);
  return memo;
}

function rgb(val) {
  const err = 'Error: Wrong color format! Range: 0-255, Format: R,G,B';
  if(!val.match(/^\d{1,3},\d{1,3},\d{1,3}$/)) {
    console.error(err);
    process.exit(1);
  }
  val = val.split(',');
  val = val.map((v) => {
    if(v < 0 || v > 255) {
      console.error(err);
      process.exit(1);
    }
    return parseInt(val, 10);
  });
  return val;
}

function white(val) {
  val = parseInt(val, 10);
  if (!(val >= 0 && val <= 255)) {
    console.error('Error: Wrong color format! Range: 0-255');
    process.exit(1);
  }
  return val;
}

program
  .version(pkg.version)
  .description('UFO Wifi LED Controller Utility')
  .option('-s, --scan', 'Scan for LED Controllers')
  .option('-i, --ip <ip>', 'IP of the Controller', collect, [])
  .option('-c, --color <rgb>', 'RGB color value: ie 255,0,0 for red', rgb)
  .option('-w, --white <white>', 'White color value', white)
  .option('--poweron', 'Power on')
  .option('--poweroff', 'Power off')
  .option('--quiet', 'Suppress output')
  .option('--debug', 'Debug mode')
  .parse(process.argv);

if(program.debug) process.env.DEBUG = 'LD382:*';


if(!program.scan && !program.ip.length) {
  console.error('Error: Provide an IP or use --scan');
  program.help();
  process.exit(1);
}

function echo() {
  if(program.quiet) return;
  console.log.apply(console, arguments);
}


const LD382 = require('./index');

// SCAN
if(program.scan) {
  console.log("Scanning network for LED Controllers ...");
  LD382.scan(function (err, res) {
    console.log(res.map(v => v.replace(/,/g, "\t")).join("\n"));
  });
  return;
}

program.ip.forEach(function(ip) {
  let wifiled = new LD382(ip, 5577, {retry:0});

  wifiled.on('error', function(err) {
    console.error(err.toString());
    process.exit(1);
  });

  wifiled.on('connected', function () {
    let funcs = [];
    if(program.poweron) {
      funcs.push(function(next) {
        echo(ip, 'Power on');
        wifiled.poweron(next);
      });
    }
    if(program.poweroff) {
      funcs.push(function(next) {
        echo(ip, 'Power off');
        wifiled.poweroff(next);
      });
    }
    if(program.color) {
      funcs.push(function(next) {
        echo(ip, 'RGB', program.color.join(','));
        wifiled.rgb(program.color[0], program.color[1], program.color[2], next);
      });
    }
    if(program.white) {
      funcs.push(function(next) {
        echo(ip, 'White', program.white);
        wifiled.white(program.white, next);
      });
    }
    async.series(funcs, wifiled.disconnect.bind(wifiled));
  });

});