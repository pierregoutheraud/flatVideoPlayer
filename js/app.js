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

		this.changeVolume = function(e){

			// Ajouter un setTimeout pour pas spamer le setVolume == LAG

			if( !that.clickVolume && e.type != "click" ) {
				return false;
			}

			$(this).addClass('active');

			var volumeZoneWidth = that.$volumeZone.width();
			var volumeBarWidth = parseInt( $('.controls__volume > .volumeBar').width() );
			// var percentBarVolume = (volumeBarWidth*100)/volumeZoneWidth;
			var percentBarVolume = 100 / $('.controls__volume > .volumeBar').length;

			var mouseX = (e.offsetX != null) ? e.offsetX : e.originalEvent.layerX;
			if( mouseX == 31 )
				mouseX = 32;

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
			console.log(newVolume);
			that.video.volume = newVolume;

			if( e.type == "click" ) {
				that.$volumeZone.removeClass('active');
			}

		};

		this.init();

		// Events
		this.$playPause.on('click', this.playPause);
		this.video.addEventListener('timeupdate', this.updateProgressBar, false);
		// this.video.addEventListener('play', this.play );
		// this.video.addEventListener('pause', this.pause );
		this.$volumeZone.on( 'mousemove click', this.changeVolume );
		this.$volumeZone.on('mousedown', function(){
		    that.clickVolume = true;
		});
		this.$volumeZone.on('dragstart drop', function(){
		    return false;
		});
		$(document).on('mouseup', function(){
			that.clickVolume = false;
			that.$volumeZone.removeClass('active');
		});

	};

});