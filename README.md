### [UpsBoard](https://github.com/lienma/UpsBoard) [![Gittip](http://img.shields.io/gittip/lienma.png)](https://www.gittip.com/lienma/)
***

**_U_** senet + **_p_** lex + **_S_** tats Board, allows you to monitor your usenet services (**SABnzbd+**, **Sick Beard**, & **CouchPotato**), **Plex**, & your system (CPU Usage, Memory Usage, Bandwidth Usage, & Disk Space Usage). I want to give a special thanks to [ryanc](https://github.com/d4rk22) for his inspirational work, [Network-Status-Page](https://github.com/d4rk22/Network-Status-Page).

UpsBoard is powered by [Node.js](http://www.nodejs.org/), [Express](http://www.expressjs.com/), [Bootstrap](http://www.getbootstrap.com/), [Backbone](http://www.backbonejs.org/), [jQuery](http://www.jquery.com/?), [Flot](www.flotcharts.org/), and plenty of other libraries.

#### Requirements
*   [Node.js](http://www.nodejs.org/) v0.10.26
*   [vnStat](http://humdi.net/vnstat/) v1.11 (For getting bandwidth information)
*   [Plex Media Server](http://plexapp.com/) (PlexPass is required for currently watching)

#### Optional
*   [Sick Beard](http://sickbeard.com/)
*   [SABnzbd](http://sabnzbd.org/)
*   [Forecast.io Api Key](http://forecast.io/)


### Getting Started
####[How to Install Node.js](http://howtonode.org/how-to-install-nodejs)

#### How to Install UpsBoard
1.  **Run the following command**: ```` npm install ````  This will install all the dependences of the application
1.  Rename **config.js-sample** to **config.js**
1.  Edit the config file, **config.js**, with all your service details, api keys, username, passwords, ect...

[For instructions on installing on unRAID.](http://lime-technology.com/forum/index.php?topic=31249.0) - Thank you [smdion](https://forums.plex.tv/index.php/user/132824-smdion/)

#### How to start the UpsBoard
Enter this command from the app's root directory
```
node app
```

#### How to have UpsBoard start on boot
* [Ubuntu](https://forums.plex.tv/index.php/topic/93731-upsboard-usenet-plex-stats/page-4#entry554382) - Thank you [hthighway](https://forums.plex.tv/index.php/user/73409-hthighway/)


## Copyright & License

Copyright (C) 2013 MatthewLien.net - Released under the MIT License.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
