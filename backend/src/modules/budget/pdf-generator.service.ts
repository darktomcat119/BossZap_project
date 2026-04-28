import { Injectable, Logger } from '@nestjs/common';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import { Budget } from '../../database/entities/budget.entity';
import { Subscriber } from '../../database/entities/subscriber.entity';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit') as typeof import('pdfkit');

// Decorative PNG assets cropped from the approved ORÇAMENTO.pdf reference.
// Loaded once at module init so each PDF render is just a buffer copy.
const HEADER_ASSET_PATH = join(__dirname, 'assets', 'header-decoration.png');
const FOOTER_ASSET_PATH = join(__dirname, 'assets', 'footer-decoration.png');
const HEADER_ASSET = existsSync(HEADER_ASSET_PATH)
  ? readFileSync(HEADER_ASSET_PATH)
  : null;
const FOOTER_ASSET = existsSync(FOOTER_ASSET_PATH)
  ? readFileSync(FOOTER_ASSET_PATH)
  : null;

interface BudgetItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface LabelSet {
  documentTitleBudget: string;
  documentTitleServiceOrder: string;
  paraTo: string;
  documentNo: string;
  date: string;
  itemNo: string;
  description: string;
  quantity: string;
  unitPrice: string;
  total: string;
  paymentMethods: string;
  subtotal: string;
  discount: string;
  grandTotal: string;
  termsHeader: string;
  validity: (days: number) => string;
  terms2: string;
  thanks: string;
  signatureRoleDefault: string;
}

const TRANSLATIONS: Record<string, LabelSet> = {
  'pt-BR': {
    documentTitleBudget: 'ORÇAMENTO',
    documentTitleServiceOrder: 'ORDEM DE SERVIÇO',
    paraTo: 'Para:',
    documentNo: 'Orçamento n.°',
    date: '',
    itemNo: 'Item',
    description: 'Descrição',
    quantity: 'Quant.',
    unitPrice: 'Unitário',
    total: 'Total',
    paymentMethods: 'Forma de pagamento',
    subtotal: 'Valor total',
    discount: 'Desconto',
    grandTotal: 'Total Geral',
    termsHeader: 'Termos e condições:',
    validity: (d) => `Orçamento válido por ${d} dias.`,
    terms2: 'Valores e prazos sujeitos a alteração após esse período.',
    thanks: 'Agradecemos a sua preferência.',
    signatureRoleDefault: 'DEPARTAMENTO COMERCIAL',
  },
  es: {
    documentTitleBudget: 'PRESUPUESTO',
    documentTitleServiceOrder: 'ORDEN DE SERVICIO',
    paraTo: 'Para:',
    documentNo: 'Presupuesto n.°',
    date: '',
    itemNo: 'Ítem',
    description: 'Descripción',
    quantity: 'Cant.',
    unitPrice: 'Unitario',
    total: 'Total',
    paymentMethods: 'Forma de pago',
    subtotal: 'Subtotal',
    discount: 'Descuento',
    grandTotal: 'Total General',
    termsHeader: 'Términos y condiciones:',
    validity: (d) => `Presupuesto válido por ${d} días.`,
    terms2: 'Valores y plazos sujetos a cambios pasado ese período.',
    thanks: 'Agradecemos su preferencia.',
    signatureRoleDefault: 'DEPARTAMENTO COMERCIAL',
  },
  en: {
    documentTitleBudget: 'BUDGET',
    documentTitleServiceOrder: 'SERVICE ORDER',
    paraTo: 'To:',
    documentNo: 'Budget no.',
    date: '',
    itemNo: 'Item',
    description: 'Description',
    quantity: 'Qty',
    unitPrice: 'Unit',
    total: 'Total',
    paymentMethods: 'Payment methods',
    subtotal: 'Subtotal',
    discount: 'Discount',
    grandTotal: 'Grand Total',
    termsHeader: 'Terms and conditions:',
    validity: (d) => `Budget valid for ${d} days.`,
    terms2: 'Values and timelines may change after that period.',
    thanks: 'Thank you for your preference.',
    signatureRoleDefault: 'SALES DEPARTMENT',
  },
};

