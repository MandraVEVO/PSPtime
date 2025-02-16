import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Charts = ({ records, formatTime }) => {
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

  const activityData = activities.map(activity => {
    const activityRecords = records.filter(record => record.activity === activity);
    const totalActiveTime = activityRecords.reduce((sum, record) => sum + record.activeTime, 0);
    const totalInactiveTime = activityRecords.reduce((sum, record) => sum + record.inactiveTime, 0);
    return {
      activity,
      totalActiveTime: totalActiveTime / 60, // Convertir a minutos
      totalInactiveTime: totalInactiveTime / 60, // Convertir a minutos
    };
  });

  const totalActiveTime = activityData.reduce((sum, data) => sum + data.totalActiveTime, 0);
  const totalInactiveTime = activityData.reduce((sum, data) => sum + data.totalInactiveTime, 0);

  const percentageData = activityData.map(data => ({
    activity: data.activity,
    percentageActive: ((data.totalActiveTime / totalActiveTime) * 100).toFixed(2),
    percentageInactive: ((data.totalInactiveTime / totalInactiveTime) * 100).toFixed(2),
  }));

  const barData = {
    labels: activities,
    datasets: [
      {
        label: 'Tiempo Útil (min)',
        data: activityData.map(data => data.totalActiveTime),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
      {
        label: 'Tiempo Interrumpido (min)',
        data: activityData.map(data => data.totalInactiveTime),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'white', // Cambiar el color del texto a blanco
        },
      },
      title: {
        display: true,
        text: 'Tiempo Útil e Interrumpido por Actividad',
        color: 'white', // Cambiar el color del texto a blanco
      },
    },
    scales: {
      x: {
        ticks: {
          color: 'white', // Cambiar el color del texto a blanco
        },
      },
      y: {
        ticks: {
          color: 'white', // Cambiar el color del texto a blanco
        },
      },
    },
  };

  return (
    <div>
      <Bar data={barData} options={barOptions} />
      <div className="text-center mt-4">
        <h3>Total de Tiempo Activo: {formatTime(totalActiveTime * 60)}</h3>
        <h3>Total de Tiempo Inactivo: {formatTime(totalInactiveTime * 60)}</h3>
      </div>
      <div className="text-center mt-4">
        <h3>Porcentaje de Tiempo por Actividad</h3>
        <table className="min-w-full table-auto text-white">
          <thead>
            <tr>
              <th className="px-4 py-2">Actividad</th>
              <th className="px-4 py-2">Porcentaje de Tiempo Útil</th>
              <th className="px-4 py-2">Porcentaje de Tiempo Interrumpido</th>
            </tr>
          </thead>
          <tbody>
            {percentageData.map((data, index) => (
              <tr key={index} className="text-center">
                <td className="border px-4 py-2">{data.activity}</td>
                <td className="border px-4 py-2">{data.percentageActive}%</td>
                <td className="border px-4 py-2">{data.percentageInactive}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Charts;