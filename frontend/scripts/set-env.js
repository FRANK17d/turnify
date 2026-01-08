const fs = require('fs');
const path = require('path');

// Obtener las variables de entorno
// Si no existe, usa la URL de producción por defecto
const apiUrl = process.env.API_URL || 'https://turnify-backend-k5vo.onrender.com/api';
const wsUrl = process.env.WS_URL || 'https://turnify-backend-k5vo.onrender.com';

const envConfigFile = `export const environment = {
  production: true,
  apiUrl: '${apiUrl}',
  wsUrl: '${wsUrl}',
};
`;

const targetPath = path.join(__dirname, '../src/environments/environment.prod.ts');

fs.writeFile(targetPath, envConfigFile, function (err) {
    if (err) {
        console.log(err);
    } else {
        console.log(`✅ environment.prod.ts generado correctamente con API_URL: ${apiUrl}`);
    }
});
