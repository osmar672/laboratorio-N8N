'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const workflowPath = path.join(__dirname, '..', 'n8n', 'workflow-facturacion-dias-habiles.json');
const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
const code = workflow.nodes.find((node) => node.name === 'Aplicar reglas POO y evaluar facturas').parameters.jsCode;
const db = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'db.json'), 'utf8'));
const holidays = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'feriados-demo.json'), 'utf8'));

function runCode(itemsByNode) {
  const lookup = (name) => ({ all: () => (itemsByNode[name] || []).map((json) => ({ json })) });
  return new Function('$', code)(lookup).map((item) => item.json);
}

const currentYearHolidays = holidays.filter((item) => item.date.startsWith('2026-'));
const nextYearHolidays = holidays.filter((item) => item.date.startsWith('2027-'));
const items = runCode({
  'Obtener facturas': db.facturas,
  'Consultar feriados del ano actual': currentYearHolidays,
  'Consultar feriados del proximo ano': nextYearHolidays
});
assert.equal(items.find((x) => x.id === 'F-2026-004').accion, 'ERROR_DATOS');
assert.equal(items.find((x) => x.id === 'F-2026-005').accion, 'IGNORAR');
assert.equal(items.find((x) => x.id === 'F-2026-003').fechaVencimientoCalculada, '2026-10-13');

const apiFailure = runCode({
  'Obtener facturas': db.facturas,
  'Consultar feriados del ano actual': [{ error: { message: 'offline' } }],
  'Consultar feriados del proximo ano': nextYearHolidays
});
assert.equal(apiFailure.length, 1);
assert.equal(apiFailure[0].accion, 'ERROR_API_FERIADOS');

const serverFailure = runCode({
  'Obtener facturas': [{ error: { message: 'connection refused' } }],
  'Consultar feriados del ano actual': currentYearHolidays,
  'Consultar feriados del proximo ano': nextYearHolidays
});
assert.equal(serverFailure[0].accion, 'ERROR_JSON_SERVER');

console.log('OK: Code node comprobado con datos simulados, error API y error JSON Server.');
