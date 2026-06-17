import * as tf from "https://esm.sh/@tensorflow/tfjs@4.22.0";

async function iniciar() {
  try {
    await tf.setBackend("webgl");
    await tf.ready();

    console.log("✅ TensorFlow OK");

    const model = await tf.loadGraphModel(
      "https://tfhub.dev/google/tfjs-model/movenet/singlepose/lightning/4",
      { fromTFHub: true },
    );

    console.log("✅ MoveNet cargado");

    const video = document.getElementById("video");
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    // Iniciar cámara
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { 
        facingMode: "user",
        width: { ideal: 640 },
        height: { ideal: 480 }
      }
    });

    video.srcObject = stream;
    
    // Esperar a que el video esté listo
    await new Promise((resolve) => {
      video.onloadedmetadata = () => {
        video.play();
        resolve();
      };
    });

    // Configurar el canvas DESPUÉS de que el video tenga dimensiones
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    console.log("📹 Video:", video.videoWidth, "x", video.videoHeight);
    console.log("🖼️ Canvas:", canvas.width, "x", canvas.height);

    // Forzar que el canvas se vea
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";

    // Dibujar texto de prueba
    ctx.fillStyle = "red";
    ctx.fillRect(10, 10, 200, 100);
    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.fillText("CANVAS ACTIVO", 20, 60);
    console.log("✅ Texto de prueba dibujado");

    console.log("📷 Cámara iniciada");
    let mostrarPuntos = true;

    const boton = document.getElementById("toggle");
    boton.addEventListener("click", () => {
      mostrarPuntos = !mostrarPuntos;
      boton.textContent = mostrarPuntos ? "Ocultar puntos" : "Mostrar puntos";
      boton.classList.toggle("oculto", !mostrarPuntos);
    });

    const fpsTexto = document.getElementById("fps");
    let frameCount = 0;

    async function detectar() {
      try {
        // Verificar que el video esté listo
        if (!video.videoWidth || !video.videoHeight) {
          requestAnimationFrame(detectar);
          return;
        }

        // Asegurar que el canvas tenga las dimensiones correctas
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          console.log("🔄 Canvas actualizado:", canvas.width, "x", canvas.height);
        }

        const inicio = performance.now();

        // Crear tensor desde el video
        const tensor = tf.browser.fromPixels(video);
        const resized = tf.image.resizeBilinear(tensor, [192, 192]);
        const input = resized.cast("int32").expandDims(0);

        // Ejecutar el modelo
        const prediction = model.execute(input);
        const datos = await prediction.array();
        
        // Obtener keypoints - formato [y, x, score]
        const keypoints = datos[0][0];
        
        // Calcular FPS
        const fin = performance.now();
        const fps = 1000 / (fin - inicio);
        fpsTexto.textContent = `FPS: ${fps.toFixed(1)}`;

        // LIMPIAR canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // SIEMPRE dibujar información de depuración
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        ctx.fillRect(0, 0, canvas.width, 80);
        
        ctx.fillStyle = "#00FF00";
        ctx.font = "16px Arial";
        ctx.fillText(`FPS: ${fps.toFixed(1)} | Puntos: ${keypoints.length}`, 10, 30);
        ctx.fillText(`Canvas: ${canvas.width}x${canvas.height} | Frame: ${frameCount++}`, 10, 55);

        // Dibujar puntos si está activado
        if (mostrarPuntos) {
          let puntosVisibles = 0;
          
          for (let i = 0; i < keypoints.length; i++) {
            const punto = keypoints[i];
            const y = punto[0];
            const x = punto[1];
            const score = punto[2];
            
            // Solo dibujar si la confianza es mayor a 0.3
            if (score > 0.3) {
              puntosVisibles++;
              
              // Convertir coordenadas normalizadas a píxeles
              const xPixel = x * canvas.width;
              const yPixel = y * canvas.height;
              
              // Dibujar círculo grande y brillante
              ctx.beginPath();
              ctx.arc(xPixel, yPixel, 12, 0, Math.PI * 2);
              ctx.fillStyle = "#FF0000";
              ctx.fill();
              ctx.strokeStyle = "#FFFFFF";
              ctx.lineWidth = 3;
              ctx.stroke();
              
              // Dibujar número del punto
              ctx.fillStyle = "#FFFF00";
              ctx.font = "10px Arial";
              ctx.fillText(i, xPixel + 15, yPixel - 5);
              
              // Dibujar score
              ctx.fillStyle = "#00FFFF";
              ctx.font = "9px Arial";
              ctx.fillText(score.toFixed(2), xPixel + 15, yPixel + 10);
            }
          }
          
          // Mostrar cuántos puntos se detectaron
          ctx.fillStyle = "#FFFF00";
          ctx.font = "16px Arial";
          ctx.fillText(`Puntos visibles: ${puntosVisibles}`, 10, 80);
          
          if (puntosVisibles === 0) {
            ctx.fillStyle = "#FF6600";
            ctx.font = "20px Arial";
            ctx.fillText("⚠️ ESPERANDO DETECCIÓN...", 10, 120);
          }
        }

        // Liberar memoria
        prediction.dispose();
        tensor.dispose();
        resized.dispose();
        input.dispose();

      } catch (error) {
        console.error("❌ Error en detección:", error);
        ctx.fillStyle = "#FF0000";
        ctx.font = "20px Arial";
        ctx.fillText(`Error: ${error.message}`, 10, 100);
      }

      // Solicitar siguiente frame
      requestAnimationFrame(detectar);
    }

    // Iniciar la detección después de un pequeño delay
    setTimeout(() => {
      detectar();
    }, 500);

  } catch (error) {
    console.error("❌ Error general:", error);
    alert("Error al iniciar: " + error.message);
  }
}

// Iniciar la aplicación
iniciar();