'use strict';

const CalendarioLaboral = require('./CalendarioLaboral');

/** Entidad de negocio: una factura pendiente de cobro. */
class Factura {
  constructor(datos = {}) {
    this.id = datos.id;
    this.cliente = datos.cliente;
    this.fechaEmision = datos.fechaEmision;
    this.diasHabiles = datos.diasHabiles;
    this.monto = datos.monto;
    this.estado = datos.estado;
    this.fechaVencimiento = datos.fechaVencimiento ?? null;
  }

  validar() {
    const errores = [];
    if (this.id === undefined || this.id === null || String(this.id).trim() === '') {
      errores.push('falta el identificador de la factura');
    }
    if (!CalendarioLaboral.esFechaISO(this.fechaEmision)) {
      errores.push('fechaEmision debe tener el formato AAAA-MM-DD');
    }
    if (!Number.isInteger(this.diasHabiles) || this.diasHabiles < 1 || this.diasHabiles > 365) {
      errores.push('diasHabiles debe ser un entero entre 1 y 365');
    }
    if (typeof this.monto !== 'number' || !Number.isFinite(this.monto) || this.monto <= 0) {
      errores.push('monto debe ser un numero mayor que cero');
    }
    if (typeof this.estado !== 'string' || this.estado.trim() === '') {
      errores.push('estado es obligatorio');
    }
    if (errores.length) throw new Error(errores.join('; '));
    return true;
  }

  calcularFechaVencimiento(calendario) {
    this.validar();
    if (!(calendario instanceof CalendarioLaboral)) {
      throw new TypeError('Se requiere una instancia de CalendarioLaboral.');
    }
    return calendario.sumarDiasHabiles(this.fechaEmision, this.diasHabiles);
  }

  evaluar(fechaActual, calendario) {
    // Un estado vacio es un dato invalido; otros estados se ignoran sin recalcularlos.
    if (typeof this.estado !== 'string' || this.estado.trim() === '') this.validar();
    if (this.estado !== 'pendiente') {
      return { accion: 'IGNORAR', id: this.id, motivo: `La factura ya esta en estado ${this.estado}.` };
    }
    this.validar();
    if (!CalendarioLaboral.esFechaISO(fechaActual)) {
      throw new TypeError('La fecha de evaluacion debe usar el formato AAAA-MM-DD.');
    }

    const fechaVencimiento = this.calcularFechaVencimiento(calendario);
    const vencida = fechaActual > fechaVencimiento;
    const estadoCalculado = vencida ? 'vencida' : 'pendiente';
    const diasAtraso = vencida
      ? Math.floor((new Date(`${fechaActual}T12:00:00.000Z`) - new Date(`${fechaVencimiento}T12:00:00.000Z`)) / 86400000)
      : 0;

    const requiereCambio = this.fechaVencimiento !== fechaVencimiento || this.estado !== estadoCalculado;
    if (!requiereCambio) {
      return {
        accion: 'SIN_CAMBIOS', id: this.id, fechaVencimientoCalculada: fechaVencimiento,
        estadoCalculado, diasAtraso, motivo: 'La factura ya tiene los datos calculados.'
      };
    }

    return {
      accion: 'ACTUALIZAR', id: this.id, fechaVencimientoCalculada: fechaVencimiento,
      estadoCalculado, diasAtraso,
      motivo: vencida ? 'El plazo de pago ya vencio.' : 'Se calculo la fecha de vencimiento.',
      actualizacion: {
        fechaVencimiento,
        estado: estadoCalculado,
        diasAtraso,
        ultimaRevision: fechaActual,
        observacion: vencida ? `Factura vencida; atraso de ${diasAtraso} dia(s).` : 'Factura dentro del plazo de pago.'
      }
    };
  }
}

module.exports = Factura;
