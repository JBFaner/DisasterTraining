const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  VerticalAlign,
  PageBreak,
} = require("docx");
const fs = require("fs");
const path = require("path");

const PAGE_WIDTH = 12240; // US Letter twips
const MARGIN = 1080; // 0.75"
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const COL_ACCOUNT = Math.floor(CONTENT_WIDTH * 0.62);
const COL_AMOUNT = CONTENT_WIDTH - COL_ACCOUNT;

const noBorder = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

const singleUnderline = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

const doubleUnderline = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.DOUBLE, size: 8, color: "000000" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

function headerBlock(company, title, period) {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 0 },
      children: [
        new TextRun({ text: company, bold: true, size: 28, font: "Times New Roman" }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 0 },
      children: [
        new TextRun({ text: title, bold: true, size: 24, font: "Times New Roman" }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 40, after: 200 },
      children: [
        new TextRun({ text: period, size: 22, font: "Times New Roman" }),
      ],
    }),
  ];
}

function amountHeader() {
  return fsRow("", "Amount", { amountBold: true, amountAlign: AlignmentType.CENTER });
}

function cell(text, opts = {}) {
  const {
    bold = false,
    align = AlignmentType.LEFT,
    width = COL_ACCOUNT,
    borders = noBorder,
    indent = 0,
    italics = false,
  } = opts;

  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders,
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        alignment: align,
        indent: indent ? { left: indent } : undefined,
        spacing: { before: 40, after: 40 },
        children: [
          new TextRun({
            text,
            bold,
            italics,
            size: 22,
            font: "Times New Roman",
          }),
        ],
      }),
    ],
  });
}

function fsRow(account, amount, opts = {}) {
  const {
    accountBold = false,
    amountBold = false,
    indent = 0,
    underline = "none", // none | single | double
    blank = false,
    section = false,
  } = opts;

  let amountBorders = noBorder;
  if (underline === "single") amountBorders = singleUnderline;
  if (underline === "double") amountBorders = doubleUnderline;

  if (blank) {
    return new TableRow({
      children: [
        cell("", { width: COL_ACCOUNT }),
        cell("", { width: COL_AMOUNT, align: AlignmentType.RIGHT }),
      ],
    });
  }

  if (section) {
    return new TableRow({
      children: [
        cell(account, { bold: true, width: COL_ACCOUNT, italics: true }),
        cell("", { width: COL_AMOUNT }),
      ],
    });
  }

  return new TableRow({
    children: [
      cell(account, {
        bold: accountBold,
        width: COL_ACCOUNT,
        indent,
      }),
      cell(amount, {
        bold: amountBold,
        width: COL_AMOUNT,
        align: AlignmentType.RIGHT,
        borders: amountBorders,
      }),
    ],
  });
}

function makeTable(rows) {
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [COL_ACCOUNT, COL_AMOUNT],
    rows,
  });
}

const incomeStatement = [
  ...headerBlock(
    "ABC MERCHANDISING",
    "Income Statement",
    "For the Month Ended October 31, 2017"
  ),
  makeTable([
    amountHeader(),
    fsRow("Sales", "₱95,000.00"),
    fsRow("Less: Sales Discount", "(1,500.00)", { indent: 200 }),
    fsRow("Less: Sales Returns and Allowances", "(5,000.00)", {
      indent: 200,
      underline: "single",
    }),
    fsRow("Net Sales", "88,500.00", { accountBold: true, underline: "single" }),
    fsRow("", "", { blank: true }),
    fsRow("Cost of Goods Sold", "", { section: true }),
    fsRow("Purchases", "60,000.00", { indent: 200 }),
    fsRow("Add: Freight-In", "2,500.00", { indent: 200, underline: "single" }),
    fsRow("", "62,500.00", { indent: 200 }),
    fsRow("Less: Purchase Discount", "(1,800.00)", { indent: 200 }),
    fsRow("Less: Purchase Returns and Allowances", "(15,000.00)", {
      indent: 200,
      underline: "single",
    }),
    fsRow("Cost of Goods Sold", "45,700.00", {
      accountBold: true,
      underline: "single",
    }),
    fsRow("", "", { blank: true }),
    fsRow("Gross Profit", "42,800.00", { accountBold: true, underline: "single" }),
    fsRow("", "", { blank: true }),
    fsRow("Operating Expenses", "", { section: true }),
    fsRow("Freight-Out", "1,450.00", { indent: 200 }),
    fsRow("Salary Expense", "8,000.00", { indent: 200 }),
    fsRow("Rent Expense", "10,000.00", { indent: 200 }),
    fsRow("Utilities Expense", "12,180.00", { indent: 200, underline: "single" }),
    fsRow("Total Operating Expenses", "31,630.00", {
      accountBold: true,
      underline: "single",
    }),
    fsRow("", "", { blank: true }),
    fsRow("Net Income", "₱11,170.00", {
      accountBold: true,
      amountBold: true,
      underline: "double",
    }),
  ]),
];

