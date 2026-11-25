import { PDFDocument, StandardFonts, degrees, rgb, type PDFFont, type PDFImage, type PDFPage } from 'pdf-lib';
import {
  ELEMENT_TYPES,
  FEATURES,

  LAWN_TYPES,

  elementMeta,
  formatGbp,
  plantById,
  round,
  styleById,
  type PackageId,
  type PlanResult,
  type PlantCategory,
  type ProjectKind,
  type RedesignInputs,
  type ScratchInputs,
} from '../../src/lib/designer/shared.js';

export interface PdfImage {
  bytes: Uint8Array;
  label: string;
}

export interface PdfInput {
  kind: ProjectKind;
  packageId: PackageId;
  packageName: string;
  pdfLevel: 1 | 2;
  reference: string;
  title: string;
  generatedAt: Date;
  scratch?: ScratchInputs;
  redesign?: RedesignInputs;
  plan?: PlanResult;
  /** Selected concept first, then alternatives. */
  concepts: PdfImage[];
  original?: PdfImage;
  logo?: Uint8Array | null;
}

const MARGIN = 40;
const FOOTER_H = 30;
const HEADER_H = 46;
const GREEN = rgb(0.102, 0.235, 0.18);
const SAGE = rgb(0.43, 0.56, 0.42);
const GREY = rgb(0.38, 0.4, 0.38);
const LIGHT = rgb(0.93, 0.95, 0.92);

function hex(color: string) {
  const value = color.replace('#', '');
  return rgb(parseInt(value.slice(0, 2), 16) / 255, parseInt(value.slice(2, 4), 16) / 255, parseInt(value.slice(4, 6), 16) / 255);
}

class Builder {
  pdf!: PDFDocument;
  font!: PDFFont;
  bold!: PDFFont;
  italic!: PDFFont;
  logo: PDFImage | null = null;
  page!: PDFPage;
  y = 0;
  landscape = false;
  readonly input: PdfInput;

  constructor(input: PdfInput) {
    this.input = input;
  }

  async init() {
    this.pdf = await PDFDocument.create();
    this.pdf.setTitle(`${this.input.title} - Cambridge Garden Services`);
    this.pdf.setAuthor('Cambridge Garden Services');
    this.pdf.setSubject(`Garden plan ${this.input.reference}`);
    this.pdf.setCreationDate(this.input.generatedAt);
    this.font = await this.pdf.embedFont(StandardFonts.Helvetica);
    this.bold = await this.pdf.embedFont(StandardFonts.HelveticaBold);
    this.italic = await this.pdf.embedFont(StandardFonts.HelveticaOblique);
    if (this.input.logo) {
      try {
        this.logo = await this.pdf.embedJpg(this.input.logo);
      } catch {
        try {
          this.logo = await this.pdf.embedPng(this.input.logo);
        } catch {
          this.logo = null;
        }
      }
    }
  }

  get width() {
    return this.page.getWidth();
  }

  get height() {
    return this.page.getHeight();
  }

  get contentWidth() {
    return this.width - MARGIN * 2;
  }

  safe(text: string, font: PDFFont = this.font) {
    let out = '';
    for (const ch of text.replace(/\r/g, '').replace(/\t/g, '  ')) {
      if (ch === '\n') {
        out += ' ';
        continue;
      }
      try {
        font.encodeText(ch);
        out += ch;
      } catch {
        out += ch === '’' || ch === '‘' ? "'" : ch === '“' || ch === '”' ? '"' : '?';
      }
    }
    return out;
  }

  newPage(landscape = false) {
    this.landscape = landscape;
    this.page = this.pdf.addPage(landscape ? [841.89, 595.28] : [595.28, 841.89]);
    this.drawHeader();
    this.y = this.height - MARGIN - HEADER_H;
  }

  drawHeader() {
    const top = this.height - MARGIN + 6;
    let textX = MARGIN;
    if (this.logo) {
      this.page.drawImage(this.logo, { x: MARGIN, y: top - 30, width: 30, height: 30 });
      textX = MARGIN + 38;
    }
    this.page.drawText('Cambridge Garden Services', { x: textX, y: top - 14, size: 13, font: this.bold, color: GREEN });
    this.page.drawText('AI Garden Designer', { x: textX, y: top - 27, size: 8, font: this.font, color: SAGE });
    const ref = this.safe(`Ref ${this.input.reference}`);
    this.page.drawText(ref, {
      x: this.width - MARGIN - this.font.widthOfTextAtSize(ref, 9),
      y: top - 14,
      size: 9,
      font: this.font,
      color: GREY,
    });
    this.page.drawLine({
      start: { x: MARGIN, y: top - 36 },
      end: { x: this.width - MARGIN, y: top - 36 },
      thickness: 0.8,
      color: SAGE,
    });
  }

