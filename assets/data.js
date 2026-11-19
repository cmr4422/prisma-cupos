// Datos de demostración de Prisma. Coordenadas aproximadas de lugares reales de Palmira y Cali.

export const LUGARES = [
  // Palmira
  { id: 'unicentro-palmira', nombre: 'C.C. Unicentro Palmira', dir: 'Cl. 42 #39-68', ciudad: 'Palmira', lat: 3.5308, lng: -76.2963 },
  { id: 'llanogrande', nombre: 'C.C. Llanogrande Plaza', dir: 'Cl. 31 #44-239', ciudad: 'Palmira', lat: 3.5268, lng: -76.3069 },
  { id: 'unal-palmira', nombre: 'Universidad Nacional – Sede Palmira', dir: 'Cra. 32 #12-00', ciudad: 'Palmira', lat: 3.5126, lng: -76.309 },
  { id: 'parque-bolivar', nombre: 'Parque Bolívar', dir: 'Centro', ciudad: 'Palmira', lat: 3.5395, lng: -76.3036 },
  { id: 'terminal-palmira', nombre: 'Terminal de Transportes Palmira', dir: 'Cl. 32 con Cra. 33', ciudad: 'Palmira', lat: 3.5238, lng: -76.2991 },
  { id: 'aeropuerto', nombre: 'Aeropuerto Alfonso Bonilla Aragón', dir: 'Vía Palmira – Cali', ciudad: 'Palmira', lat: 3.5432, lng: -76.3816 },
  // Cali
  { id: 'uao', nombre: 'Universidad Autónoma de Occidente', dir: 'Cl. 25 #115-85', ciudad: 'Cali', lat: 3.3536, lng: -76.5225 },
  { id: 'javeriana', nombre: 'Pontificia Universidad Javeriana', dir: 'Cl. 18 #118-250', ciudad: 'Cali', lat: 3.3489, lng: -76.5308 },
  { id: 'icesi', nombre: 'Universidad Icesi', dir: 'Cl. 18 #122-135', ciudad: 'Cali', lat: 3.3418, lng: -76.53 },
  { id: 'univalle', nombre: 'Universidad del Valle – Meléndez', dir: 'Cl. 13 #100-00', ciudad: 'Cali', lat: 3.376, lng: -76.5335 },
  { id: 'usb', nombre: 'Universidad de San Buenaventura', dir: 'Av. 10 de Mayo, La Umbría', ciudad: 'Cali', lat: 3.3345, lng: -76.5375 },
  { id: 'unicentro-cali', nombre: 'C.C. Unicentro Cali', dir: 'Cra. 100 #5-169', ciudad: 'Cali', lat: 3.3744, lng: -76.5398 },
  { id: 'chipichape', nombre: 'C.C. Chipichape', dir: 'Cl. 38N #6N-35', ciudad: 'Cali', lat: 3.4762, lng: -76.5279 },
  { id: 'mallplaza', nombre: 'C.C. Mallplaza Cali', dir: 'Cra. 1 #65-170', ciudad: 'Cali', lat: 3.462, lng: -76.51 },
];

