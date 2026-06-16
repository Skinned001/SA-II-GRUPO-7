const video = document.getElementById("video");

async function iniciarCamara() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
  });

  video.srcObject = stream;

  console.log("Camara iniciada");
}

iniciarCamara();
