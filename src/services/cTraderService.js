import protobuf from 'protobufjs';

let protoRoot = null;

// Load proto files (run once on init)
const loadProtos = async () => {
  if (protoRoot) return protoRoot;

  try {
    protoRoot = await protobuf.load([
      'src/proto/Common.proto',
      'src/proto/OpenApi.proto',
      'src/proto/OpenApiMessages.proto',
      'src/proto/OpenApiModelMessages.proto'
    ]);
    return protoRoot;
  } catch (error) {
    console.error('Failed to load cTrader proto files:', error);
    throw new Error('cTrader proto files not found. Please download the actual proto files from https://github.com/spotware/OpenAPI/tree/master/proto and place them in src/proto/');
  }
};

// Helper to send message over WS
const sendMessage = (ws, messageType, payload) => {
  const ProtoMessage = protoRoot.lookupType('ProtoMessage');
  const payloadType = protoRoot.lookupType(messageType).payloadType;
  const encodedPayload = protoRoot.lookupType(messageType).encode(payload).finish();
  const message = ProtoMessage.create({ payloadType, payload: encodedPayload });
  ws.send(ProtoMessage.encode(message).finish());
};

// Get tokens from localStorage (encrypted as per your securityService)
const getTokens = () => JSON.parse(localStorage.getItem('ctrader_tokens') || '{}');

// Refresh token if expired
const refreshToken = async () => {
  const tokens = getTokens();
  if (!tokens.refresh_token) throw new Error('No refresh token');
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: tokens.refresh_token,
    client_id: import.meta.env.VITE_CTRADER_CLIENT_ID,
    client_secret: import.meta.env.VITE_CTRADER_CLIENT_SECRET
  });
  const response = await fetch('https://openapi.ctrader.com/apps/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error_description);
  localStorage.setItem('ctrader_tokens', JSON.stringify(data));
  return data;
};

// Main function to fetch trades and analyze
const fetchAndAnalyzeTrades = async (isDemo = true) => {
  try {
    let tokens = getTokens();
    if (Date.now() > tokens.expires_at) { // Assume you store expires_at = Date.now() + expires_in * 1000
      tokens = await refreshToken();
    }
    const root = await loadProtos();
  const wsUrl = isDemo ? import.meta.env.VITE_CTRADER_WS_DEMO : import.meta.env.VITE_CTRADER_WS_LIVE;
  const ws = new WebSocket(wsUrl);

  return new Promise((resolve, reject) => {
    ws.onopen = () => {
      // App auth - use SHORT numeric Application ID (not full client key)
      const appPayload = {
        clientId: import.meta.env.VITE_CTRADER_APP_ID, // Short numeric ID like "19506"
        clientSecret: import.meta.env.VITE_CTRADER_CLIENT_SECRET
      };
      sendMessage(ws, 'ProtoOAApplicationAuthReq', appPayload);
    };

    ws.onmessage = async (event) => {
      const ProtoMessage = root.lookupType('ProtoMessage');
      const message = ProtoMessage.decode(new Uint8Array(await event.data.arrayBuffer()));
      const payloadType = message.payloadType;
      const payload = root.lookupTypeByPayloadType(payloadType).decode(message.payload);

      if (payloadType === root.lookupType('ProtoOAApplicationAuthRes').payloadType) {
        // App auth success, get account list
        const accountListPayload = { accessToken: tokens.access_token };
        sendMessage(ws, 'ProtoOAGetAccountListByAccessTokenReq', accountListPayload);
      } else if (payloadType === root.lookupType('ProtoOAGetAccountListByAccessTokenRes').payloadType) {
        // Assume first account
        const account = payload.ctidTraderAccount[0];
        const accountAuthPayload = { ctidTraderAccountId: account.ctidTraderAccountId, accessToken: tokens.access_token };
        sendMessage(ws, 'ProtoOAAccountAuthReq', accountAuthPayload);
        localStorage.setItem('ctrader_account_id', account.ctidTraderAccountId); // Store for later
      } else if (payloadType === root.lookupType('ProtoOAAccountAuthRes').payloadType) {
        // Account auth success, fetch historical deals
        const from = new Date().getTime() - 365 * 24 * 60 * 60 * 1000; // Last year
        const to = new Date().getTime();
        const dealsPayload = {
          ctidTraderAccountId: localStorage.getItem('ctrader_account_id'),
          fromTimestamp: from,
          toTimestamp: to
        };
        sendMessage(ws, 'ProtoOADealListReq', dealsPayload);
      } else if (payloadType === root.lookupType('ProtoOADealListRes').payloadType) {
        const deals = payload.deal;
        // Group deals by positionId to reconstruct trades
        const trades = {};
        deals.forEach(deal => {
          const posId = deal.positionId;
          if (!trades[posId]) trades[posId] = { open: null, close: null, symbol: deal.symbolId, volume: deal.volume };
          if (deal.dealStatus === 'FILLED') {
            if (!trades[posId].open) {
              trades[posId].open = { time: deal.createTimestamp, price: deal.executedPrice, side: deal.tradeSide };
            } else {
              trades[posId].close = { time: deal.closeTimestamp, price: deal.executedPrice };
              trades[posId].profit = deal.profit; // Adjust as needed
            }
          }
        });
        // Filter complete trades
        const completeTrades = Object.values(trades).filter(t => t.close);

        // Convert to format expected by calculateMetricsFromData
        const formattedTrades = completeTrades.map(trade => ({
          time: new Date(trade.close.time).toISOString(),
          symbol: trade.symbol,
          type: trade.open.side === 'BUY' ? 'buy' : 'sell',
          volume: trade.volume,
          open_price: trade.open.price,
          close_price: trade.close.price,
          profit_loss: trade.profit,
          commission: 0,
          swap: 0,
          net_profit: trade.profit,
          balance: 10000 // Placeholder, will be calculated
        }));

        // Return formatted trades - they will be processed by existing calculateMetricsFromData
        resolve(formattedTrades);
        ws.close();
      }
    };

    ws.onerror = reject;
    ws.onclose = () => console.log('WS closed');
  });
  } catch (error) {
    console.error('cTrader integration error:', error);
    throw new Error('cTrader is not properly configured. Please ensure proto files are downloaded and try again.');
  }
};

export { fetchAndAnalyzeTrades, refreshToken };
