import React, { useState, useEffect } from "react";
import jsPDF from "jspdf"; // Importar jsPDF para generar PDF
import { saveAs } from "file-saver"; // Importar file-saver para guardar archivos
import html2canvas from "html2canvas"; // Importar html2canvas para capturar la tabla

const Defectos = ({ onClose, activity }) => {
  const [defectos, setDefectos] = useState(() => {
    // Cargar defectos desde localStorage al iniciar
    const savedDefectos = localStorage.getItem("defectos");
    return savedDefectos ? JSON.parse(savedDefectos) : [];
  });

  const [formData, setFormData] = useState({
    fecha: "",
    numero: "",
    tipo: "",
    encontrado: activity, // Establecer la actividad actual
    removido: "",
    tiempoCompostura: "0:00",
    descripcion: "",
    defectoArreglado: "", // Nuevo campo para defecto arreglado
  });

  const [composturaTime, setComposturaTime] = useState(0);
  const [intervalId, setIntervalId] = useState(null);

  useEffect(() => {
    // Establecer la fecha actual automáticamente
    const currentDate = new Date().toISOString().split("T")[0];
    setFormData((prevFormData) => ({ ...prevFormData, fecha: currentDate }));

    // Generar el número consecutivo
    const nextNumero = defectos.length + 1;
    setFormData((prevFormData) => ({ ...prevFormData, numero: nextNumero }));
  }, [defectos]);

  useEffect(() => {
    // Actualizar el campo "encontrado" cuando la actividad cambie
    setFormData((prevFormData) => ({ ...prevFormData, encontrado: activity }));
  }, [activity]);

  useEffect(() => {
    // Iniciar el temporizador
    const timer = setInterval(() => {
      setComposturaTime((prevTime) => prevTime + 1);
    }, 1000);
    setIntervalId(timer);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Actualizar el campo "tiempoCompostura" con el temporizador
    const minutes = Math.floor(composturaTime / 60);
    const seconds = composturaTime % 60;
    setFormData((prevFormData) => ({
      ...prevFormData,
      tiempoCompostura: `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`,
    }));
  }, [composturaTime]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validaciones
    if (!formData.tipo) {
      alert("Por favor, selecciona un tipo de defecto.");
      return;
    }
    if (!formData.removido) {
      alert("Por favor, selecciona una actividad en el campo 'Removido'.");
      return;
    }
    if (!formData.defectoArreglado) {
      alert("Por favor, selecciona si el defecto fue arreglado.");
      return;
    }
    if (!formData.descripcion.trim()) {
      alert("Por favor, proporciona una descripción del defecto.");
      return;
    }

    const updatedDefectos = [...defectos, formData];
    setDefectos(updatedDefectos);
    localStorage.setItem("defectos", JSON.stringify(updatedDefectos)); // Guardar en localStorage
    setFormData({
      fecha: new Date().toISOString().split("T")[0], // Actualizar la fecha al momento actual
      numero: defectos.length + 2, // Incrementar el número consecutivo
      tipo: "",
      encontrado: activity, // Restablecer la actividad actual
      removido: "",
      tiempoCompostura: "0:00",
      descripcion: "",
      defectoArreglado: "", // Restablecer el campo defecto arreglado
    });
    setComposturaTime(0); // Reiniciar el temporizador
    onClose(); // Cerrar el componente al guardar
  };

  const handleClearData = () => {
    setDefectos([]);
    localStorage.removeItem("defectos");
  };

  const handleSavePDF = () => {
    const fileName = prompt("¿Cómo deseas nombrar el archivo PDF?");
    if (!fileName) {
      return; // Si el usuario cancela, salir de la función
    }
    const studentName = prompt("Nombre del estudiante:");
    if (!studentName) {
      return; // Si el usuario cancela, salir de la función
    }
    const instructorName = prompt("Nombre del instructor:");
    if (!instructorName) {
      return; // Si el usuario cancela, salir de la función
    }
    const programName = prompt("Nombre del programa:");
    if (!programName) {
      return; // Si el usuario cancela, salir de la función
    }

    const doc = new jsPDF();
    const currentDate = new Date().toLocaleDateString();

    doc.text(`Registros de Defectos: ${fileName}`, 10, 10);
    doc.text(`Estudiante: ${studentName}`, 10, 20);
    doc.text(`Instructor: ${instructorName}`, 10, 30);
    doc.text(`Fecha: ${currentDate}`, 10, 40);
    doc.text(`Programa #: ${programName}`, 10, 50);

    const tableElement = document.getElementById("defectos-table");

    html2canvas(tableElement, { useCORS: true, logging: false, backgroundColor: null }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      doc.addImage(imgData, "PNG", 10, 60, 190, 0);
      doc.save(`Detecciondeerror_${fileName}.pdf`);
    }).catch((error) => {
      console.error("Error generating PDF:", error);
    });
  };

  const handleSaveFile = () => {
    const fileName = prompt("¿Cómo deseas nombrar el archivo JSON?");
    if (fileName) {
      const blob = new Blob([JSON.stringify(defectos, null, 2)], { type: "application/json" });
      saveAs(blob, `Detecciondeerror_${fileName}.json`);
    }
  };

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const importedDefectos = JSON.parse(event.target.result);
      if (window.confirm("¿Está seguro de que desea importar los datos? Esto borrará los datos existentes.")) {
        setDefectos(importedDefectos);
        localStorage.setItem("defectos", JSON.stringify(importedDefectos)); // Guardar en localStorage
      }
    };
    reader.readAsText(file);
  };

  const tipoOptions = [
    { value: "10", label: "Documentación" },
    { value: "20", label: "Sintaxis" },
    { value: "30", label: "Construcción" },
    { value: "40", label: "Asignación" },
    { value: "50", label: "Interfaz" },
    { value: "60", label: "Chequeo" },
    { value: "70", label: "Datos" },
    { value: "80", label: "Función" },
    { value: "90", label: "Sistema" },
    { value: "100", label: "Ambiente" },
  ];

  const actividadOptions = [
    "Analizar",
    "Planificar",
    "Codificar",
    "Testear",
    "Evaluación del código",
    "Revisión del código",
    "Lanzamiento",
    "Diagramar",
    "Reunión",
    "Postmortem",
  ];

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 overflow-auto">
      <div className="bg-white p-6 rounded-lg shadow-lg text-black w-full max-w-4xl h-full overflow-auto">
        <div className="mb-6 bg-blue-100 p-4 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Registrar Defecto</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fecha">
                  Fecha
                </label>
                <input
                  type="date"
                  id="fecha"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="numero">
                  Número
                </label>
                <input
                  type="number"
                  id="numero"
                  name="numero"
                  value={formData.numero}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="tipo">
                  Tipo
                </label>
                <select
                  id="tipo"
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="">Seleccionar tipo</option>
                  {tipoOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="encontrado">
                  Encontrado
                </label>
                <input
                  type="text"
                  id="encontrado"
                  name="encontrado"
                  value={formData.encontrado}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="removido">
                  Removido
                </label>
                <select
                  id="removido"
                  name="removido"
                  value={formData.removido}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="">Seleccionar actividad</option>
                  {actividadOptions.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="tiempoCompostura">
                  Tiempo de Compostura
                </label>
                <input
                  type="text"
                  id="tiempoCompostura"
                  name="tiempoCompostura"
                  value={formData.tiempoCompostura}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="defectoArreglado">
                  Defecto Arreglado
                </label>
                <select
                  id="defectoArreglado"
                  name="defectoArreglado"
                  value={formData.defectoArreglado}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="">Seleccionar opción</option>
                  <option value="si">Sí</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="descripcion">
                  Descripción
                </label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows="4"
                ></textarea>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 mr-2"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600"
              >
                Guardar
              </button>
            </div>
          </form>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              className="bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600"
              onClick={handleClearData}
            >
              Borrar Datos
            </button>
            <button
              type="button"
              className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 ml-2"
              onClick={handleSavePDF}
            >
              Guardar en PDF
            </button>
            <button
              type="button"
              className="bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 ml-2"
              onClick={handleSaveFile}
            >
              Guardar archivo
            </button>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
              id="fileInput"
            />
            <label
              htmlFor="fileInput"
              className="bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 ml-2 cursor-pointer"
            >
              Importar archivo
            </label>
          </div>
        </div>
        <div className="mt-6 bg-green-100 p-4 rounded-lg overflow-x-auto">
          <h3 className="text-xl font-bold text-green-500 mb-4">Registros de Defectos</h3>
          <div className="overflow-x-auto">
            <table id="defectos-table" className="w-full min-w-full table-auto text-black border-collapse">
              <thead>
                <tr>
                  <th className="px-4 py-2 border">Fecha</th>
                  <th className="px-4 py-2 border">Número</th>
                  <th className="px-4 py-2 border">Tipo</th>
                  <th className="px-4 py-2 border">Encontrado</th>
                  <th className="px-4 py-2 border">Removido</th>
                  <th className="px-4 py-2 border">Tiempo de Compostura</th>
                  <th className="px-4 py-2 border">Defecto Arreglado</th>
                  <th className="px-4 py-2 border">Descripción</th>
                </tr>
              </thead>
              <tbody>
                {defectos.map((defecto, index) => (
                  <tr key={index} className="text-center">
                    <td className="border px-4 py-2">{defecto.fecha}</td>
                    <td className="border px-4 py-2">{defecto.numero}</td>
                    <td className="border px-4 py-2">{defecto.tipo}</td>
                    <td className="border px-4 py-2">{defecto.encontrado}</td>
                    <td className="border px-4 py-2">{defecto.removido}</td>
                    <td className="border px-4 py-2">{defecto.tiempoCompostura}</td>
                    <td className="border px-4 py-2">{defecto.defectoArreglado}</td>
                    <td className="border px-4 py-2 whitespace-pre-line">{defecto.descripcion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Defectos;