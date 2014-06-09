"use strict";
var FVP, WebFontConfig, isChrome, isFirefox, isIE, isOpera, isSafari,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

WebFontConfig = {
  google: {
    families: ["Open+Sans:400italic,400,600,700:latin"]
  }
};

(function() {
  var s, wf;
  wf = document.createElement("script");
  wf.src = ("https:" === document.location.protocol ? "https" : "http") + "://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js";
  wf.type = "text/javascript";
  wf.async = "true";
  s = document.getElementsByTagName("script")[0];
  s.parentNode.insertBefore(wf, s);
})();

isOpera = !!window.opera || navigator.userAgent.indexOf(" OPR/") >= 0;

isFirefox = typeof InstallTrigger !== "undefined";

isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf("Constructor") > 0;

isChrome = !!window.chrome && !isOpera;

isIE = false || !!document.documentMode;

HTMLElement.prototype.wrap = function(elms) {
  var child, el, i, parent, sibling, _results;
  if (!elms.length) {
    elms = [elms];
  }
  i = elms.length - 1;
  _results = [];
  while (i >= 0) {
    child = (i > 0 ? this.cloneNode(true) : this);
    el = elms[i];
    parent = el.parentNode;
    sibling = el.nextSibling;
    child.appendChild(el);
    if (sibling) {
      parent.insertBefore(child, sibling);
    } else {
      parent.appendChild(child);
    }
    _results.push(i--);
  }
  return _results;
};

