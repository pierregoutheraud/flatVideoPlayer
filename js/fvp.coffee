"use strict"

# Open Sans Google Font
WebFontConfig = google:
	families: ["Open+Sans:400italic,400,600,700:latin"]

(->
	wf = document.createElement("script")
	wf.src = ((if "https:" is document.location.protocol then "https" else "http")) + "://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js"
	wf.type = "text/javascript"
	wf.async = "true"
	s = document.getElementsByTagName("script")[0]
	s.parentNode.insertBefore wf, s
	return
)()
isOpera = !!window.opera or navigator.userAgent.indexOf(" OPR/") >= 0
isFirefox = typeof InstallTrigger isnt "undefined"
isSafari = Object::toString.call(window.HTMLElement).indexOf("Constructor") > 0
isChrome = !!window.chrome and not isOpera
isIE = false or !!document.documentMode #@cc_on!@


HTMLElement::wrap = (elms) ->
  elms = [elms]  unless elms.length
  i = elms.length - 1
  while i >= 0
    child = (if (i > 0) then @cloneNode(true) else this)
    el = elms[i]
    parent = el.parentNode
    sibling = el.nextSibling
    child.appendChild el
    if sibling
      parent.insertBefore child, sibling
    else
      parent.appendChild child
    i--

class FVP

	controlsHTML: """
	  <div class="videoPlayer__zone"></div>
	  <div class="videoPlayer__controls">
	      <button type="button" class="controls__playPause play"></button>
	      <div class="controls__progressbar">
	          <div class="progressbar__time">
	              <div><span>00:00</span></div>
	          </div>
	          <div class="progressbar__mousetime">
	              <div><span>00:00</span></div>
	          </div>
	          <div class="progressbar__bar"></div>
	          <div class="progressbar__border">
	              <div class="progressbar__bufferbar"></div>
	              <div class="progressbar__buffering">
	                  <svg width="110%">
	                      <defs>
	                          <pattern id="buffer" patternUnits="userSpaceOnUse" x="0" y="0" width="10" height="10" viewBox="0 0 10 10">
	                              <line x1="5" y1="-1" x2="-5" y2="10" stroke-width="2" stroke="rgba(255,255,255,0.3)" stroke-linecap="butt"></line>
	                              <line x1="10" y1="-1" x2="0" y2="10" stroke-width="2" stroke="rgba(255,255,255,0.3)" stroke-linecap="butt"></line>
	                              <line x1="15" y1="-1" x2="5" y2="10" stroke-width="2" stroke="rgba(255,255,255,0.3)" stroke-linecap="butt"></line>
	                          </pattern>
	                      </defs>
	                      <rect fill="url(#buffer)" width="100%" height="100%"></rect>
	                  </svg>
	              </div>
	          </div>
	      </div>
	      <div class="controls__volume">
	          <div class="volumeBar"><div class="volumeBar"></div></div>
	          <div class="volumeBar"><div class="volumeBar"></div></div>
	          <div class="volumeBar"><div class="volumeBar"></div></div>
	          <div class="volumeBar"><div class="volumeBar"></div></div>
	          <div class="volumeBar last"><div class="volumeBar"></div></div>
	          <div class="controls__volume__zone"></div>
	      </div>
	      <button type="button" class="controls__comment"></button>
	      <button type="button" class="controls__fullscreen"></button>
	  </div>
	"""
	time:
		current:
			minutes: 0
			seconds: 0
			format: ""

		duration:
			minutes: 0
			seconds: 0
			format: ""

	mouse:
		x: 0
		y: 0
		grab: false
		click: {}
		mouseenter: {}

	canChangeVolume: true
	canChangeTime: true
	timeoutMousemove: null

	constructor: (@videoSelector) ->

		@initHTML()

		# @video.addEventListener('readystatechange ', function(){console.log('state change');});
		@video.addEventListener "durationchange", @init

		@videoPlayer.addEventListener "mouseenter", @showControls
		@videoPlayer.addEventListener "mousemove", @showControls
		@videoPlayer.addEventListener "mouseleave", @hideControls
		@videoPlayPause.addEventListener "click", @playPause
		@fullscreen.addEventListener "click", @togglefullscreen
		@video.addEventListener "timeupdate", @updateProgressBar
		@video.addEventListener "progress", @updateBufferBar

		# @video.addEventListener('play', @play );
		# @video.addEventListener('pause', @pause );

		# Prevent DRAG & DROP
		volumeEls = document.querySelectorAll(".videoPlayer *")
		i = 0

		while i < volumeEls.length
			volumeEls[i].ondragstart = ->
				false
			i++

		# @volumeZone.addEventListener('drop',function(){return false;})
		# @progressbar.addEventListener('drop',function(){return false;})

		# @volumeZone.addEventListener( 'click', @changeVolume );
		@progressbar.addEventListener "click", @changeTime

		# MOUSE DOWN
		@volumeZone.addEventListener "mousedown", =>
			@mouse.click.volume = true
			@changeVolume()
			return

		@progressbar.addEventListener "mousedown", =>
			@mouse.click.time = true
			return

		# HOVER ON PROGRESS BAR
		@progressbarBar.addEventListener "mouseenter", @mouseEnterProgressBar
		@progressbarBorder.addEventListener "mouseenter", @mouseEnterProgressBar

		# HOVER OFF PROGRESS BAR
		@progressbar.addEventListener "mouseleave", =>
			@mouse.mouseenter.time = false
			@videoPlayer.classList.remove "mousetime-visible"
			return

		# MOUSE MOVE
		document.addEventListener "mousemove", @mouseMove

		# MOUSE UP
		document.addEventListener "mouseup", =>
			@mouse.click.volume = false
			@mouse.click.time = false
			@volumeZone.classList.remove "active"
			@grabCursor false

	initHTML: =>

		@video = document.querySelector @videoSelector
		@video.classList.add 'videoPlayer__video'

		@videoPlayer = document.createElement('div')
		@videoPlayer.classList.add 'videoPlayer'

		@videoPlayer.wrap( @video )

		@controls = document.createElement('div')
		@controls.innerHTML = @controlsHTML
		@videoPlayer.appendChild @controls

		@videoPlayPause = document.querySelector '.controls__playPause'
		@progressbar = document.querySelector '.controls__progressbar'
		@progressbarBar = document.querySelector '.progressbar__bar'
		@progressbarBorder = document.querySelector '.progressbar__border'
		@bufferBar = document.querySelector '.progressbar__bufferbar'
		@progressPercentage = 0
		@bufferPercentage = 0
		@volume = document.querySelector '.controls__volume'
		@volumeZone = document.querySelector '.controls__volume__zone'
		@fullscreen = document.querySelector '.controls__fullscreen'
		@playerZone = document.querySelector '.videoPlayer__zone'
		@playerControls = document.querySelector '.videoPlayer__controls'
		@playerTime = document.querySelector '.progressbar__time > div'
		@playerMouseTime = document.querySelector '.progressbar__mousetime > div'

	# Functions
	init: =>
		@video.controls = false
		@video.volume = 1

	# Set la duration de la vidéo et l'affiche
	initDuration: =>
		@time.duration.seconds = @video.duration
		@time.duration.format = @toFormatMinutesSeconds(@time.duration.seconds)
		@setTextTime @time.duration.format

	# seconds to minutes and seconds
	toFormatMinutesSeconds: (totalSeconds) =>
		minutes = @addZero(parseInt(totalSeconds / 60))
		seconds = @addZero((totalSeconds % 60).toFixed(0))
		minutes + ":" + seconds


	addZero: (number) =>
		if number < 10
			"0" + number
		else
			number

	setTextTime: (timeString) =>
		@playerTime.querySelector("span").textContent = timeString
		return

	setMouseTextTime: (timeString) =>
		@playerMouseTime.querySelector("span").textContent = timeString
		return

	playPause: =>
		if @video.paused or @video.ended
			@play()
		else
			@pause()
		return

	timeoutplay: undefined
	play: =>
		console.log "@play"

		#if( this.video.readyState != 4 ) {
		#       this.showBuffering();
		#       clearTimeout(timeoutplay);
		#       timeoutplay = setTimeout(function(){
		#         @play();
		#       }, 1000);
		#       return false;
		#     } else {
		#       this.hideBuffering();
		#     }
		@showPause()
		@video.play()
		return

	pause: =>
		console.log "@pause"
		@showPlay()
		@video.pause()
		return

	showPause: =>
		@videoPlayPause.classList.remove "play"
		@videoPlayPause.classList.add "pause"
		return

	showPlay: =>
		@videoPlayPause.classList.remove "pause"
		@videoPlayPause.classList.add "play"
		return

	showBuffering: =>
		@videoPlayer.classList.add "buffering"
		return


	# @showPause();
	hideBuffering: =>
		@videoPlayer.classList.remove "buffering"
		return

	isDurationInit: false
	updateProgressBar: =>

		#if( @video.readyState == 1 ) @showBuffering();
		#     else @hideBuffering();

		unless @isDurationInit
			@initDuration()
			@isDurationInit = true
			return false

		@progressPercentage = Math.floor((100 / @video.duration) * @video.currentTime)
		@progressPercentage = (100 / @video.duration) * @video.currentTime
		@progressbarBar.style.width = @progressPercentage + "%"
		@updateTime()
		@end() if @video.currentTime >= @video.duration

		# console.log @progressPercentage

	setMouseTime: (seconds, percent) =>
		mouseTime = @toFormatMinutesSeconds(seconds)
		@setMouseTextTime mouseTime
		@playerMouseTime.style.display = "block"
		@playerMouseTime.style.left = percent + "%"
		return

	setTime: (seconds, percent) =>
		@time.current.format = @toFormatMinutesSeconds(seconds)
		@setTextTime @time.current.format
		@playerTime.style.left = percent + "%"
		return

	updateTime: =>
		@time.current.seconds = @video.currentTime
		@time.current.format = @toFormatMinutesSeconds(@time.current.seconds)
		@setTextTime @time.current.format
		@playerTime.style.left = @progressPercentage + "%"
		return

	end: =>
		@videoPlayPause.classList.remove "pause"
		@videoPlayPause.classList.add "play"
		return


	# Get the index of the current part of the video which is buffering
	getCurrentIndexBuffer: =>
		current = @video.currentTime

		# Récupere l'index juste inférieur au current time
		indexLastBuffer = @video.buffered.length - 1
		currentIndexBuffer = 0
		i = indexLastBuffer

		while i >= 0
			start = @video.buffered.start(i)
			if start <= current
				currentIndexBuffer = i
				break
			i--
		currentIndexBuffer

	percentVidLoaded: undefined
	updateBufferBar: =>
		@percentVidLoaded = null

		# FF4+, Chrome
		if @video and @video.buffered and @video.buffered.length > 0 and @video.buffered.end and @video.duration
			@percentVidLoaded = @video.buffered.end(@getCurrentIndexBuffer()) / @video.duration

		# Some browsers (e.g., FF3.6 and Safari 5) cannot calculate target.bufferered.end()
		#  to be anything other than 0. If the byte count is available we use this instead.
		#  Browsers that support the else if do not seem to have the bufferedBytes value and
		#  should skip to there.
		else @percentVidLoaded = @video.bufferedBytes / @video.bytesTotal  if @video and @video.bytesTotal isnt `undefined` and @video.bytesTotal > 0 and @video.bufferedBytes isnt `undefined`
		if @percentVidLoaded isnt null
			@percentVidLoaded = 100 * Math.min(1, Math.max(0, @percentVidLoaded))
		else


		# @percentVidLoaded = 100;
		@bufferBar.style.width = @percentVidLoaded + "%"
		return

	grabCursor: (setCursor) =>
		setCursor = true  if typeof setCursor is "undefined"
		return false  if @mouse.grab and setCursor
		@mouse.grab = true
		grabCursor = undefined

		# IE doesn't support co-ordinates
		cursCoords = (if isIE then "" else " 8 8")
		urlCloseHandCursor = "https://mail.google.com/mail/images/2/closedhand.cur"
		grabCursor = (if isFirefox then "-moz-grabbing" else "url(" + urlCloseHandCursor + ")" + cursCoords + ", move")

		# Opera doesn't support url cursors and doesn't fall back well...
		grabCursor = "move"  if isOpera

		# Desactiver curseur
		unless setCursor
			grabCursor = ""
			@mouse.grab = false
		document.body.style.cursor = grabCursor
		videoElements = document.querySelectorAll(".videoPlayer *")
		i = 0

		while i < videoElements.length
			videoElements[i].style.cursor = grabCursor
			i++
		return

	changeTime: =>
		@videoPlayer.classList.remove "mousetime-visible"
		mouseX = @getMousePosXRelativeTo(@progressbar)
		barWidth = @progressbar.offsetWidth
		percentMouseX = (mouseX * 100) / barWidth
		newTime = (percentMouseX / 100) * @video.duration
		@progressbarBar.style.width = percentMouseX + "%"
		@setTime newTime, percentMouseX
		@video.currentTime = newTime
		return

	changeMouseTime: =>
		@videoPlayer.classList.add "mousetime-visible"
		mouseX = @getMousePosXRelativeTo(@progressbar)
		barWidth = @progressbar.offsetWidth
		percentMouseX = (mouseX * 100) / barWidth
		newTime = (percentMouseX / 100) * @video.duration
		@setMouseTime newTime, percentMouseX
		return

	getMousePosXRelativeTo: (el) =>

		# On récup¨re la position de la souris par rapport   la volumeZone
		rectEl = el.getBoundingClientRect()
		elOffset =
			top: rectEl.top + document.body.scrollTop
			left: rectEl.left + document.body.scrollLeft

		mouseX = @mouse.x - elOffset.left
		if mouseX < 0
			mouseX = 0
		else mouseX = el.offsetWidth  if mouseX > el.offsetWidth
		mouseX

	changeVolume: =>
		@grabCursor()
		mouseX = @getMousePosXRelativeTo(@volumeZone)

		# if( !@click.volume && e.type != "click" ) {
		#   return false;
		# }
		# $(this).classList.add('active');
		volumeZoneWidth = @volumeZone.offsetWidth
		volumeBarWidth = parseInt(document.querySelector(".controls__volume > .volumeBar").offsetWidth)
		percentBarVolume = 100 / document.querySelector(".controls__volume > .volumeBar").length
		percentMouseX = (mouseX * 100) / volumeZoneWidth
		percentMouseX = 100  if percentMouseX > 95

		# On ramène le résultat a une proportion pour une largeur sans les marges (qui font 3px) entre les bars
		mouseX *= (((document.querySelectorAll(".controls__volume > .volumeBar").length * volumeBarWidth) * 100) / volumeZoneWidth) / 100
		nbBarFull = Math.floor(mouseX / volumeBarWidth)
		lastPx = Math.round(mouseX % volumeBarWidth)
		volumeBars = document.querySelectorAll(".controls__volume > .volumeBar")
		Array::forEach.call volumeBars, (el, i) ->
			if i < nbBarFull
				el.querySelector(".volumeBar").style.width = "100%"
			else if i is nbBarFull
				el.querySelector(".volumeBar").style.width = lastPx + "px"
			else
				el.querySelector(".volumeBar").style.width = "0"
			return

		newVolume = Math.round(parseFloat(percentMouseX / 100) * 100) / 100

		# console.log(newVolume);
		@video.volume = newVolume
		return


	# if( e.type == "click" ) {
	#   @$volumeZone.classList.remove('active');
	# }
	showControls: =>
		@videoPlayer.classList.remove "controls-hidden"
		return

	hideControls: =>

		# On ne cache pas si on est en train de changer le time ou le volume
		return false  if @mouse.click.volume or @mouse.click.time
		@videoPlayer.classList.add "controls-hidden"
		return

	togglefullscreen: =>
		if @videoPlayer.classList.contains("fullscreen")
			if document.ExitFullscreen
				document.ExitFullscreen()
			else if document.mozExitFullScreen
				document.mozExitFullScreen() # Firefox
			else document.webkitExitFullscreen()  if document.webkitExitFullscreen # Chrome and Safari

			# On remet l'event mousemouve sur le document et on remove celui sur le player et les controls
			document.addEventListener "mousemove", @mouseMove
			@playerZone.style.display = "none"
			@playerZone.removeEventListener "mousemove", @mouseMove
			@playerControls.removeEventListener "mousemove", @mouseMove
		else
			if @video.requestFullscreen
				@video.requestFullscreen()
			else if @video.mozRequestFullScreen
				@video.mozRequestFullScreen() # Firefox
			else @video.webkitRequestFullscreen()  if @video.webkitRequestFullscreen # Chrome and Safari

			# On retire l'event mousemouve du document et on l'ajoute sur le player et les controls
			document.removeEventListener "mousemove", @mouseMove
			@playerZone.style.display = "block"
			@playerZone.addEventListener "mousemove", @mouseMove
			@playerControls.addEventListener "mousemove", @mouseMove
		@videoPlayer.classList.toggle "fullscreen"
		return

	mouseMove: (e) =>

		@mouse.x = e.clientX
		@mouse.y = e.clientY
		if @mouse.click.volume and @canChangeVolume
			@canChangeVolume = false
			setTimeout ( =>
				@canChangeVolume = true
			), 50
			console.log 'changeVolume'
			@changeVolume()
		else if @mouse.click.time and @canChangeTime
			@canChangeTime = false
			setTimeout ( =>
				@canChangeTime = true
			), 50
			@changeTime()

		# Detect mouseenter + mousemove on time
		@changeMouseTime() if @mouse.mouseenter.time and not @mouse.click.time

		# Detect when mouse is not moving
		clearTimeout @timeoutMousemove
		unless @mouse.mouseenter.time
			@timeoutMousemove = setTimeout =>
				@hideControls()
			, 1500

	mouseEnterProgressBar: (e) =>
		@mouse.mouseenter.time = true
		return