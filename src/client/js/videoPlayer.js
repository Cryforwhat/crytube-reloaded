const video = document.querySelector("video");
const playBtn = document.getElementById("play");
const playBtnIcon = playBtn.querySelector("i");
const muteBtn = document.getElementById("mute");
const muteBtnIcon = muteBtn.querySelector("i");
const volumeRange = document.getElementById("volume");
const currentTime = document.getElementById("currentTime");
const totalTime = document.getElementById("totalTime");
const timeLine = document.getElementById("timeline");
const fullScreenBtn = document.getElementById("fullScreen");
const fullScreenIcon = fullScreenBtn.querySelector("i");
const videoContainer = document.getElementById("videoContainer");
const videoControls = document.getElementById("videoControls");

let controlsTimeout = null;
let controlsMovementTimeout = null;
let volumeValue = 0.5;
video.volume = volumeValue;

const handlePlayClick = (e) => {
	if (video.paused) {
		video.play();
	} else {
		video.pause();
	}
	playBtnIcon.classList = video.paused ? "fas fa-play" : "fas fa-pause";
};

const handlePause = () => (playBtn.innerText = "Play");
const handlePlay = () => (playBtn.innerText = "Pause");

const handleMute = (e) => {
	if (video.muted) {
		video.muted = false;
	} else {
		video.muted = true;
	}
	muteBtnIcon.classList = video.muted ? "fas fa-volume-mute" : "fas fa-volume-up";
	volumeRange.value = video.muted ? 0 : volumeValue;
};

const handleVolumeChange = (event) => {
	const {
		target: { value },
	} = event;
	if (video.muted) {
		video.muted = false;
		muteBtn.innerText = "Mute";
	}
	volumeValue = value;
	video.volume = value;
};

const formatTime = (seconds) => new Date(seconds * 1000).toISOString().substring(14, 19);

const handleMetadata = () => {
	totalTime.innerText = formatTime(Math.floor(video.duration));
	timeLine.max = Math.floor(video.duration);
};

const handleTimeUpdate = () => {
	currentTime.innerText = formatTime(Math.floor(video.currentTime));
	timeLine.value = Math.floor(video.currentTime);
};

let videoPlayStatus = false;
let setVideoPlayStatus = false;

const handleTimelineChange = (event) => {
	const {
		target: { value },
	} = event;
	if (!setVideoPlayStatus) {
		videoPlayStatus = video.paused ? false : true;
		setVideoPlayStatus = true;
	}
	video.pause();
	video.currentTime = value;
};

const handleTimelineSet = () => {
	videoPlayStatus ? video.play() : video.pause();
	setVideoPlayStatus = false;
};

const handleFullScreen = () => {
	const fullscreen = document.fullscreenElement;
	if (fullscreen) {
		document.exitFullscreen();
		fullScreenIcon.classList = "fas fa-expand";
	} else {
		videoContainer.requestFullscreen();
		fullScreenIcon.classList = "fas fa-compress";
	}
};

const hideControls = () => videoControls.classList.remove("showing");

const handleMouseMove = () => {
	if (controlsTimeout) {
		clearTimeout(controlsTimeout);
		controlsTimeout = null;
	}

	if (controlsMovementTimeout) {
		clearTimeout(controlsMovementTimeout);
		controlsMovementTimeout = null;
	}
	videoControls.classList.add("showing");
	controlsMovementTimeout = setTimeout(hideControls, 2000);
};

const handleMouseLeave = () => {
	controlsTimeout = setTimeout(hideControls, 2000);
};

const handleEnded = () => {
	const { id } = videoContainer.dataset;

	fetch(`/api/videos/${id}/view`, {
		method: "POST",
	});
};

const handleKeydown = (event) => {
	if (event.target.id === "textarea") {
		return;
	}
	switch (event.keyCode) {
		case 77:
			handleMute(); // mute
			break;
		case 70:
			handleFullScreen(); // fullscreen
			break;

		case 37:
			video.currentTime -= 5; // ⬅️
			break;
		case 39:
			video.currentTime += 5; // ➡️
			break;
		case 38:
			volumeValue += 0.1; // ⬆️
			volumeRange.value = volumeValue;
			video.volume = volumeRange.value;
			event.preventDefault();
			break;
		case 40:
			volumeValue -= 0.1; // ⬇️
			volumeRange.value = volumeValue;
			video.volume = volumeRange.value;
			event.preventDefault();
			changeMuteIcon();
			break;
		case 32:
			handlePlayClick(); // spacebar
			event.preventDefault(); // prevent scroll down
			break;
	}
};

playBtn.addEventListener("click", handlePlayClick);
muteBtn.addEventListener("click", handleMute);
volumeRange.addEventListener("input", handleVolumeChange);
fullScreenBtn.addEventListener("click", handleFullScreen);
window.addEventListener("keydown", handleKeydown);
video.readyState ? handleMetadata() : video.addEventListener("loadeddata", handleMetadata);
video.addEventListener("timeupdate", handleTimeUpdate);
video.addEventListener("click", handlePlayClick);
video.addEventListener("ended", handleEnded);
videoContainer.addEventListener("mousemove", handleMouseMove);
videoContainer.addEventListener("mouseleave", handleMouseLeave);
timeLine.addEventListener("input", handleTimelineChange);
timeLine.addEventListener("change", handleTimelineSet);
