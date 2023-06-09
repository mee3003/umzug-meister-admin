import { calculateNumbers, euroValue } from '../utils/utils';
import PdfBuilder from './PdfBuilder';
import { invoiceFileName } from './filename';

import { Gutschrift, Rechnung } from 'um-types';

export const generateRechnung = (rechnung: Rechnung) => {
  const factory = new PdfBuilder(invoiceFileName(rechnung), {
    left: 25,
    right: 12,
    top: 8,
    bottom: 3,
  });

  factory.addSpace(5);

  addTitle(factory);
  addHeader(factory);
  addPostAddr(factory);
  addDate(factory, rechnung.date);
  addCustomer(factory, rechnung);
  addRNumber(factory, rechnung);
  addTable(factory, rechnung);
  addPrice(factory, rechnung);
  addText(factory, rechnung.text);
  move(factory);
  addVermerk(factory);
  addKonto(factory);

  factory.save();
};

export function addTitle(factory: PdfBuilder) {
  factory.setBold();
  factory.addBlackHeader('UMZUG RUCK ZUCK');
  factory.resetText();
}

export function addHeader(factory: PdfBuilder) {
  factory.setColor(60, 60, 60);
  const leftCol = [
    'Tel.: 089 / 306 42 972',
    'Mobil: 0176 / 101 71 990',
    'Fax: 089 / 326 08 009',
    'umzugruckzuck@gmail.com',
  ];

  const rightCol = [
    'Alexander Berent',
    'Am Münchfeld 31',
    '80999 München',
    'UST-ID-Nr. DE 18 08 27 046',
    'Steuernummer: 144 / 139 / 21180',
  ];
  factory.addLeftRight(leftCol, rightCol, 8);
}

export function addPostAddr(factory: PdfBuilder) {
  factory.resetText();
  factory.addSpace(10);
  factory.addText(`Alexander Berent, Am Münchfeld 31, 80999 München`, 8);
}

export function addDate(factory: PdfBuilder, date: string, word = 'Rechnungsdatum') {
  factory.addSpace(10);
  factory.addLeftRight([], [`${word}: ${date}`]);
}

export function addCustomer(factory: PdfBuilder, { customerName, customerPlz, customerStreet, firma }: Rechnung) {
  factory.addSpace(5);
  let col = [];
  firma && col.push(firma);

  customerName && col.push(customerName);

  customerStreet && col.push(customerStreet);

  customerPlz && col.push(customerPlz);
  factory.addLeftRight(col, ['', '', '', '']);
}

function addRNumber(factory: PdfBuilder, { rNumber }: Rechnung) {
  factory.addSpace(35);
  factory.setBold();
  factory.addText(`Rechnung Nr: ${rNumber}`, 12, 12, 'center');
}

export function addTable(factory: PdfBuilder, { entries }: Rechnung | Gutschrift, negative = false) {
  const head = [['Bezeichnung', 'Menge', 'Einzelpreis', 'Betrag']];

  const multiplikator = negative ? -1 : 1;

  const body = entries.map((e) => {
    return [
      e.desc,
      e.colli,
      e.price ? euroValue(Number(e.price) * multiplikator) : '',
      e.sum ? euroValue(Number(e.sum) * multiplikator) : '',
    ];
  });
  factory.addTable(
    head,
    body,
    {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
    },
    { halign: 'center' },
    25,
  );
}

export function addPrice(factory: PdfBuilder, { entries }: Rechnung | Gutschrift, negative = false) {
  factory.addSpace(10);
  const { tax, brutto, netto } = calculateNumbers(entries);

  const prefix = negative ? '- ' : '';

  factory.addLeftRight(
    [],
    [
      `Nettobetrag:   ${prefix}${euroValue(netto)}`,
      `19% MwSt:     ${prefix}${euroValue(tax)}`,
      `Gesamtbetrag:   ${prefix}${euroValue(brutto)}`,
    ],
  );
}

export function addText(factory: PdfBuilder, text: string) {
  factory.addSpace(10);
  factory.resetText();
  factory.addTable(
    null,
    [[text]],
    {
      0: { lineColor: [255, 255, 255] },
    },
    null,
    25,
  );
}

export function move(factory: PdfBuilder, bestYpos = 250) {
  const currentY = factory.getY();
  if (currentY < bestYpos) {
    factory.addSpace(bestYpos - currentY);
  }
}

export function addVermerk(factory: PdfBuilder) {
  factory.addText('Die Rechnung wurde maschinell erstellt und ist ohne Unterschrift gültig.', 8);
}

export function addKonto(factory: PdfBuilder) {
  factory.addLine();
  factory.add2Cols(
    ['Bankverbindung:'],
    ['Alexander Berent, Stadtsparkasse München', 'IBAN: DE41 7015 0000 1005 7863 20', 'BIC: SSKMDEMMXXX'],
    8,
    7,
    1,
  );
}
