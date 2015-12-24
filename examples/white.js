'use strict';
if (!process.env.DEBUG) process.env.DEBUG = 'LD382:*';

let LD382 = require('../index');

let wifiled = new LD382('192.168.12.69');

wifiled.on('error', function () {
  // not needed, we use debug
});

wifiled.on('connected', function () {
  wifiled.poweron();

  let bright = 0x00;
  setInterval(function () {
    if (bright > 0xFF) bright = 0x00;
    wifiled.white(bright);
    bright += 17;
  }, 1500);
});


return;

