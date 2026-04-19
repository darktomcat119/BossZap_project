import { Injectable, Logger } from '@nestjs/common';
import { Budget } from '../../database/entities/budget.entity';
import { Subscriber } from '../../database/entities/subscriber.entity';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit') as typeof import('pdfkit');

interface BudgetItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface LabelSet {
  description: string;
  quantity: string;
  unitPrice: string;
  total: string;
  grandTotal: string;
  validUntil: string;
  date: string;
  documentNumber: string;
  budget: string;
  serviceOrder: string;
  notes: string;
  client: string;
  phone: string;
  email: string;
}

const TRANSLATIONS: Record<string, LabelSet> = {
  es: {
    description: 'Descripcion',
    quantity: 'Cant.',
    unitPrice: 'Precio Unit.',
    total: 'Total',
    grandTotal: 'Total General',
    validUntil: 'Valido por 15 dias',
    date: 'Fecha',
    documentNumber: 'N\u00b0 Documento',
    budget: 'Presupuesto',
    serviceOrder: 'Orden de Servicio',
    notes: 'Notas',
    client: 'Cliente',
    phone: 'Telefono',
    email: 'Email',
  },
  en: {
    description: 'Description',
    quantity: 'Qty',
    unitPrice: 'Unit Price',
    total: 'Total',
    grandTotal: 'Grand Total',
    validUntil: 'Valid for 15 days',
    date: 'Date',
    documentNumber: 'Document No.',
    budget: 'Budget',
    serviceOrder: 'Service Order',
    notes: 'Notes',
    client: 'Client',
    phone: 'Phone',
    email: 'Email',
  },
  'pt-BR': {
    description: 'Descricao',
    quantity: 'Qtd.',
    unitPrice: 'Preco Unit.',
    total: 'Total',
    grandTotal: 'Total Geral',
    validUntil: 'Valido por 15 dias',
    date: 'Data',
    documentNumber: 'N\u00b0 Documento',
    budget: 'Orcamento',
    serviceOrder: 'Ordem de Servico',
    notes: 'Notas',
    client: 'Cliente',
    phone: 'Telefone',
    email: 'Email',
  },
};

const PAGE_MARGIN = 50;
const COL_DESC_X = PAGE_MARGIN;
const COL_QTY_X = 330;
const COL_UNIT_X = 400;
const COL_TOTAL_X = 490;
const TABLE_WIDTH = COL_TOTAL_X + 60 - PAGE_MARGIN;
const ROW_HEIGHT = 22;

const COLOR_PRIMARY = '#2C3E50';
const COLOR_HEADER_BG = '#34495E';
const COLOR_HEADER_TEXT = '#FFFFFF';
const COLOR_ROW_ALT = '#F8F9FA';
const COLOR_ROW_NORMAL = '#FFFFFF';
const COLOR_BORDER = '#DEE2E6';
const COLOR_GRAND_TOTAL_BG = '#2C3E50';
const COLOR_GRAND_TOTAL_TEXT = '#FFFFFF';

@Injectable()
export class PdfGeneratorService {
  private readonly logger = new Logger(PdfGeneratorService.name);

  async generateBudgetPdf(
    budget: Budget,
    subscriber: Subscriber,
  ): Promise<Buffer> {
    const lang = subscriber.preferred_language ?? 'pt-BR';
    const labels = TRANSLATIONS[lang] ?? TRANSLATIONS['pt-BR'];

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: PAGE_MARGIN,
        info: {
          Title: this.getDocTitle(budget, labels),
          Author: subscriber.business_name ?? 'BossZap',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: Error) => reject(err));

      this.renderHeader(doc, subscriber, labels);
      this.renderDocumentInfo(doc, budget, labels);
      this.renderClientInfo(doc, budget, labels);
      this.renderItemsTable(doc, budget, labels);
      this.renderFooter(doc, budget, labels);

