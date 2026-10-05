import { PDFDocument, StandardFonts, rgb, type PDFImage, type PDFFont, type PDFPage } from 'pdf-lib';
import type { Booking } from '@/types/admin';
import { chronological, customerKey, dateKey, dateLabel, timeLabel, type DatePeriod } from '@/lib/bookingInsights';

const company = 'Cambridge Garden Services';
const phone = '07814 584 119';
const email = 'info@cambridgegardenservices.co.uk';
const logoUrl = '/WhatsApp_Image_2026-09-03_at_12.01.32_PM.jpeg';
const ink = rgb(0.11, 0.22, 0.17);
const muted = rgb(0.35, 0.43, 0.38);
const line = rgb(0.83, 0.87, 0.82);
const pageWidth = 595.28;
const pageHeight = 841.89;
const left = 48;
const contentWidth = pageWidth - left * 2;

function safe(value: unknown): string {
  return String(value ?? 'Not provided').replace(/[\r\n\t]+/g, ' ').replace(/[–—]/g, '-').replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[^\x20-\x7e\xa0-\xff]/g, '?');
}

async function jpegBytes(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Image could not be loaded');
  const blob = await response.blob();
  if (blob.type === 'image/jpeg') return new Uint8Array(await blob.arrayBuffer());
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Image could not be converted');
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0);
  bitmap.close();
  const jpeg = await new Promise<Blob>((resolve, reject) => canvas.toBlob((result) => result ? resolve(result) : reject(new Error('Image conversion failed')), 'image/jpeg', 0.85));
  return new Uint8Array(await jpeg.arrayBuffer());
}

class PdfBuilder {
  doc!: PDFDocument;
  regular!: PDFFont;
  bold!: PDFFont;
  logo: PDFImage | null = null;
  page!: PDFPage;
  y = 0;
  title: string;
  period: string;

  private constructor(title: string, period: string) { this.title = title; this.period = period; }

  static async create(title: string, period: string): Promise<PdfBuilder> {
    const pdf = new PdfBuilder(title, period);
    pdf.doc = await PDFDocument.create();
    pdf.doc.setTitle(`${company} - ${title}`);
    pdf.doc.setAuthor(company);
    pdf.regular = await pdf.doc.embedFont(StandardFonts.Helvetica);
    pdf.bold = await pdf.doc.embedFont(StandardFonts.HelveticaBold);
    try { pdf.logo = await pdf.doc.embedJpg(await jpegBytes(logoUrl)); } catch { /* Keep export available if the logo cannot load. */ }
    pdf.newPage();
    return pdf;
  }

  newPage() {
    this.page = this.doc.addPage([pageWidth, pageHeight]);
    this.y = pageHeight - 48;
    if (this.logo) {
      const dimensions = this.logo.scale(1);
      const scale = Math.min(56 / dimensions.width, 56 / dimensions.height);
      const width = dimensions.width * scale;
      const height = dimensions.height * scale;
      this.page.drawImage(this.logo, { x: left, y: this.y - 55 + (56 - height) / 2, width, height });
    }
    this.page.drawText(company, { x: left + 68, y: this.y - 17, size: 16, font: this.bold, color: ink });
    this.page.drawText(`${phone}  |  ${email}`, { x: left + 68, y: this.y - 36, size: 9, font: this.regular, color: muted });
    this.y -= 70;
    this.page.drawLine({ start: { x: left, y: this.y }, end: { x: pageWidth - left, y: this.y }, thickness: 1, color: line });
    this.y -= 30;
    this.page.drawText(safe(this.title), { x: left, y: this.y, size: 19, font: this.bold, color: ink });
    this.y -= 20;
    this.page.drawText(safe(this.period), { x: left, y: this.y, size: 10, font: this.regular, color: muted });
    this.y -= 28;
  }

  ensure(height: number) { if (this.y - height < 55) this.newPage(); }

