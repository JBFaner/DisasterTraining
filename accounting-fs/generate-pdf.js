const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const outPath = path.join(
  __dirname,
  "ABC_Merchandising_Financial_Statements_Oct_2017.pdf"
);

const doc = new PDFDocument({
  size: "LETTER",
  margins: { top: 54, bottom: 54, left: 54, right: 54 },
});

doc.pipe(fs.createWriteStream(outPath));

const left = 54;
const right = 558;
const amountCol = 400;

doc.registerFont("Times", "C:/Windows/Fonts/times.ttf");
doc.registerFont("Times-Bold", "C:/Windows/Fonts/timesbd.ttf");
doc.registerFont("Times-Italic", "C:/Windows/Fonts/timesi.ttf");

const font = "Times";
const fontBold = "Times-Bold";
const fontItalic = "Times-Italic";

function header(company, title, period) {
  doc.font(fontBold).fontSize(14).text(company, { align: "center" });
  doc.moveDown(0.25);
  doc.font(fontBold).fontSize(12).text(title, { align: "center" });
  doc.moveDown(0.15);
  doc.font(font).fontSize(11).text(period, { align: "center" });
  doc.moveDown(0.6);
}

function amountHeader() {
  const y = doc.y;
  doc.font(fontBold).fontSize(11).text("Amount", amountCol, y, {
    width: right - amountCol,
    align: "center",
  });
  doc.moveDown(0.35);
}

function lineAt(y, style = "single") {
  if (style === "single") {
    doc
      .moveTo(amountCol, y)
      .lineTo(right, y)
      .lineWidth(0.8)
      .stroke();
  } else if (style === "double") {
    doc
      .moveTo(amountCol, y)
      .lineTo(right, y)
      .lineWidth(0.8)
      .stroke();
    doc
      .moveTo(amountCol, y + 3)
      .lineTo(right, y + 3)
      .lineWidth(0.8)
      .stroke();
  }
}

function row(account, amount, opts = {}) {
  const {
    bold = false,
    indent = 0,
    underline = "none",
    section = false,
    blank = false,
  } = opts;

  if (blank) {
    doc.moveDown(0.35);
    return;
  }

  const y = doc.y;
  if (section) {
    doc.font(fontItalic).fontSize(11).text(account, left, y, {
      width: amountCol - left - 10,
    });
    doc.moveDown(0.25);
    return;
  }

  doc
    .font(bold ? fontBold : font)
    .fontSize(11)
    .text(account, left + indent, y, {
      width: amountCol - left - indent - 10,
      continued: false,
    });

  if (amount) {
    doc
      .font(bold ? fontBold : font)
      .fontSize(11)
      .text(amount, amountCol, y, {
        width: right - amountCol,
        align: "right",
      });
  }

  const underlineY = y + 13;
  if (underline !== "none") {
    lineAt(underlineY, underline);
    doc.y = underline === "double" ? underlineY + 8 : underlineY + 4;
  } else {
    doc.y = y + 16;
  }
}

function sectionTitle(text) {
  doc.moveDown(0.3);
  doc.font(fontBold).fontSize(12).text(text, left);
  doc.moveDown(0.2);
}

function subsectionTitle(text) {
  doc.moveDown(0.25);
  doc.font(fontItalic).fontSize(11).text(text, left);
  doc.moveDown(0.15);
}

// —— Income Statement ——
header(
  "ABC MERCHANDISING",
  "Income Statement",
  "For the Month Ended October 31, 2017"
);
amountHeader();
row("Sales", "₱95,000.00");
row("Less: Sales Discount", "(1,500.00)", { indent: 20 });
row("Less: Sales Returns and Allowances", "(5,000.00)", {
  indent: 20,
  underline: "single",
});
row("Net Sales", "88,500.00", { bold: true, underline: "single" });
row("", "", { blank: true });
row("Cost of Goods Sold", "", { section: true });
row("Purchases", "60,000.00", { indent: 20 });
row("Add: Freight-In", "2,500.00", { indent: 20, underline: "single" });
row("", "62,500.00", { indent: 20 });
row("Less: Purchase Discount", "(1,800.00)", { indent: 20 });
row("Less: Purchase Returns and Allowances", "(15,000.00)", {
  indent: 20,
  underline: "single",
});
row("Cost of Goods Sold", "45,700.00", { bold: true, underline: "single" });
row("", "", { blank: true });
row("Gross Profit", "42,800.00", { bold: true, underline: "single" });
row("", "", { blank: true });
row("Operating Expenses", "", { section: true });
row("Freight-Out", "1,450.00", { indent: 20 });
row("Salary Expense", "8,000.00", { indent: 20 });
row("Rent Expense", "10,000.00", { indent: 20 });
row("Utilities Expense", "12,180.00", { indent: 20, underline: "single" });
row("Total Operating Expenses", "31,630.00", {
  bold: true,
  underline: "single",
});
row("", "", { blank: true });
row("Net Income", "₱11,170.00", { bold: true, underline: "double" });

// —— Statement of Changes in Owner's Equity ——
doc.addPage();
header(
  "ABC MERCHANDISING",
  "Statement of Changes in Owner's Equity",
  "For the Month Ended October 31, 2017"
);
amountHeader();
row("ABC, Capital, October 1, 2017", "₱200,000.00");
row("Add: Net Income", "11,170.00", { indent: 20, underline: "single" });
row("Subtotal", "211,170.00", { bold: true, underline: "single" });
row("Less: Drawing", "(10,000.00)", { indent: 20, underline: "single" });
row("ABC, Capital, October 31, 2017", "₱201,170.00", {
  bold: true,
  underline: "double",
});

// —— Balance Sheet ——
doc.addPage();
header("ABC MERCHANDISING", "Balance Sheet", "October 31, 2017");
sectionTitle("Assets");
subsectionTitle("Current Assets");
amountHeader();
row("Cash", "₱198,020.00", { indent: 20 });
row("Office Supplies", "3,150.00", { indent: 20, underline: "single" });
row("Total Current Assets", "201,170.00", { bold: true, underline: "single" });

subsectionTitle("Non-Current Assets");
amountHeader();
row("Office Equipment", "₱45,000.00", { indent: 20, underline: "single" });
row("", "", { blank: true });
row("Total Assets", "₱246,170.00", { bold: true, underline: "double" });

sectionTitle("Liabilities and Owner's Equity");
subsectionTitle("Liabilities");
amountHeader();
row("Accounts Payable", "₱45,000.00", { indent: 20, underline: "single" });

subsectionTitle("Owner's Equity");
amountHeader();
row("ABC, Capital", "₱201,170.00", { indent: 20, underline: "single" });
row("", "", { blank: true });
row("Total Liabilities and Owner's Equity", "₱246,170.00", {
  bold: true,
  underline: "double",
});

doc.end();
console.log("Created:", outPath);