export const CONDUCTORES = [
  { id: 'c1', nombre: 'Carlos Orejuela', carrera: 'Ing. Industrial · UAO', rating: 4.9, viajes: 128, telefono: '+57 315 482 ****', vehiculo: { modelo: 'KIA Picanto', color: 'Blanco', placa: 'TRN834' }, color: '#0B7C80' },
  { id: 'c2', nombre: 'Valentina Ríos', carrera: 'Medicina · Javeriana', rating: 4.8, viajes: 86, telefono: '+57 318 220 ****', vehiculo: { modelo: 'Mazda 2', color: 'Rojo', placa: 'JKS219' }, color: '#C2410C' },
  { id: 'c3', nombre: 'Andrés Mosquera', carrera: 'Agronomía · UNAL Palmira', rating: 4.7, viajes: 64, telefono: '+57 301 774 ****', vehiculo: { modelo: 'Renault Logan', color: 'Gris', placa: 'FQD402' }, color: '#4338CA' },
  { id: 'c4', nombre: 'Laura Gómez', carrera: 'Diseño · Icesi', rating: 5.0, viajes: 41, telefono: '+57 312 905 ****', vehiculo: { modelo: 'Chevrolet Onix', color: 'Azul', placa: 'HTV587' }, color: '#BE185D' },
  { id: 'c5', nombre: 'Julián Castaño', carrera: 'Ing. Sistemas · Univalle', rating: 4.6, viajes: 97, telefono: '+57 320 118 ****', vehiculo: { modelo: 'Suzuki Swift', color: 'Negro', placa: 'MXP631' }, color: '#15803D' },
  { id: 'c6', nombre: 'Daniela Prado', carrera: 'Derecho · San Buenaventura', rating: 4.9, viajes: 73, telefono: '+57 316 640 ****', vehiculo: { modelo: 'Nissan Versa', color: 'Plata', placa: 'LPB908' }, color: '#7C3AED' },
];

// dia: 0 = hoy, 1 = mañana
export const CUPOS_BASE = [
  { id: 'k1', conductorId: 'c1', origen: 'unicentro-palmira', destino: 'uao', dia: 0, hora: '06:10', total: 4, ocupados: 2, aporte: 8000, encuentro: 'Entrada principal de Unicentro, frente a la portería' },
  { id: 'k2', conductorId: 'c2', origen: 'parque-bolivar', destino: 'javeriana', dia: 0, hora: '06:30', total: 4, ocupados: 3, aporte: 8000, encuentro: 'Esquina de la Catedral, costado del parque' },
  { id: 'k3', conductorId: 'c3', origen: 'terminal-palmira', destino: 'univalle', dia: 0, hora: '07:15', total: 3, ocupados: 1, aporte: 7000, encuentro: 'Bahía de taxis de la terminal' },
  { id: 'k4', conductorId: 'c4', origen: 'llanogrande', destino: 'icesi', dia: 0, hora: '09:00', total: 4, ocupados: 1, aporte: 9000, encuentro: 'Parqueadero de Llanogrande, entrada por la Cl. 31' },
  { id: 'k5', conductorId: 'c5', origen: 'univalle', destino: 'unicentro-palmira', dia: 0, hora: '12:40', total: 4, ocupados: 2, aporte: 8000, encuentro: 'Portería de la Cl. 13, Univalle' },
  { id: 'k6', conductorId: 'c6', origen: 'usb', destino: 'parque-bolivar', dia: 0, hora: '14:00', total: 3, ocupados: 0, aporte: 8000, encuentro: 'Entrada principal San Buenaventura' },
  { id: 'k7', conductorId: 'c1', origen: 'uao', destino: 'unicentro-palmira', dia: 0, hora: '18:20', total: 4, ocupados: 1, aporte: 8000, encuentro: 'Portería 1 de la UAO' },
  { id: 'k8', conductorId: 'c2', origen: 'javeriana', destino: 'llanogrande', dia: 0, hora: '19:00', total: 4, ocupados: 4, aporte: 8000, encuentro: 'Parqueadero de visitantes Javeriana' },
  { id: 'k9', conductorId: 'c3', origen: 'unal-palmira', destino: 'unicentro-cali', dia: 1, hora: '06:00', total: 4, ocupados: 0, aporte: 8000, encuentro: 'Portería principal UNAL Palmira' },
  { id: 'k10', conductorId: 'c4', origen: 'unicentro-palmira', destino: 'icesi', dia: 1, hora: '06:45', total: 4, ocupados: 2, aporte: 9000, encuentro: 'Entrada principal de Unicentro' },
  { id: 'k11', conductorId: 'c5', origen: 'parque-bolivar', destino: 'univalle', dia: 1, hora: '07:30', total: 3, ocupados: 1, aporte: 7000, encuentro: 'Costado norte del Parque Bolívar' },
  { id: 'k12', conductorId: 'c6', origen: 'llanogrande', destino: 'chipichape', dia: 1, hora: '10:15', total: 4, ocupados: 1, aporte: 9000, encuentro: 'Parqueadero de Llanogrande' },
  { id: 'k13', conductorId: 'c1', origen: 'uao', destino: 'terminal-palmira', dia: 1, hora: '17:30', total: 4, ocupados: 0, aporte: 8000, encuentro: 'Portería 1 de la UAO' },
  { id: 'k14', conductorId: 'c3', origen: 'aeropuerto', destino: 'parque-bolivar', dia: 1, hora: '20:00', total: 3, ocupados: 0, aporte: 6000, encuentro: 'Salida de llegadas nacionales' },
];