      doc.end();
    });
  }

  private getDocTitle(budget: Budget, labels: LabelSet): string {
    return budget.document_type === 'service_order'
      ? labels.serviceOrder
      : labels.budget;
  }

  private renderHeader(
    doc: PDFKit.PDFDocument,
    subscriber: Subscriber,
    labels: LabelSet,
  ): void {
    const startY = PAGE_MARGIN;

    // Business name
    doc
      .fontSize(20)
      .fillColor(COLOR_PRIMARY)
      .font('Helvetica-Bold')
      .text(subscriber.business_name ?? '', PAGE_MARGIN, startY, {
        width: TABLE_WIDTH,
      });

    let y = doc.y + 4;

    // Contact details
    doc.fontSize(9).fillColor('#666666').font('Helvetica');

    if (subscriber.address) {
      doc.text(subscriber.address, PAGE_MARGIN, y, {
        width: TABLE_WIDTH,
      });
      y = doc.y + 2;
    }

    const contactParts: string[] = [];
    if (subscriber.phone) {
      contactParts.push(`${labels.phone}: ${subscriber.phone}`);
    }
    if (subscriber.email) {
      contactParts.push(`${labels.email}: ${subscriber.email}`);
    }
    if (contactParts.length > 0) {
      doc.text(contactParts.join('  |  '), PAGE_MARGIN, y, {
        width: TABLE_WIDTH,
      });
      y = doc.y + 2;
    }

    // Divider line
    y += 8;
    doc
      .moveTo(PAGE_MARGIN, y)
      .lineTo(PAGE_MARGIN + TABLE_WIDTH, y)
      .strokeColor(COLOR_PRIMARY)
      .lineWidth(2)
      .stroke();

    doc.y = y + 12;
  }

  private renderDocumentInfo(
    doc: PDFKit.PDFDocument,
    budget: Budget,
    labels: LabelSet,
  ): void {
    const y = doc.y;
    const title = this.getDocTitle(budget, labels);

    doc
      .fontSize(16)
      .fillColor(COLOR_PRIMARY)
      .font('Helvetica-Bold')
      .text(title, PAGE_MARGIN, y);

    const infoY = doc.y + 6;
    doc.fontSize(10).fillColor('#444444').font('Helvetica');

    const docNumber = budget.document_number ?? budget.id.substring(0, 8);
    doc.text(`${labels.documentNumber}: ${docNumber}`, PAGE_MARGIN, infoY);

    const dateStr = new Date(budget.created_at).toISOString().split('T')[0];
    doc.text(`${labels.date}: ${dateStr}`, PAGE_MARGIN, doc.y + 2);

    doc.y += 12;
  }

  private renderClientInfo(
    doc: PDFKit.PDFDocument,
    budget: Budget,
    labels: LabelSet,
  ): void {
    if (!budget.client_name && !budget.client_phone && !budget.client_email) {
      return;
    }

    const y = doc.y;

    doc
      .fontSize(11)
      .fillColor(COLOR_PRIMARY)
      .font('Helvetica-Bold')
      .text(labels.client, PAGE_MARGIN, y);

    doc.fontSize(10).fillColor('#444444').font('Helvetica');

    if (budget.client_name) {
      doc.text(budget.client_name, PAGE_MARGIN, doc.y + 2);
    }
    if (budget.client_phone) {
      doc.text(
        `${labels.phone}: ${budget.client_phone}`,
        PAGE_MARGIN,
        doc.y + 2,
      );
    }
    if (budget.client_email) {
      doc.text(
        `${labels.email}: ${budget.client_email}`,
        PAGE_MARGIN,
        doc.y + 2,
      );
    }

    doc.y += 12;
  }

  private renderItemsTable(
    doc: PDFKit.PDFDocument,
    budget: Budget,
    labels: LabelSet,
  ): void {
    const items = budget.items as unknown as BudgetItem[];
    let y = doc.y;

    // Table header
    doc.rect(PAGE_MARGIN, y, TABLE_WIDTH, ROW_HEIGHT + 4).fill(COLOR_HEADER_BG);

    const headerY = y + 6;
    doc.fontSize(9).fillColor(COLOR_HEADER_TEXT).font('Helvetica-Bold');

    doc.text(labels.description, COL_DESC_X + 6, headerY, {
      width: COL_QTY_X - COL_DESC_X - 12,
    });
    doc.text(labels.quantity, COL_QTY_X, headerY, {
      width: 60,
      align: 'right',
    });
    doc.text(labels.unitPrice, COL_UNIT_X, headerY, {
      width: 80,
      align: 'right',
    });
    doc.text(labels.total, COL_TOTAL_X, headerY, {
      width: 60,
      align: 'right',
    });

    y += ROW_HEIGHT + 4;

    // Table rows
    doc.fontSize(9).font('Helvetica');

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const isAlt = i % 2 === 1;
      const bgColor = isAlt ? COLOR_ROW_ALT : COLOR_ROW_NORMAL;

      doc.rect(PAGE_MARGIN, y, TABLE_WIDTH, ROW_HEIGHT).fill(bgColor);

      const rowY = y + 6;
      doc.fillColor('#333333');

      doc.text(item.description ?? '', COL_DESC_X + 6, rowY, {
        width: COL_QTY_X - COL_DESC_X - 12,
      });
      doc.text(String(item.quantity), COL_QTY_X, rowY, {
        width: 60,
        align: 'right',
      });
      doc.text(this.formatCurrency(item.unit_price), COL_UNIT_X, rowY, {
        width: 80,
        align: 'right',
      });
      doc.text(this.formatCurrency(item.total), COL_TOTAL_X, rowY, {
        width: 60,
        align: 'right',
      });

      y += ROW_HEIGHT;
    }

    // Bottom border
    doc
      .moveTo(PAGE_MARGIN, y)
      .lineTo(PAGE_MARGIN + TABLE_WIDTH, y)
      .strokeColor(COLOR_BORDER)
      .lineWidth(1)
      .stroke();

    y += 4;

    // Grand total row
    doc
      .rect(PAGE_MARGIN, y, TABLE_WIDTH, ROW_HEIGHT + 6)
      .fill(COLOR_GRAND_TOTAL_BG);

    const totalY = y + 7;
    doc.fontSize(11).fillColor(COLOR_GRAND_TOTAL_TEXT).font('Helvetica-Bold');

    doc.text(labels.grandTotal, COL_DESC_X + 6, totalY, {
      width: COL_TOTAL_X - COL_DESC_X - 12,
    });
    doc.text(
      this.formatCurrency(Number(budget.total_amount)),
      COL_TOTAL_X,
      totalY,
      { width: 60, align: 'right' },
    );

    doc.y = y + ROW_HEIGHT + 16;
  }

  private renderFooter(
    doc: PDFKit.PDFDocument,
    budget: Budget,
    labels: LabelSet,
  ): void {
    let y = doc.y;

    // Validity
    doc
      .fontSize(10)
      .fillColor('#666666')
      .font('Helvetica-Oblique')
      .text(labels.validUntil, PAGE_MARGIN, y);

    y = doc.y + 8;

    // Notes
    if (budget.notes) {
      doc
        .fontSize(10)
        .fillColor(COLOR_PRIMARY)
        .font('Helvetica-Bold')
        .text(labels.notes, PAGE_MARGIN, y);

      y = doc.y + 4;

      doc
        .fontSize(9)
        .fillColor('#444444')
        .font('Helvetica')
        .text(budget.notes, PAGE_MARGIN, y, {
          width: TABLE_WIDTH,
        });
    }
  }

  private formatCurrency(value: number): string {
    return value.toLocaleString('en', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
}
