/**
 * Communication utilities for 1-tap WhatsApp deep links and Mailto integration
 */

export type TemplateType =
  | 'visit_scheduled'
  | 'arrived_on_site'
  | 'quote_followup'
  | 'general_checkin'
  | 'urgent_reminder';

export interface MessageContext {
  clientName: string;
  contactPerson: string;
  companyName: string;
  staffName: string;
  dutyTitle?: string;
  date?: string;
  notes?: string;
}

/**
 * Sanitizes phone number by removing spaces, brackets, hyphens for wa.me URL
 */
export function cleanPhoneNumberForWhatsApp(phone: string): string {
  // Remove non-digit characters except leading +
  let cleaned = phone.replace(/[^0-9]/g, '');
  // Default to adding country code if missing or 10 digits
  if (cleaned.length === 10) {
    cleaned = '1' + cleaned; // default country code fallback
  }
  return cleaned;
}

/**
 * Generates pre-filled WhatsApp message text based on template
 */
export function getWhatsAppTemplateText(
  type: TemplateType,
  context: MessageContext
): string {
  const greeting = `Hello ${context.contactPerson || context.companyName},`;
  const signature = `\n\nBest regards,\n${context.staffName}\nField Operations Team`;

  switch (type) {
    case 'visit_scheduled':
      return `${greeting}\nThis is a confirmation that our field engineer ${context.staffName} is scheduled to visit your site for "${context.dutyTitle || 'Scheduled Service'}" on ${context.date || 'today'}.\n\nPlease let us know if any special gate clearance or safety equipment is needed.${signature}`;

    case 'arrived_on_site':
      return `${greeting}\nI have arrived at your premises for "${context.dutyTitle || 'Scheduled Service'}" and am ready to begin the inspection/work.\n\nPlease let me know who to report to at the front reception.${signature}`;

    case 'quote_followup':
      return `${greeting}\nI am following up regarding the service proposal and quotation we shared recently with ${context.companyName}.\n\nDo you have any questions or require any adjustments to proceed with the work order?${signature}`;

    case 'urgent_reminder':
      return `${greeting}\nThis is a quick urgent reminder regarding your pending service action item with us. We want to ensure everything remains on schedule.\n\nPlease give us a brief update or convenient time for a quick 2-minute call.${signature}`;

    case 'general_checkin':
    default:
      return `${greeting}\nI hope all is well at ${context.companyName}. I am checking in to see if you have any upcoming site requirements, maintenance needs, or updates for us.${signature}`;
  }
}

/**
 * Builds direct WhatsApp URL
 */
export function generateWhatsAppUrl(
  phone: string,
  type: TemplateType,
  context: MessageContext
): string {
  const cleanPhone = cleanPhoneNumberForWhatsApp(phone);
  const text = getWhatsAppTemplateText(type, context);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Builds standard mailto URL
 */
export function generateMailtoUrl(
  email: string,
  type: TemplateType,
  context: MessageContext
): string {
  let subject = `Field Operations Update - ${context.companyName}`;

  if (type === 'visit_scheduled') {
    subject = `Confirmed Service Visit: ${context.dutyTitle || 'Field Inspection'} - ${context.companyName}`;
  } else if (type === 'quote_followup') {
    subject = `Follow-Up: Service Proposal & Quotation - ${context.companyName}`;
  } else if (type === 'urgent_reminder') {
    subject = `Urgent Update Required - ${context.companyName}`;
  }

  const body = getWhatsAppTemplateText(type, context);
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
