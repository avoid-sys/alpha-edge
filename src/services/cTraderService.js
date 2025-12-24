import protobuf from 'protobufjs';

let protoRoot = null;

// Load proto files (run once on init)
const loadProtos = async () => {
  if (protoRoot) return protoRoot;

  try {
    // Load proto files - in production these need to be available
    // For now, we'll create the root manually with our definitions
    protoRoot = new protobuf.Root();

    // Add basic message types that we need
    protoRoot.define("ProtoOA").add(new protobuf.Type("ProtoMessage")
      .add(new protobuf.Field("payloadType", 1, "uint32"))
      .add(new protobuf.Field("payload", 2, "bytes")));

    protoRoot.define("ProtoOA").add(new protobuf.Type("ProtoOAApplicationAuthReq")
      .add(new protobuf.Field("clientId", 1, "string"))
      .add(new protobuf.Field("clientSecret", 2, "string")));

    protoRoot.define("ProtoOA").add(new protobuf.Type("ProtoOAApplicationAuthRes")
      .add(new protobuf.Field("result", 1, "bool")));

    // Add other message types as needed
    protoRoot.define("ProtoOA").add(new protobuf.Type("ProtoOAGetAccountListByAccessTokenReq")
      .add(new protobuf.Field("accessToken", 1, "string")));

    protoRoot.define("ProtoOA").add(new protobuf.Type("ProtoOAGetAccountListByAccessTokenRes")
      .add(new protobuf.Field("ctidTraderAccount", 1, "ProtoOATraderAccount", "repeated")));

    protoRoot.define("ProtoOA").add(new protobuf.Type("ProtoOATraderAccount")
      .add(new protobuf.Field("ctidTraderAccountId", 1, "uint64"))
      .add(new protobuf.Field("accountId", 2, "string")));

    protoRoot.define("ProtoOA").add(new protobuf.Type("ProtoOAAccountAuthReq")
      .add(new protobuf.Field("ctidTraderAccountId", 1, "uint64"))
      .add(new protobuf.Field("accessToken", 2, "string")));

    protoRoot.define("ProtoOA").add(new protobuf.Type("ProtoOAAccountAuthRes")
      .add(new protobuf.Field("result", 1, "bool")));

    protoRoot.define("ProtoOA").add(new protobuf.Type("ProtoOADealListReq")
      .add(new protobuf.Field("ctidTraderAccountId", 1, "uint64"))
      .add(new protobuf.Field("fromTimestamp", 2, "int64"))
      .add(new protobuf.Field("toTimestamp", 3, "int64")));

    protoRoot.define("ProtoOA").add(new protobuf.Type("ProtoOADealListRes")
      .add(new protobuf.Field("deal", 1, "ProtoOADeal", "repeated")));

    protoRoot.define("ProtoOA").add(new protobuf.Type("ProtoOADeal")
      .add(new protobuf.Field("dealId", 1, "uint64"))
      .add(new protobuf.Field("positionId", 2, "uint64"))
      .add(new protobuf.Field("volume", 3, "uint64"))
      .add(new protobuf.Field("symbolId", 4, "string"))
      .add(new protobuf.Field("executedPrice", 5, "double"))
      .add(new protobuf.Field("profit", 6, "double"))
      .add(new protobuf.Field("dealStatus", 7, "string"))
      .add(new protobuf.Field("tradeSide", 8, "string"))
      .add(new protobuf.Field("createTimestamp", 9, "int64"))
      .add(new protobuf.Field("closeTimestamp", 10, "int64")));

    // Set up payload type mappings
    protoRoot.lookupType("ProtoOA.ProtoOAApplicationAuthReq").payloadType = 2100;
    protoRoot.lookupType("ProtoOA.ProtoOAApplicationAuthRes").payloadType = 2101;
    protoRoot.lookupType("ProtoOA.ProtoOAGetAccountListByAccessTokenReq").payloadType = 2149;
    protoRoot.lookupType("ProtoOA.ProtoOAGetAccountListByAccessTokenRes").payloadType = 2150;
    protoRoot.lookupType("ProtoOA.ProtoOAAccountAuthReq").payloadType = 2103;
    protoRoot.lookupType("ProtoOA.ProtoOAAccountAuthRes").payloadType = 2104;
    protoRoot.lookupType("ProtoOA.ProtoOADealListReq").payloadType = 2124;
    protoRoot.lookupType("ProtoOA.ProtoOADealListRes").payloadType = 2125;
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
    // Note: Implicit flow tokens don't have refresh_token, so we can't auto-refresh
    // If token is expired, user needs to re-authenticate manually
    if (Date.now() > tokens.expires_at) {
      throw new Error('Access token expired. Please reconnect to cTrader.');
    }
    const root = await loadProtos();
  const wsUrl = isDemo ? import.meta.env.VITE_CTRADER_WS_DEMO : import.meta.env.VITE_CTRADER_WS_LIVE;
  const ws = new WebSocket(wsUrl);

  return new Promise((resolve, reject) => {
    ws.onopen = () => {
      // App auth - use FULL public client key (not short numeric ID)
      const appPayload = {
        clientId: import.meta.env.VITE_CTRADER_FULL_CLIENT_ID || '19506_ZNLG80oi7Bj6mt9wi4g9KYgRh3OcEbHele1YzBfeOFvKL0A0nF', // Full public key string
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
