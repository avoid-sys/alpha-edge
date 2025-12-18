import React, { useState } from 'react';
import { localDataService } from '@/services/localDataService';
import { securityService } from '@/services/securityService';
import { NeumorphicCard, NeumorphicButton } from '@/components/NeumorphicUI';
import { Upload, FileText, CheckCircle, AlertCircle, Shield, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { calculateTradeMetrics } from '@/components/TradeLogic';

export default function ImportTrades() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [parsedCount, setParsedCount] = useState(0);
  const [securityStatus, setSecurityStatus] = useState(null); // 'validated', 'failed', 'scanning'

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      try {
        // Security validation
        const validation = await securityService.validateFile(selectedFile);
        setFile(selectedFile);
        setError(null);
        setSecurityStatus('validated');
      } catch (error) {
        setError(`Security check failed: ${error.message}`);
        setFile(null);
        setSecurityStatus('failed');
        securityService.logSecurityEvent('file_upload_blocked', {
          fileName: selectedFile.name,
          reason: error.message
        });
      }
    }
  };

  // Enhanced flexible parser that searches for trading information regardless of file structure
  const parseFlexible = (fileContent, fileType) => {
    const trades = [];

    try {
      if (fileType === 'html') {
        return parseHTML(fileContent);
      } else {
        // For CSV and other text-based files, use flexible parsing
        return parseFlexibleText(fileContent);
      }
    } catch (error) {
      console.error('Error in flexible parsing:', error);
      return trades;
    }
  };

  // Flexible text parser that searches for trading patterns anywhere in the content
  const parseFlexibleText = (textContent) => {
    const trades = [];
    const lines = textContent.split(/\r?\n/).filter(line => line.trim());

    console.log('Starting flexible text parsing for', lines.length, 'lines');

    // First, try to detect if this is a structured CSV-like file
    const delimiter = detectDelimiter(textContent);
    const isStructured = isStructuredData(textContent, delimiter);

    if (isStructured) {
      console.log('Detected structured data, using enhanced CSV parser');
      return parseEnhancedCSV(textContent, delimiter);
    }

    // If not structured, use pattern-based extraction
    console.log('Using pattern-based extraction for unstructured data');
    return extractTradesByPattern(textContent);
  };

  // Detect the most likely delimiter in the content
  const detectDelimiter = (content) => {
    const firstFewLines = content.split(/\r?\n/).slice(0, 5).join('\n');
    const semicolonCount = (firstFewLines.match(/;/g) || []).length;
    const commaCount = (firstFewLines.match(/,/g) || []).length;
    const tabCount = (firstFewLines.match(/\t/g) || []).length;
    const pipeCount = (firstFewLines.match(/\|/g) || []).length;

    const counts = [
      { delimiter: ';', count: semicolonCount },
      { delimiter: ',', count: commaCount },
      { delimiter: '\t', count: tabCount },
      { delimiter: '|', count: pipeCount }
    ];

    counts.sort((a, b) => b.count - a.count);
    return counts[0].count > 0 ? counts[0].delimiter : ',';
  };

  // Check if the data appears to be structured (has consistent columns)
  const isStructuredData = (content, delimiter) => {
    const lines = content.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) return false;

    // Check if first few lines have similar number of fields
    const fieldCounts = lines.slice(0, Math.min(5, lines.length)).map(line => {
      return line.split(delimiter).length;
    });

    const avgFields = fieldCounts.reduce((a, b) => a + b, 0) / fieldCounts.length;
    const variance = fieldCounts.reduce((sum, count) => sum + Math.pow(count - avgFields, 2), 0) / fieldCounts.length;

    // If variance is low and average fields > 3, it's likely structured
    return variance < 2 && avgFields > 3;
  };

  // Enhanced CSV parser with better flexibility
  const parseEnhancedCSV = (csvContent, delimiter) => {
    const lines = csvContent.split(/\r?\n/).filter(line => line.trim());
    const trades = [];

    if (lines.length < 2) return trades;

    // Find header row more intelligently
    let headerRowIndex = findHeaderRow(lines, delimiter);
    const headers = parseCSVLine(lines[headerRowIndex], delimiter).map(h => h.trim().toLowerCase());

    console.log('Enhanced CSV headers detected:', headers, 'at row', headerRowIndex);

    // Create flexible column mapping - look for patterns in any order
    const columnMap = createFlexibleColumnMap(headers);

    // Process data rows
    for (let i = headerRowIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cells = parseCSVLine(line, delimiter);
      if (cells.length < headers.length * 0.5) continue; // Skip incomplete rows

      // Skip header-like rows or totals
      const rowText = cells.join(' ').toLowerCase();
      if (rowText.includes('total') || rowText.includes('sum') ||
          rowText.includes('subtotal') || /^[\s,;]*$/.test(rowText)) continue;

      try {
        const tradeData = extractTradeFromRow(cells, columnMap, headers);
        if (tradeData) {
          trades.push(tradeData);
        }
      } catch (e) {
        console.warn('Error parsing CSV row:', e, cells);
      }
    }

    return trades;
  };

  // Parse CSV line handling quoted fields properly
  const parseCSVLine = (line, delimiter) => {
    const cells = [];
    let currentCell = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if ((char === delimiter && !inQuotes) || j === line.length - 1) {
        if (j === line.length - 1) currentCell += char;
        cells.push(currentCell.trim().replace(/^"|"$/g, ''));
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    if (currentCell) cells.push(currentCell.trim().replace(/^"|"$/g, ''));

    return cells;
  };

  // Find the most likely header row
  const findHeaderRow = (lines, delimiter) => {
    let bestIndex = 0;
    let bestScore = 0;

    for (let i = 0; i < Math.min(10, lines.length); i++) {
      const cells = parseCSVLine(lines[i], delimiter);
      const headers = cells.map(h => h.trim().toLowerCase());
      const score = calculateHeaderScore(headers);

      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }

    return bestIndex;
  };

  // Calculate how likely a row is to be headers
  const calculateHeaderScore = (headers) => {
    let score = 0;
    const tradeKeywords = [
      'symbol', 'instrument', 'pair', 'direction', 'side', 'type', 'action',
      'price', 'profit', 'loss', 'pl', 'balance', 'volume', 'quantity', 'lots',
      'time', 'date', 'entry', 'exit', 'open', 'close', 'buy', 'sell'
    ];

    headers.forEach(header => {
      tradeKeywords.forEach(keyword => {
        if (header.includes(keyword)) score += 2;
      });
    });

    // Bonus for having multiple trade-related headers
    const tradeHeaders = headers.filter(h =>
      tradeKeywords.some(keyword => h.includes(keyword))
    );
    if (tradeHeaders.length >= 3) score += 5;

    return score;
  };

  // Create flexible column mapping that searches for patterns
  const createFlexibleColumnMap = (headers) => {
    const map = {};

    // Define patterns for each field type
    const patterns = {
      symbol: [/symbol/i, /instrument/i, /pair/i, /currency/i, /asset/i],
      direction: [/direction/i, /side/i, /type/i, /action/i, /^buy$/i, /^sell$/i, /opening direction/i],
      entryPrice: [/(entry|open).*price/i, /(entry|open).*rate/i],
      exitPrice: [/(exit|close|closing).*price/i, /(exit|close|closing).*rate/i],
      volume: [/volume/i, /quantity/i, /lots/i, /size/i, /amount/i, /closing quantity/i],
      profit: [/(profit|pl|p\/l|net)/i, !/gross/i, !/commission/i, !/unrealised/i],
      commission: [/commission/i, /fee/i, /charges/i],
      swap: [/swap/i, /interest/i, /rollover/i],
      balance: [/(balance|equity|account)/i, /balance.*usd/i, /balance.*\$/i],
      openTime: [/(open|entry).*(time|date)/i],
      closeTime: [/(close|exit|closing).*(time|date)/i, /time|date/i] // close time is fallback
    };

    // Find best match for each field
    Object.keys(patterns).forEach(field => {
      let bestIndex = -1;
      let bestScore = 0;

      headers.forEach((header, index) => {
        let score = 0;
        const fieldPatterns = patterns[field];

        fieldPatterns.forEach(pattern => {
          if (typeof pattern === 'string') {
            if (header === pattern) score += 10;
          } else if (pattern.test(header)) {
            score += 5;
            // Additional scoring for exact matches
            if (pattern.source.includes('^') && pattern.source.includes('$')) {
              score += 5;
            }
          }
        });

        if (score > bestScore) {
          bestScore = score;
          bestIndex = index;
        }
      });

      map[field] = bestIndex;
    });

    console.log('Flexible column mapping:', map);
    return map;
  };

  // Extract trade data from a row using flexible mapping
  const extractTradeFromRow = (cells, columnMap, headers) => {
    // Enhanced extraction with fallback logic
    const extractValue = (fieldName, fallbackPatterns = []) => {
      // Try mapped column first
      if (columnMap[fieldName] >= 0 && columnMap[fieldName] < cells.length) {
        const value = cells[columnMap[fieldName]];
        if (value && value.trim()) return value;
      }

      // Fallback: search all cells for patterns
      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i].trim();
        if (!cell) continue;

        // Check fallback patterns
        if (fallbackPatterns.some(pattern => pattern.test(cell))) {
          return cell;
        }

        // Context-aware fallbacks
        if (fieldName === 'symbol' && /^[A-Z]{3,12}(\.[A-Z]{3})?$/.test(cell.replace(/[^A-Z.]/g, ''))) {
          return cell;
        }
        if (fieldName === 'direction' && /(buy|sell|long|short)/i.test(cell)) {
          return cell;
        }
      }

      return '';
    };

    const symbol = extractValue('symbol', [/^[A-Z]{3,12}(\.[A-Z]{3})?$/]);
    const direction = extractValue('direction', [/(buy|sell|long|short)/i]);
    const entryPrice = parseNumericValue(extractValue('entryPrice', [/^\d+\.?\d*$/]));
    const exitPrice = parseNumericValue(extractValue('exitPrice', [/^\d+\.?\d*$/]));
    const volume = parseNumericValue(extractValue('volume', [/^\d+\.?\d*$/]));
    const profit = parseNumericValue(extractValue('profit', [/^-?\d+\.?\d*$/]));
    const commission = parseNumericValue(extractValue('commission', [/^-?\d+\.?\d*$/]));
    const swap = parseNumericValue(extractValue('swap', [/^-?\d+\.?\d*$/]));
    const balance = parseNumericValue(extractValue('balance', [/^\d+\.?\d*$/]));
    const closeTimeStr = extractValue('closeTime', [/\d{1,4}[-\/]\d{1,2}[-\/]\d{1,4}/]);
    const openTimeStr = extractValue('openTime', [/\d{1,4}[-\/]\d{1,2}[-\/]\d{1,4}/]);

    // Normalize direction
    let normalizedDirection = '';
    const dirLower = direction.toLowerCase();
    if (/buy|long/i.test(dirLower)) {
      normalizedDirection = 'Buy';
    } else if (/sell|short/i.test(dirLower)) {
      normalizedDirection = 'Sell';
    }

    // Validate trade data
    const cleanedSymbol = symbol.replace(/[^a-zA-Z0-9\/]/g, '').toUpperCase();
    const hasValidSymbol = cleanedSymbol.length >= 3 && cleanedSymbol.length <= 12;
    const hasValidDirection = normalizedDirection !== '';

    if (!hasValidSymbol || !hasValidDirection) {
      return null;
    }

    // Calculate net profit correctly
    let netProfit = profit || 0;
    if (commission !== 0 || swap !== 0) {
      // If commission/swap are separate, adjust the profit
      if (profit !== 0) {
        netProfit = profit - Math.abs(commission) - Math.abs(swap);
      }
    }

    // Parse dates
    const closeDate = parseDate(closeTimeStr) || new Date();
    const openDate = parseDate(openTimeStr);

    const tradeData = {
      symbol: cleanedSymbol,
      direction: normalizedDirection,
      close_time: closeDate.toISOString(),
      entry_price: entryPrice || 0,
      exit_price: exitPrice || 0,
      volume: volume || 0,
      net_profit: netProfit,
      balance: balance || 0,
      open_time: openDate ? openDate.toISOString() : null
    };

    console.log('Extracted trade:', tradeData);
    return tradeData;
  };

  // Enhanced numeric parsing
  const parseNumericValue = (value) => {
    if (!value || typeof value !== 'string') return 0;

    // Handle various formats: "1,234.56", "(123.45)", "-123.45", "123 456.78"
    const cleaned = value
      .replace(/\s/g, '') // Remove spaces
      .replace(/[()]/g, '') // Remove parentheses
      .replace(/[^\d.,-]/g, ''); // Keep only numbers, dots, commas, minus

    // Handle negative numbers
    const isNegative = value.includes('(') || (cleaned.startsWith('-') && cleaned.length > 1);
    const cleanValue = cleaned.replace(/^-/, '');

    // Try parsing with different decimal separators
    let num = parseFloat(cleanValue.replace(',', '.'));
    if (isNaN(num)) {
      // Try comma as decimal separator
      num = parseFloat(cleanValue.replace(/\./g, '').replace(',', '.'));
    }

    return isNaN(num) ? 0 : (isNegative ? -num : num);
  };

  // Enhanced date parsing
  const parseDate = (dateStr) => {
    if (!dateStr) return null;

    const dateFormats = [
      // DD/MM/YYYY HH:MM:SS
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\s+(\d{1,2}):(\d{2}):?(\d{2})?/,
      // YYYY-MM-DD HH:MM:SS
      /(\d{4})[\/\-](\d{2})[\/\-](\d{2})\s+(\d{1,2}):(\d{2}):?(\d{2})?/,
      // DD/MM/YYYY or MM/DD/YYYY
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
      // YYYY-MM-DD
      /(\d{4})[\/\-](\d{2})[\/\-](\d{2})/,
    ];

    for (const format of dateFormats) {
      const match = dateStr.match(format);
      if (match) {
        try {
          if (match.length > 4) {
            // Has time component
            const [, d1, m1, y1, h, min, sec] = match;
            // Determine if it's DD/MM or MM/DD based on values
            const day = parseInt(d1);
            const month = parseInt(m1);
            const year = parseInt(y1);

            let actualDay, actualMonth;
            if (day > 12 && month <= 12) {
              // Must be DD/MM/YYYY
              actualDay = day;
              actualMonth = month;
            } else if (month > 12 && day <= 12) {
              // Must be MM/DD/YYYY
              actualDay = month;
              actualMonth = day;
            } else if (day <= 12 && month <= 12) {
              // Ambiguous, assume DD/MM/YYYY (more common internationally)
              actualDay = day;
              actualMonth = month;
            } else {
              continue; // Invalid date
            }

            return new Date(year, actualMonth - 1, actualDay, parseInt(h), parseInt(min), parseInt(sec || '0'));
          } else {
            // Date only
            const [, d1, m1, y1] = match;
            const day = parseInt(d1);
            const month = parseInt(m1);
            const year = parseInt(y1);

            let actualDay, actualMonth;
            if (day > 12 && month <= 12) {
              actualDay = day;
              actualMonth = month;
            } else if (month > 12 && day <= 12) {
              actualDay = month;
              actualMonth = day;
            } else {
              actualDay = day;
              actualMonth = month;
            }

            return new Date(year, actualMonth - 1, actualDay);
          }
        } catch (e) {
          continue;
        }
      }
    }

    // Fallback: try native Date parsing
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date;
    } catch (e) {
      return null;
    }
  };

  // Pattern-based extraction for unstructured data
  const extractTradesByPattern = (content) => {
    const trades = [];
    const lines = content.split(/\r?\n/).filter(line => line.trim());

    console.log('Extracting trades by pattern from', lines.length, 'lines');

    // Look for trade-like patterns in each line
    lines.forEach((line, index) => {
      const trade = extractTradeFromLine(line, index, lines);
      if (trade) {
        trades.push(trade);
      }
    });

    return trades;
  };

  // Extract trade information from a single line using pattern recognition
  const extractTradeFromLine = (line, index, allLines) => {
    const text = line.toLowerCase();

    // Quick check for trade-like content
    const hasSymbol = /[a-z]{3,12}(\.[a-z]{3})?/.test(text);
    const hasDirection = /(buy|sell|long|short)/.test(text);
    const hasNumbers = /\d+\.?\d*/.g.test(text);

    if (!hasSymbol || !hasDirection || !hasNumbers) {
      return null;
    }

    // Extract components using regex patterns
    const symbolMatch = line.match(/([A-Z]{3,12}(\.[A-Z]{3})?)/);
    const directionMatch = line.match(/(buy|sell|long|short)/i);
    const priceMatches = line.match(/\d+\.?\d*/g);
    const profitMatch = line.match(/[-+]?\$?\d+\.?\d*/);

    if (!symbolMatch || !directionMatch) return null;

    const symbol = symbolMatch[1].toUpperCase();
    const direction = directionMatch[1].charAt(0).toUpperCase() + directionMatch[1].slice(1).toLowerCase();

    // Extract numeric values intelligently
    const numbers = priceMatches ? priceMatches.map(n => parseFloat(n)).filter(n => !isNaN(n)) : [];

    let entryPrice = 0, exitPrice = 0, volume = 0, profit = 0;

    if (numbers.length >= 1) entryPrice = numbers[0];
    if (numbers.length >= 2) exitPrice = numbers[1];
    if (numbers.length >= 3) volume = numbers[2];

    if (profitMatch) {
      profit = parseNumericValue(profitMatch[0]);
    }

    // Normalize direction
    let normalizedDirection = direction;
    if (direction.toLowerCase() === 'long') normalizedDirection = 'Buy';
    if (direction.toLowerCase() === 'short') normalizedDirection = 'Sell';

    return {
      symbol,
      direction: normalizedDirection,
      close_time: new Date().toISOString(),
      entry_price: entryPrice,
      exit_price: exitPrice,
      volume: volume,
      net_profit: profit,
      balance: 0,
      open_time: null
    };
  };

  // HTML parsing is now handled by the flexible parser
  const parseHTML = (htmlContent) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    // Look for all tables in the document
    const allTables = Array.from(doc.querySelectorAll('table'));
    const trades = [];

    console.log('Found', allTables.length, 'tables in HTML');

    // Try to find trade data in each table
    for (const table of allTables) {
      const rows = Array.from(table.querySelectorAll('tr'));
      console.log('Processing table with', rows.length, 'rows');

      // Skip tables with too few rows (likely not trade tables)
      if (rows.length < 2) continue;

      // Look for header row to identify column structure
      let headerRow = null;
      let dataStartIndex = 0;

      // Find the header row by looking for common trade-related headers
      for (let i = 0; i < Math.min(5, rows.length); i++) {
        const rowText = rows[i].innerText.toLowerCase();
        const headerCount = (rowText.match(/symbol|instrument|pair|direction|side|type|price|profit|balance|volume|quantity|lots|time|date/gi) || []).length;
        
        if (headerCount >= 3) {
          headerRow = rows[i];
          dataStartIndex = i + 1;
          break;
        }
      }

      // Fallback to first row if no header found
      if (!headerRow) {
        headerRow = rows[0];
        dataStartIndex = 1;
      }

      // Analyze header to understand column structure
      const headerCells = Array.from(headerRow.querySelectorAll('th, td'));
      const headers = headerCells.map(cell => (cell.innerText || '').trim().toLowerCase());

      console.log('Detected headers:', headers);

      // --- SPECIAL HANDLING: cTrader History statement table ---
      // The user specifically wants the parser to use this table structure:
      // Balance USD / Balance $, Symbol, Opening direction, Closing time (UTC+7),
      // Entry price, Closing price, Closing Quantity, Net USD / Net $
      const hasCTraderHistoryHeaders =
        headers.some(h => h.includes('balance usd') || h.includes('balance $')) &&
        headers.some(h => h.includes('symbol')) &&
        headers.some(h => h.includes('opening direction')) &&
        headers.some(h => h.includes('closing time')) &&
        headers.some(h => h.includes('entry price')) &&
        headers.some(h => h.includes('closing price')) &&
        headers.some(h => h.includes('closing quantity')) &&
        headers.some(h => h.includes('net usd') || h.includes('net $'));

      // If this table does not look like the cTrader History table, skip it
      // This prevents us from accidentally parsing Positions/Orders/Transactions tables
      if (!hasCTraderHistoryHeaders) {
        console.log('Skipping non-History table');
        continue;
      }

      // Enhanced column mapping with more variations (including cTrader specific)
      const columnMap = {
        symbol: headers.findIndex(h => 
          h.includes('symbol') || h.includes('instrument') || h.includes('pair') || 
          h.includes('currency') || h.includes('asset')
        ),
        direction: headers.findIndex(h => 
          h.includes('direction') || h.includes('side') || h.includes('type') ||
          h.includes('action') || h.includes('opening direction') || h === 'buy' || h === 'sell'
        ),
        entryPrice: headers.findIndex(h => 
          (h.includes('entry') || h.includes('open')) && (h.includes('price') || h.includes('rate'))
        ),
        exitPrice: headers.findIndex(h => 
          (h.includes('exit') || h.includes('close') || h.includes('closing')) && 
          (h.includes('price') || h.includes('rate')) && !h.includes('time')
        ),
        volume: headers.findIndex(h => 
          h.includes('volume') || h.includes('quantity') || h.includes('lots') || 
          h.includes('size') || h.includes('amount') || h.includes('closing quantity')
        ),
        profit: headers.findIndex(h => 
          (h.includes('profit') || h.includes('pl') || h.includes('p/l') || h.includes('net usd') || h.includes('net')) && 
          !h.includes('gross') && !h.includes('commission') && !h.includes('unrealised')
        ),
        commission: headers.findIndex(h => 
          h.includes('commission') || h.includes('fee') || h.includes('charges')
        ),
        swap: headers.findIndex(h => 
          h.includes('swap') || h.includes('interest') || h.includes('rollover')
        ),
        balance: headers.findIndex(h => 
          (h.includes('balance') && (h.includes('usd') || h.includes('currency') || h.length < 20)) || 
          h.includes('equity') || (h.includes('account') && h.includes('balance'))
        ),
        openTime: headers.findIndex(h => 
          (h.includes('open') || h.includes('entry') || h.includes('created')) && 
          (h.includes('time') || h.includes('date'))
        ),
        closeTime: headers.findIndex(h => 
          (h.includes('close') || h.includes('exit') || h.includes('closing time')) && 
          (h.includes('time') || h.includes('date')) &&
          !h.includes('open') && !h.includes('entry')
        )
      };

      console.log('Column mapping:', columnMap);

      // Process data rows
      for (let i = dataStartIndex; i < rows.length; i++) {
        const row = rows[i];
        const cells = Array.from(row.querySelectorAll('td'));
        const cellTexts = cells.map(cell => (cell.innerText || cell.textContent || '').trim());

        // Skip rows that don't have enough cells or are headers/totals
        if (cells.length < 3) continue;
        const rowTextLower = cellTexts.join(' ').toLowerCase();
        if (rowTextLower.includes('total') || rowTextLower.includes('sum') || 
            rowTextLower.includes('subtotal') || rowTextLower === '') continue;

        try {
          // Extract data using column mapping or fallback to pattern recognition
          let symbol = '';
          if (columnMap.symbol >= 0 && columnMap.symbol < cellTexts.length) {
            symbol = cellTexts[columnMap.symbol];
          } else {
            // Fallback: find text that looks like a trading pair
            symbol = cellTexts.find(text => {
              const cleaned = text.replace(/[^a-zA-Z0-9]/g, '');
              return cleaned.length >= 3 && cleaned.length <= 12 && 
                     /^[A-Z]{3,6}[A-Z0-9]{0,6}$/i.test(cleaned);
            }) || '';
          }

          let direction = '';
          if (columnMap.direction >= 0 && columnMap.direction < cellTexts.length) {
            direction = cellTexts[columnMap.direction];
          } else {
            direction = cellTexts.find(text => /buy|sell|long|short/i.test(text)) || '';
          }

          // Extract numeric values from all cells with better parsing
          const numericValues = cellTexts.map((text, idx) => {
            if (!text) return null;
            
            // Remove spaces (thousand separators), currency symbols, and other non-numeric chars except digits, dots, commas, and minus
            let cleaned = text.replace(/\s/g, '').replace(/[^\d.,-]/g, '');
            
            // Handle negative numbers (might be at start or end)
            const isNegative = cleaned.startsWith('-') || text.includes('(');
            cleaned = cleaned.replace(/[()]/g, '').replace(/^-/, '');
            
            // Try parsing with dot as decimal separator
            let num = parseFloat(cleaned);
            if (isNaN(num)) {
              // Try with comma as decimal separator
              cleaned = cleaned.replace(',', '.');
              num = parseFloat(cleaned);
            }
            
            if (!isNaN(num)) {
              return { value: isNegative ? -num : num, index: idx, original: text };
            }
            
            return null;
          }).filter(item => item !== null && !isNaN(item.value));

          // Smart assignment based on available data and column mapping
          let entryPrice = 0, exitPrice = 0, volume = 0, netProfit = 0, balance = 0;
          let commission = 0, swap = 0;

          // Extract entry price
          if (columnMap.entryPrice >= 0 && columnMap.entryPrice < cellTexts.length) {
            const val = parseFloat(cellTexts[columnMap.entryPrice].replace(/[^\d.-]/g, '').replace(',', '.'));
            if (!isNaN(val)) entryPrice = val;
          }
          if (entryPrice === 0 && numericValues.length > 0) {
            // Usually first or second numeric value
            entryPrice = numericValues[0]?.value || 0;
          }

          // Extract exit price
          if (columnMap.exitPrice >= 0 && columnMap.exitPrice < cellTexts.length) {
            const val = parseFloat(cellTexts[columnMap.exitPrice].replace(/[^\d.-]/g, '').replace(',', '.'));
            if (!isNaN(val)) exitPrice = val;
          }
          if (exitPrice === 0 && numericValues.length > 1) {
            exitPrice = numericValues[1]?.value || 0;
          }

          // Extract volume
          if (columnMap.volume >= 0 && columnMap.volume < cellTexts.length) {
            const val = parseFloat(cellTexts[columnMap.volume].replace(/[^\d.-]/g, '').replace(',', '.'));
            if (!isNaN(val) && val > 0) volume = val;
          }
          if (volume === 0 && numericValues.length > 2) {
            // Volume is usually a smaller number (0.01 to 100)
            const volumeCandidate = numericValues.find(n => n.value > 0 && n.value < 1000);
            if (volumeCandidate) volume = volumeCandidate.value;
          }

          // Extract profit (net profit) - handle spaces and negative numbers
          if (columnMap.profit >= 0 && columnMap.profit < cellTexts.length) {
            const profitText = cellTexts[columnMap.profit];
            // Remove spaces, handle negative (could be in parentheses or with minus)
            const isNegative = profitText.includes('(') || profitText.trim().startsWith('-');
            let cleaned = profitText.replace(/\s/g, '').replace(/[()]/g, '').replace(/[^\d.,-]/g, '');
            if (cleaned.startsWith('-')) cleaned = cleaned.substring(1);
            const val = parseFloat(cleaned.replace(',', '.'));
            if (!isNaN(val)) netProfit = isNegative ? -val : val;
          }
          if (netProfit === 0 && numericValues.length > 0) {
            // Profit is usually one of the last numeric values, can be positive or negative
            // Look for values that are not too large (not balance) and not too small (not prices)
            const profitCandidates = numericValues.filter(n => 
              Math.abs(n.value) > 0.01 && Math.abs(n.value) < 1000000
            );
            if (profitCandidates.length > 0) {
              // Usually the last or second-to-last value
              netProfit = profitCandidates[profitCandidates.length - 1]?.value || 0;
            }
          }

          // Extract balance - handle spaces as thousand separators
          if (columnMap.balance >= 0 && columnMap.balance < cellTexts.length) {
            const balanceText = cellTexts[columnMap.balance];
            // Remove spaces (thousand separators) and parse
            const cleaned = balanceText.replace(/\s/g, '').replace(/[^\d.,-]/g, '');
            const val = parseFloat(cleaned.replace(',', '.'));
            if (!isNaN(val) && val > 0) balance = val;
          }
          if (balance === 0 && numericValues.length > 0) {
            // Balance is usually the largest positive number (typically > 1000 for real accounts)
            const balanceCandidates = numericValues.filter(n => n.value > 1000);
            if (balanceCandidates.length > 0) {
              // Sort by value descending and take the largest
              balanceCandidates.sort((a, b) => b.value - a.value);
              balance = balanceCandidates[0]?.value || 0;
            }
          }

          // Extract commission and swap if available
          if (columnMap.commission >= 0 && columnMap.commission < cellTexts.length) {
            const val = parseFloat(cellTexts[columnMap.commission].replace(/[^\d.-]/g, '').replace(',', '.'));
            if (!isNaN(val)) commission = val;
          }

          if (columnMap.swap >= 0 && columnMap.swap < cellTexts.length) {
            const val = parseFloat(cellTexts[columnMap.swap].replace(/[^\d.-]/g, '').replace(',', '.'));
            if (!isNaN(val)) swap = val;
          }

          // Adjust net profit if commission/swap are separate
          if (commission !== 0 || swap !== 0) {
            netProfit = netProfit - commission - swap;
          }

          // Extract dates with improved parsing
          let closeTimeStr = '';
          let openTimeStr = '';
          
          if (columnMap.closeTime >= 0 && columnMap.closeTime < cellTexts.length) {
            closeTimeStr = cellTexts[columnMap.closeTime];
          } else {
            // Look for date patterns in any cell (prioritize later dates for close time)
            const datePatterns = cellTexts.filter(text => 
              /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{2}[\/\-]\d{2}|\d{2}[\/\-]\d{2}[\/\-]\d{4}/.test(text)
            );
            if (datePatterns.length > 0) {
              closeTimeStr = datePatterns[datePatterns.length - 1]; // Last date is usually close time
            }
          }

          if (columnMap.openTime >= 0 && columnMap.openTime < cellTexts.length) {
            openTimeStr = cellTexts[columnMap.openTime];
          }

          // Normalize direction
          let normalizedDirection = '';
          const dirLower = direction.toLowerCase();
          if (/buy|long/i.test(dirLower)) {
            normalizedDirection = 'Buy';
          } else if (/sell|short/i.test(dirLower)) {
            normalizedDirection = 'Sell';
          }

          // Validate trade data - relaxed validation to capture more trades
          const hasValidSymbol = symbol && symbol.length >= 3 && symbol.length <= 12;
          const hasValidDirection = normalizedDirection !== '';
          const hasValidProfit = !isNaN(netProfit);
          const hasValidVolume = volume > 0 || numericValues.length >= 3;

          if (hasValidSymbol && hasValidDirection && hasValidProfit) {
            // Parse close date with improved handling
            let closeDate;
            try {
              if (closeTimeStr) {
                // Try multiple date formats
                const dateFormats = [
                  // DD/MM/YYYY HH:MM:SS
                  /(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):?(\d{2})?/,
                  // DD/MM/YYYY
                  /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
                  // YYYY-MM-DD HH:MM:SS
                  /(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2}):?(\d{2})?/,
                  // YYYY-MM-DD
                  /(\d{4})-(\d{2})-(\d{2})/,
                  // DD-MM-YYYY
                  /(\d{1,2})-(\d{1,2})-(\d{4})/,
                ];

                let matched = false;
                for (const format of dateFormats) {
                  const match = closeTimeStr.match(format);
                  if (match) {
                    if (format === dateFormats[0] || format === dateFormats[2]) {
                      // Has time component
                      const [, d1, m1, y1, h, min, sec] = match;
                      closeDate = new Date(`${y1}-${m1.padStart(2, '0')}-${d1.padStart(2, '0')}T${h.padStart(2, '0')}:${min.padStart(2, '0')}:${(sec || '00').padStart(2, '0')}`);
                    } else {
                      // Date only
                      const [, d1, m1, y1] = match;
                      closeDate = new Date(`${y1}-${m1.padStart(2, '0')}-${d1.padStart(2, '0')}T00:00:00`);
                    }
                    matched = true;
                    break;
                  }
                }

                if (!matched) {
                  closeDate = new Date(closeTimeStr);
                }
              } else {
                closeDate = new Date(); // Fallback to current date
              }

              if (isNaN(closeDate.getTime())) {
                closeDate = new Date(); // Final fallback
              }
            } catch (e) {
              console.warn('Date parsing error:', e, closeTimeStr);
              closeDate = new Date();
            }

            // Parse open date if available
            let openDate = null;
            if (openTimeStr) {
              try {
                openDate = new Date(openTimeStr);
                if (isNaN(openDate.getTime())) {
                  openDate = null;
                }
              } catch (e) {
                openDate = null;
              }
            }

            // Clean symbol - keep only alphanumeric, preserve common separators
            const cleanedSymbol = symbol.replace(/[^a-zA-Z0-9\/]/g, '').toUpperCase();

            const tradeData = {
              symbol: cleanedSymbol,
              direction: normalizedDirection,
              close_time: closeDate.toISOString(),
              entry_price: entryPrice || 0,
              exit_price: exitPrice || 0,
              volume: volume || 0,
              net_profit: netProfit,
              balance: balance || 0,
              open_time: openDate ? openDate.toISOString() : null
            };

            console.log('Parsed trade:', tradeData);
            trades.push(tradeData);
          } else {
            console.log('Skipped row - validation failed:', {
              hasSymbol: hasValidSymbol,
              hasDirection: hasValidDirection,
              hasProfit: hasValidProfit,
              symbol,
              direction,
              netProfit
            });
          }
        } catch (e) {
          console.warn('Error parsing trade row:', e, cellTexts);
        }
      }
    }

    console.log('Total trades parsed:', trades.length);
    return trades;
  };

  const handleUpload = async () => {
    if (!file) return;

    // Rate limiting check
    const userId = 'anonymous'; // In a real app, use actual user ID
    if (!securityService.checkRateLimit('file_upload', userId, 5, 60000)) {
      setError('Too many upload attempts. Please wait before trying again.');
      return;
    }

    setLoading(true);
    setSecurityStatus('scanning');

    try {
      // Additional security validation before processing
      const validation = await securityService.validateFile(file);
      const text = validation.content;

      securityService.logSecurityEvent('file_processing_started', {
        fileName: file.name,
        fileSize: text.length
      });

      console.log('Processing file:', file.name, 'Size:', text.length);

      let trades = [];
      const fileName = file.name.toLowerCase();

      // Use flexible parser that works with any file format
      const fileType = fileName.endsWith('.html') || fileName.endsWith('.htm') ? 'html' : 'text';
      console.log('Parsing file with flexible parser, type:', fileType);
      trades = parseFlexible(text, fileType);

      console.log('Found trades:', trades);

      // Validate each trade for security
      const validTrades = [];
      const validationErrors = [];

      for (const trade of trades) {
        const validation = securityService.validateTradeData(trade);
        if (validation.valid) {
          // Sanitize trade data
          const sanitizedTrade = {
            ...trade,
            symbol: securityService.sanitizeInput(trade.symbol, 'text'),
            direction: trade.direction,
            volume: parseFloat(trade.volume) || 0,
            net_profit: parseFloat(trade.net_profit) || 0,
            balance: parseFloat(trade.balance) || 0
          };
          validTrades.push(sanitizedTrade);
        } else {
          validationErrors.push(...validation.errors);
        }
      }

      setParsedCount(validTrades.length);

      if (validTrades.length === 0) {
        const errorMsg = validationErrors.length > 0
          ? `Data validation failed: ${validationErrors.slice(0, 3).join(', ')}`
          : 'No valid trades found in file.';
        throw new Error(errorMsg);
      }

      if (validationErrors.length > 0) {
        console.warn('Some trades were filtered out due to validation errors:', validationErrors);
      }

      securityService.logSecurityEvent('trades_validated', {
        totalTrades: trades.length,
        validTrades: validTrades.length,
        filteredOut: validationErrors.length
      });

      // For local storage, use a mock user or create one if doesn't exist
      let user = await localDataService.getCurrentUser();
      if (!user) {
        user = {
          email: securityService.sanitizeInput('local@alphaedge.com', 'email'),
          full_name: securityService.sanitizeInput('Local Trader', 'text')
        };
        await localDataService.setCurrentUser(user);
      }

      // Get or Create Profile
      let profileId;
      const existingProfiles = await localDataService.entities.TraderProfile.filter({ created_by: user.email });

      if (existingProfiles.length > 0) {
        profileId = existingProfiles[0].id;
      } else {
        const sanitizedName = securityService.sanitizeInput(user.full_name || 'Trader', 'text');
        const newProfile = await localDataService.entities.TraderProfile.create({
           nickname: sanitizedName,
           broker: 'Imported',
           avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`,
           created_by: user.email,
           is_live_account: false // File import, not live account
        });
        profileId = newProfile.id;
      }

      // Clear existing trades for this profile (replace, don't append)
      await localDataService.entities.Trade.deleteByProfileId(profileId);

      // Add profile ID to validated trades
      const tradesWithId = validTrades.map(t => ({ ...t, trader_profile_id: profileId }));

      // Bulk Insert New Trades
      await localDataService.entities.Trade.bulkCreate(tradesWithId);

      // Calculate Metrics
      // Fetch all trades for this profile to ensure full history calculation
      const allTrades = await localDataService.entities.Trade.filter({ trader_profile_id: profileId });

      const metrics = calculateTradeMetrics(allTrades);

      if (metrics) {
        await localDataService.entities.TraderProfile.update(profileId, metrics);
      }

      // Log successful import
      securityService.logSecurityEvent('file_import_successful', {
        fileName: file.name,
        tradesImported: validTrades.length,
        profileId
      });

      // Navigate to dashboard with refresh parameter to force data reload
      navigate(createPageUrl(`Dashboard?refresh=${Date.now()}`));

    } catch (err) {
      console.error(err);
      securityService.logSecurityEvent('file_import_failed', {
        fileName: file.name,
        error: err.message
      });
      setError(err.message || "Failed to process file");
    } finally {
      setLoading(false);
      setSecurityStatus(null);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="text-center mb-6 sm:mb-10">
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-3">Import Trades</h1>
        <p className="text-gray-500 mb-2 text-sm sm:text-base">Upload your trading statement file to populate your dashboard.</p>
        <p className="text-xs sm:text-sm text-gray-400">Supports: HTML files from cTrader, MetaTrader, and most brokers • CSV files from various platforms</p>
      </div>

      <NeumorphicCard className="w-full max-w-md p-4 sm:p-8">
         <div className="flex flex-col items-center gap-6">
            <div className="w-full h-32 sm:h-40 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center bg-gray-50 hover:bg-white transition-colors cursor-pointer relative">
               <input
                  type="file"
                  accept=".html,.htm,.csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
               />
               <Upload className="text-gray-400 mb-2" size={32} />
               <p className="text-sm text-gray-500">{file ? file.name : "Click or drag HTML/CSV file here"}</p>
            </div>

            {securityStatus && (
               <div className={`flex items-center gap-2 text-sm p-3 rounded-lg w-full ${
                 securityStatus === 'validated' ? 'text-green-600 bg-green-50' :
                 securityStatus === 'failed' ? 'text-red-500 bg-red-50' :
                 'text-blue-600 bg-blue-50'
               }`}>
                  {securityStatus === 'validated' ? <ShieldCheck size={16} /> :
                   securityStatus === 'failed' ? <Shield size={16} /> :
                   <Shield size={16} />}
                  {securityStatus === 'validated' ? 'Security check passed' :
                   securityStatus === 'failed' ? 'Security check failed' :
                   'Scanning file...'}
               </div>
            )}

            {error && (
               <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-lg w-full">
                  <AlertCircle size={16} /> {error}
               </div>
            )}

            {parsedCount > 0 && (
               <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg w-full">
                  <CheckCircle size={16} /> Found {parsedCount} trades
               </div>
            )}

            <NeumorphicButton
               variant="action"
               className="w-full flex items-center justify-center"
               onClick={handleUpload}
               disabled={!file || loading}
            >
               {loading ? (
                  <span className="animate-pulse">Processing...</span>
               ) : (
                  <>
                     <FileText size={20} className="mr-2" />
                     Process Statement
                  </>
               )}
            </NeumorphicButton>
         </div>
      </NeumorphicCard>
      
      <div className="mt-8 max-w-md text-center">
         <p className="text-xs text-gray-400 mb-2">
           Supported formats: HTML statements from cTrader, MetaTrader, and most brokers • CSV files from various platforms
         </p>
         <p className="text-xs text-gray-400">
           Files should contain: Symbol, Direction (Buy/Sell), Entry/Exit Prices, Volume, Profit/Loss, Balance
         </p>
      </div>
    </div>
  );
}