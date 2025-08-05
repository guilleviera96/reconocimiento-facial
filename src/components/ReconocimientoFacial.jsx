import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";

const ReconocimientoFacial = ({ onSuccess }) => {
  const webcamRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [location, setLocation] = useState(null);
  const [usuarioDescriptor, setUsuarioDescriptor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models"; // Asegurate que estén en public/models
      console.log("Inicio carga modelos...");
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        console.log("Modelos cargados correctamente.");
      } catch (error) {
        console.error("Error cargando modelos:", error);
        alert("Error cargando modelos, revisá consola.");
        setLoading(false);
        return;
      }

      try {
        const img = await faceapi.fetchImage("/usuarios/guille.jpeg");
        const detection = await faceapi
          .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          setUsuarioDescriptor(detection.descriptor);
          console.log("Imagen de referencia cargada y procesada.");
        } else {
          alert("No se pudo cargar el rostro de referencia.");
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error("Error cargando imagen de referencia:", err);
        alert("Error cargando imagen de referencia.");
        setLoading(false);
        return;
      }

      setModelsLoaded(true);
      setLoading(false);
    };

    loadModels();

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => {
        console.error("Error geolocalización:", error);
      }
    );
  }, []);

  const handleCapture = () => {
    const screenshot = webcamRef.current.getScreenshot();

    if (!screenshot) {
      alert("No se pudo obtener la imagen de la webcam.");
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

      if (!usuarioDescriptor) {
        alert("Rostro de usuario no cargado.");
        return;
      }

      const distancia = faceapi.euclideanDistance(
        liveDetection.descriptor,
        usuarioDescriptor
      );

      console.log("Distancia:", distancia);

      if (distancia < 0.4) {
        alert("✅ Rostro verificado correctamente.");
        onSuccess({
          location,
          faceDescriptor: liveDetection.descriptor,
        });
      } else {
        alert("❌ Rostro no coincide.");
      }
    };
  };

  return (
    <div className="bg-white shadow-lg p-6 rounded-lg w-full max-w-md text-center">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Verificación Facial</h2>

      <div className="flex justify-center mb-4">
        <div className="border-4 border-blue-500 rounded-md overflow-hidden">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            width={320}
            height={240}
            onUserMedia={() => console.log("✅ Cámara iniciada correctamente")}
            onUserMediaError={(error) => {
              console.error("❌ Error accediendo a la cámara:", error);
              alert(
                "No se pudo acceder a la cámara. Por favor, revisá los permisos y el navegador."
              );
            }}
          />
        </div>
      </div>

      {loading && <p className="text-gray-500">Cargando modelos y datos...</p>}

      {!loading && modelsLoaded && usuarioDescriptor && (
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
