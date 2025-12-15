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

  const parseCSV = (csvContent) => {
    const lines = csvContent.split('\n').filter(line => line.trim());
    const trades = [];

    if (lines.length < 2) return trades; // Need at least header + 1 data row

    // Try to detect delimiter
    const firstLine = lines[0];
    let delimiter = ',';
    if (firstLine.split(';').length > firstLine.split(',').length) {
      delimiter = ';';
    } else if (firstLine.split('\t').length > firstLine.split(',').length) {
      delimiter = '\t';
    }

    const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase());

    console.log('CSV headers detected:', headers);

    // Map columns
    const columnMap = {
      symbol: headers.findIndex(h => h.includes('symbol') || h.includes('instrument') || h.includes('pair')),
      direction: headers.findIndex(h => h.includes('direction') || h.includes('side') || h.includes('type') || h.includes('buy') || h.includes('sell')),
      entryPrice: headers.findIndex(h => h.includes('entry') && h.includes('price')),
      exitPrice: headers.findIndex(h => (h.includes('exit') || h.includes('close')) && h.includes('price')),
      volume: headers.findIndex(h => h.includes('volume') || h.includes('quantity') || h.includes('lots')),
      profit: headers.findIndex(h => h.includes('profit') || h.includes('p/l')),
      balance: headers.findIndex(h => h.includes('balance') || h.includes('equity')),
      openTime: headers.findIndex(h => h.includes('open') && (h.includes('time') || h.includes('date'))),
      closeTime: headers.findIndex(h => h.includes('close') && (h.includes('time') || h.includes('date')))
    };

    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split(delimiter).map(cell => cell.trim());
      if (cells.length < headers.length) continue;

      try {
        const symbol = columnMap.symbol >= 0 ? cells[columnMap.symbol] :
                      cells.find(cell => cell && !/\d/.test(cell) && cell.length <= 10) || '';

        const direction = columnMap.direction >= 0 ? cells[columnMap.direction] :
                         cells.find(cell => /buy|sell/i.test(cell)) || '';

        // Extract numeric values
        const entryPrice = columnMap.entryPrice >= 0 ? parseFloat(cells[columnMap.entryPrice]?.replace(/[^0-9.-]/g, '')) || 0 :
                          parseFloat(cells.find(cell => cell && /^\d+\.?\d*$/.test(cell.replace(/[^0-9.-]/g, '')))) || 0;

        const exitPrice = columnMap.exitPrice >= 0 ? parseFloat(cells[columnMap.exitPrice]?.replace(/[^0-9.-]/g, '')) || 0 :
                         parseFloat(cells.filter(cell => cell && /^\d+\.?\d*$/.test(cell.replace(/[^0-9.-]/g, '')))[1]) || 0;

        const volume = columnMap.volume >= 0 ? parseFloat(cells[columnMap.volume]?.replace(/[^0-9.-]/g, '')) || 0 :
                      parseFloat(cells.filter(cell => cell && /^\d+\.?\d*$/.test(cell.replace(/[^0-9.-]/g, '')))[2]) || 0;

        const netProfit = columnMap.profit >= 0 ? parseFloat(cells[columnMap.profit]?.replace(/[^0-9.-]/g, '')) || 0 :
                         parseFloat(cells.reverse().find(cell => cell && /[-]?\d+\.?\d*$/.test(cell.replace(/[^0-9.-]/g, '')))) || 0;

        const balance = columnMap.balance >= 0 ? parseFloat(cells[columnMap.balance]?.replace(/[^0-9.-]/g, '')) || 0 :
                       parseFloat(cells.slice().reverse().find(cell => cell && /[-]?\d+\.?\d*$/.test(cell.replace(/[^0-9.-]/g, '')))) || 0;

        const closeTimeStr = columnMap.closeTime >= 0 ? cells[columnMap.closeTime] :
                             cells.find(cell => /\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/.test(cell)) || '';

        // Normalize direction
        let normalizedDirection = '';
        if (/buy/i.test(direction)) {
          normalizedDirection = 'Buy';
        } else if (/sell/i.test(direction)) {
          normalizedDirection = 'Sell';
        }

        if (symbol && normalizedDirection && !isNaN(netProfit)) {
          let closeDate;
          try {
            if (closeTimeStr.includes('/')) {
              const [datePart, timePart] = closeTimeStr.split(' ');
              const [day, month, year] = datePart.split('/');
              closeDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timePart || '00:00:00'}`);
            } else if (closeTimeStr.includes('-')) {
              closeDate = new Date(closeTimeStr);
            } else {
              closeDate = new Date();
            }

            if (isNaN(closeDate.getTime())) {
              closeDate = new Date();
            }
          } catch (e) {
            closeDate = new Date();
          }

          const tradeData = {
            symbol: symbol.replace(/[^a-zA-Z0-9]/g, ''),
            direction: normalizedDirection,
            close_time: closeDate.toISOString(),
            entry_price: entryPrice,
            exit_price: exitPrice,
            volume: volume,
            net_profit: netProfit,
            balance: balance || 0,
            open_time: null
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
    const tables = Array.from(doc.querySelectorAll('table'));
    const trades = [];

    console.log('Found', tables.length, 'tables in HTML');

    // Try to find trade data in each table
    for (const table of tables) {
      const rows = Array.from(table.querySelectorAll('tr'));
      console.log('Processing table with', rows.length, 'rows');

      // Skip tables with too few rows (likely not trade tables)
      if (rows.length < 3) continue;

      // Look for header row to identify column structure
      let headerRow = rows[0];
      let dataStartIndex = 1;

      // Sometimes headers are in the second row
      if (rows.length > 1) {
        const firstRowText = headerRow.innerText.toLowerCase();
        const secondRowText = rows[1].innerText.toLowerCase();

        // If first row looks like data and second looks like headers, swap them
        if (firstRowText.match(/\d/) && secondRowText.match(/symbol|direction|price|profit/i)) {
          headerRow = rows[1];
          dataStartIndex = 2;
        }
      }

      // Analyze header to understand column structure
      const headerCells = Array.from(headerRow.querySelectorAll('th, td'));
      const headers = headerCells.map(cell => (cell.innerText || '').trim().toLowerCase());

      console.log('Detected headers:', headers);

      // Map column indices based on headers
      const columnMap = {
        symbol: headers.findIndex(h => h.includes('symbol') || h.includes('instrument') || h.includes('pair')),
        direction: headers.findIndex(h => h.includes('direction') || h.includes('side') || h.includes('type')),
        entryPrice: headers.findIndex(h => h.includes('entry') && h.includes('price')),
        exitPrice: headers.findIndex(h => h.includes('exit') && h.includes('price') || h.includes('close') && h.includes('price')),
        volume: headers.findIndex(h => h.includes('volume') || h.includes('quantity') || h.includes('lots')),
        profit: headers.findIndex(h => h.includes('profit') && !h.includes('gross')),
        balance: headers.findIndex(h => h.includes('balance') || h.includes('equity')),
        openTime: headers.findIndex(h => h.includes('open') && (h.includes('time') || h.includes('date'))),
        closeTime: headers.findIndex(h => h.includes('close') && (h.includes('time') || h.includes('date')))
      };

      console.log('Column mapping:', columnMap);

      // Process data rows
      for (let i = dataStartIndex; i < rows.length; i++) {
        const row = rows[i];
        const cells = Array.from(row.querySelectorAll('td'));
        const cellTexts = cells.map(cell => (cell.innerText || '').trim());

        // Skip rows that don't have enough cells or are headers/totals
        if (cells.length < 5) continue;
        if (cellTexts.some(text => text.toLowerCase().includes('total') || text.toLowerCase().includes('sum'))) continue;

        try {
          // Extract data using column mapping or fallback to pattern recognition
          const symbol = columnMap.symbol >= 0 ? cellTexts[columnMap.symbol] :
                        cellTexts.find(text => text && !/\d/.test(text) && text.length <= 10) || '';

          const direction = columnMap.direction >= 0 ? cellTexts[columnMap.direction] :
                           cellTexts.find(text => /buy|sell/i.test(text)) || '';

          // Extract numeric values from all cells
          const numericValues = cellTexts.map(text => {
            const cleaned = text.replace(/[^0-9.-]/g, '');
            return parseFloat(cleaned);
          }).filter(num => !isNaN(num));

          // Smart assignment based on available data
          let entryPrice = 0, exitPrice = 0, volume = 0, netProfit = 0, balance = 0;

          if (columnMap.entryPrice >= 0 && !isNaN(parseFloat(cellTexts[columnMap.entryPrice]?.replace(/[^0-9.-]/g, '')))) {
            entryPrice = parseFloat(cellTexts[columnMap.entryPrice].replace(/[^0-9.-]/g, ''));
          } else if (numericValues.length >= 1) {
            entryPrice = numericValues[0];
          }

          if (columnMap.exitPrice >= 0 && !isNaN(parseFloat(cellTexts[columnMap.exitPrice]?.replace(/[^0-9.-]/g, '')))) {
            exitPrice = parseFloat(cellTexts[columnMap.exitPrice].replace(/[^0-9.-]/g, ''));
          } else if (numericValues.length >= 2) {
            exitPrice = numericValues[1];
          }

          if (columnMap.volume >= 0 && !isNaN(parseFloat(cellTexts[columnMap.volume]?.replace(/[^0-9.-]/g, '')))) {
            volume = parseFloat(cellTexts[columnMap.volume].replace(/[^0-9.-]/g, ''));
          } else if (numericValues.length >= 3) {
            volume = numericValues[2];
          }

          if (columnMap.profit >= 0 && !isNaN(parseFloat(cellTexts[columnMap.profit]?.replace(/[^0-9.-]/g, '')))) {
            netProfit = parseFloat(cellTexts[columnMap.profit].replace(/[^0-9.-]/g, ''));
          } else if (numericValues.length >= 4) {
            netProfit = numericValues[numericValues.length - 2]; // Usually second to last
          }

          if (columnMap.balance >= 0 && !isNaN(parseFloat(cellTexts[columnMap.balance]?.replace(/[^0-9.-]/g, '')))) {
            balance = parseFloat(cellTexts[columnMap.balance].replace(/[^0-9.-]/g, ''));
          } else if (numericValues.length >= 5) {
            balance = numericValues[numericValues.length - 1]; // Usually last
          }

          // Extract dates
          let closeTimeStr = '';
          if (columnMap.closeTime >= 0) {
            closeTimeStr = cellTexts[columnMap.closeTime];
          } else {
            // Look for date patterns in any cell
            closeTimeStr = cellTexts.find(text => /\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/.test(text)) || '';
          }

          // Normalize direction
          let normalizedDirection = '';
          if (/buy/i.test(direction)) {
            normalizedDirection = 'Buy';
          } else if (/sell/i.test(direction)) {
            normalizedDirection = 'Sell';
          }

          // Validate trade data
          if (symbol && normalizedDirection && !isNaN(netProfit) && entryPrice > 0 && volume > 0) {
            // Parse date
            let closeDate;
            try {
              if (closeTimeStr.includes('/')) {
                // DD/MM/YYYY format
                const [datePart, timePart] = closeTimeStr.split(' ');
                const [day, month, year] = datePart.split('/');
                closeDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timePart || '00:00:00'}`);
              } else if (closeTimeStr.includes('-')) {
                // YYYY-MM-DD format
                closeDate = new Date(closeTimeStr);
              } else if (closeTimeStr) {
                closeDate = new Date(closeTimeStr);
              } else {
                closeDate = new Date(); // Fallback to current date
              }

              if (isNaN(closeDate.getTime())) {
                closeDate = new Date(); // Final fallback
              }
            } catch (e) {
              closeDate = new Date();
            }

            const tradeData = {
              symbol: symbol.replace(/[^a-zA-Z0-9]/g, ''), // Clean symbol
              direction: normalizedDirection,
              close_time: closeDate.toISOString(),
              entry_price: entryPrice,
              exit_price: exitPrice,
              volume: volume,
              net_profit: netProfit,
              balance: balance || 0,
              open_time: null
            };

            console.log('Parsed trade:', tradeData);
            trades.push(tradeData);
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