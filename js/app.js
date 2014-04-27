"use strict";

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
		this.mouse = {
			click : {}
		};
		var that = this;

		// Functions
		this.init = function(){
			this.video.controls = false;
			this.video.volume = 1;
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

		this.updateProgressBar = function(){
			// this = video
			// that.progressPercentage = Math.floor((100 / this.duration) * this.currentTime);
			that.progressPercentage = (100 / this.duration) * this.currentTime;
			that.$progressbarBar.css('width', that.progressPercentage + '%');

			console.log( this.currentTime );
			console.log( this.duration );

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

			} else {

				if (that.video.requestFullscreen) {
					that.video.requestFullscreen();
				} else if (that.video.mozRequestFullScreen) {
					that.video.mozRequestFullScreen(); // Firefox
				} else if (that.video.webkitRequestFullscreen) {
					that.video.webkitRequestFullscreen(); // Chrome and Safari
				}
			}

			that.$videoPlayer.toggleClass('fullscreen');
		};

		this.init();

		// Events
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
		this.$volumeZone.on('mousedown', function(){
		    that.mouse.click.volume = true;
		});
		this.$progressbar.on('mousedown', function(){
			that.pause();
		    that.mouse.click.time = true;
		});

		var canChangeVolume = true,
			canChangeTime = true,
			timeoutMousemove;

		// MOUSE MOVE
		$(document).mousemove(function(e){
			that.mouse.x = e.clientX;
			that.mouse.y = e.clientY;

			if( that.mouse.click.volume && canChangeVolume ) {
				canChangeVolume = false;
				setTimeout(function(){
					canChangeVolume = true;
				}, 50);
				that.changeVolume();
			}

			if( that.mouse.click.time && canChangeTime ) {
				canChangeTime = false;
				setTimeout(function(){
					canChangeTime = true;
				}, 50);
				that.changeTime();
			}

			// Detect when mouse is not moving
			clearTimeout(timeoutMousemove);
			timeoutMousemove = setTimeout(function(){
				that.hideControls();
			},2000);
		});

		// MOUSE UP
		$(document).on('mouseup', function(){
			that.mouse.click.volume = false;
			that.mouse.click.time = false;
			that.$volumeZone.removeClass('active');
		});

	};

});