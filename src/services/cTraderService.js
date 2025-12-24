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

    // Set up payload type mappings and add missing types
    protoRoot.lookupType("ProtoOA.ProtoOAApplicationAuthReq").payloadType = 2100;
    protoRoot.lookupType("ProtoOA.ProtoOAApplicationAuthRes").payloadType = 2101;
    protoRoot.lookupType("ProtoOA.ProtoOAGetAccountListByAccessTokenReq").payloadType = 2149;
    protoRoot.lookupType("ProtoOA.ProtoOAGetAccountListByAccessTokenRes").payloadType = 2150;
    protoRoot.lookupType("ProtoOA.ProtoOAAccountAuthReq").payloadType = 2103;
    protoRoot.lookupType("ProtoOA.ProtoOAAccountAuthRes").payloadType = 2104;
    protoRoot.lookupType("ProtoOA.ProtoOADealListReq").payloadType = 2124;
    protoRoot.lookupType("ProtoOA.ProtoOADealListRes").payloadType = 2125;

    // Add missing message types
    protoRoot.define("ProtoOA").add(new protobuf.Type("ProtoOAErrorRes")
      .add(new protobuf.Field("errorCode", 1, "string"))
      .add(new protobuf.Field("description", 2, "string")));

    protoRoot.lookupType("ProtoOA.ProtoOAErrorRes").payloadType = 50;
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
  if (!tokens.refresh_token) throw new Error('No refresh token available. Please reconnect to cTrader.');

  console.log('🔄 Refreshing cTrader access token...');
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: tokens.refresh_token,
    client_id: import.meta.env.VITE_CTRADER_APP_ID, // Use short numeric ID for OAuth
    client_secret: import.meta.env.VITE_CTRADER_CLIENT_SECRET
  });

  try {
    const response = await fetch('https://openapi.ctrader.com/apps/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });

    const data = await response.json();
    if (data.error) {
      console.error('❌ Token refresh failed:', data);
      throw new Error(data.error_description || data.error);
    }

    // Add expiration time
    data.expires_at = Date.now() + data.expires_in * 1000;
    localStorage.setItem('ctrader_tokens', JSON.stringify(data));
    console.log('✅ Token refreshed successfully');
    return data;
  } catch (error) {
    console.error('❌ Token refresh error:', error);
    // If refresh fails, clear tokens to force reconnection
    localStorage.removeItem('ctrader_tokens');
    throw error;
  }
};

