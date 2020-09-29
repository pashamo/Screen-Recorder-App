const { desktopCapturer , remote } = require('electron');
const { Menu , dialog } = remote;
const { writeFile, write } = require('fs');

//Buttons
const videoElement = document.querySelector('video');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const videoSelectBtn = document.getElementById('videoSelectBtn');

//Get available video sources
const getVideoSources = async () => {
  const inputSources = await desktopCapturer.getSources({
    types: ['window', 'screen']
  });

  const videoOptionsMenu = Menu.buildFromTemplate(
    inputSources.map(source => {
      return {
        label: source.name,
        click: () => selectSource(source)
      };
    })
  );

  videoOptionsMenu.popup();
}


let mediaRecorder; //MediaRecorder instance to capture footage
let recordedChunks = [];

//Change to videoSource window to capture
const selectSource = async (source) => {
  videoSelectBtn.innerText = source.name;

  const constraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: source.id
      }
    }
  };

  //create stream
  const stream = await navigator.mediaDevices.getUserMedia(constraints);

  //preview the source in video
  videoElement.srcObject = stream;
  videoElement.play();

  //create the MediaRecorder
  const options = { mimeType: 'video/webm; codecs=vp9' };
  mediaRecorder = new MediaRecorder(stream, options);

  //register event handlers
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;
};

const handleDataAvailable = (e) => {
  console.log('video data available');
  recordedChunks.push(e.data);
};

const handleStop = async (e) => {
  const blob = new Blob(recordedChunks, {
    mimeType: 'video/webm; codecs=vp9'
  });

  const buffer = Buffer.from(await blob.arrayBuffer());

  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: "Save video",
    defaultPath: `vid-${Date.now()}.webm`
  });

  console.log(filePath);

  writeFile(filePath, buffer, () => console.log("Video saved successfully!"));
}

//Attaching Video Sources function to button
videoSelectBtn.onclick = getVideoSources;
startBtn.onclick = handleDataAvailable;
stopBtn.onclick = handleStop;
