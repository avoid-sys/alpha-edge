import React, { useState } from 'react';
import { localDataService } from '@/services/localDataService';
import { securityService } from '@/services/securityService';
import { NeumorphicCard, NeumorphicButton } from '@/components/NeumorphicUI';
import { Upload, FileText, CheckCircle, AlertCircle, Shield, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { calculateTradeMetrics } from '@/components/TradeLogic';

// ELO scoring functions (copied from Dashboard.jsx)
const normalizeScore = (value, minThresh, excellentThresh, isPositive = true, capValue = null) => {
  if (value === null || value === undefined || isNaN(value)) return 50.0; // Neutral for missing data

  if (capValue !== null) {
    if (isPositive) {
      value = Math.min(value, capValue); // Cap maximum values
    } else {
      value = Math.max(value, capValue); // Cap minimum values for negative metrics
    }
  }

  const range = excellentThresh - minThresh;
  let score;

  if (isPositive) {
    // Higher values = better score
    if (value <= minThresh) return 0.0;
    if (value >= excellentThresh) return 100.0;
    score = ((value - minThresh) / range) * 100;
  } else {
    // Lower values = better score
    if (value <= excellentThresh) return 100.0;
    if (value >= minThresh) return 0.0;
    score = 100 - ((value - excellentThresh) / range) * 100;
  }

  return Math.max(0, Math.min(100, score));
};

const calculateELOScores = (metrics, trades = null) => {
  if (!metrics || !metrics.total_trades || metrics.total_trades === 0) {
    return {
      performance_score: 0,
      risk_score: 0,
      consistency_score: 0,
      account_health_score: 0,
      elo_score: 1000
    };
  }

  // Get account context for scaling and dynamic benchmarks
  const startEquity = 10000; // Default, should come from profile or trades
  const durationDays = metrics.accountAge || 30; // Use account age as proxy for duration
  const totalTrades = metrics.total_trades;

  // Scale dollar metrics to percentages relative to start equity
  const expectancyPct = metrics.expectancy ? (metrics.expectancy / startEquity) * 100 : 0;
  const bestTradePct = metrics.bestTrade ? (metrics.bestTrade / startEquity) * 100 : 0;
  const worstTradePct = metrics.worstTrade ? Math.abs(metrics.worstTrade / startEquity) * 100 : 0;

  // PERFORMANCE SCORE (0-100)
  const perfSubs = {
    totalReturn: normalizeScore(metrics.totalReturn, 0, 50, true),
    annReturn: normalizeScore(metrics.annualizedReturn, 10, 100, true, 500),
    winRate: normalizeScore(metrics.winRate, 50, 80, true),
    profitFactor: normalizeScore(metrics.profitFactor, 1.0, 3.0, true, 10),
    expectancy: normalizeScore(expectancyPct, 0, 0.5, true),
    bestTrade: normalizeScore(bestTradePct, 0, 5, true, 10)
  };
  const perfWeights = [0.15, 0.25, 0.20, 0.20, 0.10, 0.10];
  let performanceScore = perfWeights.reduce((sum, weight, i) =>
    sum + Object.values(perfSubs)[i] * weight, 0);

  // Penalize insufficient data
  if (totalTrades < 10) {
    performanceScore = Math.min(performanceScore, 70);
  }

  // RISK CONTROL SCORE (0-100)
  const riskSubs = {
    maxDrawdown: normalizeScore(metrics.maxDrawdown, 30, 5, false),
    avgDrawdown: normalizeScore(metrics.avgDrawdown || 0, 10, 1, false),
    recoveryFactor: normalizeScore(metrics.recoveryFactor, 1, 10, true),
    volatility: normalizeScore(metrics.volatility, 50, 20, false),
    sharpeRatio: normalizeScore(metrics.sharpeRatio, 0.5, 2.0, true, 5),
    avgRiskTrade: normalizeScore(metrics.avgRiskTrade, 5, 1, false)
  };

  const riskWeights = [0.25, 0.15, 0.15, 0.15, 0.20, 0.10];
  const riskScore = riskWeights.reduce((sum, weight, i) =>
    sum + Object.values(riskSubs)[i] * weight, 0);

  // CONSISTENCY SCORE (0-100)
  const totalMonths = Math.max(1, Math.ceil(durationDays / 30));

  const consistencySubs = {
    roughness: normalizeScore(metrics.roughness, 5, 0.5, false),
    positiveMonths: normalizeScore(metrics.positiveMonths, 3, 6, true),
    freqStd: normalizeScore(metrics.freqStd, 2.0, 0.5, false),
    sortinoRatio: normalizeScore(metrics.sortinoRatio, 1.0, 4.0, true, 10),
    calmarRatio: normalizeScore(metrics.calmarRatio, 1.0, 5.0, true),
    sqn: normalizeScore(metrics.sqn, 1.6, 3.0, true, 5)
  };
  const consistencyWeights = [0.10, 0.15, 0.10, 0.20, 0.20, 0.25];
  let consistencyScore = consistencyWeights.reduce((sum, weight, i) =>
    sum + Object.values(consistencySubs)[i] * weight, 0);

  // Penalize insufficient data
  if (totalTrades < 50) {
    consistencyScore *= Math.min(1, totalTrades / 50);
  }

  // ACCOUNT HEALTH SCORE (0-100)
  const currentDate = new Date();
  const firstTradeDate = new Date(Math.min(...allTrades.map(t => new Date(t.close_time || t.time))));
  const actualAccountAge = Math.max(1, Math.ceil((currentDate - firstTradeDate) / (1000 * 60 * 60 * 24)));

  const exposureTime = metrics.exposureTime || 50;
  const activityRate = Math.min(metrics.activityRate || 0, 100);

  const healthSubs = {
    accountAge: normalizeScore(actualAccountAge, 90, 365, true),
    tradingDays: normalizeScore(metrics.tradingDays, 20, 100, true),
    activityRate: normalizeScore(activityRate, 10, 50, true),
    exposureTime: normalizeScore(exposureTime, 100, 50, false),
    totalTrades: normalizeScore(totalTrades, 30, 200, true),
    worstTrade: normalizeScore(worstTradePct, 10, 1, false)
  };

  const healthWeights = [0.20, 0.15, 0.15, 0.15, 0.20, 0.10];
  const accountHealthScore = healthWeights.reduce((sum, weight, i) =>
    sum + Object.values(healthSubs)[i] * weight, 0);

  // TRADER ELO CALCULATION
  let eloScore = 1000 + (performanceScore * 4 + riskScore * 3 + consistencyScore * 2 + accountHealthScore * 1) * 3;

  return {
    performance_score: Math.round(Math.max(0, Math.min(100, performanceScore))),
    risk_score: Math.round(Math.max(0, Math.min(100, riskScore))),
    consistency_score: Math.round(Math.max(0, Math.min(100, consistencyScore))),
    account_health_score: Math.round(Math.max(0, Math.min(100, accountHealthScore))),
    elo_score: Math.round(Math.max(1000, Math.min(4000, eloScore)))
  };
};

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

  const parseCSV = (csvContent) => {
    const lines = csvContent.split(/\r?\n/).filter(line => line.trim());
    const trades = [];

    if (lines.length < 2) return trades; // Need at least header + 1 data row

    // Try to detect delimiter with better detection
    const firstLine = lines[0];
    let delimiter = ',';
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;
    const tabCount = (firstLine.match(/\t/g) || []).length;
    
    if (semicolonCount > commaCount && semicolonCount > tabCount) {
      delimiter = ';';
    } else if (tabCount > commaCount && tabCount > semicolonCount) {
      delimiter = '\t';
    }

    // Find header row (might not be first row)
    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const testHeaders = lines[i].split(delimiter).map(h => h.trim().toLowerCase());
      const headerKeywords = testHeaders.filter(h => 
        /symbol|instrument|pair|direction|side|type|price|profit|balance|volume|quantity|lots|time|date/.test(h)
      );
      if (headerKeywords.length >= 3) {
        headerRowIndex = i;
        break;
      }
    }

    const headers = lines[headerRowIndex].split(delimiter).map(h => h.trim().toLowerCase());

    console.log('CSV headers detected:', headers, 'at row', headerRowIndex);

    // Enhanced column mapping
    const columnMap = {
      symbol: headers.findIndex(h => 
        h.includes('symbol') || h.includes('instrument') || h.includes('pair') ||
        h.includes('currency') || h.includes('asset')
      ),
      direction: headers.findIndex(h => 
        h.includes('direction') || h.includes('side') || h.includes('type') ||
        h.includes('action') || h === 'buy' || h === 'sell'
      ),
      entryPrice: headers.findIndex(h => 
        (h.includes('entry') || h.includes('open')) && (h.includes('price') || h.includes('rate'))
      ),
      exitPrice: headers.findIndex(h => 
        (h.includes('exit') || h.includes('close')) && (h.includes('price') || h.includes('rate'))
      ),
      volume: headers.findIndex(h => 
        h.includes('volume') || h.includes('quantity') || h.includes('lots') ||
        h.includes('size') || h.includes('amount')
      ),
      profit: headers.findIndex(h => 
        (h.includes('profit') || h.includes('pl') || h.includes('p/l')) &&
        !h.includes('gross') && !h.includes('commission')
      ),
      commission: headers.findIndex(h => 
        h.includes('commission') || h.includes('fee') || h.includes('charges')
      ),
      swap: headers.findIndex(h => 
        h.includes('swap') || h.includes('interest') || h.includes('rollover')
      ),
      balance: headers.findIndex(h => 
        h.includes('balance') || h.includes('equity') || h.includes('account')
      ),
      openTime: headers.findIndex(h => 
        (h.includes('open') || h.includes('entry')) && (h.includes('time') || h.includes('date'))
      ),
      closeTime: headers.findIndex(h => 
        (h.includes('close') || h.includes('exit') || h.includes('time') || h.includes('date')) &&
        !h.includes('open') && !h.includes('entry')
      )
    };

    // Process data rows (start after header row)
    for (let i = headerRowIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines
      
      // Handle quoted fields properly
      const cells = [];
      let currentCell = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if ((char === delimiter && !inQuotes) || j === line.length - 1) {
          cells.push(currentCell.trim().replace(/^"|"$/g, ''));
          currentCell = '';
        } else {
          currentCell += char;
        }
      }
      if (currentCell) cells.push(currentCell.trim().replace(/^"|"$/g, ''));
      
      if (cells.length < 3) continue; // Need at least some data
      
      // Skip header-like rows or totals
      const rowText = cells.join(' ').toLowerCase();
      if (rowText.includes('total') || rowText.includes('sum') || 
          rowText.includes('subtotal') || /^[\s,;]*$/.test(rowText)) continue;

      try {
        // Extract symbol
        let symbol = '';
        if (columnMap.symbol >= 0 && columnMap.symbol < cells.length) {
          symbol = cells[columnMap.symbol];
        } else {
          symbol = cells.find(cell => {
            const cleaned = cell.replace(/[^a-zA-Z0-9]/g, '');
            return cleaned.length >= 3 && cleaned.length <= 12;
          }) || '';
        }

        // Extract direction
        let direction = '';
        if (columnMap.direction >= 0 && columnMap.direction < cells.length) {
          direction = cells[columnMap.direction];
        } else {
          direction = cells.find(cell => /buy|sell|long|short/i.test(cell)) || '';
        }

        // Extract numeric values with better parsing
        const parseNumeric = (cell) => {
          if (!cell) return null;
          // Remove spaces (thousand separators) and parse
          const isNegative = cell.includes('(') || cell.trim().startsWith('-');
          let cleaned = cell.replace(/\s/g, '').replace(/[()]/g, '').replace(/[^\d.,-]/g, '');
          if (cleaned.startsWith('-')) cleaned = cleaned.substring(1);
          const num = parseFloat(cleaned.replace(',', '.'));
          if (isNaN(num)) return null;
          return isNegative ? -num : num;
        };

        const entryPrice = columnMap.entryPrice >= 0 && columnMap.entryPrice < cells.length
          ? (parseNumeric(cells[columnMap.entryPrice]) || 0) : 0;

        const exitPrice = columnMap.exitPrice >= 0 && columnMap.exitPrice < cells.length
          ? (parseNumeric(cells[columnMap.exitPrice]) || 0) : 0;

        const volume = columnMap.volume >= 0 && columnMap.volume < cells.length
          ? (parseNumeric(cells[columnMap.volume]) || 0) : 0;

        let netProfit = columnMap.profit >= 0 && columnMap.profit < cells.length
          ? (parseNumeric(cells[columnMap.profit]) || 0) : 0;

        const commission = columnMap.commission >= 0 && columnMap.commission < cells.length
          ? (parseNumeric(cells[columnMap.commission]) || 0) : 0;

        const swap = columnMap.swap >= 0 && columnMap.swap < cells.length
          ? (parseNumeric(cells[columnMap.swap]) || 0) : 0;

        // Adjust net profit if commission/swap are separate
        if (commission !== 0 || swap !== 0) {
          netProfit = netProfit - commission - swap;
        }

        const balance = columnMap.balance >= 0 && columnMap.balance < cells.length
          ? (parseNumeric(cells[columnMap.balance]) || 0) : 0;

        const closeTimeStr = columnMap.closeTime >= 0 && columnMap.closeTime < cells.length
          ? cells[columnMap.closeTime] : '';

        const openTimeStr = columnMap.openTime >= 0 && columnMap.openTime < cells.length
          ? cells[columnMap.openTime] : '';

        // Normalize direction
        let normalizedDirection = '';
        const dirLower = direction.toLowerCase();
        if (/buy|long/i.test(dirLower)) {
          normalizedDirection = 'Buy';
        } else if (/sell|short/i.test(dirLower)) {
          normalizedDirection = 'Sell';
        }

        // Validate trade data
        const hasValidSymbol = symbol && symbol.replace(/[^a-zA-Z0-9]/g, '').length >= 3;
        const hasValidDirection = normalizedDirection !== '';
        const hasValidProfit = !isNaN(netProfit);

        if (hasValidSymbol && hasValidDirection && hasValidProfit) {
          // Parse dates with improved handling
          let closeDate;
          try {
            if (closeTimeStr) {
              // Try multiple date formats (same as HTML parser)
              const dateFormats = [
                /(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):?(\d{2})?/,
                /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
                /(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2}):?(\d{2})?/,
                /(\d{4})-(\d{2})-(\d{2})/,
                /(\d{1,2})-(\d{1,2})-(\d{4})/,
              ];

              let matched = false;
              for (const format of dateFormats) {
                const match = closeTimeStr.match(format);
                if (match) {
                  if (format === dateFormats[0] || format === dateFormats[2]) {
                        const [, d1, m1, y1, h, min, sec] = match;
                        closeDate = new Date(`${y1}-${m1.padStart(2, '0')}-${d1.padStart(2, '0')}T${h.padStart(2, '0')}:${min.padStart(2, '0')}:${(sec || '00').padStart(2, '0')}`);
                      } else {
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
              closeDate = new Date();
            }

            if (isNaN(closeDate.getTime())) {
              closeDate = new Date();
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

          console.log('Parsed CSV trade:', tradeData);
          trades.push(tradeData);
        }
      } catch (e) {
        console.warn('Error parsing CSV row:', e, cells);
      }
    }

    return trades;
  };

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

      if (fileName.endsWith('.csv')) {
        console.log('Parsing as CSV file');
        trades = parseCSV(text);
      } else {
        console.log('Parsing as HTML file');
        trades = parseHTML(text);
      }

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
        console.log('📝 Created local user for file import:', user.email);
      } else {
        console.log('👤 Using existing local user:', user.email);
      }

      // Get or Create Profile
      let profileId;
      const existingProfiles = await localDataService.entities.TraderProfile.filter({ created_by: user.email });
      console.log('🔍 Looking for profiles created by:', user.email, 'found:', existingProfiles.length);

      if (existingProfiles.length > 0) {
        profileId = existingProfiles[0].id;
        console.log('📂 Using existing profile:', profileId);
      } else {
        const sanitizedName = securityService.sanitizeInput(user.full_name || 'Trader', 'text');
        // Determine trading type based on active mode
        const activeTradingMode = localStorage.getItem('active_trading_mode') || 'forex';
        const tradingType = activeTradingMode === 'crypto' ? 'Crypto' : 'Forex';

        const newProfile = await localDataService.entities.TraderProfile.create({
           nickname: sanitizedName,
           broker: 'Imported',
           trading_type: tradingType,
           avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`,
           created_by: user.email,
           is_live_account: false // File import, not live account
        });
        profileId = newProfile.id;
        console.log('🆕 Created new profile:', profileId, 'for user:', user.email);
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
        // Calculate ELO scores for leaderboard ranking
        const eloScores = calculateELOScores(metrics, allTrades);

        // Update profile with both metrics and ELO scores
        await localDataService.entities.TraderProfile.update(profileId, {
          ...metrics,
          ...eloScores,
          trader_score: eloScores.elo_score // For leaderboard sorting
        });
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