// Brand palette extracted from the reference layout. Universal across
// all subscribers — they wanted "padrão visual universal".
const COLOR_BRAND_BLACK = '#1B1B1B';
const COLOR_BRAND_ORANGE = '#F89F0E';
const COLOR_MID_GRAY = '#9CA3AF';
const COLOR_ROW_DIVIDER = '#918F8F';
const COLOR_CELL_SHADED = '#E9E8E8';
const COLOR_BODY_TEXT = '#2A2A2A';
const COLOR_WHITE = '#FFFFFF';

const PAGE_W = 595; // A4 width in pt
const PAGE_H = 842; // A4 height in pt
const PAGE_MARGIN = 50;
const CONTENT_W = PAGE_W - PAGE_MARGIN * 2;

// Default validity if the budget doesn't have valid_until set. Reference
// PDF uses 7 days, which matches typical Brazilian MEI practice.
const DEFAULT_VALIDITY_DAYS = 7;

// Default payment-methods bullet list for subscribers that don't have a
// custom list configured yet. Reference: "Dinheiro / Pix / Cartões".
const DEFAULT_PAYMENT_METHODS = [
  'Dinheiro',
  'Pix',
  'Cartões de crédito/débito',
];

@Injectable()
export class PdfGeneratorService {
  private readonly logger = new Logger(PdfGeneratorService.name);

  async generateBudgetPdf(
    budget: Budget,
    subscriber: Subscriber,
  ): Promise<Buffer> {
    const lang = subscriber.preferred_language ?? 'pt-BR';
    const labels = TRANSLATIONS[lang] ?? TRANSLATIONS['pt-BR'];

    // Pre-fetch the subscriber logo (best-effort; fall back to the
    // BossZap text mark if the network call fails).
    const logoBuffer = await this.tryFetchLogo(subscriber.logo_url);

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 0, // we manage spacing manually for the branded layout
        info: {
          Title: this.getDocTitle(budget, labels),
          Author: subscriber.business_name ?? 'BossZap',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: Error) => reject(err));

      this.renderHeaderBand(doc, budget, subscriber, labels, logoBuffer);
      this.renderInfoRow(doc, budget, labels);
      const tableBottomY = this.renderItemsTable(doc, budget, labels);
      this.renderTotalsAndPayment(
        doc,
        budget,
        subscriber,
        labels,
        tableBottomY + 18,
      );
      this.renderTermsAndThanks(doc, budget, labels);
      this.renderFooterContactRow(doc, subscriber, labels);
      this.renderBottomAccent(doc);

