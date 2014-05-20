"use strict";

// Open Sans Google Font
var WebFontConfig = {
	google: { families: [ 'Open+Sans:400italic,400,600,700:latin' ] }
};
(function() {
	var wf = document.createElement('script');
	wf.src = ('https:' == document.location.protocol ? 'https' : 'http') +
	'://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
	wf.type = 'text/javascript';
	wf.async = 'true';
	var s = document.getElementsByTagName('script')[0];
	s.parentNode.insertBefore(wf, s);
})();

var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
var isFirefox = typeof InstallTrigger !== 'undefined';
var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
var isChrome = !!window.chrome && !isOpera;
var isIE = /*@cc_on!@*/false || !!document.documentMode;

document.addEventListener('DOMContentLoaded', function(){

	var videoPlayer =  new function(){

		this.videoPlayer = document.querySelector('.videoPlayer');

		this.video = document.querySelector('.videoPlayer__video');
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
		this.playerMouseTime = document.querySelector('.progressbar__mousetime > div');

		this.time = {
			current : {
				minutes : 0,
				seconds : 0,
				format : ""
			},
			duration : {
				minutes : 0,
				seconds : 0,
				format : ""
			}
		};
		this.mouse = {
			x : 0,
			y : 0,
			grab : false,
			click : {},
			mouseenter : {}
		};
		this.canChangeVolume = true;
		this.canChangeTime = true;
		this.timeoutMousemove;

		var that = this;

		// Functions
		this.init = function(){
			this.video.controls = false;
			this.video.volume = 1;
		};

		// Set la duration de la vidéo et l'affiche
		this.initDuration = function(){
			this.time.duration.seconds = this.video.duration;
			this.time.duration.format = this.toFormatMinutesSeconds( this.time.duration.seconds );
			this.setTextTime( this.time.duration.format );
		}

		// seconds to minutes and seconds
		this.toFormatMinutesSeconds = function( totalSeconds ){
			var minutes = this.addZero( parseInt( totalSeconds / 60 ) );
			var seconds = this.addZero(  ( totalSeconds % 60 ).toFixed(0) );
			return minutes + ':' + seconds;
		};
		this.addZero = function( number ){
			if( number < 10 ){
				return '0' + number;
			} else {
				return number;
			}
		};
		this.setTextTime = function( timeString ) {
			that.playerTime.querySelector('span').textContent = timeString;
		};
		this.setMouseTextTime = function( timeString ) {
			that.playerMouseTime.querySelector('span').textContent = timeString;
		};

		this.playPause = function(){
			if (that.video.paused || that.video.ended)
				that.play();
			else
				that.pause();
		};

		var timeoutplay;
		this.play = function(){

			console.log('this.play');

			if( this.video.readyState != 4 ) {
				this.showBuffering();
				clearTimeout(timeoutplay);
				timeoutplay = setTimeout(function(){
					that.play();
				}, 1000);
				return false;
			} else {
				this.hideBuffering();
			}

			this.showPause();
			this.video.play();
		};

		this.pause = function(){
			console.log('this.pause');
			this.showPlay();
			this.video.pause();
		};

		this.showPause = function(){
			this.videoPlayPause.classList.remove('play');
			this.videoPlayPause.classList.add('pause');
		};
		this.showPlay = function(){
			this.videoPlayPause.classList.remove('pause');
			this.videoPlayPause.classList.add('play');
		};

		this.showBuffering = function(){
			this.videoPlayer.classList.add('buffering');
			this.showPause();
		};
		this.hideBuffering = function(){
			this.videoPlayer.classList.remove('buffering');
			this.showPlay();
		};

		var isDurationInit = false;
		this.updateProgressBar = function(){

			if( !isDurationInit ) {
				that.initDuration();
				isDurationInit = true;
				return false;
			}

			// this = video
			that.progressPercentage = Math.floor((100 / this.duration) * this.currentTime);
			that.progressPercentage = (100 / this.duration) * this.currentTime;
			that.progressbarBar.style.width = that.progressPercentage + '%';

			that.updateTime();

			if( this.currentTime >= this.duration )
				that.end();

		};

		this.setMouseTime = function( seconds, percent ){
			var mouseTime = this.toFormatMinutesSeconds( seconds );
			this.setMouseTextTime( mouseTime );
			that.playerMouseTime.style.display = 'block';
			that.playerMouseTime.style.left = percent + '%';
		};
		this.setTime = function( seconds, percent ){
			this.time.current.format = this.toFormatMinutesSeconds( seconds );
			this.setTextTime( this.time.current.format );
			that.playerTime.style.left = percent + '%';
		};
		this.updateTime = function(){
			this.time.current.seconds = this.video.currentTime;
			this.time.current.format = this.toFormatMinutesSeconds( this.time.current.seconds );
			this.setTextTime( this.time.current.format );
			that.playerTime.style.left = that.progressPercentage + '%';
		};

		this.end = function(){
			this.videoPlayPause.classList.remove('pause');
			this.videoPlayPause.classList.add('play');
		};

		// Get the index of the current part of the video which is buffering
		this.getCurrentIndexBuffer = function(){
			var current = this.video.currentTime;
			// Récupere l'index juste inférieur au current time
			var indexLastBuffer = that.video.buffered.length - 1;
			var currentIndexBuffer = 0;
			for(var i=indexLastBuffer;i>=0;i--) {
				var start = that.video.buffered.start(i);
				if( start <= current ) {
					currentIndexBuffer = i;
					break;
				}
			}
			return currentIndexBuffer;
		};

		var percentVidLoaded;
		this.updateBufferBar = function(){

			percentVidLoaded = null;

			// FF4+, Chrome
			if (that.video && that.video.buffered && that.video.buffered.length > 0 && that.video.buffered.end && that.video.duration) {

				percentVidLoaded = that.video.buffered.end( that.getCurrentIndexBuffer() ) / that.video.duration;

			}

			// Some browsers (e.g., FF3.6 and Safari 5) cannot calculate target.bufferered.end()
			//  to be anything other than 0. If the byte count is available we use this instead.
			//  Browsers that support the else if do not seem to have the bufferedBytes value and
			//  should skip to there.
			else if (that.video && that.video.bytesTotal != undefined && that.video.bytesTotal > 0 && that.video.bufferedBytes != undefined) {
			    percentVidLoaded = that.video.bufferedBytes / that.video.bytesTotal;
			}

			if (percentVidLoaded !== null) {
			    percentVidLoaded = 100 * Math.min(1, Math.max(0, percentVidLoaded));
			}else {
				// percentVidLoaded = 100;
			}

			that.bufferBar.style.width = percentVidLoaded + '%';
		};

		this.grabCursor = function( setCursor ){

			if(typeof setCursor === 'undefined')
				setCursor = true;

			if( that.mouse.grab && setCursor ) {
				return false;
			}

			that.mouse.grab = true;

			var grabCursor;
			// IE doesn't support co-ordinates
			var cursCoords = isIE ? "" : " 8 8";
			var urlCloseHandCursor = 'https://mail.google.com/mail/images/2/closedhand.cur'

		    grabCursor = isFirefox ? "-moz-grabbing" : "url("+urlCloseHandCursor+")" + cursCoords + ", move";
		    // Opera doesn't support url cursors and doesn't fall back well...
		    if (isOpera) grabCursor = "move";

			// Desactiver curseur
			if( !setCursor ) {
				grabCursor = '';
				that.mouse.grab = false;
			}

			document.body.style.cursor = grabCursor;
			var  videoElements = document.querySelectorAll('.videoPlayer *');
			for(var i=0;i<videoElements.length;i++) {
				videoElements[i].style.cursor = grabCursor;
			}
			// videoElements.style.cursor = grabCursor;
			// videoElements.style.cursor = grabCursor;
			// document.querySelectorAll('.videoPlayer *');.style.cursor = grabCursor;
			// console.log( grabCursor + ' !important' );
			// document.body.setAttribute('style', 'cursor: '+ grabCursor + ' !important;' );
		};

		this.changeTime = function(){
			that.videoPlayer.classList.remove('mousetime-visible');
			var mouseX = that.getMousePosXRelativeTo( that.progressbar );
			var barWidth = that.progressbar.offsetWidth;
			var percentMouseX = (mouseX*100)/barWidth;
			var newTime = (percentMouseX/100)*that.video.duration;
			that.progressbarBar.style.width = percentMouseX + '%';
			that.setTime( newTime, percentMouseX );
			that.video.currentTime = newTime;
		};

		this.changeMouseTime = function(){
			that.videoPlayer.classList.add('mousetime-visible');
			var mouseX = that.getMousePosXRelativeTo( that.progressbar );
			var barWidth = that.progressbar.offsetWidth;
			var percentMouseX = (mouseX*100)/barWidth;
			var newTime = (percentMouseX/100)*that.video.duration;
			that.setMouseTime( newTime, percentMouseX );
		};

		this.getMousePosXRelativeTo = function( el ){
			// On récupère la position de la souris par rapport à la volumeZone
			var rectEl = el.getBoundingClientRect();


			var elOffset = {
				top: rectEl.top + document.body.scrollTop,
				left: rectEl.left + document.body.scrollLeft
			}
			var mouseX = that.mouse.x - elOffset.left;
			if( mouseX < 0)
				mouseX = 0;
			else if( mouseX > el.offsetWidth )
				mouseX = el.offsetWidth;

			return mouseX;
		};

		this.changeVolume = function(){

			that.grabCursor();

			var mouseX = that.getMousePosXRelativeTo( that.volumeZone );

			// if( !that.click.volume && e.type != "click" ) {
			// 	return false;
			// }
			// $(this).classList.add('active');

			var volumeZoneWidth = that.volumeZone.offsetWidth,
				volumeBarWidth = parseInt( document.querySelector('.controls__volume > .volumeBar').offsetWidth ),
				percentBarVolume = 100 / document.querySelector('.controls__volume > .volumeBar').length;

			var percentMouseX = (mouseX*100)/volumeZoneWidth;
			if( percentMouseX > 95 )
				percentMouseX = 100;

			// On ramène le résultat à une proportion pour une largeur sans les marges (qui font 3px) entre les bars
			mouseX *= (((document.querySelectorAll('.controls__volume > .volumeBar').length*volumeBarWidth)*100)/volumeZoneWidth)/100;

			var nbBarFull = Math.floor(mouseX/volumeBarWidth);
			var lastPx = Math.round(mouseX%volumeBarWidth);

			var volumeBars = document.querySelectorAll('.controls__volume > .volumeBar');

			Array.prototype.forEach.call(volumeBars, function(el, i){

				if( i < nbBarFull ) {
					el.querySelector('.volumeBar').style.width = '100%';
				} else if( i == nbBarFull ) {
					el.querySelector('.volumeBar').style.width = lastPx + 'px';
				} else {
					el.querySelector('.volumeBar').style.width = '0';
				}
			});

			var newVolume = Math.round(parseFloat(percentMouseX/100)*100)/100;
			// console.log(newVolume);
			that.video.volume = newVolume;

			// if( e.type == "click" ) {
			// 	that.$volumeZone.classList.remove('active');
			// }

		};

		this.showControls = function(){
			that.videoPlayer.classList.remove('controls-hidden');
		};
		this.hideControls = function(){

			// On ne cache pas si on est en train de changer le time ou le volume
			if( that.mouse.click.volume || that.mouse.click.time )
				return false;

			that.videoPlayer.classList.add('controls-hidden');
		};

		this.togglefullscreen = function(){


			if( that.videoPlayer.classList.contains('fullscreen') ){

				if (document.ExitFullscreen) {
					document.ExitFullscreen();
				} else if (document.mozExitFullScreen) {
					document.mozExitFullScreen(); // Firefox
				} else if (document.webkitExitFullscreen) {
					document.webkitExitFullscreen(); // Chrome and Safari
				}

				// On remet l'event mousemouve sur le document et on remove celui sur le player et les controls
				document.addEventListener('mousemove', that.mouseMove);
				that.playerZone.style.display = 'none';
				that.playerZone.removeEventListener('mousemove', that.mouseMove);
				that.playerControls.removeEventListener('mousemove', that.mouseMove);

			} else {

				if (that.video.requestFullscreen) {
					that.video.requestFullscreen();
				} else if (that.video.mozRequestFullScreen) {
					that.video.mozRequestFullScreen(); // Firefox
				} else if (that.video.webkitRequestFullscreen) {
					that.video.webkitRequestFullscreen(); // Chrome and Safari
				}

				// On retire l'event mousemouve du document et on l'ajoute sur le player et les controls
				document.removeEventListener('mousemove', that.mouseMove);
				that.playerZone.style.display = 'block';
				that.playerZone.addEventListener('mousemove', that.mouseMove);
				that.playerControls.addEventListener('mousemove', that.mouseMove);
			}

			that.videoPlayer.classList.toggle('fullscreen');
		};

		this.mouseMove = function(e){
			that.mouse.x = e.clientX;
			that.mouse.y = e.clientY;

			if( that.mouse.click.volume && that.canChangeVolume ) {
				that.canChangeVolume = false;
				setTimeout(function(){
					that.canChangeVolume = true;
				}, 50);
				that.changeVolume();
			} else if( that.mouse.click.time && that.canChangeTime ) {
				that.canChangeTime = false;
				setTimeout(function(){
					that.canChangeTime = true;
				}, 50);
				that.changeTime();
			}

			// Detect mouseenter + mousemove on time
			if( that.mouse.mouseenter.time && !that.mouse.click.time ) {
				that.changeMouseTime();
			}

			// Detect when mouse is not moving
			clearTimeout(that.timeoutMousemove);
			if( !that.mouse.mouseenter.time ) {
				that.timeoutMousemove = setTimeout(function(){
					that.hideControls();
				},1500);
			}
		};

		this.mouseEnterProgressBar = function(e){
			that.mouse.mouseenter.time = true;
		};

		// Events
		// this.video.addEventListener('readystatechange ', function(){console.log('state change');});
		this.video.addEventListener('durationchange', function(){
			// A partir de là on récup la duration
			that.init();
		});
		this.videoPlayer.addEventListener('mouseenter', this.showControls);
		this.videoPlayer.addEventListener('mousemove', this.showControls);
		this.videoPlayer.addEventListener('mouseleave', this.hideControls);

		this.videoPlayPause.addEventListener('click', this.playPause);
		this.fullscreen.addEventListener('click', this.togglefullscreen);
		this.video.addEventListener('timeupdate', this.updateProgressBar, false);
		this.video.addEventListener('progress', this.updateBufferBar, false);
		// this.video.addEventListener('play', this.play );
		// this.video.addEventListener('pause', this.pause );

		// Prevent DRAG & DROP
		var volumeEls = document.querySelectorAll('.videoPlayer *');
		for(var i=0;i<volumeEls.length;i++) {
			volumeEls[i].ondragstart = function(){ return false; };
		}
		// this.volumeZone.addEventListener('drop',function(){return false;})
		// this.progressbar.addEventListener('drop',function(){return false;})

		// this.volumeZone.addEventListener( 'click', this.changeVolume );
		this.progressbar.addEventListener( 'click', this.changeTime );

		// MOUSE DOWN
		this.volumeZone.addEventListener('mousedown', function(){
		    that.mouse.click.volume = true;
		    that.changeVolume();
		});
		this.progressbar.addEventListener('mousedown', function(){
			// that.pause();
		    that.mouse.click.time = true;
		});

		// HOVER ON PROGRESS BAR
		this.progressbarBar.addEventListener('mouseenter', this.mouseEnterProgressBar);
		this.progressbarBorder.addEventListener('mouseenter', this.mouseEnterProgressBar);

		// HOVER OFF PROGRESS BAR
		this.progressbar.addEventListener('mouseleave', function(){
			that.mouse.mouseenter.time = false;
			that.videoPlayer.classList.remove('mousetime-visible');
		});

		// MOUSE MOVE
		document.addEventListener('mousemove', that.mouseMove);

		// MOUSE UP
		document.addEventListener('mouseup', function(){
			that.mouse.click.volume = false;
			that.mouse.click.time = false;
			that.volumeZone.classList.remove('active');
			that.grabCursor( false );
		});
	};

});