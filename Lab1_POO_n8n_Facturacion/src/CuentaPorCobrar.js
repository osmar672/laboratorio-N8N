'use strict';

const Factura = require('./Factura');

/** Coleccion de facturas que centraliza la evaluacion de cuentas por cobrar. */
class CuentaPorCobrar {
  constructor(facturas = []) {
    if (!Array.isArray(facturas)) throw new TypeError('Las facturas deben proporcionarse como una lista.');
    this.facturas = facturas;
  }

  evaluarPendientes(fechaActual, calendario) {
    return this.facturas.map((datos) => {
      try {
        const factura = new Factura(datos);
        return factura.evaluar(fechaActual, calendario);
      } catch (error) {
        return {
          accion: 'ERROR_DATOS',
          id: datos?.id ?? null,
          motivo: error.message,
          noActualizar: true
        };
      }
    });
  }
}

module.exports = CuentaPorCobrar;
