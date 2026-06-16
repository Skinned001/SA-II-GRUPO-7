import * as poseDetection from "https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection";
import "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs";

async function iniciar() {
  const video = document.getElementById("video");

  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
  });

  video.srcObject = stream;

  await new Promise((resolve) => {
    video.onloadedmetadata = resolve;
  });

  console.log(poseDetection);
  const model = poseDetection.SupportedModels.MoveNet;

  console.log(model);

  const detector = await poseDetection.createDetector(model);

  console.log("MoveNet cargado");

  setInterval(async () => {
    const poses = await detector.estimatePoses(video);

    console.clear();
    console.log(poses);
  }, 100);
}

iniciar();