const equityStatement = [
  new Paragraph({ children: [new PageBreak()] }),
  ...headerBlock(
    "ABC MERCHANDISING",
    "Statement of Changes in Owner's Equity",
    "For the Month Ended October 31, 2017"
  ),
  makeTable([
    amountHeader(),
    fsRow("ABC, Capital, October 1, 2017", "₱200,000.00"),
    fsRow("Add: Net Income", "11,170.00", { indent: 200, underline: "single" }),
    fsRow("Subtotal", "211,170.00", { accountBold: true, underline: "single" }),
    fsRow("Less: Drawing", "(10,000.00)", { indent: 200, underline: "single" }),
    fsRow("ABC, Capital, October 31, 2017", "₱201,170.00", {
      accountBold: true,
      amountBold: true,
      underline: "double",
    }),
  ]),
];

const balanceSheet = [
  new Paragraph({ children: [new PageBreak()] }),
  ...headerBlock("ABC MERCHANDISING", "Balance Sheet", "October 31, 2017"),
  new Paragraph({
    spacing: { before: 120, after: 80 },
    children: [
      new TextRun({
        text: "Assets",
        bold: true,
        size: 24,
        font: "Times New Roman",
      }),
    ],
  }),
  new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({
        text: "Current Assets",
        bold: true,
        italics: true,
        size: 22,
        font: "Times New Roman",
      }),
    ],
  }),
  makeTable([
    amountHeader(),
    fsRow("Cash", "₱198,020.00", { indent: 200 }),
    fsRow("Office Supplies", "3,150.00", { indent: 200, underline: "single" }),
    fsRow("Total Current Assets", "201,170.00", {
      accountBold: true,
      underline: "single",
    }),
  ]),
  new Paragraph({
    spacing: { before: 200, after: 60 },
    children: [
      new TextRun({
        text: "Non-Current Assets",
        bold: true,
        italics: true,
        size: 22,
        font: "Times New Roman",
      }),
    ],
  }),
  makeTable([
    amountHeader(),
    fsRow("Office Equipment", "₱45,000.00", {
      indent: 200,
      underline: "single",
    }),
    fsRow("", "", { blank: true }),
    fsRow("Total Assets", "₱246,170.00", {
      accountBold: true,
      amountBold: true,
      underline: "double",
    }),
  ]),
  new Paragraph({
    spacing: { before: 280, after: 80 },
    children: [
      new TextRun({
        text: "Liabilities and Owner's Equity",
        bold: true,
        size: 24,
        font: "Times New Roman",
      }),
    ],
  }),
  new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({
        text: "Liabilities",
        bold: true,
        italics: true,
        size: 22,
        font: "Times New Roman",
      }),
    ],
  }),
  makeTable([
    amountHeader(),
    fsRow("Accounts Payable", "₱45,000.00", {
      indent: 200,
      underline: "single",
    }),
  ]),
  new Paragraph({
    spacing: { before: 200, after: 60 },
    children: [
      new TextRun({
        text: "Owner's Equity",
        bold: true,
        italics: true,
        size: 22,
        font: "Times New Roman",
      }),
    ],
  }),
  makeTable([
    amountHeader(),
    fsRow("ABC, Capital", "₱201,170.00", {
      indent: 200,
      underline: "single",
    }),
    fsRow("", "", { blank: true }),
    fsRow("Total Liabilities and Owner's Equity", "₱246,170.00", {
      accountBold: true,
      amountBold: true,
      underline: "double",
    }),
  ]),
];

const doc = new Document({
  styles: {
    default: {
      document: {
        styles: [
          {
            id: "Normal",
            name: "Normal",
            run: { font: "Times New Roman", size: 22 },
          },
        ],
      },
    },
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: PAGE_WIDTH, height: 15840 },
          margin: {
            top: MARGIN,
            bottom: MARGIN,
            left: MARGIN,
            right: MARGIN,
          },
        },
      },
      children: [...incomeStatement, ...equityStatement, ...balanceSheet],
    },
  ],
});

const outPath = path.join(
  __dirname,
  "ABC_Merchandising_Financial_Statements_Oct_2017.docx"
);

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outPath, buffer);
  console.log("Created:", outPath);
});
