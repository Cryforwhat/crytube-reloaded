import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";

const startBtn = document.getElementById("startBtn");
const video = document.getElementById("preview");

let stream;
let recorder;
let videoFile;

const files = {
	input: "recording.webm",
	output: "output.mp4",
	thumbnail: "thumbnail.jpg",
};

const downloadFile = (fileURL, fileName) => {
	const a = document.createElement("a");
	a.href = fileURL;
	a.download = fileName;
	document.body.appendChild(a);
	a.click();
};

const handleDownload = async () => {
	actionBtn.removeEventListener("click", handleDownload);

	actionBtn.innerText = "Transcoding...";

	actionBtn.disabled = true;

	const ffmpeg = createFFmpeg({
		corePath: "https://unpkg.com/@ffmpeg/core@0.10.0/dist/ffmpeg-core.js",
		log: true,
	});
	await ffmpeg.load();

	ffmpeg.FS("writeFile", files.input, await fetchFile(videoFile));

	await ffmpeg.run("-i", files.input, "-r", "60", files.output);

	await ffmpeg.run("-i", files.input, "-ss", "00:00:01", "-frames:v", "1", files.thumbnail);

	const mp4File = ffmpeg.FS("readFile", files.output);
	const thumbFile = ffmpeg.FS("readFile", files.thumbnail);

	const mp4Blob = new Blob([mp4File.buffer], { type: "video/mp4" });
	const thumbBlob = new Blob([thumbFile.buffer], { type: "image/jpg" });

	const mp4URL = URL.createObjectURL(mp4Blob);
	const thumbURL = URL.createObjectURL(thumbBlob);

	downloadFile(mp4URL, "My Recording.mp4");
	downloadFile(thumbURL, "My thumbnail.jpg");

	ffmpeg.FS("unlink", files.output);
	ffmpeg.FS("unlink", files.thumbnail);
	ffmpeg.FS("unlink", files.input);

	URL.revokeObjectURL(thumbURL);
	URL.revokeObjectURL(mp4URL);
	URL.revokeObjectURL(videoFile);

	actionBtn.disabled = false;
	init();
	actionBtn.innerText = "Record Again";
	actionBtn.addEventListener("click", handleStart);
};

const handleStart = () => {
	actionBtn.innerText = "Stop Recording";
	actionBtn.innerText = "Recording";
	actionBtn.disabled = true;
	actionBtn.removeEventListener("click", handleStart);
	recorder = new window.MediaRecorder(stream);
	recorder.ondataavailable = (event) => {
		videoFile = URL.createObjectURL(event.data);
		video.srcObject = null;
		video.src = videoFile;
		video.loop = true;
		video.play();
		actionBtn.innerText = "Download";
		actionBtn.disabled = false;
		actionBtn.addEventListener("click", handleDownload);
	};
	recorder.start();
	setTimeout(() => {
		recorder.stop();
	}, 5000);
};

const init = async () => {
	stream = await navigator.mediaDevices.getUserMedia({
		audio: false,
		video: {
			width: 1024,
			height: 576,
		},
	});

	video.srcObject = stream;
	video.play();
};

init();

actionBtn.addEventListener("click", handleStart);
