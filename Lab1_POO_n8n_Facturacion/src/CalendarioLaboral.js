'use strict';

/** Servicio de dominio: identifica dias habiles y calcula fechas de vencimiento. */
class CalendarioLaboral {
  constructor(feriados = []) {
    if (!Array.isArray(feriados)) {
      throw new TypeError('Los feriados deben proporcionarse como una lista.');
    }
    this.feriados = new Set(
      feriados
        .map((feriado) => (typeof feriado === 'string' ? feriado : feriado?.date))
        .filter((fecha) => CalendarioLaboral.esFechaISO(fecha))
    );
  }

  static esFechaISO(fecha) {
    if (typeof fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
    const date = new Date(`${fecha}T12:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === fecha;
  }

  esDiaHabil(fechaISO) {
    if (!CalendarioLaboral.esFechaISO(fechaISO)) {
      throw new TypeError(`Fecha invalida: ${fechaISO}`);
    }
    const date = new Date(`${fechaISO}T12:00:00.000Z`);
    const diaSemana = date.getUTCDay();
    return diaSemana !== 0 && diaSemana !== 6 && !this.feriados.has(fechaISO);
  }

  sumarDiasHabiles(fechaInicial, cantidad) {
    if (!CalendarioLaboral.esFechaISO(fechaInicial)) {
      throw new TypeError('La fecha de emision debe usar el formato AAAA-MM-DD.');
    }
    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 365) {
      throw new RangeError('Los dias habiles deben ser un entero entre 1 y 365.');
    }

    const fecha = new Date(`${fechaInicial}T12:00:00.000Z`);
    let diasContados = 0;
    let intentos = 0;

    // Se comienza a contar el dia siguiente a la emision.
    while (diasContados < cantidad) {
      fecha.setUTCDate(fecha.getUTCDate() + 1);
      const actual = fecha.toISOString().slice(0, 10);
      if (this.esDiaHabil(actual)) diasContados += 1;
      intentos += 1;
      if (intentos > 550) throw new Error('No fue posible calcular la fecha dentro del limite esperado.');
    }

    return fecha.toISOString().slice(0, 10);
  }
}

module.exports = CalendarioLaboral;
