import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ImageRun,
  convertMillimetersToTwip,
} from 'docx';
import { saveAs } from 'file-saver';
import { Order, BusinessSettings } from '../types';
import { formatCurrency } from '../calculations/financials';

export async function generateOrderSlipsDocx(
  orders: Order[],
  settings?: BusinessSettings
): Promise<Blob> {
  const businessName = settings?.business_name || 'NAAM Studio';
  const currencySymbol = settings?.currency_symbol || 'Rs.';

  // Attempt to fetch logo icon buffer for embedded slip images
  let logoBuffer: ArrayBuffer | null = null;
  try {
    if (typeof window !== 'undefined') {
      const res = await fetch('/images/logo-icon.png');
      if (res.ok) {
        logoBuffer = await res.arrayBuffer();
      }
    }
  } catch (e) {
    // Fallback if offline or server render
  }

  const slipsPerPage = 10;
  const numOrders = orders.length;

  // Group orders into chunks of 10 for each A4 page
  const pageChunks: Order[][] = [];
  for (let i = 0; i < numOrders; i += slipsPerPage) {
    pageChunks.push(orders.slice(i, i + slipsPerPage));
  }

  const sections = pageChunks.map((chunk) => {
    // Create 5 rows x 2 columns = 10 cells per page grid
    const tableRows: TableRow[] = [];

    for (let rowIndex = 0; rowIndex < 5; rowIndex++) {
      const leftOrderIndex = rowIndex * 2;
      const rightOrderIndex = rowIndex * 2 + 1;

      const leftOrder = chunk[leftOrderIndex];
      const rightOrder = chunk[rightOrderIndex];

      const rowCells: TableCell[] = [
        createParcelSlipTableCell(leftOrder, businessName, currencySymbol, logoBuffer),
        createParcelSlipTableCell(rightOrder, businessName, currencySymbol, logoBuffer),
      ];

      tableRows.push(
        new TableRow({
          children: rowCells,
          height: {
            value: convertMillimetersToTwip(53), // 53mm per row fits 5 rows on A4 height (297mm - 20mm margins)
            rule: 'exact',
          },
        })
      );
    }

    return {
      properties: {
        page: {
          size: {
            width: convertMillimetersToTwip(210), // A4 width: 210mm
            height: convertMillimetersToTwip(297), // A4 height: 297mm
          },
          margin: {
            top: convertMillimetersToTwip(8),
            bottom: convertMillimetersToTwip(8),
            left: convertMillimetersToTwip(8),
            right: convertMillimetersToTwip(8),
          },
        },
      },
      children: [
        new Table({
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
          rows: tableRows,
        }),
      ],
    };
  });

  const doc = new Document({
    sections,
  });

  const blob = await Packer.toBlob(doc);
  return blob;
}

