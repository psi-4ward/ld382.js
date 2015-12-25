# LD382 UFO Led Controller Library

A NodeJS Library and CLI tool to communicate with the LD382 UFO Led Controller.

Requires NodeJS 4.0 or later.

```
$ sudo npm install -g ld382.js

$ ld382 -h
  Usage: ld382 [options]

  UFO Wifi LED Controller Utility

  Options:

    -h, --help           output usage information
    -V, --version        output the version number
    -s, --scan           Scan for LED Controllers
    -i, --ip <ip>        IP of the Controller
    -c, --color <rgb>    RGB color value: ie 255,0,0 for red
    -w, --white <white>  White color value
    --poweron            Power on
    --poweroff           Power off
    --quiet              Suppress output
    --debug              Debug mode

$ ld382 --sacen
192.168.12.69   ACCF2366D320    HF-LPB100-ZJ200

$ ld38s --ip 192.168.12.69 --poweron --white 125
```

### TODO
* RGB Tests (dont have a RGB stripe yet)
* Implement the predefined programs

## License
  [MIT](LICENSE)