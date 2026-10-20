'use strict';

const assert = require('node:assert/strict');
const CalendarioLaboral = require('../src/CalendarioLaboral');
const Factura = require('../src/Factura');
const CuentaPorCobrar = require('../src/CuentaPorCobrar');

const calendario = new CalendarioLaboral(['2026-10-12', '2026-12-25']);

// 1. Suma dias habiles y excluye fines de semana.
assert.equal(calendario.sumarDiasHabiles('2026-10-08', 2), '2026-10-13');
// 2. Excluye un feriado entre semana.
assert.equal(calendario.sumarDiasHabiles('2026-10-09', 1), '2026-10-13');
// 3. Valida datos incompletos.
assert.throws(() => new Factura({ id: 'X', fechaEmision: '2026-10-01', diasHabiles: 0, monto: 10 }).validar(), /diasHabiles/);
// 4. Marca vencida despues de la fecha limite.
const facturaVencida = new Factura({ id: 'T-1', cliente: 'Cliente', fechaEmision: '2026-09-01', diasHabiles: 3, monto: 100, estado: 'pendiente' });
assert.equal(facturaVencida.evaluar('2026-09-10', calendario).estadoCalculado, 'vencida');
// 5. No procesa facturas pagadas.
const cartera = new CuentaPorCobrar([{ id: 'T-2', fechaEmision: '2026-10-01', diasHabiles: 5, monto: 100, estado: 'pagada' }]);
assert.equal(cartera.evaluarPendientes('2026-10-19', calendario)[0].accion, 'IGNORAR');
// 6. Una factura mal formada se captura sin tumbar toda la evaluacion.
const carteraConError = new CuentaPorCobrar([{ id: 'T-3', fechaEmision: 'mal', diasHabiles: 1, monto: 100, estado: 'pendiente' }]);
assert.equal(carteraConError.evaluarPendientes('2026-10-19', calendario)[0].accion, 'ERROR_DATOS');

console.log('OK: 6 pruebas pasaron.');