function createParcelSlipTableCell(
  order: Order | undefined,
  businessName: string,
  currencySymbol: string,
  logoBuffer: ArrayBuffer | null
): TableCell {
  // If no order present for this grid cell, render clean empty dashed cell
  if (!order) {
    return new TableCell({
      children: [new Paragraph({})],
      width: { size: 50, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.DASHED, size: 4, color: 'E2E8F0' },
        bottom: { style: BorderStyle.DASHED, size: 4, color: 'E2E8F0' },
        left: { style: BorderStyle.DASHED, size: 4, color: 'E2E8F0' },
        right: { style: BorderStyle.DASHED, size: 4, color: 'E2E8F0' },
      },
    });
  }

  // Format Items List
  const itemParagraphs: Paragraph[] = (order.order_items || []).map((item) => {
    return new Paragraph({
      spacing: { before: 8, after: 8 },
      children: [
        new TextRun({
          text: `• ${item.item_name} `,
          size: 14, // 7 pt font
          bold: true,
          font: 'Arial',
        }),
        new TextRun({
          text: `× ${item.quantity}`,
          size: 14,
          bold: true,
          color: '4F46E5',
          font: 'Arial',
        }),
        item.customization_details
          ? new TextRun({
              text: ` (${item.customization_details})`,
              size: 12,
              italics: true,
              color: '64748B',
              font: 'Arial',
            })
          : new TextRun(''),
      ],
    });
  });

  const remainingCod = order.cod_amount ?? order.remaining_amount ?? 0;
  const orderDateStr = new Date(order.order_date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' });

  // Header children with optional embedded logo image
  const headerRuns: (TextRun | ImageRun)[] = [];
  if (logoBuffer) {
    headerRuns.push(
      new ImageRun({
        data: logoBuffer,
        transformation: { width: 16, height: 16 },
      })
    );
    headerRuns.push(new TextRun({ text: ' ', size: 14 }));
  }

  headerRuns.push(
    new TextRun({
      text: businessName.toUpperCase(),
      bold: true,
      size: 16,
      color: '0F172A',
      font: 'Arial',
    })
  );
  headerRuns.push(
    new TextRun({
      text: '  |  PARCEL SLIP',
      bold: true,
      size: 13,
      color: '64748B',
      font: 'Arial',
    })
  );

  return new TableCell({
    width: { size: 50, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 8, color: '0F172A' },
      bottom: { style: BorderStyle.SINGLE, size: 8, color: '0F172A' },
      left: { style: BorderStyle.SINGLE, size: 8, color: '0F172A' },
      right: { style: BorderStyle.SINGLE, size: 8, color: '0F172A' },
    },
    margins: {
      top: convertMillimetersToTwip(2.5),
      bottom: convertMillimetersToTwip(2.5),
      left: convertMillimetersToTwip(3),
      right: convertMillimetersToTwip(3),
    },
    children: [
      // HEADER: NAAM STUDIO LOGO & TITLE
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 0, after: 15 },
        children: headerRuns,
      }),

      // ORDER ID & DATE BANNER
      new Paragraph({
        spacing: { before: 0, after: 15 },
        children: [
          new TextRun({ text: 'ORDER # ', bold: true, size: 13, color: '475569', font: 'Arial' }),
          new TextRun({ text: order.order_number, bold: true, size: 17, color: '4F46E5', font: 'Arial' }),
          new TextRun({ text: `   DATE: ${orderDateStr}`, bold: true, size: 13, color: '64748B', font: 'Arial' }),
        ],
      }),

      // SHIP TO BOX
      new Paragraph({
        spacing: { before: 0, after: 6 },
        children: [
          new TextRun({ text: 'SHIP TO:', bold: true, size: 12, color: '64748B', font: 'Arial' }),
        ],
      }),
      new Paragraph({
        spacing: { before: 0, after: 6 },
        children: [
          new TextRun({ text: order.customer_name, bold: true, size: 15, color: '0F172A', font: 'Arial' }),
          new TextRun({ text: `  (${order.customer_phone})`, size: 13, color: '334155', font: 'Arial' }),
        ],
      }),
      new Paragraph({
        spacing: { before: 0, after: 15 },
        children: [
          new TextRun({
            text: `${order.customer_address}, ${order.customer_city}`,
            size: 13,
            color: '334155',
            font: 'Arial',
          }),
        ],
      }),

      // ITEMS HEADER
      new Paragraph({
        spacing: { before: 0, after: 6 },
        children: [
          new TextRun({ text: 'ITEMS IN PARCEL:', bold: true, size: 12, color: '64748B', font: 'Arial' }),
        ],
      }),

      // ITEMS LIST
      ...itemParagraphs,

      // FINANCIAL BREAKDOWN
      new Paragraph({
        spacing: { before: 15, after: 6 },
        children: [
          new TextRun({ text: 'Total: ', bold: true, size: 14, font: 'Arial' }),
          new TextRun({ text: `${formatCurrency(order.total_amount, currencySymbol)}  |  `, size: 14, font: 'Arial' }),
          new TextRun({ text: 'Paid: ', bold: true, size: 14, font: 'Arial' }),
          new TextRun({ text: `${formatCurrency(order.total_paid, currencySymbol)}  |  `, size: 14, color: '16A34A', font: 'Arial' }),
          new TextRun({ text: 'Delivery: ', size: 12, color: '64748B', font: 'Arial' }),
          new TextRun({ text: `${formatCurrency(order.delivery_charges, currencySymbol)}`, size: 12, color: '64748B', font: 'Arial' }),
        ],
      }),

      // PROMINENT COD / REMAINING HIGHLIGHT BOX
      new Paragraph({
        spacing: { before: 12, after: 10 },
        children: [
          new TextRun({ text: 'COD / REMAINING TO COLLECT: ', bold: true, size: 15, color: 'DC2626', font: 'Arial' }),
          new TextRun({
            text: `${formatCurrency(remainingCod, currencySymbol)}`,
            bold: true,
            size: 20,
            color: 'DC2626',
            font: 'Arial',
          }),
        ],
      }),

      // FOOTER THANK YOU
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 10, after: 0 },
        children: [
          new TextRun({
            text: `Thank you for shopping with ${businessName}!`,
            italics: true,
            size: 11,
            color: '94A3B8',
            font: 'Arial',
          }),
        ],
      }),
    ],
  });
}

export async function downloadOrderSlips(orders: Order[], settings?: BusinessSettings) {
  if (!orders || orders.length === 0) return;

  const blob = await generateOrderSlipsDocx(orders, settings);
  const filename =
    orders.length === 1
      ? `NAAM-Studio-Slip-${orders[0].order_number}.docx`
      : `NAAM-Studio-Slips-${new Date().toISOString().split('T')[0]}-${orders.length}-orders.docx`;

  saveAs(blob, filename);
}
