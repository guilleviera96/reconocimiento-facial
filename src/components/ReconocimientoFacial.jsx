import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import * as tf from "@tensorflow/tfjs";

const ReconocimientoFacial = ({ onSuccess }) => {
  const webcamRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [location, setLocation] = useState(null);
  const [usuariosDescriptors, setUsuariosDescriptors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorCamara, setErrorCamara] = useState(false);

  const usuarios = [
    { nombre: "Guille", archivo: "/usuarios/guille.jpeg" },
    { nombre: "Camilo", archivo: "/usuarios/camilo.jpeg" },
  ];

  useEffect(() => {
    const loadModelsAndUsers = async () => {
      await tf.setBackend("cpu");
      await tf.ready();

      const MODEL_URL = "/models";

      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        console.log("✅ Modelos cargados correctamente.");
      } catch (error) {
        console.error("❌ Error cargando modelos:", error);
        alert("Error cargando modelos.");
        setLoading(false);
        return;
      }

      // carga de descriptores de todos los usuarios
      const descriptores = [];
      for (const usuario of usuarios) {
        try {
          const img = await faceapi.fetchImage(usuario.archivo);
          const detection = await faceapi
            .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();

          if (detection) {
            descriptores.push({
              nombre: usuario.nombre,
              descriptor: detection.descriptor,
            });
            console.log(`🧠 Rostro cargado: ${usuario.nombre}`);
          } else {
            console.warn(`⚠️ No se detectó rostro para ${usuario.nombre}`);
          }
        } catch (err) {
          console.error(`❌ Error con ${usuario.nombre}:`, err);
        }
      }

      if (descriptores.length === 0) {
        alert("No se pudo cargar ningún rostro de referencia.");
        setLoading(false);
        return;
      }

      setUsuariosDescriptors(descriptores);
      setModelsLoaded(true);
      setLoading(false);
    };

    loadModelsAndUsers();

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => {
        console.error("⚠️ Error geolocalización:", error);
      }
    );
  }, []);

  const handleCapture = () => {
    const screenshot = webcamRef.current.getScreenshot();

    if (!screenshot) {
      alert("No se pudo obtener imagen de la cámara.");
      return;
    }

    const img = new Image();
    img.src = screenshot;

    img.onload = async () => {
      const liveDetection = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!liveDetection) {
        alert("No se detectó ningún rostro.");
        return;
      }

      if (usuariosDescriptors.length === 0) {
        alert("No hay descriptores cargados.");
        return;
      }

      // buscar la menor distancia
      let distanciaMinima = Infinity;
      let usuarioDetectado = null;

      for (const usuario of usuariosDescriptors) {
        const distancia = faceapi.euclideanDistance(
          liveDetection.descriptor,
          usuario.descriptor
        );

        if (distancia < distanciaMinima) {
          distanciaMinima = distancia;
          usuarioDetectado = usuario;
        }
      }

      console.log("🔍 Distancia más baja:", distanciaMinima);

      if (distanciaMinima < 0.4) {
        const ahora = new Date();
        const hora = ahora.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        alert(`✅ Bienvenido ${usuarioDetectado.nombre}\n🕒 Llegaste a las ${hora}`);

        onSuccess({
          nombre: usuarioDetectado.nombre,
          location,
          faceDescriptor: liveDetection.descriptor,
          horaLlegada: hora,
        });
      } else {
        alert("❌ Rostro no reconocido.");
      }
    };
  };

  return (
    <div className="bg-white shadow-lg p-6 rounded-lg w-full max-w-md text-center">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Verificación Facial</h2>

      <div className="flex justify-center mb-4">
        {errorCamara ? (
          <p className="text-red-600 font-medium">
            🚫 No se detectó cámara en este dispositivo.
          </p>
        ) : (
          <div className="border-4 border-blue-500 rounded-md overflow-hidden">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              width={320}
              height={240}
              videoConstraints={{
                width: 320,
                height: 240,
                facingMode: "user",
              }}
              onUserMedia={() => console.log("📷 Cámara iniciada correctamente")}
              onUserMediaError={(error) => {
                console.error("❌ Error accediendo a la cámara:", error);
                alert("Revisá los permisos o cerrá otras apps que usen la cámara.");
                setErrorCamara(true);
              }}
            />
          </div>
        )}
      </div>

      {loading && <p className="text-gray-500">⏳ Cargando modelos y rostros...</p>}

      {!loading && modelsLoaded && usuariosDescriptors.length > 0 && !errorCamara && (
        <button
          onClick={handleCapture}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition duration-200"
        >
          Verificar rostro
        </button>
      )}
    </div>
  );
};

export default ReconocimientoFacial;