export const RESPUESTAS_AUTO = [
  '¡Hola! Sí, el cupo sigue disponible 🙌',
  'Perfecto, te espero en el punto de encuentro. Llega 5 minutos antes, porfa.',
  'Listo, voy en camino. Te aviso cuando esté llegando 🚗',
  'Claro que sí, sin problema.',
  'Dale, cualquier cosa me escribes por aquí.',
];

export const RESPUESTAS_RAPIDAS = [
  '¿El cupo sigue disponible?',
  'Ya voy para el punto de encuentro',
  'Llego en 5 minutos',
  '¿Me puedes esperar un momento?',
];

export const FAQ = [
  { q: '¿Cómo reservo un cupo?', a: 'En Inicio verás los cupos disponibles. Usa la búsqueda y los filtros (día, horario, sentido y cupos libres), toca un cupo para ver el detalle y pulsa “Reservar cupo”. Recibirás la confirmación al instante y podrás escribirle al conductor.' },
  { q: '¿Cómo cambio entre pasajero y conductor?', a: 'Usa el selector “Pasajero / Conductor” que está siempre arriba en la pantalla de Inicio, o desde tu Perfil. La primera vez que pases a conductor te pediremos los datos de tu vehículo.' },
  { q: '¿Cómo publico un cupo como conductor?', a: 'En modo conductor pulsa el botón “Publicar cupo”. Elige origen, destino (o escribe uno nuevo), día, hora, cuántos cupos ofreces y el aporte. Antes de publicar verás un resumen.' },
  { q: '¿Cómo finalizo un cupo?', a: 'En modo conductor, abre el cupo publicado y pulsa “Finalizar cupo” cuando termine el viaje o si ya no vas a llevar más pasajeros. Los pasajeros reservados serán notificados.' },
  { q: '¿Qué hago si no encuentro cupos?', a: 'Prueba con otro horario o con el día de mañana, cambia el sentido del viaje o quita filtros. También puedes activar el aviso para que te avisemos cuando se publique un cupo hacia tu destino.' },
  { q: '¿Puedo cancelar una reserva?', a: 'Sí. En “Mis viajes” abre la reserva y pulsa “Cancelar reserva”. Te recomendamos avisar al conductor por el chat.' },
  { q: '¿Mis datos están seguros?', a: 'Solo mostramos tu nombre y tu foto a los conductores con los que reservas. Tu número de contacto es opcional y nunca se muestra completo.' },
];

export const TUTORIAL = [
  { titulo: 'Encuentra tu cupo en segundos', texto: 'Mira todos los cupos disponibles entre Palmira y Cali con destino, hora, placa y cupos libres. Sin perseguir mensajes en el grupo.', icono: 'search' },
  { titulo: 'Filtra a tu medida', texto: 'Busca por destino y filtra por día, horario, sentido del viaje y cupos disponibles.', icono: 'filter' },
  { titulo: 'Pasajero o conductor, tú eliges', texto: 'Cambia de rol cuando quieras con el selector de arriba. Como conductor publicas y finalizas tus cupos fácilmente.', icono: 'swap' },
  { titulo: 'Habla con el conductor', texto: 'Coordina el punto de encuentro desde el chat. Si tienes dudas, toca el botón de ayuda “?” en cualquier momento.', icono: 'message' },
];