  text(value: unknown, options: { bold?: boolean; size?: number; indent?: number; gap?: number } = {}) {
    const font = options.bold ? this.bold : this.regular;
    const size = options.size || 10;
    const indent = options.indent || 0;
    const maxWidth = contentWidth - indent;
    const words = safe(value).split(/\s+/);
    let current = '';
    const lines: string[] = [];
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
        lines.push(current);
        current = word;
      } else current = candidate;
    }
    if (current) lines.push(current);
    for (const valueLine of lines) {
      this.ensure(size + 5);
      this.page.drawText(valueLine, { x: left + indent, y: this.y, size, font, color: options.bold ? ink : muted });
      this.y -= size + 5;
    }
    this.y -= options.gap || 0;
  }

  section(label: string) {
    this.ensure(38);
    this.y -= 10;
    this.text(label.toUpperCase(), { bold: true, size: 10, gap: 7 });
  }

  field(label: string, value: unknown) { this.text(`${label}: ${value == null || value === '' ? 'Not provided' : value}`, { gap: 4 }); }

  async image(url: string, name?: string | null) {
    try {
      const image = await this.doc.embedJpg(await jpegBytes(url));
      const width = Math.min(contentWidth, 370);
      const height = Math.min(270, width * image.height / image.width);
      this.ensure(height + 30);
      this.page.drawImage(image, { x: left, y: this.y - height, width: height * image.width / image.height, height });
      this.y -= height + 10;
      if (name) this.text(name, { size: 9 });
    } catch {
      this.field('Inspiration image', `${name || 'Customer upload'} - ${url}`);
    }
  }

  async download(filename: string) {
    const pages = this.doc.getPages();
    pages.forEach((page, index) => {
      page.drawLine({ start: { x: left, y: 42 }, end: { x: pageWidth - left, y: 42 }, thickness: 1, color: line });
      page.drawText(`${company}  |  Page ${index + 1} of ${pages.length}`, { x: left, y: 27, size: 8, font: this.regular, color: muted });
    });
    const bytes = await this.doc.save();
    const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }
}

const appointment = (booking: Booking) => booking.appointment_at
  ? `${dateLabel(dateKey(booking.appointment_at), { day: 'numeric', month: 'long', year: 'numeric' })} at ${timeLabel(booking.appointment_at)} (Cambridge time)`
  : 'Not scheduled';
const service = (booking: Booking, services: Record<string, string>) => booking.service_id && services[booking.service_id] || booking.project_type;
const status = (booking: Booking) => booking.status[0].toUpperCase() + booking.status.slice(1);

export async function downloadBookingPdf(booking: Booking, services: Record<string, string>) {
  const pdf = await PdfBuilder.create('Booking details', `Reference: ${booking.id}`);
  pdf.section('Appointment');
  pdf.field('Booking date and time', appointment(booking));
  pdf.field('Status', status(booking));
  pdf.section('Customer');
  pdf.field('Name', booking.name);
  pdf.field('Phone', booking.phone);
  pdf.field('Email', booking.email);
  pdf.field('Full address', booking.address);
  pdf.section('Project');
  pdf.field('Selected service', service(booking, services));
  pdf.field('Budget', booking.budget);
  pdf.field('Final price', booking.final_price == null ? null : `GBP ${booking.final_price.toFixed(2)}`);
  pdf.field('Project details', booking.project_details);
  pdf.field('Created date', new Date(booking.created_at).toLocaleString('en-GB', { timeZone: 'Europe/London', dateStyle: 'medium', timeStyle: 'short' }));
  if (booking.attachment_url) { pdf.section('Inspiration image'); await pdf.image(booking.attachment_url, booking.attachment_name); }
  await pdf.download(`booking-${booking.id}.pdf`);
}

