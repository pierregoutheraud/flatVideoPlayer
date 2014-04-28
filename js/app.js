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

$(function(){

	var videoPlayer =  new function(){

		this.$videoPlayer = $('.videoPlayer');
		this.$video = $('.videoPlayer__video');
		this.video = this.$video[0];
		this.$playPause = $('.controls__playPause');
		this.$progressbar = $('.controls__progressbar');
		this.$progressbarBar = $('.progressbar__bar');
		this.$bufferBar = $('.progressbar__bufferbar');
		this.progressPercentage = 0;
		this.bufferPercentage = 0;
		this.$volume = $('.controls__volume');
		this.$volumeZone = $('.controls__volume__zone');
		this.$fullscreen = $('.controls__fullscreen');
		this.$playerZone = $('.videoPlayer__zone');
		this.$playerControls = $('.videoPlayer__controls');
		this.$playerTime = $('.progressbar__time > div');
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
			click : {}
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
			this.setTime( this.time.duration.format );
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
		this.setTime = function( timeString ) {
			that.$playerTime.find('span').text( timeString );
		};


		this.playPause = function(){
			if (that.video.paused || that.video.ended)
				that.play();
			else
				that.pause();
		};
		this.play = function(){
			// console.log('play function');
			this.$playPause.removeClass('play').addClass('pause');
			this.video.play();
		};
		this.pause = function(){
			// console.log('pause function');
			this.$playPause.removeClass('pause').addClass('play');
			this.video.pause();
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
			that.$progressbarBar.css('width', that.progressPercentage + '%');

			that.time.current.seconds = that.video.currentTime;
			that.time.current.format = that.toFormatMinutesSeconds( that.time.current.seconds );
			that.setTime( that.time.current.format );

			// Move time
			that.$playerTime.css('left', that.progressPercentage + '%');

			/*
			// that.time.seconds = this.currentTime.toFixed(1);
			that.time.minutes = parseInt( this.currentTime / 60 );
			that.time.minutes = (that.time.minutes < 10) ? '0' + that.time.minutes : that.time.minutes;

			that.time.seconds = (this.currentTime % 60).toFixed(0);
			that.time.seconds = (that.time.seconds < 10) ? '0' + that.time.seconds : that.time.seconds;

			that.time.currentTimeString = that.time.minutes + ':' + that.time.seconds;
			that.$playerTime.find('span').text( that.time.currentTimeString );
			that.$playerTime.css('left', that.progressPercentage + '%');
			*/

			if( this.currentTime >= this.duration )
				that.end();

		};

		this.end = function(){
			this.$playPause.removeClass('pause').addClass('play');
		};

		var percentVidLoaded;
		this.updateBufferBar = function(){
			/*
			console.log( this.buffered.end );
			that.bufferPercentage = (this.buffered.end(0) / this.duration) * 100;
			if( that.bufferPercentage > 100 )
				that.bufferPercentage = 100;
			that.$bufferBar.css('width', that.bufferPercentage + '%');
			*/

			percentVidLoaded = null;

			// FF4+, Chrome
			if (that.video && that.video.buffered && that.video.buffered.length > 0 && that.video.buffered.end && that.video.duration) {
			    percentVidLoaded = that.video.buffered.end(0) / that.video.duration;
			}
			/* Some browsers (e.g., FF3.6 and Safari 5) cannot calculate target.bufferered.end()
			 *  to be anything other than 0. If the byte count is available we use this instead.
			 *  Browsers that support the else if do not seem to have the bufferedBytes value and
			 *  should skip to there.
			 */
			else if (that.video && that.video.bytesTotal != undefined && that.video.bytesTotal > 0 && that.video.bufferedBytes != undefined) {
			    percentVidLoaded = that.video.bufferedBytes / that.video.bytesTotal;
			}

			if (percentVidLoaded !== null) {
			    percentVidLoaded = 100 * Math.min(1, Math.max(0, percentVidLoaded));
			} else {
				percentVidLoaded = 100;
			}

			that.$bufferBar.css('width', percentVidLoaded + '%');
		};

		this.changeTime = function(){
			var mouseX = that.getMousePosXRelativeTo( that.$progressbar );
			var barWidth = that.$progressbar.width();
			var percentMouseX = (mouseX*100)/barWidth;
			var newTime = (percentMouseX/100)*that.video.duration;
			that.video.currentTime = newTime;
			that.$progressbarBar.css('width', percentMouseX + '%');
		};

		this.getMousePosXRelativeTo = function( $el ){
			// On récupère la position de la souris par rapport à la volumeZone
			var mouseX = that.mouse.x - $el.offset().left;
			if( mouseX < 0)
				mouseX = 0;
			else if( mouseX > $el.width() )
				mouseX = $el.width();

			return mouseX;
		};

		this.changeVolume = function(){

			var mouseX = that.getMousePosXRelativeTo( that.$volumeZone );

			// if( !that.click.volume && e.type != "click" ) {
			// 	return false;
			// }
			// $(this).addClass('active');

			var volumeZoneWidth = that.$volumeZone.width(),
				volumeBarWidth = parseInt( $('.controls__volume > .volumeBar').width() ),
				percentBarVolume = 100 / $('.controls__volume > .volumeBar').length;

			var percentMouseX = (mouseX*100)/volumeZoneWidth;
			if( percentMouseX > 95 )
				percentMouseX = 100;

			// On ramène le résultat à une proportion pour une largeur sans les marges (qui font 3px) entre les bars
			mouseX *= ((($('.controls__volume > .volumeBar').length*volumeBarWidth)*100)/volumeZoneWidth)/100;

			var nbBarFull = Math.floor(mouseX/volumeBarWidth);
			var lastPx = Math.round(mouseX%volumeBarWidth);

			$('.controls__volume > .volumeBar').find('.volumeBar').css('width', '0' );
			$('.controls__volume > .volumeBar:lt('+nbBarFull+')').find('.volumeBar').css('width', '100%' );
			$('.controls__volume > .volumeBar:eq('+(nbBarFull)+')').find('.volumeBar').css('width', lastPx + 'px' );

			var newVolume = Math.round(parseFloat(percentMouseX/100)*100)/100;
			// console.log(newVolume);
			that.video.volume = newVolume;

			// if( e.type == "click" ) {
			// 	that.$volumeZone.removeClass('active');
			// }

		};

		this.showControls = function(){
			that.$videoPlayer.removeClass('controls-hidden');
		};
		this.hideControls = function(){

			// On ne cache pas si on est en train de changer le time ou le volume
			if( that.mouse.click.volume || that.mouse.click.time )
				return false;

			that.$videoPlayer.addClass('controls-hidden');

		};

		this.togglefullscreen = function(){


			if( that.$videoPlayer.hasClass('fullscreen') ){

				if (that.video.ExitFullscreen) {
					that.video.ExitFullscreen();
				} else if (that.video.mozExitFullScreen) {
					that.video.mozExitFullScreen(); // Firefox
				} else if (that.video.webkitExitFullscreen) {
					that.video.webkitExitFullscreen(); // Chrome and Safari
				}

				// On remet l'event mousemouve sur le document et on remove celui sur le player et les controls
				$(document).on('mousemove', that.mouseMove);
				that.$playerZone.hide().add( that.$playerControls ).off('mousemove', that.mouseMove);

			} else {

				if (that.video.requestFullscreen) {
					that.video.requestFullscreen();
				} else if (that.video.mozRequestFullScreen) {
					that.video.mozRequestFullScreen(); // Firefox
				} else if (that.video.webkitRequestFullscreen) {
					that.video.webkitRequestFullscreen(); // Chrome and Safari
				}

				// On retire l'event mousemouve du document et on l'ajoute sur le player et les controls
				$(document).off('mousemove', that.mouseMove);
				that.$playerZone.show().add( that.$playerControls ).on('mousemove', that.mouseMove);
			}

			that.$videoPlayer.toggleClass('fullscreen');
		};

		this.mouseMove = function(e){
			that.mouse.x = e.clientX;
			that.mouse.y = e.clientY;

			// console.log(e.clientX);

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

			// Detect when mouse is not moving
			clearTimeout(that.timeoutMousemove);
			that.timeoutMousemove = setTimeout(function(){
				that.hideControls();
			},1500);
		};

		// Events
		// this.video.addEventListener('readystatechange ', function(){console.log('state change');});
		this.video.addEventListener('durationchange', function(){
			// A partir de là on récup la duration
			that.init();
		});
		this.$videoPlayer.on('mouseenter mousemove', this.showControls);
		this.$videoPlayer.on('mouseleave', this.hideControls);
		this.$playPause.on('click', this.playPause);
		this.$fullscreen.on('click', this.togglefullscreen);
		this.video.addEventListener('timeupdate', this.updateProgressBar, false);
		this.video.addEventListener('progress', this.updateBufferBar, false);
		// this.video.addEventListener('play', this.play );
		// this.video.addEventListener('pause', this.pause );
		this.$volumeZone.add(this.$progressbar).on( 'dragstart drop', function(){
			return false;
		});
		this.$volumeZone.on( 'click', this.changeVolume );
		this.$progressbar.on( 'click', this.changeTime );

		// MOUSE DOWN
		this.$volumeZone.on('mousedown', function(){
		    that.mouse.click.volume = true;
		});
		this.$progressbar.on('mousedown', function(){
			that.pause();
		    that.mouse.click.time = true;
		});

		// MOUSE MOVE
		$(document).on('mousemove', that.mouseMove);

		// MOUSE UP
		$(document).on('mouseup', function(){
			that.mouse.click.volume = false;
			that.mouse.click.time = false;
			that.$volumeZone.removeClass('active');
		});

	};

});