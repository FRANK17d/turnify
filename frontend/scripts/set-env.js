const fs = require('fs');
const path = require('path');

// Obtener las variables de entorno
// Si no existe (local), usa un valor por defecto o localhost
const apiUrl = process.env.API_URL || 'http://localhost:3000/api';
const wsUrl = process.env.WS_URL || 'http://localhost:3000';

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
