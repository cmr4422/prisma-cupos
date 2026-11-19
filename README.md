# Prisma · Cupos universitarios

Prototipo funcional de **Prisma**, una app para encontrar, reservar y publicar cupos de transporte universitario entre Palmira y Cali.

**Demo en vivo:** https://cmr4422.github.io/prisma-cupos/

Proyecto de *Diseño Centrado en el Usuario* · Angelo Iván Rengifo Mosquera · Fares Adrian Canchala Verdecia.

## Qué incluye

| Requerimiento funcional | Dónde está en la app |
|---|---|
| 1. Gestión de cuentas de usuario | Registro con validaciones, inicio de sesión, editar perfil con foto, cerrar sesión |
| 2. Consulta detallada de los cupos | Detalle con mapa y ruta real, conductor, vehículo, placa, hora, aporte, punto de encuentro y cupos |
| 3. Comunicación entre usuarios | Chat con respuestas rápidas (conductor ↔ pasajero) |
| 4. Gestión de tipos de usuario | Selector **Pasajero / Conductor** siempre visible en Inicio y en Perfil |
| 5. Publicación de cupos | Formulario con destino libre, día, hora, cupos, aporte y resumen antes de publicar |
| 6. Finalización de cupos ofrecidos | Botón “Finalizar cupo” con confirmación |
| 7. Visualización de cupos disponibles | Lista con búsqueda y filtros (día, sentido, horario, cupos libres) |

Mejoras aplicadas a partir del Reporte de evaluación: tutorial al primer ingreso, sección de ayuda y preguntas frecuentes, mensajes de error claros junto a cada campo, estado vacío con sugerencias cuando no hay cupos, más destinos y destino libre, filtros, interruptor de rol visible, textos y botones más grandes, botón de editar perfil visible, y menú de publicación simplificado en una sola pantalla.

## Tecnología

HTML, CSS y JavaScript sin dependencias de compilación. Mapas con Leaflet + OpenStreetMap y rutas con OSRM. Los datos se guardan en el navegador (localStorage), así cada persona que escanea el QR tiene su propia demo.

Para probar en local: `npx http-server -p 5173` y abrir http://localhost:5173.

Cuenta de prueba: usuario `demo`, contraseña `prisma123` (o “Explorar sin registrarme”).
