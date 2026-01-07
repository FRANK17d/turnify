const http = require('http');

const API_BASE = 'http://localhost:3000/api';

function request(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function main() {
  console.log('=== Test de Suscripción ===\n');

  // 1. Login como admin@demo.com (FREE plan)
  console.log('1. Login como admin@demo.com...');
  const loginRes = await request('POST', '/auth/login', {
    email: 'admin@demo.com',
    password: 'Demo123!',
  });

  if (loginRes.status !== 200 && loginRes.status !== 201) {
    console.log('Error de login:', loginRes.data);
    return;
  }

  const token = loginRes.data.accessToken;
  console.log('   Token obtenido ✓');

  // 2. Ver servicios actuales
  console.log('\n2. Obteniendo servicios actuales...');
  const servicesRes = await request('GET', '/services', null, token);
  console.log(`   Servicios existentes: ${servicesRes.data.length}`);
  servicesRes.data.forEach((s, i) => console.log(`   ${i + 1}. ${s.name} (ID: ${s.id})`));

  // 3. Ver plan actual
  console.log('\n3. Plan actual...');
  const planRes = await request('GET', '/subscriptions/current/details', null, token);
  console.log(`   Plan: ${planRes.data.plan.name}`);
  console.log(`   Límite servicios: ${planRes.data.plan.maxServices}`);

  // 4. Intentar crear servicio
  console.log('\n4. Intentando crear nuevo servicio...');
  const timestamp = Date.now();
  const createRes = await request('POST', '/services', {
    name: `Servicio Test ${timestamp}`,
    description: 'Test de límite de plan',
    duration: 30,
    price: 15.00,
    isActive: true,
  }, token);

  console.log(`   Status: ${createRes.status}`);
  console.log(`   Respuesta:`, createRes.data);

  if (createRes.status === 403) {
    console.log('\n✅ SubscriptionGuard BLOQUEÓ correctamente - Límite alcanzado!');
  } else if (createRes.status === 201) {
    console.log('\n✅ Servicio creado correctamente (aún hay espacio en el plan)');
  }
}

main().catch(console.error);
