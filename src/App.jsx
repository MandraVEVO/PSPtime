import React, { useState, useEffect, useCallback } from "react";
import { Velustro } from "uvcanvas";
import { saveRecordsToFile } from "./save";
import { importRecordsFromFile } from "./import";
import Charts from "./charts";
import generatePDF from "./pdf";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import html2canvas from "html2canvas";
import { Chart } from "chart.js";

const App = () => {
  
  const [mexicoTime, setMexicoTime] = useState(null);
  const [systemTime, setSystemTime] = useState(null);
  const [activeTime, setActiveTime] = useState(0);
  const [inactiveTime, setInactiveTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [activity, setActivity] = useState("");
  const [showComboBox, setShowComboBox] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [comment, setComment] = useState("");
  const [records, setRecords] = useState([]);
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hasRecovered, setHasRecovered] = useState(false);
  const [showCharts, setShowCharts] = useState(false);

  const activities = [
    "Analizar",
    "Planificar",
    "Codificar",
    "Testear",
    "Evaluación del código",
    "Revisión del código",
    "Lanzamiento",
    "Diagramar",
    "Reunión",
  ];

  useEffect(() => {
    const fetchMexicoTime = async () => {
      try {
        const response = await fetch(
          "http://worldtimeapi.org/api/timezone/America/Mexico_City"
        );
        const data = await response.json();
        setMexicoTime(
          new Date(data.datetime).toLocaleTimeString("en-US", { hour12: false })
        );
      } catch (error) {
        console.error("Error al obtener la hora:", error);
      }
    };

    fetchMexicoTime();
    const interval = setInterval(() => {
      fetchMexicoTime();
      setSystemTime(
        new Date().toLocaleTimeString("en-US", { hour12: false })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let timer;
    let audio;

    const playAlertSound = () => {
      audio = new Audio("/sounds/alert.mp3");
      audio.loop = true;
      audio.play();
    };

    const stopAlertSound = () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };

    const showNotification = () => {
      if (Notification.permission === "granted") {
        new Notification("Alerta de tiempo", {
          body: "Han pasado 30 segundos.",
          requireInteraction: true,
        }).onclick = () => {
          stopAlertSound();
        };
      }
    };

    const handleAlert = () => {
      playAlertSound();
      showNotification();
      setTimeout(() => {
        alert("Han pasado 30 segundos.");
        stopAlertSound();
        setIsActive(true); // Asegurar que sigue activo después de la alerta
        setIsPaused(false); // Evitar que entre en pausa
      }, 500);
    };

    if (isTracking) {
      timer = setInterval(() => {
        if (isActive && !isPaused) {
          setActiveTime((prev) => {
            const newTime = prev + 1;
            localStorage.setItem("activeTime", newTime);
            if (newTime === 30) {
              handleAlert();
            }
            return newTime;
          });
        } else if (!isActive && isPaused) {
          setInactiveTime((prev) => {
            const newTime = prev + 1;
            localStorage.setItem("inactiveTime", newTime);
            return newTime;
          });
        }
      }, 1000);
    }

    return () => {
      clearInterval(timer); // Limpia el intervalo antes de crear uno nuevo
      stopAlertSound(); // Detiene el sonido de alerta si está sonando
    };
  }, [isActive, isTracking, isPaused]);

  // Solicitar permiso para mostrar notificaciones
  useEffect(() => {
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const savedRecords = localStorage.getItem("records");
    const savedActiveTime = localStorage.getItem("activeTime");
    const savedInactiveTime = localStorage.getItem("inactiveTime");
    const savedStartTime = localStorage.getItem("startTime");
    const savedActivity = localStorage.getItem("activity");
    const savedIsTracking = localStorage.getItem("isTracking") === "true";
    const savedIsPaused = localStorage.getItem("isPaused") === "true";
    const savedIsActive = localStorage.getItem("isActive") === "true";

    if (savedRecords && !hasRecovered) {
      setRecords(JSON.parse(savedRecords));
      alert("Información recuperada de la memoria local");
      setHasRecovered(true);
    }

    if (savedActiveTime && savedStartTime && savedIsTracking) {
      setActiveTime(parseInt(savedActiveTime, 10));
      setInactiveTime(parseInt(savedInactiveTime, 10) || 0); // Asegúrate de que inactiveTime se inicialice correctamente
      setStartTime(savedStartTime);
      setActivity(savedActivity || "");
      setIsTracking(savedIsTracking);
      setIsPaused(savedIsPaused);
      setIsActive(savedIsActive);
    }

    const handleBeforeUnload = () => {
      localStorage.setItem("records", JSON.stringify(records));
      localStorage.setItem("activeTime", activeTime);
      localStorage.setItem("inactiveTime", inactiveTime);
      localStorage.setItem("startTime", startTime);
      localStorage.setItem("activity", activity);
      localStorage.setItem("isTracking", isTracking);
      localStorage.setItem("isPaused", isPaused);
      localStorage.setItem("isActive", isActive);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [records, hasRecovered, activeTime, inactiveTime, startTime, activity, isTracking, isPaused, isActive]);

  const playAlertSound = () => {
    const audio = new Audio("/sounds/alert.mp3");
    audio.play();
  };

  const handleStart = () => {
    setShowComboBox(true);
  };

  const handleSelectActivity = (event) => {
    setActivity(event.target.value);
    const currentTime = new Date().toLocaleTimeString("en-US", { hour12: false });
    setStartTime(currentTime);
    setShowComboBox(false);
    setIsActive(true);
    setIsTracking(true);
    setIsPaused(false);
    localStorage.setItem("startTime", currentTime);
    localStorage.setItem("isTracking", true);
    localStorage.setItem("isPaused", false);
    localStorage.setItem("isActive", true);
    localStorage.setItem("activity", event.target.value);
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
    setIsActive(isPaused);
    localStorage.setItem("isPaused", !isPaused);
    localStorage.setItem("isActive", isPaused);
  };

  const handleStop = () => {
    setIsActive(false);
    setIsTracking(false);
    setIsPaused(false);

    const endTimeValue = new Date().toLocaleTimeString("en-US", {
      hour12: false,
    });

    let userComment = prompt("¿Qué comentario deseas guardar?");
    if (userComment === null) {
      // Si el usuario cancela, reanudar el tiempo
      setIsActive(true);
      setIsTracking(true);
      setIsPaused(false);
      return;
    }

    while (userComment && (/[^a-zA-Z\s]/.test(userComment) || userComment.length > 40)) {
      alert("El comentario solo puede contener letras y espacios, y debe tener un máximo de 40 caracteres.");
      userComment = prompt("¿Qué comentario deseas guardar?");
    }

    const date = new Date().toLocaleDateString();

    const newRecords = [
      ...records,
      {
        date,
        startTime,
        endTime: endTimeValue,
        inactiveTime,
        activeTime,
        activity,
        comment: userComment || "",
      },
    ];

    setRecords(newRecords);
    localStorage.setItem("records", JSON.stringify(newRecords));

    // Reiniciar estados
    setActiveTime(0);
    setInactiveTime(0);
    setActivity("");
    setStartTime(null);
    localStorage.removeItem("activeTime");
    localStorage.removeItem("inactiveTime");
    localStorage.removeItem("startTime");
    localStorage.removeItem("isTracking");
    localStorage.removeItem("isPaused");
    localStorage.removeItem("isActive");
    localStorage.removeItem("activity");
  };

  const handleSave = () => {
    if (records.length === 0) {
      alert("No hay registros capturados");
      return;
    }
    const fileName = prompt("¿Cómo deseas nombrar el archivo JSON?");
    if (fileName) {
      saveRecordsToFile(records, fileName);
    }
  };

  const handleImport = () => {
    importRecordsFromFile(setRecords);
  };

  const handleClear = () => {
    if (window.confirm("¿Estás seguro de que deseas borrar todos los registros?")) {
      setRecords([]);
      localStorage.removeItem("records");
    }
  };

  const toggleCharts = () => {
    setShowCharts(!showCharts);
  };

  const handleGeneratePDF = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".json";
    fileInput.onchange = (event) => {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const jsonContent = JSON.parse(e.target.result);
        const projectName = file.name.replace(".json", "");
        generatePDF(projectName, jsonContent);
      };
      reader.readAsText(file);
    };
    fileInput.click();
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const handleAlert = () => {
    playAlertSound();
    setTimeout(() => {
      alert("Han pasado 30 segundos.");
      setIsActive(true); // Asegurar que sigue activo después de la alerta
      setIsPaused(false); // Evitar que entre en pausa
    }, 500);
  };
  (() => {
    let timer;
    if (isTracking) {
      if (isActive && !isPaused) {
        timer = setInterval(() => {
          setActiveTime((prev) => {
            const newTime = prev + 1;
            if (newTime === 30) {
              handleAlert(); // Llama a la alerta, pero no pausa el tiempo activo
            }
            return newTime;
          });
        }, 1000);
      } else if (!isActive && isPaused) {
        timer = setInterval(() => {
          setInactiveTime((prev) => {
            const newTime = prev + 1;
            localStorage.setItem("inactiveTime", newTime);
            return newTime;
          });
        }, 1000);
      }
    }
    return () => clearInterval(timer);
  }, [isActive, isTracking, isPaused]);
  
  // Función para generar el PDF del proyecto
  const handleDownload = useCallback(async () => {
    if (records.length =useEffect== 0) {
      alert("No hay registros capturados para convertir a PDF.");
      return;
    }
  
    try {
      const fileName = prompt("¿Cómo deseas nombrar el archivo PDF?");
      if (!fileName) {
        alert("El nombre del archivo es obligatorio.");
        return;
      }
  
      const startDate = records.length > 0 ? records[0].date : "N/A";
      const endDate = new Date().toLocaleDateString();
  
      const pdf = new jsPDF();
  
      pdf.setFontSize(18);
      pdf.text(`Proyecto: ${fileName}`, 10, 10);
      pdf.setFontSize(12);
      pdf.text(`Fecha de Inicio: ${startDate}`, 10, 15);
      pdf.text(`Fecha de Fin: ${endDate}`, 10, 20);
  
      // Configuración para la tabla
      pdf.autoTable({
        startY: 30,
        head: [["Fecha", "Inicio", "Fin", "Interrupción", "Tiempo Activo", "Actividad", "Comentario"]],
        body: records.map((record) => [
          record.date,
          record.startTime,
          record.endTime,
          formatTime(record.inactiveTime),
          formatTime(record.activeTime),
          record.activity,
          record.comment,
        ]),
        theme: "grid",
        margin: { bottom: 20 }, // Espacio para evitar cortar datos en la paginación
        didDrawPage: (data) => {
          pdf.setFontSize(10);
          pdf.text(`Página ${pdf.internal.getNumberOfPages()}`, 10, pdf.internal.pageSize.height - 10);
        },
      });
  
      // Gráfico
      const actividadesAgregadas = records.reduce((acc, curr) => {
        const key = curr.activity;
        if (!acc[key]) acc[key] = { activeTime: 0, inactiveTime: 0 };
        acc[key].activeTime += curr.activeTime / 60;
        acc[key].inactiveTime += curr.inactiveTime / 60;
        return acc;
      }, {});
  
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 200;
      document.body.appendChild(canvas);
  
      const ctx = canvas.getContext("2d");
      new Chart(ctx, {
        type: "bar",
        data: {
          labels: Object.keys(actividadesAgregadas),
          datasets: [
            {
              label: "Tiempo Activo (min)",
              data: Object.values(actividadesAgregadas).map((d) => d.activeTime),
              backgroundColor: "rgba(75, 192, 192, 0.6)",
            },
            {
              label: "Tiempo Inactivo (min)",
              data: Object.values(actividadesAgregadas).map((d) => d.inactiveTime),
              backgroundColor: "rgba(255, 99, 132, 0.6)",
            },
          ],
        },
        options: {
          responsive: false,
          plugins: {
            tooltip: {
              callbacks: {
                label: function (context) {
                  const total = context.dataset.data.reduce((sum, value) => sum + value, 0);
                  const percentage = ((context.raw / total) * 100).toFixed(2);
                  return `${context.dataset.label}: ${context.raw} minutos (${percentage}%)`;
                },
              },
            },
          },
        },
      });
  
      await new Promise((resolve) => setTimeout(resolve, 500));
  
      const chartImage = await html2canvas(canvas);
      const chartImgData = chartImage.toDataURL("image/png");
  
      let finalY = pdf.autoTable.previous.finalY + 10;
      const pageHeight = pdf.internal.pageSize.height;
  
      if (finalY + 100 > pageHeight) {
        pdf.addPage();
        finalY = 10;
      }
  
      pdf.addImage(chartImgData, "PNG", 10, finalY, 180, (chartImage.height * 180) / chartImage.width);
  
      finalY += (chartImage.height * 180) / chartImage.width + 10;
  
      if (finalY + 20 > pageHeight) {
        pdf.addPage();
        finalY = 10;
      }
  
      const totalActiveTime = records.reduce((acc, r) => acc + r.activeTime, 0);
      const totalInactiveTime = records.reduce((acc, r) => acc + r.inactiveTime, 0);
      const totalTime = totalActiveTime + totalInactiveTime;
      const activePercentage = ((totalActiveTime / totalTime) * 100).toFixed(2);
      const inactivePercentage = ((totalInactiveTime / totalTime) * 100).toFixed(2);
  
      pdf.text(`Total tiempo útil: ${formatTime(totalActiveTime)} (${activePercentage}%)`, 10, finalY);
      pdf.text(`Total interrupción: ${formatTime(totalInactiveTime)} (${inactivePercentage}%)`, 10, finalY + 10);
  
      pdf.save(`${fileName}.pdf`);
      document.body.removeChild(canvas);
    } catch (error) {
      console.error("Error al generar el PDF: ", error);
    }
  }, [records]);
  

  return (
    <div className="relative min-h-screen bg-gray-900 text-white">
      <Velustro className="fixed top-0 left-0 w-full h-full z-0" />
      <div className="relative z-10 flex flex-col items-center justify-center">
        <div className="w-full max-w-3xl bg-gray-800 bg-opacity-75 p-8 rounded-lg shadow-lg text-center mb-8">
          <h1 className="text-4xl font-bold text-green-500 mb-6">Timetracker</h1>
          <div className="space-y-4">
            <div className="text-2xl font-semibold">
              <span className="text-yellow-400">Hora de México:</span>{" "}
              {mexicoTime || "Cargando..."}
            </div>
            <div className="text-2xl font-semibold">
              <span className="text-yellow-400">Hora del Sistema:</span>{" "}
              {systemTime || "Cargando..."}
            </div>
            {showComboBox && (
              <select
                className="bg-gray-700 text-white p-2 rounded"
                onChange={handleSelectActivity}
              >
                <option value="">Seleccionar actividad</option>
                {activities.map((act, index) => (
                  <option key={index} value={act}>
                    {act}
                  </option>
                ))}
              </select>
            )}
            <div className="text-2xl font-semibold">
              <span className="text-yellow-400">Actividad en curso:</span>{" "}
              {activity || "Ninguna"}
            </div>
            <div className="flex justify-between space-x-4 mt-4 flex-wrap">
              <button
                onClick={handleStart}
                className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600"
                disabled={isTracking}
              >
                Iniciar
              </button>
              <button
                onClick={handlePause}
                className="bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600"
                disabled={!isTracking}
              >
                {isPaused ? "Reanudar" : "Pausar"}
              </button>
              <button
                onClick={handleStop}
                className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600"
                disabled={!isTracking}
              >
                Detener
              </button>
              <button
                onClick={handleSave}
                className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
              >
                Guardar
              </button>
              <button
                onClick={handleImport}
                className="bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600"
              >
                Importar
              </button>
              <button
                onClick={toggleCharts}
                className="bg-teal-500 text-white py-2 px-4 rounded-lg hover:bg-teal-600"
              >
                Graficas
              </button>
              <button
                onClick={handleDownload}
                className="bg-pink-500 text-white py-2 px-4 rounded-lg hover:bg-pink-600"
              >
                Convertir a pdf
              </button>
              <button
                onClick={handleClear}
                className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600"
              >
                Borrar Datos
              </button>
            </div>
          </div>
        </div>

        <div className="w-full max-w-3xl bg-gray-700 bg-opacity-75 p-6 rounded-lg shadow-lg text-center mb-8">
          <h2 className="text-3xl font-bold text-blue-500 mb-4">Timer</h2>
          <div className="text-xl font-semibold mb-4">
            <span className="text-yellow-400">Tiempo Activo:</span> {formatTime(activeTime)}
          </div>
          <div className="text-xl font-semibold mb-4">
            <span className="text-yellow-400">Tiempo Inactivo:</span>{" "}
            {formatTime(inactiveTime)}
          </div>
        </div>

        {showCharts && (
          <div className="w-full max-w-3xl bg-gray-800 bg-opacity-75 p-4 rounded-lg shadow-lg mb-8">
            <Charts records={records} formatTime={formatTime} />
          </div>
        )}

<div className="w-full max-w-3xl bg-gray-800 bg-opacity-75 p-4 rounded-lg shadow-lg overflow-x-auto">
            <h3 className="text-xl font-bold text-green-500 mb-4">
              Registros de Actividad
            </h3>
            <table className="min-w-full table-auto text-white">
              <thead>
                <tr>
                  <th className="px-4 py-2">Fecha</th>
                  <th className="px-4 py-2">Inicio</th>
                  <th className="px-4 py-2">Fin</th>
                  <th className="px-4 py-2">Interrupción</th>
                  <th className="px-4 py-2">A tiempo</th>
                  <th className="px-4 py-2">Actividad</th>
                  <th className="px-4 py-2">Comentario</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record, index) => (
                  <tr key={index} className="text-center">
                    <td className="border px-4 py-2">{record.date}</td>
                    <td className="border px-4 py-2">{record.startTime}</td>
                    <td className="border px-4 py-2">{record.endTime}</td>
                    <td className="border px-4 py-2">{formatTime(record.inactiveTime)}</td>
                    <td className="border px-4 py-2">{formatTime(record.activeTime)}</td>
                    <td className="border px-4 py-2">{record.activity}</td>
                    <td className="border px-4 py-2 whitespace-pre-line">{record.comment}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      </div>
    </div>
  );
};

export default App;