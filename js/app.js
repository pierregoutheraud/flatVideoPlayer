$(function(){

	var videoPlayer =  new function(){

		this.$videoPlayer = $('.videoPlayer');
		this.$video = $('.videoPlayer__video');
		this.video = this.$video[0];
		this.$playPause = $('.controls__playPause');
		this.$progressbarBar = $('.progressbar__bar');
		this.progressPercentage = 0;
		this.$volume = $('.controls__volume');
		this.$volumeZone = $('.controls__volume__zone');
		this.clickVolume = false;
		this.mouse = {};
		var that = this;

		// Functions
		this.init = function(){
			this.video.controls = false;
		};

		this.playPause = function(){

			if (that.video.paused || that.video.ended)
				that.play();
			else
				that.pause();
		};
		this.play = function(){
			console.log('play function');
			this.$playPause.removeClass('play').addClass('pause');
			this.video.play();
		};
		this.pause = function(){
			console.log('pause function');
			this.$playPause.removeClass('pause').addClass('play');
			this.video.pause();
		};

		this.updateProgressBar = function(){
			// this = video
			that.progressPercentage = Math.floor((100 / this.duration) * this.currentTime);
			that.$progressbarBar.css('width', that.progressPercentage + '%');

		};

		this.changeVolume = function(){

			// console.log(this.mouse.x);
			// console.log(this.$volumeZone.offset().left);

			var mouseX = this.mouse.x - this.$volumeZone.offset().left;
			if( mouseX < 0)
				mouseX = 0;
			else if( mouseX > this.$volumeZone.width() )
				mouseX = that.$volumeZone.width();

			// Ajouter un setTimeout pour pas spamer le setVolume == LAG

			// if( !that.clickVolume && e.type != "click" ) {
			// 	return false;
			// }

			$(this).addClass('active');

			var volumeZoneWidth = that.$volumeZone.width();
			var volumeBarWidth = parseInt( $('.controls__volume > .volumeBar').width() );
			// var percentBarVolume = (volumeBarWidth*100)/volumeZoneWidth;
			var percentBarVolume = 100 / $('.controls__volume > .volumeBar').length;

			// var mouseX = (e.offsetX != null) ? e.offsetX : e.originalEvent.layerX;
			// if( mouseX == 31 )
				// mouseX = 32;

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

		this.init();

		// Events
		this.$playPause.on('click', this.playPause);
		this.video.addEventListener('timeupdate', this.updateProgressBar, false);
		// this.video.addEventListener('play', this.play );
		// this.video.addEventListener('pause', this.pause );
		// this.$volumeZone.on( 'mousemove click', this.changeVolume );
		this.$volumeZone.on( 'dragstart drop', function(){
			return false;
		});
		// this.$volumeZone.on( 'click', this.changeVolume );
		this.$volumeZone.on('mousedown', function(){
		    that.mouse.clickVolume = true;
		});

		var canChangeVolume = true;
		$(document).mousemove(function(e){
			that.mouse.x = e.clientX;
			that.mouse.y = e.clientY;
			if( that.mouse.clickVolume && canChangeVolume ) {
				canChangeVolume = false;
				setTimeout(function(){
					canChangeVolume = true;
				}, 50);
				that.changeVolume();
			}
		});
		$(document).on('mouseup', function(){
			that.mouse.clickVolume = false;
			that.$volumeZone.removeClass('active');
		});

	};

});