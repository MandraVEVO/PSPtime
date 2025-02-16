import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const generatePDF = (projectName, records) => {
  const doc = new jsPDF();
  const startDate = records.length > 0 ? records[0].date : "N/A";
  const endDate = new Date().toLocaleDateString();

  doc.text(`Nombre del Proyecto: ${projectName}`, 10, 10);
  doc.text(`Fecha de Inicio: ${startDate}`, 10, 20);
  doc.text(`Fecha de Fin: ${endDate}`, 10, 30);

  const tableElement = document.getElementById("records-table");

  html2canvas(tableElement, { useCORS: true, logging: false, backgroundColor: null }).then((canvas) => {
    const imgData = canvas.toDataURL("image/png");
    doc.addImage(imgData, "PNG", 10, 40, 190, 0);
    doc.save(`${projectName}.pdf`);
  }).catch((error) => {
    console.error("Error generating PDF:", error);
  });
};

export default generatePDF;