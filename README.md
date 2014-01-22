# [UpStats Board](https://github.com/lienma/UpStatsBoard)

**U**senet + **p**lex + **Stats** Board, allows you to monitor your usenet services (**SABnzbd+**, **Sick Beard**, & **CouchPotato**), **Plex**, & your system (CPU Usage, Memory Usage, Bandwidth Usage, & Disk Space Usage). I want to give a special thanks to [ryanc](https://github.com/d4rk22) for his inspirational work, [Network-Status-Page](https://github.com/d4rk22/Network-Status-Page).

Ups Status Board is powered by [Node.js](http://www.nodejs.org/), [Express](http://www.expressjs.com/), [Bootstrap](http://www.getbootstrap.com/), [Backbone](http://www.backbonejs.org/), [jQuery](http://www.jquery.com/?), [Flot](www.flotcharts.org/), and plenty of other libraries.

## This is a work in progress. Not a lot of features have not been implemented yet.

### Requirements
*  Ubuntu and CentOS (As of right now)
*  [Node.js](http://www.nodejs.org/)
*  [vnStat](http://humdi.net/vnstat/)
*  [Plex Media Server](http://plexapp.com/)
*  [Sick Beard](http://sickbeard.com/)

### Optional
*  [Forecast.io Api Key](http://forecast.io/)


## Getting Started
### How to Install Node.JS
Linux - [Installing Node.js via package manager](https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager)

### How to Install UpStats Board
1.  Run the following command: ```` npm install ````
1.  Rename **config.js-sample** to **config.js**
1.  Edit the config file, **config.js**

### How to start UpsStats Board
    node app

### How to have UpsStats Board start on boot
Coming soon.

## Copyright & License

Copyright (C) 2013 MatthewLien.net - Released under the MIT License.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.