  ensure(needed: number) {
    if (this.y - needed < MARGIN + FOOTER_H) this.newPage(this.landscape);
  }

  wrap(text: string, font: PDFFont, size: number, maxWidth: number) {
    const lines: string[] = [];
    for (const paragraph of this.safe(text, font).split(/\s*\n\s*/)) {
      let line = '';
      for (const word of paragraph.split(' ')) {
        if (!word) continue;
        const attempt = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(attempt, size) <= maxWidth) {
          line = attempt;
        } else {
          if (line) lines.push(line);
          // Break very long words so nothing overflows.
          let rest = word;
          while (font.widthOfTextAtSize(rest, size) > maxWidth) {
            let cut = rest.length - 1;
            while (cut > 1 && font.widthOfTextAtSize(rest.slice(0, cut), size) > maxWidth) cut -= 1;
            lines.push(rest.slice(0, cut));
            rest = rest.slice(cut);
          }
          line = rest;
        }
      }
      lines.push(line);
    }
    return lines;
  }

  paragraph(text: string, opts: { size?: number; bold?: boolean; italic?: boolean; color?: ReturnType<typeof rgb>; gap?: number; indent?: number } = {}) {
    const size = opts.size ?? 10;
    const font = opts.bold ? this.bold : opts.italic ? this.italic : this.font;
    const indent = opts.indent ?? 0;
    const leading = size * 1.35;
    const lines = this.wrap(text, font, size, this.contentWidth - indent);
    for (const line of lines) {
      this.ensure(leading);
      this.page.drawText(line, { x: MARGIN + indent, y: this.y - size, size, font, color: opts.color ?? rgb(0.13, 0.15, 0.13) });
      this.y -= leading;
    }
    this.y -= opts.gap ?? 4;
  }

  heading(text: string, level: 1 | 2 = 1) {
    const size = level === 1 ? 16 : 12;
    this.ensure(size * 2.5);
    this.y -= level === 1 ? 6 : 2;
    this.page.drawText(this.safe(text, this.bold), { x: MARGIN, y: this.y - size, size, font: this.bold, color: GREEN });
    this.y -= size + 4;
    if (level === 1) {
      this.page.drawLine({ start: { x: MARGIN, y: this.y }, end: { x: MARGIN + 60, y: this.y }, thickness: 2, color: SAGE });
      this.y -= 8;
    }
  }

  bullets(items: string[], size = 10) {
    for (const item of items) {
      const lines = this.wrap(item, this.font, size, this.contentWidth - 14);
      const leading = size * 1.35;
      lines.forEach((line, index) => {
        this.ensure(leading);
        if (index === 0) this.page.drawCircle({ x: MARGIN + 4, y: this.y - size * 0.55, size: 1.6, color: SAGE });
        this.page.drawText(line, { x: MARGIN + 14, y: this.y - size, size, font: this.font, color: rgb(0.13, 0.15, 0.13) });
        this.y -= leading;
      });
      this.y -= 1.5;
    }
    this.y -= 3;
  }

  keyValues(rows: [string, string][]) {
    const size = 10;
    const keyW = 150;
    for (const [key, value] of rows) {
      const lines = this.wrap(value || '-', this.font, size, this.contentWidth - keyW - 8);
      const h = Math.max(1, lines.length) * size * 1.35 + 5;
      this.ensure(h);
      this.page.drawRectangle({ x: MARGIN, y: this.y - h + 1, width: this.contentWidth, height: h - 1, color: LIGHT, opacity: 0.6 });
      this.page.drawText(this.safe(key, this.bold), { x: MARGIN + 6, y: this.y - size - 2, size, font: this.bold, color: GREEN });
      lines.forEach((line, i) => {
        this.page.drawText(line, { x: MARGIN + keyW, y: this.y - size - 2 - i * size * 1.35, size, font: this.font, color: rgb(0.13, 0.15, 0.13) });
      });
      this.y -= h;
    }
    this.y -= 6;
  }

  table(columns: { title: string; width: number; align?: 'left' | 'right' }[], rows: string[][], size = 9) {
    const total = columns.reduce((sum, column) => sum + column.width, 0);
    const scale = this.contentWidth / total;
    const widths = columns.map((column) => column.width * scale);
    const drawHeader = () => {
      this.ensure(22);
      this.page.drawRectangle({ x: MARGIN, y: this.y - 18, width: this.contentWidth, height: 18, color: GREEN });
      let x = MARGIN;
      columns.forEach((column, i) => {
        const title = this.safe(column.title, this.bold);
        const tx = column.align === 'right' ? x + widths[i] - 5 - this.bold.widthOfTextAtSize(title, size) : x + 5;
        this.page.drawText(title, { x: tx, y: this.y - 12.5, size, font: this.bold, color: rgb(1, 1, 1) });
        x += widths[i];
      });
      this.y -= 18;
    };
    drawHeader();
    rows.forEach((row, rowIndex) => {
      const cellLines = row.map((cell, i) => this.wrap(cell, this.font, size, widths[i] - 10));
      const lineCount = Math.max(1, ...cellLines.map((lines) => lines.length));
      const h = lineCount * size * 1.3 + 7;
      if (this.y - h < MARGIN + FOOTER_H) {
        this.newPage(this.landscape);
        drawHeader();
      }
      if (rowIndex % 2 === 0) this.page.drawRectangle({ x: MARGIN, y: this.y - h, width: this.contentWidth, height: h, color: LIGHT, opacity: 0.55 });
      let x = MARGIN;
      cellLines.forEach((lines, i) => {
        lines.forEach((line, lineIndex) => {
          const tx = columns[i].align === 'right' ? x + widths[i] - 5 - this.font.widthOfTextAtSize(line, size) : x + 5;
          this.page.drawText(line, { x: tx, y: this.y - size - 3 - lineIndex * size * 1.3, size, font: this.font, color: rgb(0.13, 0.15, 0.13) });
        });
        x += widths[i];
      });
      this.y -= h;
    });
    this.y -= 8;
  }

  async embed(bytes: Uint8Array): Promise<PDFImage | null> {
    try {
      const isPng = bytes[0] === 0x89 && bytes[1] === 0x50;
      return isPng ? await this.pdf.embedPng(bytes) : await this.pdf.embedJpg(bytes);
    } catch {
      return null;
    }
  }

  async image(image: PdfImage, maxHeight: number, caption?: string) {
    const embedded = await this.embed(image.bytes);
    if (!embedded) {
      this.paragraph(`${image.label}: image could not be embedded.`, { italic: true, color: GREY });
      return;
    }
    const maxW = this.contentWidth;
    const scale = Math.min(maxW / embedded.width, maxHeight / embedded.height);
    const w = embedded.width * scale;
    const h = embedded.height * scale;
    this.ensure(h + (caption ? 18 : 6));
    const x = MARGIN + (maxW - w) / 2;
    this.page.drawRectangle({ x: x - 1, y: this.y - h - 1, width: w + 2, height: h + 2, borderColor: SAGE, borderWidth: 0.6 });
    this.page.drawImage(embedded, { x, y: this.y - h, width: w, height: h });
    this.y -= h + 4;
    if (caption) {
      const text = this.safe(caption, this.italic);
      this.page.drawText(text, {
        x: MARGIN + (maxW - this.italic.widthOfTextAtSize(text, 8.5)) / 2,
        y: this.y - 9,
        size: 8.5,
        font: this.italic,
        color: GREY,
      });
      this.y -= 16;
    }
    this.y -= 4;
  }

  /** Vector, to-scale top-down plan. Fits the available box on the current page. */
  drawPlan(box: { x: number; y: number; w: number; h: number }, opts: { showPlants: boolean }) {
    const { scratch, plan } = this.input;
    if (!scratch || !plan) return;
    const { plot, elements } = scratch;
    const band = Math.max(1.2, Math.max(plot.width, plot.depth) * 0.12);
    const street = Math.max(0.7, band * 0.5);
    const extraX = plot.houseSide === 'left' || plot.houseSide === 'right' ? band + street : 0;
    const extraY = plot.houseSide === 'top' || plot.houseSide === 'bottom' ? band + street : 0;
    const dimPad = 22;
    const totalW = plot.width + extraX;
    const totalH = plot.depth + extraY;
    const scale = Math.min((box.w - dimPad * 2) / totalW, (box.h - dimPad * 2) / totalH);
    const drawW = totalW * scale;
    const drawH = totalH * scale;
    const left = box.x + (box.w - drawW) / 2;
    const top = box.y + box.h - (box.h - drawH) / 2; // PDF y of top edge
    const offX = plot.houseSide === 'left' ? band + street : 0;
    const offY = plot.houseSide === 'top' ? band + street : 0;
    const px = (x: number) => left + (offX + x) * scale;
    const py = (y: number) => top - (offY + y) * scale;

    // House and street.
    const houseRect = (() => {
      switch (plot.houseSide) {
        case 'top':
          return { x: 0, y: -band, w: plot.width, h: band };
        case 'bottom':
          return { x: 0, y: plot.depth, w: plot.width, h: band };
        case 'left':
          return { x: -band, y: 0, w: band, h: plot.depth };
        default:
          return { x: plot.width, y: 0, w: band, h: plot.depth };
      }
    })();
    const streetRect = (() => {
      switch (plot.houseSide) {
        case 'top':
          return { x: 0, y: -band - street, w: plot.width, h: street };
        case 'bottom':
          return { x: 0, y: plot.depth + band, w: plot.width, h: street };
        case 'left':
          return { x: -band - street, y: 0, w: street, h: plot.depth };
        default:
          return { x: plot.width + band, y: 0, w: street, h: plot.depth };
      }
    })();
    const drawRect = (r: { x: number; y: number; w: number; h: number }, fill: ReturnType<typeof rgb>, border: ReturnType<typeof rgb>) => {
      this.page.drawRectangle({ x: px(r.x), y: py(r.y + r.h), width: r.w * scale, height: r.h * scale, color: fill, borderColor: border, borderWidth: 0.6 });
    };
    drawRect(houseRect, rgb(0.8, 0.77, 0.72), rgb(0.5, 0.45, 0.4));
    drawRect(streetRect, rgb(0.62, 0.64, 0.66), rgb(0.4, 0.42, 0.44));
    const label = (text: string, r: { x: number; y: number; w: number; h: number }, vertical: boolean) => {
      const t = this.safe(text, this.bold);
      const size = 8;
      const cx = px(r.x + r.w / 2);
      const cy = py(r.y + r.h / 2);
      const tw = this.bold.widthOfTextAtSize(t, size);
      if (vertical) {
        this.page.drawText(t, { x: cx + size * 0.35, y: cy - tw / 2, size, font: this.bold, color: rgb(0.2, 0.2, 0.2), rotate: degrees(90) });
      } else {
        this.page.drawText(t, { x: cx - tw / 2, y: cy - size * 0.35, size, font: this.bold, color: rgb(0.2, 0.2, 0.2) });
      }
    };
    const vertical = plot.houseSide === 'left' || plot.houseSide === 'right';
    label('HOUSE', houseRect, vertical);
    label('STREET', streetRect, vertical);

    // Garden plot background and elements.
    this.page.drawRectangle({ x: px(0), y: py(plot.depth), width: plot.width * scale, height: plot.depth * scale, color: rgb(0.97, 0.98, 0.95) });
    elements.forEach((element) => {
      const meta = elementMeta(element.type);
      this.page.drawRectangle({
        x: px(element.x),
        y: py(element.y + element.h),
        width: element.w * scale,
        height: element.h * scale,
        color: hex(meta.fill),
        borderColor: hex(meta.stroke),
        borderWidth: 0.7,
      });
      const text = this.safe(meta.label, this.font);
      const size = 7;
      const tw = this.font.widthOfTextAtSize(text, size);
      if (tw < element.w * scale - 6 && size + 4 < element.h * scale) {
        this.page.drawText(text, { x: px(element.x) + 3, y: py(element.y) - size - 2, size, font: this.font, color: rgb(0.15, 0.15, 0.15) });
      }
    });

    // Boundary.
    this.page.drawRectangle({ x: px(0), y: py(plot.depth), width: plot.width * scale, height: plot.depth * scale, borderColor: GREEN, borderWidth: 1.4 });

    // Hedge and fence runs.
    plan.hedgeRuns.forEach((run) => {
      this.page.drawLine({ start: { x: px(run[0]), y: py(run[1]) }, end: { x: px(run[2]), y: py(run[3]) }, thickness: 3.2, color: rgb(0.1, 0.42, 0.2), opacity: 0.55 });
    });
    plan.fenceRuns.forEach((run) => {
      this.page.drawLine({ start: { x: px(run[0]), y: py(run[1]) }, end: { x: px(run[2]), y: py(run[3]) }, thickness: 1.8, color: rgb(0.45, 0.3, 0.18), dashArray: [4, 2] });
    });

    if (opts.showPlants) {
      const colours: Record<PlantCategory, ReturnType<typeof rgb>> = {
        flower: rgb(0.84, 0.2, 0.42),
        shrub: rgb(0.18, 0.49, 0.31),
        tree: rgb(0.08, 0.33, 0.18),
        hedge: rgb(0.1, 0.37, 0.12),
      };
      plan.markers.forEach((marker) => {
        const plant = plantById(marker.plantId);
        const spread = plant ? plant.spread : 0.5;
        const radius = Math.min(11, Math.max(1.3, (spread * scale) / 2));
        const cx = px(marker.x);
        const cy = py(marker.y);
        if (marker.category === 'tree') {
          this.page.drawCircle({ x: cx, y: cy, size: Math.max(radius, 5), color: colours.tree, opacity: 0.35, borderColor: colours.tree, borderWidth: 0.9 });
          this.page.drawCircle({ x: cx, y: cy, size: 1.4, color: colours.tree });
        } else {
          this.page.drawCircle({ x: cx, y: cy, size: marker.category === 'hedge' ? Math.min(radius, 2.2) : radius * 0.7, color: colours[marker.category], opacity: 0.85 });
        }
      });
    }

    // Dimension labels.
    const wText = `${round(plot.width, 1)} m`;
    const dText = `${round(plot.depth, 1)} m`;
    const wSize = 9;
    this.page.drawText(wText, {
      x: px(plot.width / 2) - this.bold.widthOfTextAtSize(wText, wSize) / 2,
      y: plot.houseSide === 'bottom' ? top - drawH - 14 : py(plot.depth) - 14,
      size: wSize,
      font: this.bold,
      color: GREEN,
    });
    this.page.drawText(dText, {
      x: (plot.houseSide === 'left' ? left + drawW : left) + (plot.houseSide === 'left' ? 6 : -14),
      y: py(plot.depth / 2) + this.bold.widthOfTextAtSize(dText, wSize) / 2,
      size: wSize,
      font: this.bold,
      color: GREEN,
      rotate: degrees(-90),
    });

    // Scale bar.
    const options = [1, 2, 5, 10, 20];
    const barMetres = options.filter((value) => value * scale <= box.w * 0.3).pop() || 1;
    const barX = box.x + 4;
    const barY = box.y + 2;
    this.page.drawLine({ start: { x: barX, y: barY }, end: { x: barX + barMetres * scale, y: barY }, thickness: 2, color: rgb(0.2, 0.2, 0.2) });
    this.page.drawText(`${barMetres} m`, { x: barX + barMetres * scale + 4, y: barY - 3, size: 8, font: this.font, color: rgb(0.2, 0.2, 0.2) });
  }

  legend(showPlants: boolean) {
    const used = new Set(this.input.scratch?.elements.map((element) => element.type));
    const items: { color: ReturnType<typeof rgb>; label: string }[] = ELEMENT_TYPES.filter((meta) => used.has(meta.type)).map((meta) => ({ color: hex(meta.fill), label: meta.label }));
    if (this.input.plan?.fenceRuns.length) items.push({ color: rgb(0.45, 0.3, 0.18), label: 'Fencing (dashed)' });
    if (showPlants) {
      items.push({ color: rgb(0.84, 0.2, 0.42), label: 'Flowers' }, { color: rgb(0.18, 0.49, 0.31), label: 'Shrubs' }, { color: rgb(0.08, 0.33, 0.18), label: 'Trees' });
      if (this.input.plan?.hedgeRuns.length) items.push({ color: rgb(0.1, 0.42, 0.2), label: 'Hedge' });
    }
    let x = MARGIN;
    this.ensure(20);
    items.forEach((item) => {
      const w = this.font.widthOfTextAtSize(this.safe(item.label), 8.5) + 22;
      if (x + w > this.width - MARGIN) {
        x = MARGIN;
        this.y -= 14;
        this.ensure(16);
      }
      this.page.drawRectangle({ x, y: this.y - 9, width: 10, height: 8, color: item.color, borderColor: GREY, borderWidth: 0.4 });
      this.page.drawText(this.safe(item.label), { x: x + 14, y: this.y - 8, size: 8.5, font: this.font, color: rgb(0.13, 0.15, 0.13) });
      x += w;
    });
    this.y -= 22;
  }

  finish() {
    const pages = this.pdf.getPages();
    pages.forEach((page, index) => {
      const w = page.getWidth();
      page.drawLine({ start: { x: MARGIN, y: MARGIN - 4 }, end: { x: w - MARGIN, y: MARGIN - 4 }, thickness: 0.4, color: SAGE });
      page.drawText(this.safe('Cambridge Garden Services - AI design and cost figures are estimates, not a quotation.'), {
        x: MARGIN,
        y: MARGIN - 16,
        size: 7.5,
        font: this.font,
        color: GREY,
      });
      const label = `Page ${index + 1} of ${pages.length}`;
      page.drawText(label, { x: w - MARGIN - this.font.widthOfTextAtSize(label, 8), y: MARGIN - 16, size: 8, font: this.font, color: GREY });
    });
  }
}

