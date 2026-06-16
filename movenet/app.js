import * as tf from "https://esm.sh/@tensorflow/tfjs@4.22.0";

async function iniciar() {
  await tf.setBackend("webgl");
  await tf.ready();

  console.log("TensorFlow OK");

  const model = await tf.loadGraphModel(
    "https://tfhub.dev/google/tfjs-model/movenet/singlepose/lightning/4",
    { fromTFHub: true },
  );

  console.log("MoveNet cargado");

  const video = document.getElementById("video");

  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
  });

  video.srcObject = stream;

  await video.play();

  console.log("Cámara iniciada");
}
setInterval(async () => {
  const tensor = tf.browser.fromPixels(video);

  const resized = tf.image.resizeBilinear(tensor, [192, 192]);

  const input = resized.expandDims(0);

  const prediction = await model.executeAsync(input);

  console.log(prediction);

  tensor.dispose();
  resized.dispose();
  input.dispose();
}, 1000);

iniciar();
