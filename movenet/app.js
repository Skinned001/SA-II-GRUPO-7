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
  const canvas = document.getElementById("canvas");

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");

  console.log("Cámara iniciada");

  async function detectar() {
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }
    const tensor = tf.browser.fromPixels(video);

    const resized = tf.image.resizeBilinear(tensor, [192, 192]);

    const input = resized.cast("int32").expandDims(0);

    const prediction = model.execute(input);

    const datos = await prediction.array();
    const keypoints = datos[0][0];
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const punto of keypoints) {
      const y = punto[0];
      const x = punto[1];
      const score = punto[2];

      // console.log(x, y, score);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    for (const [y, x, score] of keypoints) {
      if (score > 0.3) {
        const xPixel = x * video.videoWidth;
        const yPixel = y * video.videoHeight;

        ctx.beginPath();
        ctx.arc(xPixel, yPixel, 10, 0, Math.PI * 2);
        ctx.fillStyle = "red";
        ctx.fill();
      }
    }

    // console.log(keypoints);

    // console.log(datos);

    prediction.dispose();

    tensor.dispose();
    resized.dispose();
    input.dispose();
    requestAnimationFrame(detectar);
  }

  detectar();
}

iniciar();
