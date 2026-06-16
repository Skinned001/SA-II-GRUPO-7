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

  setInterval(async () => {
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }
    const tensor = tf.browser.fromPixels(video);

    const resized = tf.image.resizeBilinear(tensor, [192, 192]);

    const input = resized.cast("int32").expandDims(0);

    const prediction = await model.executeAsync(input);

    const datos = await prediction.array();

    const keypoints = datos[0][0];

    const ctx = canvas.getContext("2d");

    ctx.beginPath();
    ctx.arc(xPixel, yPixel, 5, 0, Math.PI * 2);
    ctx.fill();

    console.log(keypoints);

    console.log(datos);

    prediction.dispose();

    tensor.dispose();
    resized.dispose();
    input.dispose();
  }, 1000);
}

iniciar();
