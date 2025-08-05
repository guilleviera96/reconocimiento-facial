import ReconocimientoFacial from './components/ReconocimientoFacial';

function App() {
  const handleExito = (datos) => {
    console.log("✅ Asistencia registrada:", datos);
    alert("Asistencia registrada con éxito 📍");
    // Podrías guardar en localStorage, enviar al backend, etc.
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Sistema de Asistencia Facial</h1>
      <ReconocimientoFacial onSuccess={handleExito} />
    </div>
  );
}

export default App;
