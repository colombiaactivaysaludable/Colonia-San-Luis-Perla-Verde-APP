import { Match, Player, Callup } from '../types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateSpanish(dateString: string): string {
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Generates the unique, standalone link for player confirmation
 */
export function getConfirmationUrl(matchId: string): string {
  if (typeof window === 'undefined') return `#/confirmar/${matchId}`;
  const origin = window.location.origin;
  const pathname = window.location.pathname;
  return `${origin}${pathname}#/confirmar/${matchId}`;
}

/**
 * Plantilla exacta para lista de difusión de WhatsApp:
 * Sin nombres ni cantidad de convocados en el texto.
 * Si arbitraje, minutos o implementos están vacíos, se omiten esas líneas.
 */
export function generateConfirmationBroadcastMessage(
  match: Match,
  teamName: string = 'COLONIA SAN LUIS – PERLA VERDE'
): string {
  const fechaStr = formatDateSpanish(match.date).toUpperCase();
  const confirmationUrl = getConfirmationUrl(match.id);

  // Combinar lista de implementos predefinidos y texto personalizado
  const allEquipment = [
    ...(match.requiredEquipment || []),
    ...(match.customEquipment?.trim() ? [match.customEquipment.trim()] : []),
  ];
  const implementosStr = allEquipment.join(', ');

  // Líneas condicionales: se omiten si están vacías
  const optionalLines: string[] = [];
  if (match.individualRefereeFee && match.individualRefereeFee > 0) {
    optionalLines.push(`💰 Arbitraje: ${formatCurrency(match.individualRefereeFee)} por jugador`);
  }
  if (implementosStr) {
    optionalLines.push(`🎽 Recordar traer: ${implementosStr}`);
  }
  if (match.arrivalMinutes && match.arrivalMinutes > 0) {
    optionalLines.push(`⏱️ Llegar ${match.arrivalMinutes} minutos antes del partido`);
  }

  const sections: string[] = [
    `🟢⚪ ${teamName.toUpperCase()} ⚪🟢`,
    `📋 CONVOCATORIA — ${fechaStr}`,
    `🏆 Torneo: ${match.tournament}\n🕐 Hora: ${match.time}\n📍 Lugar: ${match.venue}\n🆚 Rival: ${match.rival}`,
  ];

  if (optionalLines.length > 0) {
    sections.push(optionalLines.join('\n'));
  }

  sections.push(`👉 Confirma tu asistencia aquí:\n${confirmationUrl}`);
  sections.push(`¡Vamos Colonia! 💪`);

  return sections.join('\n\n');
}

/**
 * Mensaje de recordatorio exclusivo para los jugadores que aún están pendientes
 */
export function generatePendingReminderMessage(
  match: Match,
  pendingPlayers: Player[],
  teamName: string = 'Colonia San Luis – Perla Verde'
): string {
  const fechaStr = formatDateSpanish(match.date);
  const confirmationUrl = getConfirmationUrl(match.id);

  let msg = `🟢⚪ *RECORDATORIO — ${teamName.toUpperCase()}* ⚪🟢\n\n`;
  msg += `Muchachos, tenemos partido vs *${match.rival}* (${match.tournament}) el *${fechaStr}* a las *${match.time}*.\n\n`;

  if (pendingPlayers.length > 0) {
    msg += `⚠️ *Aún no han confirmado su asistencia (${pendingPlayers.length}):*\n`;
    pendingPlayers.forEach((p) => {
      msg += `• #${p.dorsal} ${p.fullName}\n`;
    });
    msg += `\n`;
  }

  msg += `👉 Por favor ingresa a este enlace y confirma si vas o no en un solo toque:\n`;
  msg += `${confirmationUrl}\n\n`;
  msg += `¡Es clave para definir la planilla a tiempo! 💪🌲`;

  return msg;
}

/**
 * Convocatoria Final Oficial (Cierre del proceso)
 * Anuncio oficial con los jugadores confirmados
 */
export function generateFinalSquadWhatsAppMessage(
  match: Match,
  confirmedPlayers: Player[],
  teamName: string = 'Colonia San Luis – Perla Verde'
): string {
  const fechaStr = formatDateSpanish(match.date).toUpperCase();
  const allEquipment = [
    ...(match.requiredEquipment || []),
    ...(match.customEquipment?.trim() ? [match.customEquipment.trim()] : []),
  ];
  const implementosStr = allEquipment.join(', ');

  let msg = `🟢⚪ *${teamName.toUpperCase()}* ⚪🟢\n\n`;
  msg += `📋 *CONVOCATORIA FINAL OFICIAL*\n\n`;
  msg += `🏆 *Torneo:* ${match.tournament}\n`;
  msg += `📅 *Fecha:* ${fechaStr}\n`;
  msg += `🕐 *Hora:* ${match.time} hrs\n`;
  msg += `📍 *Lugar:* ${match.venue}\n`;
  msg += `🆚 *Rival:* vs ${match.rival}\n\n`;

  if (match.arrivalMinutes && match.arrivalMinutes > 0) {
    msg += `⏱️ *Llegada sugerida:* Llegar ${match.arrivalMinutes} minutos antes para planilla y calentamiento\n`;
  }
  if (match.individualRefereeFee && match.individualRefereeFee > 0) {
    msg += `💰 *Arbitraje:* ${formatCurrency(match.individualRefereeFee)} por jugador\n`;
  }
  if (implementosStr) {
    msg += `🎽 *Indumentaria:* ${implementosStr}\n`;
  }

  msg += `\n👥 *PLANTEL CONFIRMADO (${confirmedPlayers.length} Jugadores):*\n`;
  if (confirmedPlayers.length === 0) {
    msg += `(Sin confirmados aún)\n`;
  } else {
    // Agrupar o listar con dorsal
    confirmedPlayers.forEach((p, idx) => {
      const nick = p.nickname ? ` "${p.nickname}"` : '';
      msg += `${idx + 1}. #${p.dorsal} ${p.fullName}${nick} (${p.position})\n`;
    });
  }

  msg += `\n¡Con toda la actitud por los 3 puntos! 🌲⚽\n`;
  msg += `#ColoniaSanLuis #VamosColonia`;

  return msg;
}

export function openWhatsApp(message: string, phoneNumber?: string): void {
  const cleanPhone = phoneNumber ? phoneNumber.replace(/\D/g, '') : '';
  const encodedText = encodeURIComponent(message);
  
  let url = '';
  if (cleanPhone) {
    url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
  } else {
    url = `https://api.whatsapp.com/send?text=${encodedText}`;
  }

  window.open(url, '_blank', 'noopener,noreferrer');
}

export function generatePaymentReminderMessage(
  teamName: string,
  player: Player,
  balance: number,
  matchDescription?: string
): string {
  let msg = `Hola *${player.fullName}* 👋,\n\nTe recordamos desde la delegación de *${teamName}* que tienes un saldo pendiente por concepto de arbitrajes de *${formatCurrency(balance)}*`;
  if (matchDescription) {
    msg += ` correspondiente a ${matchDescription}`;
  }
  msg += `.\n\nPor favor indícanos o envía el comprobante de pago cuando puedas para mantener la planilla al día. ¡Muchas gracias por el compromiso con el equipo! ⚽🙌`;
  return msg;
}

export function generateConvocatoriaWhatsAppMessage(
  teamName: string,
  match: Match,
  convocados: { player: Player; callup: Callup }[],
  inasistencias: { player: Player; callup: Callup }[]
): string {
  // Return the official broadcast template
  return generateConfirmationBroadcastMessage(match, teamName);
}
