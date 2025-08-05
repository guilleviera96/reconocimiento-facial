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
      const MODEL_URL = "/models";
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);

      // Cargar imagen de referencia
      const img = await faceapi.fetchImage("/usuarios/guille.jpeg");
      const detection = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        setUsuarioDescriptor(detection.descriptor);
      } else {
        alert("No se pudo cargar el rostro de referencia.");
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

  const handleCapture = async () => {
    const screenshot = webcamRef.current.getScreenshot();
    const img = await faceapi.fetchImage(screenshot);

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

  return (
    <div className="bg-white shadow-lg p-6 rounded-lg w-full max-w-md text-center">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Verificación Facial
      </h2>

      <div className="flex justify-center mb-4">
        <div className="border-4 border-blue-500 rounded-md overflow-hidden">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            width={320}
            height={240}
            videoConstraints={{ facingMode: "user" }}
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
