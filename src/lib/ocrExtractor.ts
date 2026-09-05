export interface ExtractedFields {
  rawText: string;
  name?: string;
  brand?: string;
  expiryDate?: string;
  manufacturingDate?: string;
  purchaseDate?: string;
  batchNumber?: string;
  invoiceNumber?: string;
  confidenceNotes: string[];
}

/**
 * Normalizes standard date formats (DD/MM/YYYY, MM/YYYY, DD-MMM-YYYY) into YYYY-MM-DD
 */
function normalizeDateString(dateStr: string): string | undefined {
  const clean = dateStr.trim().replace(/[/.]/g, '-');

  // Format 1: DD-MM-YYYY or DD-MM-YY
  const dmyMatch = clean.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
  if (dmyMatch) {
    let day = parseInt(dmyMatch[1], 10);
    let month = parseInt(dmyMatch[2], 10);
    let year = parseInt(dmyMatch[3], 10);
    if (year < 100) year += 2000;
    if (month > 12 && day <= 12) {
      // Swap if month/day reversed
      const temp = day;
      day = month;
      month = temp;
    }
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // Format 2: MM-YYYY or MM-YY (Standard on medicine strips: e.g. EXP 08/28)
  const myMatch = clean.match(/^(\d{1,2})-(\d{2,4})$/);
  if (myMatch) {
    const month = parseInt(myMatch[1], 10);
    let year = parseInt(myMatch[2], 10);
    if (year < 100) year += 2000;
    if (month >= 1 && month <= 12) {
      // Last day of month default for expiry safety
      const lastDay = new Date(year, month, 0).getDate();
      return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    }
  }

  // Format 3: Named months (e.g. 15-AUG-2027 or AUG 2027)
  const months: { [k: string]: string } = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };

  for (const [mName, mNum] of Object.entries(months)) {
    const namedMatch = new RegExp(`(\\d{1,2})?[-\\s]?(${mName})[a-z]*[-\\s]?(\\d{2,4})`, 'i').exec(dateStr);
    if (namedMatch) {
      let year = parseInt(namedMatch[3], 10);
      if (year < 100) year += 2000;
      const day = namedMatch[1] ? String(parseInt(namedMatch[1], 10)).padStart(2, '0') : '28';
      return `${year}-${mNum}-${day}`;
    }
  }

  return undefined;
}

export function parseOcrText(text: string): ExtractedFields {
  const result: ExtractedFields = {
    rawText: text,
    confidenceNotes: [],
  };

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // 1. Expiry Date Detection (EXP, EXPIRY, USE BY, BEST BEFORE)
  const expiryRegex = /(?:exp(?:iry)?\.?|use\s*by|best\s*before)[\s:]*([0-9]{1,2}[/-][0-9]{2,4}|[0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4}|[a-zA-Z]{3,9}[\s-]*\d{2,4})/i;
  const expiryMatch = text.match(expiryRegex);
  if (expiryMatch && expiryMatch[1]) {
    const parsed = normalizeDateString(expiryMatch[1]);
    if (parsed) {
      result.expiryDate = parsed;
      result.confidenceNotes.push('Detected Expiry Date');
    }
  }

  // 2. Manufacturing Date Detection (MFG, MFD, DATE OF MFG)
  const mfgRegex = /(?:mfg\.?|mfd\.?|date\s*of\s*mfg)[\s:]*([0-9]{1,2}[/-][0-9]{2,4}|[0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4}|[a-zA-Z]{3,9}[\s-]*\d{2,4})/i;
  const mfgMatch = text.match(mfgRegex);
  if (mfgMatch && mfgMatch[1]) {
    const parsed = normalizeDateString(mfgMatch[1]);
    if (parsed) {
      result.manufacturingDate = parsed;
      result.confidenceNotes.push('Detected Manufacturing Date');
    }
  }

  // 3. Batch / Lot Number Detection
  const batchRegex = /(?:b\.?\s*no\.?|batch(?:\s*no\.?)?|lot(?:\s*no\.?)?)[\s:]*([A-Z0-9-]{3,15})/i;
  const batchMatch = text.match(batchRegex);
  if (batchMatch && batchMatch[1]) {
    result.batchNumber = batchMatch[1].trim();
    result.confidenceNotes.push('Detected Batch / Lot No');
  }

  // 4. Invoice / Bill Number Detection
  const invRegex = /(?:inv(?:oice)?(?:\s*no\.?)?|bill\s*no\.?)[\s:]*([A-Z0-9-]{3,20})/i;
  const invMatch = text.match(invRegex);
  if (invMatch && invMatch[1]) {
    result.invoiceNumber = invMatch[1].trim();
    result.confidenceNotes.push('Detected Invoice / Receipt No');
  }

  // 5. Product Name / Title Heuristic
  // Select first substantive line (3+ chars) that does not start with dates or pricing
  const excludedKeywords = ['exp', 'mfg', 'batch', 'b.no', 'mrp', 'rs.', 'tax', 'invoice', 'tel', 'phone'];
  for (const line of lines) {
    const lower = line.toLowerCase();
    const isExcluded = excludedKeywords.some((kw) => lower.startsWith(kw));
    if (!isExcluded && line.length >= 3 && line.length <= 40 && !result.name) {
      result.name = line.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
      result.confidenceNotes.push('Suggested Item Name from header');
      break;
    }
  }

  return result;
}