export async function downloadBookingReport(bookings: Booking[], period: DatePeriod, services: Record<string, string>) {
  const pdf = await PdfBuilder.create('Booking report', period?.label || 'All bookings');
  pdf.section('Summary');
  pdf.field('Total bookings', bookings.length);
  for (const state of ['new', 'confirmed', 'completed', 'cancelled']) pdf.field(`${state[0].toUpperCase()}${state.slice(1)} bookings`, bookings.filter((booking) => booking.status === state).length);
  pdf.section('Bookings');
  for (const booking of [...bookings].sort(chronological)) pdf.text(`${appointment(booking)}  |  ${booking.name}  |  ${service(booking, services)}  |  ${status(booking)}`, { gap: 6 });
  if (!bookings.length) pdf.text('No bookings in this period.');
  await pdf.download('booking-report.pdf');
}

export async function downloadDailySchedule(bookings: Booking[], day: string, services: Record<string, string>) {
  const pdf = await PdfBuilder.create('Daily schedule', dateLabel(day, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
  pdf.field('Total bookings today', bookings.length);
  pdf.section('Appointments');
  for (const booking of [...bookings].sort(chronological)) {
    pdf.text(`${timeLabel(booking.appointment_at!)}  |  ${booking.name}  |  ${service(booking, services)}  |  ${status(booking)}`, { bold: true, gap: 2 });
    pdf.text(`Address: ${booking.address || 'Not provided'}`, { indent: 12, gap: 8 });
  }
  if (!bookings.length) pdf.text('No bookings scheduled for today.');
  await pdf.download(`schedule-${day}.pdf`);
}

export async function downloadWeeklySchedule(bookings: Booking[], days: string[], services: Record<string, string>) {
  const pdf = await PdfBuilder.create('Weekly schedule', `${dateLabel(days[0], { day: 'numeric', month: 'short', year: 'numeric' })} - ${dateLabel(days[6], { day: 'numeric', month: 'short', year: 'numeric' })}`);
  for (const day of days) {
    pdf.section(dateLabel(day, { weekday: 'long', day: 'numeric', month: 'long' }));
    const daily = bookings.filter((booking) => booking.appointment_at && dateKey(booking.appointment_at) === day).sort(chronological);
    if (!daily.length) pdf.text('No bookings scheduled.', { gap: 5 });
    for (const booking of daily) {
      pdf.text(`${timeLabel(booking.appointment_at!)}  |  ${booking.name}  |  ${service(booking, services)}  |  ${status(booking)}`, { bold: true, gap: 2 });
      pdf.text(`Address: ${booking.address || 'Not provided'}`, { indent: 12, gap: 6 });
    }
  }
  await pdf.download(`weekly-schedule-${days[0]}.pdf`);
}

export async function downloadMonthlyReport(bookings: Booking[], all: Booking[], month: string, services: Record<string, string>) {
  const pdf = await PdfBuilder.create('Monthly booking report', dateLabel(`${month}-01`, { month: 'long', year: 'numeric' }));
  const firstByCustomer = new Map<string, string>();
  for (const booking of all) {
    const key = customerKey(booking);
    if (!firstByCustomer.has(key) || firstByCustomer.get(key)! > booking.created_at) firstByCustomer.set(key, booking.created_at);
  }
  const serviceCounts = new Map<string, number>();
  const dayCounts = new Map<string, number>();
  for (const booking of bookings) {
    const title = service(booking, services);
    serviceCounts.set(title, (serviceCounts.get(title) || 0) + 1);
    const day = dateKey(booking.appointment_at!);
    dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
  }
  const topService = [...serviceCounts].sort((a, b) => b[1] - a[1])[0];
  const busyDay = [...dayCounts].sort((a, b) => b[1] - a[1])[0];
  pdf.section('Summary');
  pdf.field('Total bookings', bookings.length);
  pdf.field('Completed bookings', bookings.filter((booking) => booking.status === 'completed').length);
  pdf.field('Pending bookings', bookings.filter((booking) => booking.status === 'new' || booking.status === 'contacted').length);
  pdf.field('Confirmed bookings', bookings.filter((booking) => booking.status === 'confirmed').length);
  pdf.field('Cancelled bookings', bookings.filter((booking) => booking.status === 'cancelled').length);
  pdf.field('New customers', new Set(bookings.filter((booking) => firstByCustomer.get(customerKey(booking)) === booking.created_at).map(customerKey)).size);
  pdf.field('Most requested service', topService ? `${topService[0]} (${topService[1]})` : 'None');
  pdf.field('Busiest day', busyDay ? `${dateLabel(busyDay[0])} (${busyDay[1]})` : 'None');
  pdf.section('Complete booking list');
  for (const booking of [...bookings].sort(chronological)) pdf.text(`${appointment(booking)}  |  ${booking.name}  |  ${service(booking, services)}  |  ${status(booking)}`, { gap: 6 });
  if (!bookings.length) pdf.text('No bookings in this month.');
  await pdf.download(`monthly-bookings-${month}.pdf`);
}

export async function downloadCustomerReport(bookings: Booking[], all: Booking[], period: DatePeriod, services: Record<string, string>) {
  const pdf = await PdfBuilder.create('Customer report', period?.label || 'All bookings');
  const groups = new Map<string, Booking[]>();
  for (const booking of bookings) groups.set(customerKey(booking), [...(groups.get(customerKey(booking)) || []), booking]);
  const firstByCustomer = new Map<string, string>();
  for (const booking of all) {
    const key = customerKey(booking);
    if (!firstByCustomer.has(key) || firstByCustomer.get(key)! > booking.created_at) firstByCustomer.set(key, booking.created_at);
  }
  const customers = [...groups].map(([key, entries]) => ({ key, entries, type: firstByCustomer.get(key) === [...entries].sort((a, b) => a.created_at.localeCompare(b.created_at))[0].created_at ? 'New' : 'Returning' }));
  pdf.section('Summary');
  pdf.field('New customers', customers.filter((entry) => entry.type === 'New').length);
  pdf.field('Returning customers', customers.filter((entry) => entry.type === 'Returning').length);
  pdf.section('Customers');
  for (const customer of customers.sort((a, b) => a.entries[0].name.localeCompare(b.entries[0].name))) {
    const last = [...customer.entries].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
    pdf.text(`${customer.entries[0].name} (${customer.type})  |  ${customer.entries[0].email}`, { bold: true, gap: 2 });
    pdf.text(`Bookings: ${customer.entries.length}  |  Last booking: ${appointment(last)}  |  Services: ${[...new Set(customer.entries.map((booking) => service(booking, services)))].join(', ')}`, { indent: 12, gap: 8 });
  }
  if (!customers.length) pdf.text('No customers in this period.');
  await pdf.download('customer-report.pdf');
}

export async function downloadServiceReport(bookings: Booking[], all: Booking[], period: DatePeriod, services: Record<string, string>) {
  const pdf = await PdfBuilder.create('Service performance', period?.label || 'All bookings');
  const firstByCustomer = new Map<string, string>();
  for (const booking of all) {
    const key = customerKey(booking);
    if (!firstByCustomer.has(key) || firstByCustomer.get(key)! > booking.created_at) firstByCustomer.set(key, booking.created_at);
  }
  const groups = new Map<string, Booking[]>();
  for (const booking of bookings) {
    const title = service(booking, services);
    groups.set(title, [...(groups.get(title) || []), booking]);
  }
  pdf.field('Total bookings', bookings.length);
  pdf.section('Services');
  for (const [title, entries] of [...groups].sort((a, b) => b[1].length - a[1].length)) {
    const newCustomers = new Set(entries.filter((entry) => firstByCustomer.get(customerKey(entry)) === entry.created_at).map(customerKey));
    const allCustomers = new Set(entries.map(customerKey));
    pdf.text(title, { bold: true, size: 12, gap: 3 });
    pdf.text(`${entries.length} bookings  |  ${newCustomers.size} new customers  |  ${allCustomers.size - newCustomers.size} returning customers`, { indent: 12, gap: 12 });
  }
  if (!groups.size) pdf.text('No bookings in this period.');
  await pdf.download('service-performance.pdf');
}