const DISCLAIMER =
  'All costs and quantities in this document are estimates for planning purposes only and are not a quotation. Final costs depend on site conditions, material availability and measurements taken on site. AI-generated images are illustrations of the chosen design direction and may not match your garden layout exactly; the scaled plan is the reference for positions and sizes.';

function dateText(date: Date) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

function featureList(scratch: ScratchInputs) {
  return scratch.features.map((id) => {
    const feature = FEATURES.find((item) => item.id === id);
    if (!feature) return id;
    const qty = feature.countable ? ` x ${Math.max(1, Math.round(scratch.featureQty[id] || 1))}` : '';
    return `${feature.label}${qty}`;
  });
}

export async function buildPdf(input: PdfInput): Promise<Uint8Array> {
  const b = new Builder(input);
  await b.init();
  const complete = input.pdfLevel === 2;
  const plus = input.packageId !== 'preview';
  const style = styleById(input.scratch?.style || input.redesign?.style || 'modern');

  // Portrait cover / summary page.
  b.newPage(false);
  b.page.drawText(b.safe(complete ? 'Garden Implementation Plan' : input.kind === 'scratch' ? 'Garden Plan Summary' : 'Garden Design Report', b.bold), {
    x: MARGIN,
    y: b.y - 24,
    size: 24,
    font: b.bold,
    color: GREEN,
  });
  b.y -= 40;
  b.paragraph(input.title, { size: 13, color: GREY, gap: 8 });

  const summary: [string, string][] = [
    ['Reference', input.reference],
    ['Date generated', dateText(input.generatedAt)],
    ['Package', input.packageName],
    ['Garden style', `${style.label}: ${style.description}`],
  ];
  if (input.scratch) {
    const { plot } = input.scratch;
    summary.push(
      ['Plot dimensions', `${round(plot.width, 1)} m wide x ${round(plot.depth, 1)} m deep`],
      ['Plot area', `${round(plot.width * plot.depth, 1)} m²`],
      ['House position', `${plot.houseSide} edge of the plan (street beyond the house)`]
    );
  }
  b.keyValues(summary);

  if (input.concepts[0]) {
    b.heading(input.kind === 'redesign' && input.original ? 'Your redesigned garden' : 'Selected garden design', 2);
    await b.image(input.concepts[0], 300, input.concepts[0].label);
  }

  if (input.kind === 'redesign') {
    if (input.original) {
      b.newPage(false);
      b.heading('Before and after');
      await b.image(input.original, 260, 'Your original garden photograph');
      if (input.concepts[0]) await b.image(input.concepts[0], 260, `Selected redesign: ${input.concepts[0].label}`);
    }
    b.heading('Your design brief');
    b.keyValues([
      ['Garden style', style.label],
      ['Your instructions', input.redesign?.instructions || 'None provided'],
    ]);
    if (input.concepts.length > 1) {
      b.newPage(false);
      b.heading('Alternative design concepts');
      for (const concept of input.concepts.slice(1)) {
        await b.image(concept, 260, concept.label);
      }
    }
    if (plus) {
      b.newPage(false);
      b.heading('Recommendations');
      b.paragraph(`The ${style.label} style typically works well with the following planting. Suitability depends on your soil, aspect and exposure, which should be confirmed on site.`);
      b.table(
        [
          { title: 'Plant', width: 3 },
          { title: 'Type', width: 1.2 },
          { title: 'Notes', width: 5 },
        ],
        style.plants
          .map(plantById)
          .filter((plant): plant is NonNullable<typeof plant> => Boolean(plant))
          .map((plant) => [`${plant.name} (${plant.latin})`, plant.category, `${plant.description} ${plant.sun}.`])
      );
      b.paragraph('Material and cost quantities are not calculated for photo redesigns because the garden has not been measured. Measurements, quantities and pricing require an on-site assessment.', { italic: true, color: GREY });
    }
    if (complete) {
      b.heading('Implementation notes');
      b.bullets(implementationNotes());
      b.heading('Items requiring on-site assessment', 2);
      b.bullets([
        'Garden measurements and levels',
        'Ground conditions, drainage and soil type',
        'Access for materials and machinery',
        'Underground services, boundaries and any planning or tree preservation restrictions',
      ]);
    }
    b.paragraph(DISCLAIMER, { size: 8.5, italic: true, color: GREY });
    b.finish();
    return b.pdf.save();
  }

  // ------------------------------- Scratch ---------------------------------
  const scratch = input.scratch as ScratchInputs;
  const plan = input.plan as PlanResult;
  const { plot } = scratch;

  b.heading('Your selections', 1);
  const lawn = LAWN_TYPES.find((item) => item.id === scratch.lawnType);
  b.keyValues([
    ['Lawn type', lawn ? lawn.label : 'Not specified'],
    ['Maintenance', scratch.preferences.maintenance],
    ['Preferred materials', scratch.preferences.materials.join(', ') || 'No preference'],
    ['Features', featureList(scratch).join(', ') || 'None selected'],
    ['Budget', scratch.preferences.budget ? `${formatGbp(Math.round(scratch.preferences.budget * 100))} (your stated budget)` : 'Not specified'],
    ['Additional instructions', scratch.preferences.instructions || 'None'],
    ['Special requirements', scratch.preferences.special || 'None'],
  ]);

  // Plan page: orientation follows the plot shape.
  const landscape = plot.width > plot.depth * 1.15 || ((plot.houseSide === 'left' || plot.houseSide === 'right') && plot.width >= plot.depth * 0.9);
  b.newPage(landscape);
  b.heading(complete ? 'Scaled garden layout (top-down)' : 'Top-down garden layout');
  const planTop = b.y;
  const planBottom = MARGIN + FOOTER_H + 52;
  b.drawPlan({ x: MARGIN, y: planBottom, w: b.contentWidth, h: planTop - planBottom }, { showPlants: complete || plus });
  b.y = planBottom - 6;
  b.legend(complete || plus);
  b.paragraph('Plan drawn to scale from the dimensions you entered. The house and street are shown for orientation only; the house footprint is not to scale.', { size: 8.5, italic: true, color: GREY });

  b.newPage(false);
  b.heading('Garden zones');
  const zoneRows = ELEMENT_TYPES.filter((meta) => plan.areas[meta.type] > 0).map((meta) => [
    meta.label,
    String(scratch.elements.filter((element) => element.type === meta.type).length),
    `${plan.areas[meta.type]} m²`,
  ]);
  if (zoneRows.length) {
    b.table(
      [
        { title: 'Zone', width: 4 },
        { title: 'Number', width: 1.2, align: 'right' },
        { title: 'Area (no overlap)', width: 2, align: 'right' },
      ],
      zoneRows
    );
  } else {
    b.paragraph('No zones were placed in the layout.', { italic: true });
  }
  b.paragraph(`Plot area ${plan.plotArea} m². Zones cover about ${plan.gardenCoveragePct}% of the plot; the remainder is open space.`);

  if (plus && !complete) {
    b.heading('Plant suggestions');
    const plantRows = scratch.plants
      .map(plantById)
      .filter((plant): plant is NonNullable<typeof plant> => Boolean(plant))
      .map((plant) => [plant.name, plant.category, `${plant.description} Approx. mature height ${plant.height} m. ${plant.sun}.`]);
    if (plantRows.length) {
      b.table(
        [
          { title: 'Plant', width: 3 },
          { title: 'Type', width: 1.1 },
          { title: 'Description', width: 5.5 },
        ],
        plantRows
      );
    } else {
      b.paragraph('No plants were selected.', { italic: true });
    }
    plan.warnings.forEach((warning) => b.paragraph(`Note: ${warning}`, { color: rgb(0.6, 0.25, 0.1) }));
  }

  if (!complete && plus) {
    b.heading('Material suggestions', 2);
    b.bullets(
      (scratch.preferences.materials.length ? scratch.preferences.materials : ['Choose paving to suit your style, for example natural stone or porcelain']).map(
        (material) => `${material}: suitable for patios, paths and seating areas; confirm suitability on site.`
      )
    );
  }

  if (complete) {
    b.newPage(false);
    b.heading('Planting zones and plant placement');
    b.paragraph('Plant positions on the layout plan are generated from your flower beds, planting zones and boundaries using each plant\'s typical spacing. Quantities are indicative and should be confirmed on site.');
    const placementRows = plan.plantLines.map((line) => [line.name, line.category, String(line.quantity), line.where]);
    if (placementRows.length) {
      b.table(
        [
          { title: 'Plant', width: 3.4 },
          { title: 'Type', width: 1.1 },
          { title: 'Qty', width: 0.9, align: 'right' },
          { title: 'Location', width: 3.2 },
        ],
        placementRows
      );
    }
    b.heading('Recommended plants', 2);
    b.table(
      [
        { title: 'Plant', width: 3.2 },
        { title: 'Description', width: 4.4 },
        { title: 'Size (H x S)', width: 1.4 },
      ],
      scratch.plants
        .map(plantById)
        .filter((plant): plant is NonNullable<typeof plant> => Boolean(plant))
        .map((plant) => [`${plant.name} (${plant.latin})`, `${plant.description} ${plant.sun}. ${plant.interest}.`, `${plant.height} x ${plant.spread} m`])
    );
    plan.warnings.forEach((warning) => b.paragraph(`Note: ${warning}`, { color: rgb(0.6, 0.25, 0.1) }));

    b.newPage(false);
    b.heading('Materials, quantities and estimated costs');
    b.paragraph('Quantities are calculated from your plot dimensions and layout. Unit rates are the rates configured by Cambridge Garden Services; items without a configured rate are shown as "To be quoted" and are not included in the total.');
    b.table(
      [
        { title: 'Item', width: 3.6 },
        { title: 'Qty', width: 1, align: 'right' },
        { title: 'Unit', width: 0.8 },
        { title: 'Unit rate', width: 1.3, align: 'right' },
        { title: 'Estimate', width: 1.5, align: 'right' },
      ],
      plan.lines.map((line) => [
        line.note ? `${line.label} (${line.note})` : line.label,
        String(line.quantity),
        line.unit.replace('m2', 'm²').replace('m3', 'm³'),
        line.unitRatePence === null ? 'To be quoted' : formatGbp(line.unitRatePence),
        line.totalPence === null ? (line.key === 'mulch_m3' ? 'Included above' : 'To be quoted') : formatGbp(line.totalPence),
      ])
    );
    const priced = plan.lines.filter((line) => line.totalPence !== null).length;
    b.keyValues([
      ['Estimated total (priced items only)', priced ? formatGbp(plan.pricedTotalPence) : 'No rates configured yet'],
      ['Items to be quoted', String(plan.unpricedCount)],
      ['Your budget', scratch.preferences.budget ? formatGbp(Math.round(scratch.preferences.budget * 100)) : 'Not specified'],
    ]);
    if (scratch.preferences.budget && priced) {
      const budgetPence = Math.round(scratch.preferences.budget * 100);
      const diff = budgetPence - plan.pricedTotalPence;
      b.paragraph(
        diff >= 0
          ? `Priced items are ${formatGbp(diff)} within your stated budget. Labour, excavation, waste removal and the items to be quoted are not included.`
          : `Priced items exceed your stated budget by ${formatGbp(-diff)}, before labour, excavation, waste removal and the items to be quoted.`,
        { italic: true, color: GREY }
      );
    }
    b.paragraph('This estimate covers materials as listed. It does not include labour, delivery, excavation, sub-base, waste removal, drainage or VAT unless a configured rate says otherwise.', { size: 9, italic: true, color: GREY });

    b.heading('Items requiring on-site assessment', 2);
    b.bullets(plan.onSiteChecks);

    b.newPage(false);
    b.heading('Practical implementation notes');
    b.bullets(implementationNotes());
  }

  if (plus && input.concepts.length > 1) {
    b.newPage(false);
    b.heading('Alternative design concepts');
    for (const concept of input.concepts.slice(1)) {
      await b.image(concept, 250, concept.label);
    }
  }

  b.newPage(false);
  b.heading('Make your garden real');
  b.paragraph('Cambridge Garden Services can turn this plan into a real outdoor transformation. Request a garden quote at www.cambridgegardenservices.co.uk and quote your reference ' + input.reference + '.');
  b.paragraph(DISCLAIMER, { size: 8.5, italic: true, color: GREY });

  b.finish();
  return b.pdf.save();
}

function implementationNotes() {
  return [
    'Confirm measurements, levels and boundaries on site and check for underground services before any digging.',
    'Clear the area and remove unwanted vegetation, then set levels and falls so water drains away from the house.',
    'Build hard landscaping first (patio, paths, seating areas) on a properly compacted sub-base suited to the surface and expected loads.',
    'Install boundaries, fencing and any electrical or lighting cables before planting, using a qualified electrician for mains work.',
    'Prepare planting beds by loosening the soil and improving it with compost, then plant and mulch to retain moisture.',
    'Lay turf or sow lawn seed once beds and hard surfaces are complete; spring and autumn are generally the best times.',
    'Plant trees, shrubs and hedges in autumn to early spring where possible; water new plants regularly through their first growing season.',
    'Keep a record of plant names and positions so aftercare, pruning and replacement are easy.',
  ];
}

