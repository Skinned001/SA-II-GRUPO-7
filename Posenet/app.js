import * as tf from "https://esm.sh/@tensorflow/tfjs@4.22.0";
import * as posenet from "https://esm.sh/@tensorflow-models/posenet";

async function iniciar() {
  await tf.setBackend("webgl");
  await tf.ready();

  console.log("TensorFlow OK");
  console.log("Versión TF:", tf.version);

  console.log("PoseNet:", posenet);

  const net = await posenet.load({
    architecture: "MobileNetV1",
    outputStride: 16,
    inputResolution: { width: 640, height: 480 },
    multiplier: 0.75,
  });

  console.log("PoseNet cargado");

  const video = document.getElementById("video");

  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
  });

  video.srcObject = stream;

  await video.play();

  console.log(
    "Video:",
    video.videoWidth,
    video.videoHeight
  );

  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const fpsTexto = document.getElementById("fps");
  const boton = document.getElementById("toggle");

  let mostrarPuntos = true;

  boton.addEventListener("click", () => {
    mostrarPuntos = !mostrarPuntos;

    boton.textContent = mostrarPuntos
      ? "Ocultar puntos"
      : "Mostrar puntos";
  });

  async function detectar() {
    const inicio = performance.now();

    const pose = await net.estimateSinglePose(video, {
      flipHorizontal: false,
    });

    const fin = performance.now();

    const fps = 1000 / (fin - inicio);

    fpsTexto.textContent = `FPS: ${fps.toFixed(1)}`;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (mostrarPuntos) {
      for (const punto of pose.keypoints) {
        if (punto.score > 0.3) {
          ctx.beginPath();

          ctx.arc(
            punto.position.x,
            punto.position.y,
            8,
            0,
            Math.PI * 2
          );

          ctx.fillStyle = "blue";
          ctx.fill();
        }
      }
    }

    // Debug cada segundo
    if (Math.floor(Date.now() / 1000) % 2 === 0) {
      console.log("Pose:", pose);

      console.log(
        "Nariz:",
        pose.keypoints[0].position
      );

      console.log(
        "Ojo izquierdo:",
        pose.keypoints[1].position
      );

      console.log(
        "Ojo derecho:",
        pose.keypoints[2].position
      );
    }

    requestAnimationFrame(detectar);
  }

  detectar();
}

iniciar();