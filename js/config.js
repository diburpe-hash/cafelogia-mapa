// Configuración del mapa Cafelogía.
//
// Para conectar el mapa a tu Google Sheet:
// 1. En Google Sheets: Archivo > Compartir > Publicar en la web.
// 2. Elige la pestaña con los datos y el formato "Valores separados por comas (.csv)".
// 3. Pega aquí la URL que te da Google (empieza con https://docs.google.com/spreadsheets/d/e/...).
// Mientras esto quede vacío ("") el mapa usa el archivo local data/cafelogia.csv.
const CAFELOGIA_CONFIG = {
  sheetCsvUrl: "",
  localCsvUrl: "data/cafelogia.csv",
  initialCenter: [42.5075, 1.5218], // Andorra la Vella
  initialZoom: 13,
};
