'use strict';

const fs = require('node:fs');
const path = require('node:path');
const CalendarioLaboral = require('./src/CalendarioLaboral');
const CuentaPorCobrar = require('./src/CuentaPorCobrar');

function fechaCostaRica() {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Costa_Rica', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const valores = Object.fromEntries(partes.map((parte) => [parte.type, parte.value]));
  return `${valores.year}-${valores.month}-${valores.day}`;
}

const raiz = __dirname;
const base = JSON.parse(fs.readFileSync(path.join(raiz, 'db.json'), 'utf8'));
const feriados = JSON.parse(fs.readFileSync(path.join(raiz, 'data', 'feriados-demo.json'), 'utf8'));
const calendario = new CalendarioLaboral(feriados);
const cartera = new CuentaPorCobrar(base.facturas);
const hoy = fechaCostaRica();
const resultados = cartera.evaluarPendientes(hoy, calendario);

console.log('\nLABORATORIO #1 | POO + n8n | Central de facturacion\n');
console.log(`Fecha de evaluacion (Costa Rica): ${hoy}`);
console.log('Nota: esta demostracion usa feriados de ejemplo locales; el workflow consulta la API externa.\n');
for (const resultado of resultados) {
  console.log(JSON.stringify(resultado, null, 2));
}
console.log('\nFin de la demostracion POO.\n');
