import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";

const ReconocimientoFacial = ({ onSuccess }) => {
    const webcamRef = useRef(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [location, setLocation] = useState(null);
    const [usuarioDescriptor, setUsuarioDescriptor] = useState(null); // referencia

    // Paso 1: Cargar modelos y descriptor de imagen de usuario
    useEffect(() => {
        const loadModels = async () => {
            const MODEL_URL = "/models";
            await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
            await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
            await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
            setModelsLoaded(true);

            // Cargar imagen de referencia (usuario registrado)
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

    // Paso 2: Captura y comparación
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

        // Comparación
        const distancia = faceapi.euclideanDistance(
            liveDetection.descriptor,
            usuarioDescriptor
        );

        console.log("Distancia:", distancia);

        if (distancia < 0.5) {
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
        <div className="flex flex-col items-center">
            <h2>Verificación Facial</h2>
            <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                width={320}
                height={240}
                videoConstraints={{ facingMode: "user" }}
            />
            {modelsLoaded && usuarioDescriptor ? (
                <button
                    onClick={handleCapture}
                    className="mt-2 bg-blue-500 p-2 text-white"
                >
                    Verificar rostro
                </button>
            ) : (
                <p>Cargando modelos y datos del usuario...</p>
            )}
        </div>
    );
};

export default ReconocimientoFacial;