FVP = (function() {
  FVP.prototype.controlsHTML = "<div class=\"videoPlayer__zone\"></div>\n<div class=\"videoPlayer__controls\">\n    <button type=\"button\" class=\"controls__playPause play\"></button>\n    <div class=\"controls__progressbar\">\n        <div class=\"progressbar__time\">\n            <div><span>00:00</span></div>\n        </div>\n        <div class=\"progressbar__mousetime\">\n            <div><span>00:00</span></div>\n        </div>\n        <div class=\"progressbar__bar\"></div>\n        <div class=\"progressbar__border\">\n            <div class=\"progressbar__bufferbar\"></div>\n            <div class=\"progressbar__buffering\">\n                <svg width=\"110%\">\n                    <defs>\n                        <pattern id=\"buffer\" patternUnits=\"userSpaceOnUse\" x=\"0\" y=\"0\" width=\"10\" height=\"10\" viewBox=\"0 0 10 10\">\n                            <line x1=\"5\" y1=\"-1\" x2=\"-5\" y2=\"10\" stroke-width=\"2\" stroke=\"rgba(255,255,255,0.3)\" stroke-linecap=\"butt\"></line>\n                            <line x1=\"10\" y1=\"-1\" x2=\"0\" y2=\"10\" stroke-width=\"2\" stroke=\"rgba(255,255,255,0.3)\" stroke-linecap=\"butt\"></line>\n                            <line x1=\"15\" y1=\"-1\" x2=\"5\" y2=\"10\" stroke-width=\"2\" stroke=\"rgba(255,255,255,0.3)\" stroke-linecap=\"butt\"></line>\n                        </pattern>\n                    </defs>\n                    <rect fill=\"url(#buffer)\" width=\"100%\" height=\"100%\"></rect>\n                </svg>\n            </div>\n        </div>\n    </div>\n    <div class=\"controls__volume\">\n        <div class=\"volumeBar\"><div class=\"volumeBar\"></div></div>\n        <div class=\"volumeBar\"><div class=\"volumeBar\"></div></div>\n        <div class=\"volumeBar\"><div class=\"volumeBar\"></div></div>\n        <div class=\"volumeBar\"><div class=\"volumeBar\"></div></div>\n        <div class=\"volumeBar last\"><div class=\"volumeBar\"></div></div>\n        <div class=\"controls__volume__zone\"></div>\n    </div>\n    <button type=\"button\" class=\"controls__comment\"></button>\n    <button type=\"button\" class=\"controls__fullscreen\"></button>\n</div>";

  FVP.prototype.time = {
    current: {
      minutes: 0,
      seconds: 0,
      format: ""
    },
    duration: {
      minutes: 0,
      seconds: 0,
      format: ""
    }
  };

  FVP.prototype.mouse = {
    x: 0,
    y: 0,
    grab: false,
    click: {},
    mouseenter: {}
  };

  FVP.prototype.canChangeVolume = true;

  FVP.prototype.canChangeTime = true;

  FVP.prototype.timeoutMousemove = null;

  function FVP(videoSelector) {
    var i, volumeEls,
      _this = this;
    this.videoSelector = videoSelector;
    this.mouseEnterProgressBar = __bind(this.mouseEnterProgressBar, this);
    this.mouseMove = __bind(this.mouseMove, this);
    this.togglefullscreen = __bind(this.togglefullscreen, this);
    this.hideControls = __bind(this.hideControls, this);
    this.showControls = __bind(this.showControls, this);
    this.changeVolume = __bind(this.changeVolume, this);
    this.getMousePosXRelativeTo = __bind(this.getMousePosXRelativeTo, this);
    this.changeMouseTime = __bind(this.changeMouseTime, this);
    this.changeTime = __bind(this.changeTime, this);
    this.grabCursor = __bind(this.grabCursor, this);
    this.updateBufferBar = __bind(this.updateBufferBar, this);
    this.getCurrentIndexBuffer = __bind(this.getCurrentIndexBuffer, this);
    this.end = __bind(this.end, this);
    this.updateTime = __bind(this.updateTime, this);
    this.setTime = __bind(this.setTime, this);
    this.setMouseTime = __bind(this.setMouseTime, this);
    this.updateProgressBar = __bind(this.updateProgressBar, this);
    this.hideBuffering = __bind(this.hideBuffering, this);
    this.showBuffering = __bind(this.showBuffering, this);
    this.showPlay = __bind(this.showPlay, this);
    this.showPause = __bind(this.showPause, this);
    this.pause = __bind(this.pause, this);
    this.play = __bind(this.play, this);
    this.playPause = __bind(this.playPause, this);
    this.setMouseTextTime = __bind(this.setMouseTextTime, this);
    this.setTextTime = __bind(this.setTextTime, this);
    this.addZero = __bind(this.addZero, this);
    this.toFormatMinutesSeconds = __bind(this.toFormatMinutesSeconds, this);
    this.initDuration = __bind(this.initDuration, this);
    this.init = __bind(this.init, this);
    this.initHTML = __bind(this.initHTML, this);
    this.initHTML();
    this.video.addEventListener("durationchange", this.init);
    this.videoPlayer.addEventListener("mouseenter", this.showControls);
    this.videoPlayer.addEventListener("mousemove", this.showControls);
    this.videoPlayer.addEventListener("mouseleave", this.hideControls);
    this.videoPlayPause.addEventListener("click", this.playPause);
    this.fullscreen.addEventListener("click", this.togglefullscreen);
    this.video.addEventListener("timeupdate", this.updateProgressBar);
    this.video.addEventListener("progress", this.updateBufferBar);
    volumeEls = document.querySelectorAll(".videoPlayer *");
    i = 0;
    while (i < volumeEls.length) {
      volumeEls[i].ondragstart = function() {
        return false;
      };
      i++;
    }
    this.progressbar.addEventListener("click", this.changeTime);
    this.volumeZone.addEventListener("mousedown", function() {
      _this.mouse.click.volume = true;
      _this.changeVolume();
    });
    this.progressbar.addEventListener("mousedown", function() {
      _this.mouse.click.time = true;
    });
    this.progressbarBar.addEventListener("mouseenter", this.mouseEnterProgressBar);
    this.progressbarBorder.addEventListener("mouseenter", this.mouseEnterProgressBar);
    this.progressbar.addEventListener("mouseleave", function() {
      _this.mouse.mouseenter.time = false;
      _this.videoPlayer.classList.remove("mousetime-visible");
    });
    document.addEventListener("mousemove", this.mouseMove);
    document.addEventListener("mouseup", function() {
      _this.mouse.click.volume = false;
      _this.mouse.click.time = false;
      _this.volumeZone.classList.remove("active");
      return _this.grabCursor(false);
    });
  }

  FVP.prototype.initHTML = function() {
    this.video = document.querySelector(this.videoSelector);
    this.video.classList.add('videoPlayer__video');
    this.videoPlayer = document.createElement('div');
    this.videoPlayer.classList.add('videoPlayer');
    this.videoPlayer.wrap(this.video);
    this.controls = document.createElement('div');
    this.controls.innerHTML = this.controlsHTML;
    this.videoPlayer.appendChild(this.controls);
    this.videoPlayPause = document.querySelector('.controls__playPause');
    this.progressbar = document.querySelector('.controls__progressbar');
    this.progressbarBar = document.querySelector('.progressbar__bar');
    this.progressbarBorder = document.querySelector('.progressbar__border');
    this.bufferBar = document.querySelector('.progressbar__bufferbar');
    this.progressPercentage = 0;
    this.bufferPercentage = 0;
    this.volume = document.querySelector('.controls__volume');
    this.volumeZone = document.querySelector('.controls__volume__zone');
    this.fullscreen = document.querySelector('.controls__fullscreen');
    this.playerZone = document.querySelector('.videoPlayer__zone');
    this.playerControls = document.querySelector('.videoPlayer__controls');
    this.playerTime = document.querySelector('.progressbar__time > div');
    return this.playerMouseTime = document.querySelector('.progressbar__mousetime > div');
  };

  FVP.prototype.init = function() {
    this.video.controls = false;
    return this.video.volume = 1;
  };

  FVP.prototype.initDuration = function() {
    this.time.duration.seconds = this.video.duration;
    this.time.duration.format = this.toFormatMinutesSeconds(this.time.duration.seconds);
    return this.setTextTime(this.time.duration.format);
  };

  FVP.prototype.toFormatMinutesSeconds = function(totalSeconds) {
    var minutes, seconds;
    minutes = this.addZero(parseInt(totalSeconds / 60));
    seconds = this.addZero((totalSeconds % 60).toFixed(0));
    return minutes + ":" + seconds;
  };

  FVP.prototype.addZero = function(number) {
    if (number < 10) {
      return "0" + number;
    } else {
      return number;
    }
  };

  FVP.prototype.setTextTime = function(timeString) {
    this.playerTime.querySelector("span").textContent = timeString;
  };

  FVP.prototype.setMouseTextTime = function(timeString) {
    this.playerMouseTime.querySelector("span").textContent = timeString;
  };

  FVP.prototype.playPause = function() {
    if (this.video.paused || this.video.ended) {
      this.play();
    } else {
      this.pause();
    }
  };

  FVP.prototype.timeoutplay = void 0;

  FVP.prototype.play = function() {
    console.log("@play");
    this.showPause();
    this.video.play();
  };

  FVP.prototype.pause = function() {
    console.log("@pause");
    this.showPlay();
    this.video.pause();
  };

  FVP.prototype.showPause = function() {
    this.videoPlayPause.classList.remove("play");
    this.videoPlayPause.classList.add("pause");
  };

  FVP.prototype.showPlay = function() {
    this.videoPlayPause.classList.remove("pause");
    this.videoPlayPause.classList.add("play");
  };

  FVP.prototype.showBuffering = function() {
    this.videoPlayer.classList.add("buffering");
  };

  FVP.prototype.hideBuffering = function() {
    this.videoPlayer.classList.remove("buffering");
  };

  FVP.prototype.isDurationInit = false;

  FVP.prototype.updateProgressBar = function() {
    if (!this.isDurationInit) {
      this.initDuration();
      this.isDurationInit = true;
      return false;
    }
    this.progressPercentage = Math.floor((100 / this.video.duration) * this.video.currentTime);
    this.progressPercentage = (100 / this.video.duration) * this.video.currentTime;
    this.progressbarBar.style.width = this.progressPercentage + "%";
    this.updateTime();
    if (this.video.currentTime >= this.video.duration) {
      return this.end();
    }
  };

  FVP.prototype.setMouseTime = function(seconds, percent) {
    var mouseTime;
    mouseTime = this.toFormatMinutesSeconds(seconds);
    this.setMouseTextTime(mouseTime);
    this.playerMouseTime.style.display = "block";
    this.playerMouseTime.style.left = percent + "%";
  };

  FVP.prototype.setTime = function(seconds, percent) {
    this.time.current.format = this.toFormatMinutesSeconds(seconds);
    this.setTextTime(this.time.current.format);
    this.playerTime.style.left = percent + "%";
  };

  FVP.prototype.updateTime = function() {
    this.time.current.seconds = this.video.currentTime;
    this.time.current.format = this.toFormatMinutesSeconds(this.time.current.seconds);
    this.setTextTime(this.time.current.format);
    this.playerTime.style.left = this.progressPercentage + "%";
  };

  FVP.prototype.end = function() {
    this.videoPlayPause.classList.remove("pause");
    this.videoPlayPause.classList.add("play");
  };

  FVP.prototype.getCurrentIndexBuffer = function() {
    var current, currentIndexBuffer, i, indexLastBuffer, start;
    current = this.video.currentTime;
    indexLastBuffer = this.video.buffered.length - 1;
    currentIndexBuffer = 0;
    i = indexLastBuffer;
    while (i >= 0) {
      start = this.video.buffered.start(i);
      if (start <= current) {
        currentIndexBuffer = i;
        break;
      }
      i--;
    }
    return currentIndexBuffer;
  };

  FVP.prototype.percentVidLoaded = void 0;

  FVP.prototype.updateBufferBar = function() {
    this.percentVidLoaded = null;
    if (this.video && this.video.buffered && this.video.buffered.length > 0 && this.video.buffered.end && this.video.duration) {
      this.percentVidLoaded = this.video.buffered.end(this.getCurrentIndexBuffer()) / this.video.duration;
    } else {
      if (this.video && this.video.bytesTotal !== undefined && this.video.bytesTotal > 0 && this.video.bufferedBytes !== undefined) {
        this.percentVidLoaded = this.video.bufferedBytes / this.video.bytesTotal;
      }
    }
    if (this.percentVidLoaded !== null) {
      this.percentVidLoaded = 100 * Math.min(1, Math.max(0, this.percentVidLoaded));
    } else {

    }
    this.bufferBar.style.width = this.percentVidLoaded + "%";
  };

  FVP.prototype.grabCursor = function(setCursor) {
    var cursCoords, grabCursor, i, urlCloseHandCursor, videoElements;
    if (typeof setCursor === "undefined") {
      setCursor = true;
    }
    if (this.mouse.grab && setCursor) {
      return false;
    }
    this.mouse.grab = true;
    grabCursor = void 0;
    cursCoords = (isIE ? "" : " 8 8");
    urlCloseHandCursor = "https://mail.google.com/mail/images/2/closedhand.cur";
    grabCursor = (isFirefox ? "-moz-grabbing" : "url(" + urlCloseHandCursor + ")" + cursCoords + ", move");
    if (isOpera) {
      grabCursor = "move";
    }
    if (!setCursor) {
      grabCursor = "";
      this.mouse.grab = false;
    }
    document.body.style.cursor = grabCursor;
    videoElements = document.querySelectorAll(".videoPlayer *");
    i = 0;
    while (i < videoElements.length) {
      videoElements[i].style.cursor = grabCursor;
      i++;
    }
  };

  FVP.prototype.changeTime = function() {
    var barWidth, mouseX, newTime, percentMouseX;
    this.videoPlayer.classList.remove("mousetime-visible");
    mouseX = this.getMousePosXRelativeTo(this.progressbar);
    barWidth = this.progressbar.offsetWidth;
    percentMouseX = (mouseX * 100) / barWidth;
    newTime = (percentMouseX / 100) * this.video.duration;
    this.progressbarBar.style.width = percentMouseX + "%";
    this.setTime(newTime, percentMouseX);
    this.video.currentTime = newTime;
  };

  FVP.prototype.changeMouseTime = function() {
    var barWidth, mouseX, newTime, percentMouseX;
    this.videoPlayer.classList.add("mousetime-visible");
    mouseX = this.getMousePosXRelativeTo(this.progressbar);
    barWidth = this.progressbar.offsetWidth;
    percentMouseX = (mouseX * 100) / barWidth;
    newTime = (percentMouseX / 100) * this.video.duration;
    this.setMouseTime(newTime, percentMouseX);
  };

  FVP.prototype.getMousePosXRelativeTo = function(el) {
    var elOffset, mouseX, rectEl;
    rectEl = el.getBoundingClientRect();
    elOffset = {
      top: rectEl.top + document.body.scrollTop,
      left: rectEl.left + document.body.scrollLeft
    };
    mouseX = this.mouse.x - elOffset.left;
    if (mouseX < 0) {
      mouseX = 0;
    } else {
      if (mouseX > el.offsetWidth) {
        mouseX = el.offsetWidth;
      }
    }
    return mouseX;
  };

  FVP.prototype.changeVolume = function() {
    var lastPx, mouseX, nbBarFull, newVolume, percentBarVolume, percentMouseX, volumeBarWidth, volumeBars, volumeZoneWidth;
    this.grabCursor();
    mouseX = this.getMousePosXRelativeTo(this.volumeZone);
    volumeZoneWidth = this.volumeZone.offsetWidth;
    volumeBarWidth = parseInt(document.querySelector(".controls__volume > .volumeBar").offsetWidth);
    percentBarVolume = 100 / document.querySelector(".controls__volume > .volumeBar").length;
    percentMouseX = (mouseX * 100) / volumeZoneWidth;
    if (percentMouseX > 95) {
      percentMouseX = 100;
    }
    mouseX *= (((document.querySelectorAll(".controls__volume > .volumeBar").length * volumeBarWidth) * 100) / volumeZoneWidth) / 100;
    nbBarFull = Math.floor(mouseX / volumeBarWidth);
    lastPx = Math.round(mouseX % volumeBarWidth);
    volumeBars = document.querySelectorAll(".controls__volume > .volumeBar");
    Array.prototype.forEach.call(volumeBars, function(el, i) {
      if (i < nbBarFull) {
        el.querySelector(".volumeBar").style.width = "100%";
      } else if (i === nbBarFull) {
        el.querySelector(".volumeBar").style.width = lastPx + "px";
      } else {
        el.querySelector(".volumeBar").style.width = "0";
      }
    });
    newVolume = Math.round(parseFloat(percentMouseX / 100) * 100) / 100;
    this.video.volume = newVolume;
  };

  FVP.prototype.showControls = function() {
    this.videoPlayer.classList.remove("controls-hidden");
  };

  FVP.prototype.hideControls = function() {
    if (this.mouse.click.volume || this.mouse.click.time) {
      return false;
    }
    this.videoPlayer.classList.add("controls-hidden");
  };

  FVP.prototype.togglefullscreen = function() {
    if (this.videoPlayer.classList.contains("fullscreen")) {
      if (document.ExitFullscreen) {
        document.ExitFullscreen();
      } else if (document.mozExitFullScreen) {
        document.mozExitFullScreen();
      } else {
        if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
      }
      document.addEventListener("mousemove", this.mouseMove);
      this.playerZone.style.display = "none";
      this.playerZone.removeEventListener("mousemove", this.mouseMove);
      this.playerControls.removeEventListener("mousemove", this.mouseMove);
    } else {
      if (this.video.requestFullscreen) {
        this.video.requestFullscreen();
      } else if (this.video.mozRequestFullScreen) {
        this.video.mozRequestFullScreen();
      } else {
        if (this.video.webkitRequestFullscreen) {
          this.video.webkitRequestFullscreen();
        }
      }
      document.removeEventListener("mousemove", this.mouseMove);
      this.playerZone.style.display = "block";
      this.playerZone.addEventListener("mousemove", this.mouseMove);
      this.playerControls.addEventListener("mousemove", this.mouseMove);
    }
    this.videoPlayer.classList.toggle("fullscreen");
  };

  FVP.prototype.mouseMove = function(e) {
    var _this = this;
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
    if (this.mouse.click.volume && this.canChangeVolume) {
      this.canChangeVolume = false;
      setTimeout((function() {
        return _this.canChangeVolume = true;
      }), 50);
      console.log('changeVolume');
      this.changeVolume();
    } else if (this.mouse.click.time && this.canChangeTime) {
      this.canChangeTime = false;
      setTimeout((function() {
        return _this.canChangeTime = true;
      }), 50);
      this.changeTime();
    }
    if (this.mouse.mouseenter.time && !this.mouse.click.time) {
      this.changeMouseTime();
    }
    clearTimeout(this.timeoutMousemove);
    if (!this.mouse.mouseenter.time) {
      return this.timeoutMousemove = setTimeout(function() {
        return _this.hideControls();
      }, 1500);
    }
  };

  FVP.prototype.mouseEnterProgressBar = function(e) {
    this.mouse.mouseenter.time = true;
  };

  return FVP;

})();

 //# sourceMappingURL=fvp.js.map