      doc.end();
    });
  }

  private getDocTitle(budget: Budget, labels: LabelSet): string {
    return budget.document_type === 'service_order'
      ? labels.documentTitleServiceOrder
      : labels.documentTitleBudget;
  }

  // ─── Header band: logo + diagonal black band + orange accent ──────

  private renderHeaderBand(
    doc: PDFKit.PDFDocument,
    budget: Budget,
    subscriber: Subscriber,
    labels: LabelSet,
    logoBuffer: Buffer | null,
  ): void {
    const bandTop = 0;
    const bandHeight = 80;
    // Diagonal cut starts ~36% from the left
    const leftWhiteWidth = PAGE_W * 0.36;

    // Prefer the PNG asset cropped from the approved reference for
    // pixel-perfect fidelity. The asset bakes the "ORÇAMENTO" title plus
    // the diagonal band, orange ribbon, black notch, orange tab AND the
    // thin horizontal divider line at the bottom (full page width). The
    // logo zone in the upper-left of the asset is blanked white so the
    // subscriber's logo (or text fallback) can sit on top cleanly.
    // For non-pt-BR languages we fall back to the geometric draw below
    // so the title text can be translated.
    const lang = subscriber.preferred_language ?? 'pt-BR';
    if (HEADER_ASSET && lang === 'pt-BR' && budget.document_type !== 'service_order') {
      const assetH = 117;
      try {
        doc.image(HEADER_ASSET, 0, bandTop, {
          width: PAGE_W,
          height: assetH,
        });
        // Subscriber logo (or text fallback) over the blank logo zone
        this.renderHeaderLogoSlot(doc, subscriber, logoBuffer, bandTop, bandHeight);
        return;
      } catch (err) {
        this.logger.warn(
          `Header asset render failed, falling back to geometric draw: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    // The header is a stack of two parallelograms whose left diagonals
    // are continuations of the same line — the black band on top and a
    // shorter orange ribbon directly below it. They share an edge so
    // there is no visible gap between them.
    const bandTopLeftX = leftWhiteWidth + 30;
    const bandBottomLeftX = leftWhiteWidth;
    const ribbonHeight = 20;
    const ribbonTop = bandHeight;
    // Continue the band's diagonal slope into the ribbon below.
    const slopePerY = (bandTopLeftX - bandBottomLeftX) / bandHeight;
    const ribbonBottomLeftX = bandBottomLeftX - slopePerY * ribbonHeight;

    // Black diagonal band (top)
    doc
      .save()
      .moveTo(bandTopLeftX, bandTop)
      .lineTo(PAGE_W, bandTop)
      .lineTo(PAGE_W, bandHeight)
      .lineTo(bandBottomLeftX, bandHeight)
      .closePath()
      .fill(COLOR_BRAND_BLACK)
      .restore();

    // Orange ribbon directly below — same diagonal continued.
    doc
      .save()
      .moveTo(bandBottomLeftX, ribbonTop)
      .lineTo(PAGE_W, ribbonTop)
      .lineTo(PAGE_W, ribbonTop + ribbonHeight)
      .lineTo(ribbonBottomLeftX, ribbonTop + ribbonHeight)
      .closePath()
      .fill(COLOR_BRAND_ORANGE)
      .restore();

    // Small downward black notch sitting on top of the orange ribbon,
    // about a third of the way across from the diagonal — matches the
    // reference's layered tab effect.
    const notchX = bandBottomLeftX + 90;
    const notchW = 22;
    doc
      .save()
      .moveTo(notchX, ribbonTop)
      .lineTo(notchX + notchW, ribbonTop)
      .lineTo(notchX + notchW / 2, ribbonTop + 8)
      .closePath()
      .fill(COLOR_BRAND_BLACK)
      .restore();

    // Small orange downward "tab" hanging below the ribbon on the right
    const tabX = PAGE_W - 90;
    const tabTop = ribbonTop + ribbonHeight;
    doc
      .save()
      .moveTo(tabX, tabTop)
      .lineTo(tabX + 28, tabTop)
      .lineTo(tabX + 14, tabTop + 12)
      .closePath()
      .fill(COLOR_BRAND_ORANGE)
      .restore();

    // Title text inside the black band, italic white, right-aligned
    const title = this.getDocTitle(budget, labels);
    doc
      .font('Helvetica-BoldOblique')
      .fontSize(26)
      .fillColor(COLOR_WHITE)
      .text(title, leftWhiteWidth + 40, bandTop + 28, {
        width: PAGE_W - leftWhiteWidth - 90,
        align: 'right',
      });

    // Logo (or text fallback) in the white left zone (geometric fallback path)
    this.renderHeaderLogoSlot(doc, subscriber, logoBuffer, bandTop, bandHeight);
  }

  private renderHeaderLogoSlot(
    doc: PDFKit.PDFDocument,
    subscriber: Subscriber,
    logoBuffer: Buffer | null,
    bandTop: number,
    bandHeight: number,
  ): void {
    if (logoBuffer) {
      try {
        doc.image(logoBuffer, PAGE_MARGIN, bandTop + 12, {
          fit: [PAGE_W * 0.36 - 30, bandHeight - 24],
          valign: 'center',
        });
      } catch (err) {
        this.logger.warn(
          `Logo render failed: ${err instanceof Error ? err.message : String(err)}`,
        );
        this.renderTextLogo(doc, subscriber, bandTop, bandHeight);
      }
    } else {
      this.renderTextLogo(doc, subscriber, bandTop, bandHeight);
    }
  }

  private renderTextLogo(
    doc: PDFKit.PDFDocument,
    subscriber: Subscriber,
    bandTop: number,
    bandHeight: number,
  ): void {
    const businessName = subscriber.business_name ?? 'BossZap';
    doc
      .font('Helvetica-Bold')
      .fontSize(22)
      .fillColor(COLOR_BRAND_BLACK)
      .text(businessName, PAGE_MARGIN, bandTop + bandHeight / 2 - 12, {
        width: PAGE_W * 0.34 - PAGE_MARGIN,
        align: 'left',
      });
  }

  // ─── Info row: "Para:" client (left)  +  doc number / date (right) ─

  private renderInfoRow(
    doc: PDFKit.PDFDocument,
    budget: Budget,
    labels: LabelSet,
  ): void {
    const y = 130;
    const rightCol = PAGE_W - PAGE_MARGIN - 200;

    // LEFT: "Para:" + client info
    doc
      .font('Helvetica-BoldOblique')
      .fontSize(11)
      .fillColor(COLOR_MID_GRAY)
      .text(labels.paraTo, PAGE_MARGIN, y);

    let yLeft = y + 16;
    doc.font('Helvetica-Oblique').fontSize(11).fillColor(COLOR_BODY_TEXT);

    if (budget.client_name) {
      doc.text(budget.client_name, PAGE_MARGIN, yLeft, { width: 280 });
      yLeft = doc.y + 2;
    }

    // Use client_email/phone as separate lines (under the address slot
    // in the reference). Address goes on its own line(s).
    const clientAddress = (
      budget as Budget & { client_address?: string | null }
    ).client_address;
    if (clientAddress) {
      doc.text(clientAddress, PAGE_MARGIN, yLeft, { width: 280 });
      yLeft = doc.y + 2;
    }

    // RIGHT: document number + date
    const docNumber =
      budget.document_number ?? budget.id.substring(0, 8).toUpperCase();
    const dateStr = this.formatDateBR(budget.created_at);

    doc
      .font('Helvetica-BoldOblique')
      .fontSize(11)
      .fillColor(COLOR_BODY_TEXT)
      .text(`${labels.documentNo} ${docNumber}`, rightCol, y, {
        width: 200,
        align: 'right',
      });
    doc
      .font('Helvetica-Oblique')
      .fontSize(11)
      .text(dateStr, rightCol, y + 16, {
        width: 200,
        align: 'right',
      });
  }

  // ─── Items table ──────────────────────────────────────────────────

  private renderItemsTable(
    doc: PDFKit.PDFDocument,
    budget: Budget,
    labels: LabelSet,
  ): number {
    const items = (budget.items as unknown as BudgetItem[]) ?? [];
    const startY = 220;
    const rowH = 30;

    // Column geometry — cells abut directly (no inter-column gaps).
    // Text uses an inner left padding so labels don't sit flush against
    // the cell edge.
    const cellPadX = 6;
    const xItem = PAGE_MARGIN;
    const wItem = 46;
    const xDesc = xItem + wItem;
    const wDesc = 224;
    const xQty = xDesc + wDesc;
    const wQty = 54;
    const xUnit = xQty + wQty;
    const wUnit = 96;
    const xTotal = xUnit + wUnit;
    const wTotal = PAGE_W - PAGE_MARGIN - xTotal;

    // Header row — five abutting cells matching the approved reference:
    //   • Item, Descrição: ORANGE bg with BLACK italic text
    //   • Quant.: BLACK bg with WHITE italic text
    //   • Unitário, Total: BLACK bg with ORANGE italic text
    doc.rect(xItem, startY, wItem, rowH).fill(COLOR_BRAND_ORANGE);
    doc.rect(xDesc, startY, wDesc, rowH).fill(COLOR_BRAND_ORANGE);
    doc.rect(xQty, startY, wQty, rowH).fill(COLOR_BRAND_BLACK);
    doc.rect(xUnit, startY, wUnit, rowH).fill(COLOR_BRAND_BLACK);
    doc.rect(xTotal, startY, wTotal, rowH).fill(COLOR_BRAND_BLACK);

    const headerTextY = startY + 11;
    doc.font('Helvetica-BoldOblique').fontSize(10);

    doc.fillColor(COLOR_BRAND_BLACK);
    doc.text(labels.itemNo, xItem + cellPadX, headerTextY, {
      width: wItem - cellPadX,
    });
    doc.text(labels.description, xDesc + cellPadX, headerTextY, {
      width: wDesc - cellPadX,
    });

    doc.fillColor(COLOR_WHITE);
    doc.text(labels.quantity, xQty + cellPadX, headerTextY, {
      width: wQty - cellPadX,
    });

    doc.fillColor(COLOR_BRAND_ORANGE);
    doc.text(labels.unitPrice, xUnit + cellPadX, headerTextY, {
      width: wUnit - cellPadX,
    });
    doc.text(labels.total, xTotal + cellPadX, headerTextY, {
      width: wTotal - cellPadX,
    });

    let y = startY + rowH;

    // Body rows: column-level alternating shading (cols 1, 3, 5 shaded;
    // cols 2, 4 white) with thin horizontal dividers between rows.
    doc.font('Helvetica-Oblique').fontSize(10).fillColor(COLOR_BODY_TEXT);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const num = String(i + 1).padStart(2, '0');
      const cellY = y + 10;

      doc.rect(xItem, y, wItem, rowH).fill(COLOR_CELL_SHADED);
      doc.rect(xQty, y, wQty, rowH).fill(COLOR_CELL_SHADED);
      doc.rect(xTotal, y, wTotal, rowH).fill(COLOR_CELL_SHADED);

      doc.fillColor(COLOR_BODY_TEXT);
      doc.text(num, xItem + cellPadX, cellY, { width: wItem - cellPadX });
      doc.text(item.description ?? '—', xDesc + cellPadX, cellY, {
        width: wDesc - cellPadX,
      });
      doc.text(this.formatQuantity(item.quantity), xQty + cellPadX, cellY, {
        width: wQty - cellPadX,
      });
      doc.text(this.formatBRL(item.unit_price), xUnit + cellPadX, cellY, {
        width: wUnit - cellPadX,
      });
      doc.text(this.formatBRL(item.total), xTotal + cellPadX, cellY, {
        width: wTotal - cellPadX,
      });

      y += rowH;

      // Thin horizontal divider below every row (including the last one)
      doc
        .moveTo(PAGE_MARGIN, y)
        .lineTo(PAGE_MARGIN + CONTENT_W, y)
        .strokeColor(COLOR_ROW_DIVIDER)
        .lineWidth(0.5)
        .stroke();
    }

    return y;
  }

  // ─── Two-column totals area + payment methods ─────────────────────

  private renderTotalsAndPayment(
    doc: PDFKit.PDFDocument,
    budget: Budget,
    subscriber: Subscriber,
    labels: LabelSet,
    startY: number,
  ): void {
    // LEFT: Forma de pagamento (use the subscriber's configured list
    // when present — falls back to the BossZap default of the three
    // most common Brazilian methods).
    doc
      .font('Helvetica-BoldOblique')
      .fontSize(11)
      .fillColor(COLOR_BODY_TEXT)
      .text(labels.paymentMethods, PAGE_MARGIN, startY);

    doc.font('Helvetica-Oblique').fontSize(10).fillColor(COLOR_BODY_TEXT);
    let yLeft = doc.y + 4;
    const methods = this.resolvePaymentMethods(subscriber.payment_methods);
    for (const method of methods) {
      doc.text(`- ${method}`, PAGE_MARGIN, yLeft);
      yLeft = doc.y + 1;
    }

    // RIGHT: subtotal / discount / Total Geral
    const totalAmount = Number(budget.total_amount) || 0;
    const discount = Number(
      (budget as Budget & { discount_amount?: number | string }).discount_amount,
    );
    const hasDiscount = isFinite(discount) && discount > 0;
    const subtotal = hasDiscount ? totalAmount + discount : totalAmount;

    const xRightLabel = 350;
    const xRightVal = PAGE_W - PAGE_MARGIN - 130;
    const wRightVal = 130;

    doc
      .font('Helvetica-BoldOblique')
      .fontSize(11)
      .fillColor(COLOR_BODY_TEXT)
      .text(labels.subtotal, xRightLabel, startY);
    doc
      .font('Helvetica-Oblique')
      .text(this.formatBRL(subtotal), xRightVal, startY, {
        width: wRightVal,
        align: 'right',
      });

    let yRight = startY + 18;
    if (hasDiscount) {
      doc
        .font('Helvetica-BoldOblique')
        .text(labels.discount, xRightLabel, yRight);
      doc
        .font('Helvetica-Oblique')
        .text(this.formatBRL(discount), xRightVal, yRight, {
          width: wRightVal,
          align: 'right',
        });
      yRight += 18;
    }

    // Orange "Total Geral" box
    const boxY = yRight + 4;
    const boxH = 30;
    doc
      .rect(xRightLabel - 8, boxY, PAGE_W - PAGE_MARGIN - (xRightLabel - 8), boxH)
      .fill(COLOR_BRAND_ORANGE);

    doc
      .font('Helvetica-BoldOblique')
      .fontSize(12)
      .fillColor(COLOR_WHITE)
      .text(labels.grandTotal, xRightLabel, boxY + 9);
    doc.text(this.formatBRL(totalAmount), xRightVal, boxY + 9, {
      width: wRightVal,
      align: 'right',
    });

    // Save the bottom of the totals block as the "next y" anchor
    doc.y = Math.max(yLeft, boxY + boxH) + 18;
  }

  // ─── Terms + thanks ───────────────────────────────────────────────

  private renderTermsAndThanks(
    doc: PDFKit.PDFDocument,
    budget: Budget,
    labels: LabelSet,
  ): void {
    const y = doc.y;
    const days = this.computeValidityDays(budget);

    doc
      .font('Helvetica-BoldOblique')
      .fontSize(10)
      .fillColor(COLOR_BODY_TEXT)
      .text(labels.termsHeader, PAGE_MARGIN, y);

    doc
      .font('Helvetica-Oblique')
      .fontSize(10)
      .fillColor(COLOR_BODY_TEXT)
      .text(labels.validity(days), PAGE_MARGIN, doc.y + 2);

    doc.text(labels.terms2, PAGE_MARGIN, doc.y + 2);

    doc
      .font('Helvetica-BoldOblique')
      .fontSize(10)
      .text(labels.thanks, PAGE_MARGIN, doc.y + 14);

    doc.y += 14;
  }

  // ─── Footer row 2: contacts + signature ───────────────────────────

  private renderFooterContactRow(
    doc: PDFKit.PDFDocument,
    subscriber: Subscriber,
    labels: LabelSet,
  ): void {
    const y = PAGE_H - 130;

    // Contact pieces with Material-style icons rendered as SVG paths
    // (Helvetica doesn't carry the ☎/✉/📍 glyphs and emoji renders
    // inconsistently across PDF readers).
    let cursorX = PAGE_MARGIN;
    const iconSize = 14;
    const iconTextGap = 5;
    const groupGap = 16;
    const iconY = y - 2; // align icon vertically against the text baseline
    const textY = y + 4;
    doc.font('Helvetica-Oblique').fontSize(9).fillColor(COLOR_BODY_TEXT);

    if (subscriber.phone) {
      this.drawPhoneIcon(doc, cursorX, iconY);
      doc.text(subscriber.phone, cursorX + iconSize + iconTextGap, textY, {
        lineBreak: false,
      });
      cursorX +=
        iconSize +
        iconTextGap +
        doc.widthOfString(subscriber.phone) +
        groupGap;
    }
    if (subscriber.email) {
      this.drawEnvelopeIcon(doc, cursorX, iconY);
      doc.text(subscriber.email, cursorX + iconSize + iconTextGap, textY, {
        lineBreak: false,
      });
      cursorX +=
        iconSize +
        iconTextGap +
        doc.widthOfString(subscriber.email) +
        groupGap;
    }
    if (subscriber.address) {
      // The address is the last item and may wrap; give it all the room
      // up to (but not touching) the signature column on the right.
      const signX = PAGE_W * 0.62;
      this.drawPinIcon(doc, cursorX, iconY);
      doc.text(subscriber.address, cursorX + iconSize + iconTextGap, textY, {
        width: signX - cursorX - iconSize - iconTextGap - 8,
      });
    }

    // Signature: line + name + role on the right
    const signX = PAGE_W * 0.62;
    const signW = PAGE_W - signX - PAGE_MARGIN;

    doc
      .moveTo(signX, y)
      .lineTo(signX + signW, y)
      .strokeColor(COLOR_BODY_TEXT)
      .lineWidth(0.7)
      .stroke();

    const ownerName = (subscriber.owner_name ?? '').toUpperCase();
    const role =
      ((subscriber as Subscriber & { signature_role?: string | null })
        .signature_role as string | null | undefined) ||
      labels.signatureRoleDefault;

    doc
      .font('Helvetica-BoldOblique')
      .fontSize(11)
      .fillColor(COLOR_BODY_TEXT)
      .text(ownerName, signX, y + 6, {
        width: signW,
        align: 'center',
      });
    doc
      .font('Helvetica-Oblique')
      .fontSize(9)
      .fillColor(COLOR_MID_GRAY)
      .text(role, signX, doc.y + 1, {
        width: signW,
        align: 'center',
      });
  }

  // ─── Decorative bottom band: black slab + orange triangle ─────────

  private renderBottomAccent(doc: PDFKit.PDFDocument): void {
    // Prefer the PNG asset cropped from the approved reference for the
    // elaborate orange-and-black ribbon decoration at the bottom.
    if (FOOTER_ASSET) {
      try {
        const assetH = 44;
        doc.image(FOOTER_ASSET, 0, PAGE_H - assetH, {
          width: PAGE_W,
          height: assetH,
        });
        return;
      } catch (err) {
        this.logger.warn(
          `Footer asset render failed, falling back to geometric draw: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    // Geometric fallback (used if the asset is missing).
    const bandTop = PAGE_H - 50;
    doc
      .save()
      .moveTo(0, bandTop)
      .lineTo(PAGE_W * 0.62, bandTop)
      .lineTo(PAGE_W * 0.62 + 40, PAGE_H)
      .lineTo(0, PAGE_H)
      .closePath()
      .fill(COLOR_BRAND_BLACK)
      .restore();

    doc
      .save()
      .moveTo(PAGE_W * 0.66, PAGE_H - 28)
      .lineTo(PAGE_W * 0.86, PAGE_H - 28)
      .lineTo(PAGE_W * 0.76, PAGE_H)
      .closePath()
      .fill(COLOR_BRAND_ORANGE)
      .restore();
  }

  // ─── Hand-drawn icons (avoids font/glyph issues across PDF readers)

  // Material-style contact icons rendered as SVG paths inside a colored
  // background shape — matches the polished icons in the approved
  // reference. All paths are from the standard 24x24 Material Icons set
  // and are scaled to fit a 14pt icon slot.

  private static readonly ICON_SIZE = 14;
  private static readonly ICON_PHONE_PATH =
    'M20 15.5c-1.25 0-2.45-.2-3.57-.57-.35-.11-.74-.03-1.02.24l-2.2 2.2c-2.83-1.44-5.15-3.75-6.59-6.58l2.2-2.21c.28-.27.36-.66.25-1.01C8.7 6.45 8.5 5.25 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1z';
  private static readonly ICON_EMAIL_PATH =
    'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z';
  private static readonly ICON_PIN_PATH =
    'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z';

  private drawCircleBgIcon(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    bgColor: string,
    svgPath: string,
  ): void {
    const size = PdfGeneratorService.ICON_SIZE;
    const r = size / 2;
    const cx = x + r;
    const cy = y + r;
    // Background colored circle
    doc.save().circle(cx, cy, r).fill(bgColor).restore();
    // White glyph on top, scaled from 24x24 viewbox to ~62% of circle
    const glyphSize = size * 0.62;
    const scale = glyphSize / 24;
    const offset = (size - glyphSize) / 2;
    doc.save();
    doc.translate(x + offset, y + offset).scale(scale);
    doc.path(svgPath).fill(COLOR_WHITE);
    doc.restore();
  }

  private drawPhoneIcon(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
  ): void {
    this.drawCircleBgIcon(
      doc,
      x,
      y,
      COLOR_BRAND_BLACK,
      PdfGeneratorService.ICON_PHONE_PATH,
    );
  }

  private drawEnvelopeIcon(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
  ): void {
    // Reference uses ORANGE (not black) for the email icon background.
    this.drawCircleBgIcon(
      doc,
      x,
      y,
      COLOR_BRAND_ORANGE,
      PdfGeneratorService.ICON_EMAIL_PATH,
    );
  }

  private drawPinIcon(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
  ): void {
    // The pin glyph itself is the icon — no background circle. Uses
    // even-odd fill so the inner circle becomes a transparent hole.
    const size = PdfGeneratorService.ICON_SIZE;
    const scale = size / 24;
    doc.save();
    doc.translate(x, y).scale(scale);
    doc
      .path(PdfGeneratorService.ICON_PIN_PATH)
      .fill(COLOR_BRAND_BLACK, 'even-odd');
    doc.restore();
  }

  // ─── Helpers ──────────────────────────────────────────────────────

  /**
   * Subscriber-configurable payment methods. Stored as a single string
   * with `,` or `;` separators (e.g. "Dinheiro, Pix, Cartão"). Falls
   * back to the BossZap default of the three most common Brazilian
   * methods when the subscriber hasn't set their own list yet.
   */
  private resolvePaymentMethods(raw: string | null | undefined): string[] {
    if (!raw || !raw.trim()) return [...DEFAULT_PAYMENT_METHODS];
    return raw
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  /**
   * Brazilian currency format: "R$ 1.234,56". Uses pt-BR locale so
   * thousands are dots and decimals are commas, matching the reference.
   */
  private formatBRL(value: number | string | null | undefined): string {
    const n = Number(value ?? 0);
    if (!isFinite(n)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(n);
  }

  /**
   * Quantity formatting that preserves unit suffixes when present
   * ("45m²", "180m²"). Plain numbers get zero-padded for visual rhythm
   * matching the reference ("01" instead of "1").
   */
  private formatQuantity(raw: number | string): string {
    if (typeof raw === 'string' && /[^\d.,]/.test(raw)) return raw;
    const n = Number(raw);
    if (!isFinite(n)) return String(raw);
    if (Number.isInteger(n) && n < 100) return String(n).padStart(2, '0');
    return new Intl.NumberFormat('pt-BR').format(n);
  }

  /**
   * dd/MM/yyyy. Used for the document date in the header info row.
   */
  private formatDateBR(date: Date | string): string {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    return [
      String(d.getDate()).padStart(2, '0'),
      String(d.getMonth() + 1).padStart(2, '0'),
      d.getFullYear(),
    ].join('/');
  }

  /**
   * Resolve validity to a day count: explicit `valid_until` row → days
   * delta from creation; else default (7 days, matching the reference
   * and Brazilian MEI norm).
   */
  private computeValidityDays(budget: Budget): number {
    if (!budget.valid_until) return DEFAULT_VALIDITY_DAYS;
    const created = new Date(budget.created_at).getTime();
    const valid = new Date(budget.valid_until).getTime();
    if (!isFinite(created) || !isFinite(valid) || valid <= created) {
      return DEFAULT_VALIDITY_DAYS;
    }
    const diffDays = Math.round((valid - created) / 86400000);
    return diffDays > 0 ? diffDays : DEFAULT_VALIDITY_DAYS;
  }

  /**
   * Best-effort fetch of the subscriber logo for embedding in the
   * header. We allow up to 5s for the image to come back; longer waits
   * would slow budget creation noticeably. On failure we return null and
   * the renderer falls back to the business name as a text mark.
   */
  private async tryFetchLogo(
    logoUrl: string | null | undefined,
  ): Promise<Buffer | null> {
    if (!logoUrl) return null;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(logoUrl, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) {
        this.logger.warn(`Logo fetch ${res.status}: ${logoUrl.slice(0, 80)}`);
        return null;
      }
      const arr = await res.arrayBuffer();
      return Buffer.from(arr);
    } catch (err) {
      this.logger.warn(
        `Logo fetch failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      return null;
    }
  }
}
