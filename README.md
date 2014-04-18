Chinachu [![Build Status](https://secure.travis-ci.org/kanreisa/Chinachu.png)](http://travis-ci.org/kanreisa/Chinachu) [![tip for next commit](http://tip4commit.com/projects/689.svg)](http://tip4commit.com/projects/689)
========

Visit the Chinachu website for more information: <http://chinachu.akkar.in/>

========
**Testing to run Chinachu on Windows..**

Extract [Chinachu-hima.zip](https://github.com/xtne6f/Chinachu/archive/hima.zip), assuming you've extracted to C:\Chinachu (hereafter called '/').  
Extract [npm-1.4.7.zip](http://nodejs.org/dist/npm/npm-1.4.7.zip) (latest version recommended) to / (for example C:\Chinachu\npm.cmd must exist).  
Extract [ace-builds-3bded0b~.zip](https://github.com/ajaxorg/ace-builds/archive/3bded0bc1b5b51f74afd2f8dafb768ab8f35b00b.zip) to /web/lib/ace (ex. /web/lib/ace/README.md).  
Extract [flagrate-fbc30be~.zip](https://github.com/webnium/flagrate/archive/fbc30be493dbe7905bf3d686e81e21f9a33785e0.zip) to /web/lib/flagrate (ex. /web/lib/flagrate/README.md).  
Create /usr directory, and extract [libav-10-win32.7z](http://win32.libav.org/releases/libav-10-win32.7z) (only /bin and /share are enough) (ex. /usr/bin/avconv.exe).  
Extract [epgdump.zip](https://github.com/xtne6f/epgdump/releases/download/v1.1/epgdump.zip) to /usr/bin (or build https://github.com/xtne6f/epgdump yourself).  
Download [node.exe](http://nodejs.org/dist/v0.10.26/node.exe) to /usr/bin.

Then, launch the Command Prompt and run following.

    cd C:\Chinachu
    mkdir log data tmp
    copy config.sample.json config.json
    copy rules.sample.json rules.json
    set PATH=C:\Chinachu\usr\bin;%PATH%
    npm install
    npm update

Finally configure config.json, and start daemons.

    chinachu.cmd start-operator
    chinachu.cmd start-wui

On Windows, BonDriver is the defacto dtv recording I/F. So [bondump](https://github.com/xtne6f/bondump) (BonDriver->stdout converter) might be useful.
