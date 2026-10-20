# Guion para defender el Laboratorio #1

## Presentacion sugerida (2-3 minutos)

Mi solucion automatiza el control de vencimientos de una empresa. Las facturas se guardan en JSON Server y algunas tienen plazos de pago expresados en dias habiles. Calcularlos manualmente puede generar errores, porque hay que excluir fines de semana y feriados nacionales.

Elegí una central de facturacion porque combina tres elementos: datos propios de la empresa, datos externos actualizados y reglas de negocio que se pueden probar. JSON Server actua como la base de facturas. Nager.Date aporta los feriados de Costa Rica del año actual y del siguiente. n8n coordina el proceso cada dia a las 8:00, y tambien permite ejecutarlo manualmente para la demostracion.

En POO separé responsabilidades. `CalendarioLaboral` sabe reconocer dias habiles y calcular una fecha. `Factura` valida una factura, calcula su vencimiento y decide si esta vencida. `CuentaPorCobrar` recorre la cartera y captura errores por factura para que un registro incorrecto no detenga toda la evaluacion. Estas clases se prueban con `node main.js` y `npm test`, sin depender de n8n.

El nodo Code del workflow implementa el mismo algoritmo porque el workflow exportado debe funcionar sin depender de archivos locales externos. El IF separa las facturas que necesitan actualizarse de las que no deben tocarse. Las facturas con datos invalidos, fallos de JSON Server o respuestas invalidas de la API terminan en la ruta de incidencias sin modificar registros.

Lo mas delicado fue integrar la logica de fechas con las respuestas HTTP y asegurar que un error de datos o de una API no provoque una actualizacion incorrecta. Por eso valide los datos y elegi no actualizar si no se puede comprobar la lista de feriados.

## Demostracion en vivo (orden recomendado)

1. Ejecuta `npm run demo` y explica la salida de `CuentaPorCobrar`.
2. Ejecuta `npm test` y muestra que pasan las seis pruebas.
3. En una terminal ejecuta `npm run api` y confirma `curl http://localhost:3000/facturas`.
4. Abre el workflow importado en n8n y pulsa **Execute Workflow**.
5. Explica los nodos: `Obtener facturas`, las dos consultas de feriados, Code, IF y PATCH.
6. Abre `http://localhost:3000/facturas` y enseña las facturas actualizadas.
7. Explica el registro `F-2026-004`: tiene `diasHabiles: 0`, por lo que el Code genera `ERROR_DATOS` y el IF no deja que llegue al PATCH.
8. Para demostrar un fallo externo, cambia temporalmente la URL del nodo de feriados a un endpoint invalido. Ejecuta de nuevo y muestra `ERROR_API_FERIADOS`. Restaura la URL oficial al terminar.

## Preguntas que debes poder contestar

- **Por que dos consultas de feriados?** Para cubrir tanto el año de hoy como el siguiente si una fecha de vencimiento cruza de año.
- **Por que se empieza a contar al dia siguiente?** Porque los dias de plazo posteriores a la emision no incluyen el dia en que se emitio la factura.
- **Que pasa si la API de feriados falla?** El workflow no adivina fechas. Genera una incidencia y no cambia ninguna factura.
- **Por que hay logica en clases y en Code?** Las clases permiten probar el dominio de forma independiente. El Code node incorpora el mismo algoritmo para que el workflow exportado sea autocontenido e importable en n8n.
- **Por que hay un IF?** Para que solo los resultados `ACTUALIZAR` ejecuten PATCH. Errores, facturas pagadas y registros sin cambios siguen otra ruta.
