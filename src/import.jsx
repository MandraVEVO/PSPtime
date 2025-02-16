export const importRecordsFromFile = (setRecords) => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";
  input.onchange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedRecords = JSON.parse(e.target.result);
          const confirmImport = window.confirm("¿Estás seguro de que quieres cargar un archivo nuevo? Esto borrará los datos actuales.");
          if (confirmImport) {
            setRecords(importedRecords);
          }
        } catch (error) {
          alert("Error al importar el archivo. Asegúrate de que el archivo sea un JSON válido.");
        }
      };
      reader.readAsText(file);
    }
  };
  input.click();
};