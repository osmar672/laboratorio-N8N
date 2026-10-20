# Laboratorio #1 - Soluciones de negocio: POO + n8n

**Escenario:** central de facturacion que calcula vencimientos en dias habiles para Costa Rica y marca como vencidas las facturas cuyo plazo ya termino.

## Contenido

- `n8n/workflow-facturacion-dias-habiles.json`: workflow importable en n8n. Incluye inicio manual y ejecucion diaria, consultas a JSON Server y Nager.Date, Code, IF, PATCH y ruta de incidencias.
- `src/`: clases JavaScript puras para probar sin n8n.
- `main.js`: ejecuta la demostracion POO por consola.
- `tests/pruebas.js`: seis pruebas automatizadas con `node:assert`.
- `db.json`: datos de prueba para JSON Server.
- `docs/Logica_de_Negocio.docx` y `.pdf`: documento breve para entregar.
- `docs/Guion_de_Defensa.md`: guia para demostracion oral en vivo.

## Requisitos

- Node.js y npm.
- Una instancia de n8n (local recomendada para este laboratorio).
- Conexion a internet para la API externa de feriados.

### 1. Instalar Node.js y npm en Arch Linux

```bash
sudo pacman -Syu nodejs npm
```

Cierra y vuelve a abrir la terminal si ya estaba abierta. Comprueba:

```bash
node --version
npm --version
```

### 2. Instalar dependencias e iniciar JSON Server

Abre una terminal dentro de la carpeta del proyecto:

```bash
npm install
npm run api
```

JSON Server queda escuchando en `http://localhost:3000`. No cierres esa terminal mientras pruebas n8n.

Verifica los datos en otra terminal:

```bash
curl http://localhost:3000/facturas
```

### 3. Probar las clases POO sin n8n

En otra terminal, desde la carpeta del proyecto:

```bash
npm run demo
npm test
```

`npm run demo` muestra la evaluacion de las facturas por consola. `npm test` debe mostrar `OK: 6 pruebas pasaron.` y luego `OK: Code node comprobado con datos simulados, error API y error JSON Server.`. El demo usa `data/feriados-demo.json` para poder probar la logica offline; el workflow de n8n obtiene feriados directamente de Nager.Date.

### 4. Importar el workflow

1. Abre n8n.
2. En el menu de workflows selecciona **Import from File** (Importar desde archivo).
3. Selecciona `n8n/workflow-facturacion-dias-habiles.json`.
4. Guarda el workflow y pulsa **Execute Workflow** para probarlo manualmente.
5. En las ejecuciones, revisa el nodo `Aplicar reglas POO y evaluar facturas`, y luego la ruta de `Actualizar factura en JSON Server`.
6. Comprueba los cambios en `http://localhost:3000/facturas`.

El workflow consulta los feriados del año actual y del siguiente mediante `https://date.nager.at/api/v3/PublicHolidays/{year}/CR`.

### 5. Ajustar URL segun donde corre n8n

El JSON incluido presupone que n8n puede acceder a JSON Server mediante `http://localhost:3000`.

- **n8n instalado directamente en la misma computadora:** deja `localhost`.
- **n8n dentro de Docker en Linux:** `localhost` apunta al contenedor. Usa un nombre/IP accesible del host para los dos URL de JSON Server. Si configuras `host.docker.internal`, inicia Docker con el mapeo de host correspondiente (`--add-host=host.docker.internal:host-gateway`) y cambia ambas URL en los nodos HTTP Request.
- **n8n Cloud:** una URL `localhost` no sera accesible desde la nube; expone JSON Server de forma segura mediante un endpoint accesible y reemplaza la URL. No publiques la base de datos sin controles.

### 6. Activar la ejecucion diaria

Primero valida una ejecucion manual. Cuando JSON Server y la API esten respondiendo, activa el workflow desde n8n. El disparador diario esta configurado para las 08:00 con zona horaria `America/Costa_Rica`.

## Reglas implementadas

1. La fecha de vencimiento se calcula contando desde el dia siguiente a la emision.
2. Sabados y domingos no se cuentan como dias habiles.
3. Los feriados devueltos por la API de Costa Rica tampoco se cuentan.
4. Solo se evalua automaticamente una factura con estado `pendiente`.
5. Los datos obligatorios deben ser validos: id, fecha ISO, dias habiles entre 1 y 365 y monto mayor que cero.
6. Una factura queda `vencida` cuando la fecha actual de Costa Rica es posterior a su vencimiento; si vence hoy todavia se considera pendiente.
7. JSON Server se actualiza solo si cambia el vencimiento o el estado; si no hay cambios, no se envia PATCH.
8. Si falla JSON Server, falla la API de feriados o falta un dato, se emite una incidencia y no se actualiza la factura.

## Manejo de errores que debes demostrar

- **Dato incompleto:** `F-2026-004` tiene `diasHabiles: 0`. El Code node devuelve `ERROR_DATOS` y el IF lo desvía a la ruta de incidencias sin ejecutar PATCH.
- **API externa caída:** para ensayar este caso, cambia temporalmente la URL de `Consultar feriados del ano actual` a una URL inválida, ejecuta el workflow y observa `ERROR_API_FERIADOS`. Luego restaura la URL oficial.
- **JSON Server no disponible:** detén `npm run api`, ejecuta el workflow y revisa `ERROR_JSON_SERVER`; después vuelve a iniciarlo.

## Fuentes técnicas

- Nager.Date Public Holiday API: https://date.nager.at/nl/Api
- JSON Server: https://github.com/typicode/json-server
- n8n HTTP Request: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/
- n8n Code node: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.code/


## Estado de verificacion

En este paquete se ejecutaron `node main.js`, las seis pruebas POO, las pruebas del codigo del nodo Code con respuestas HTTP simuladas y la validacion sintactica del JSON del workflow. La ejecucion real de los nodos HTTP dentro de n8n requiere que importes el flujo, inicies JSON Server y tengas acceso a Internet; no se afirma que se haya ejecutado en tu instancia de n8n.
