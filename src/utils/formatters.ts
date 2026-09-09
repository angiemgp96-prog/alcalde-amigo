// Utilitarios de formato para ALCALDE AMIGO

// Formato de moneda en Pesos Colombianos ($ COP)
export function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(amount);
}

// Formato de fecha relativa / legible
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

// Validador y limpiador de número de celular colombiano para WhatsApp (agrega 57 si no lo tiene)
export function formatWhatsAppNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('57') && cleaned.length === 12) {
    return cleaned;
  }
  if (cleaned.length === 10 && cleaned.startsWith('3')) {
    return `57${cleaned}`;
  }
  return cleaned;
}
