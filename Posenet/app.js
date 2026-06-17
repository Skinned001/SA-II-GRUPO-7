import * as tf from "https://esm.sh/@tensorflow/tfjs@4.22.0";
import * as posenet from "https://esm.sh/@tensorflow-models/posenet";

async function iniciar() {
  await tf.setBackend("webgl");
  await tf.ready();

  console.log("TensorFlow OK");

  const net = await posenet.load();

  console.log("PoseNet cargado");

  const video = document.getElementById("video");

  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
  });

  video.srcObject = stream;

  await video.play();

  const canvas = document.getElementById("canvas");
  const FPS = document.getElementById("fps");

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");

  let mostrarPuntos = true;
  let ultimoTiempo = performance.now();

  const boton = document.getElementById("toggle");

  boton.addEventListener("click", () => {
    mostrarPuntos = !mostrarPuntos;

    boton.textContent = mostrarPuntos ? "Ocultar puntos" : "Mostrar puntos";
  });

  async function detectar() {
    const inicio = performance.now();

    const pose = await net.estimateSinglePose(video);

    const fin = performance.now();
    const fps = 1000 / (fin - inicio);

    FPS.textContent = `FPS: ${fps.toFixed(1)}`;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (mostrarPuntos) {
      for (const punto of pose.keypoints) {
        if (punto.score > 0.3) {
          ctx.beginPath();
          ctx.arc(punto.position.x, punto.position.y, 8, 0, Math.PI * 2);
          ctx.fillStyle = "blue";
          ctx.fill();
        }
      }
    }

    requestAnimationFrame(detectar);
  }

  detectar();
}

iniciar();