// Main function to fetch trades and analyze
const fetchAndAnalyzeTrades = async (isDemo = false) => { // Default to live for production
  try {
    let tokens = getTokens();

    // Auto-refresh token if expired and refresh_token is available
    if (Date.now() > tokens.expires_at) {
      console.log('⚠️ Access token expired, attempting refresh...');
      if (tokens.refresh_token) {
        try {
          tokens = await refreshToken();
          console.log('✅ Token refreshed automatically');
        } catch (refreshError) {
          console.warn('❌ Token refresh failed:', refreshError.message);
          throw new Error('Access token expired and refresh failed. Please reconnect to cTrader.');
        }
      } else {
        throw new Error('Access token expired. Please reconnect to cTrader.');
      }
    }
    const root = await loadProtos();
  const wsUrl = isDemo ? import.meta.env.VITE_CTRADER_WS_DEMO : import.meta.env.VITE_CTRADER_WS_LIVE;
  const ws = new WebSocket(wsUrl);

  return new Promise((resolve, reject) => {
    let selectedAccountId = null; // Store selected account ID for later use

    ws.onopen = () => {
      console.log('🔌 WebSocket opened successfully');
      // App auth - use FULL public client key (not short numeric ID)
      const appPayload = {
        clientId: import.meta.env.VITE_CTRADER_FULL_CLIENT_ID || '19506_ZNLG80oi7Bj6mt9wi4g9KYgRh3OcEbHele1YzBfeOFvKL0A0nF', // Full public key string
        clientSecret: import.meta.env.VITE_CTRADER_CLIENT_SECRET
      };
      console.log('📡 Sending ProtoOAApplicationAuthReq with clientId:', appPayload.clientId.substring(0, 10) + '...');
      sendMessage(ws, 'ProtoOAApplicationAuthReq', appPayload);
    };

    ws.onmessage = async (event) => {
      try {
        const ProtoMessage = root.lookupType('ProtoMessage');
        const message = ProtoMessage.decode(new Uint8Array(await event.data.arrayBuffer()));
        const payloadType = message.payloadType;
        console.log('📨 WebSocket message received, payloadType:', payloadType);

        // Map payload types to message types
        let messageType;
        switch (payloadType) {
          case 2100: messageType = 'ProtoOAApplicationAuthReq'; break;
          case 2101: messageType = 'ProtoOAApplicationAuthRes'; break;
          case 2149: messageType = 'ProtoOAGetAccountListByAccessTokenReq'; break;
          case 2150: messageType = 'ProtoOAGetAccountListByAccessTokenRes'; break;
          case 2103: messageType = 'ProtoOAAccountAuthReq'; break;
          case 2104: messageType = 'ProtoOAAccountAuthRes'; break;
          case 2124: messageType = 'ProtoOADealListReq'; break;
          case 2125: messageType = 'ProtoOADealListRes'; break;
          default: messageType = null;
        }

        if (!messageType) {
          console.warn('⚠️ Unknown payload type:', payloadType);
          return;
        }

        const payload = root.lookupType('ProtoOA.' + messageType).decode(message.payload);
        console.log('📋 Decoded message:', messageType, payload);

        // Handle different message types
        if (messageType === 'ProtoOAApplicationAuthRes') {
          if (payload.result) {
            console.log('✅ Application authentication successful');
            // Get account list
            const accountListPayload = { accessToken: tokens.access_token };
            console.log('📡 Requesting account list...');
            sendMessage(ws, 'ProtoOAGetAccountListByAccessTokenReq', accountListPayload);
          } else {
            console.error('❌ Application authentication failed');
            reject(new Error('Application authentication failed'));
          }
        } else if (messageType === 'ProtoOAGetAccountListByAccessTokenRes') {
          console.log('📊 Account list received:', payload.ctidTraderAccount?.length || 0, 'accounts');
          if (payload.ctidTraderAccount && payload.ctidTraderAccount.length > 0) {
            // Use first account for demo, or find live account
            const account = isDemo ?
              payload.ctidTraderAccount.find(acc => acc.accountId?.includes('DEMO')) || payload.ctidTraderAccount[0] :
              payload.ctidTraderAccount.find(acc => !acc.accountId?.includes('DEMO')) || payload.ctidTraderAccount[0];

            selectedAccountId = account.ctidTraderAccountId; // Store for later use
            console.log('🎯 Using account:', account.accountId, 'ctid:', selectedAccountId);

            // Authenticate account
            const accountAuthPayload = {
              ctidTraderAccountId: selectedAccountId,
              accessToken: tokens.access_token
            };
            console.log('🔐 Authenticating account...');
            sendMessage(ws, 'ProtoOAAccountAuthReq', accountAuthPayload);
          } else {
            reject(new Error('No trading accounts found'));
          }
        } else if (messageType === 'ProtoOAAccountAuthRes') {
          if (payload.result) {
            console.log('✅ Account authentication successful');
            // Get deals for last 30 days
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            const dealListPayload = {
              ctidTraderAccountId: selectedAccountId, // Use stored account ID
              fromTimestamp: Math.floor(thirtyDaysAgo / 1000),
              toTimestamp: Math.floor(Date.now() / 1000)
            };
            console.log('📈 Requesting trading deals...');
            sendMessage(ws, 'ProtoOADealListReq', dealListPayload);
          } else {
            console.error('❌ Account authentication failed');
            reject(new Error('Account authentication failed'));
          }
        } else if (messageType === 'ProtoOADealListRes') {
          console.log('💰 Trading deals received:', payload.deal?.length || 0, 'deals');
          if (payload.deal && payload.deal.length > 0) {
            // Transform deals to our format
            const trades = payload.deal.map(deal => ({
              id: deal.dealId.toString(),
              timestamp: new Date(deal.closeTimestamp * 1000),
              symbol: deal.symbolId || 'UNKNOWN',
              side: deal.tradeSide === 1 ? 'buy' : 'sell',
              volume: deal.volume / 100000, // Convert from base units
              price: deal.executedPrice / 100000, // Convert from points
              profit: deal.profit / 100, // Convert from cents
              commission: 0, // Not provided in basic deal data
              swap: 0, // Not provided
              status: 'closed'
            }));

            console.log('✅ Successfully processed', trades.length, 'trades');
            resolve(trades);
          } else {
            console.warn('⚠️ No trading deals found in the last 30 days');
            resolve([]); // Return empty array instead of rejecting
          }
        }
      } catch (error) {
        console.error('❌ Error processing WebSocket message:', error);
        reject(error);
      }
    };

    ws.onerror = (error) => {
      console.error('🚨 WebSocket error:', error);
      reject(new Error('WebSocket connection failed: ' + error.message));
    };

    ws.onclose = (event) => {
      console.log('🔌 WebSocket closed:', event.code, event.reason);
      if (event.code !== 1000) { // Not normal closure
        reject(new Error(`WebSocket closed unexpectedly: ${event.code} ${event.reason}`));
      }
    };

    // Timeout after 30 seconds
    setTimeout(() => {
      ws.close();
      reject(new Error('WebSocket connection timeout'));
    }, 30000);

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

    };

    // Timeout after 30 seconds
    setTimeout(() => {
      ws.close();
      reject(new Error('WebSocket connection timeout'));
    }, 30000);
  });
  } catch (error) {
    console.error('cTrader integration error:', error);
    throw new Error('cTrader is not properly configured. Please ensure proto files are downloaded and try again.');
  }
};

export { fetchAndAnalyzeTrades, refreshToken };
