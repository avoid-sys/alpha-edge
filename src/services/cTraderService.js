import protobuf from 'protobufjs';

let protoRoot = null;

// Load proto files (run once on init)
const loadProtos = async () => {
  if (protoRoot) return protoRoot;

  try {
    console.log('🔧 Loading cTrader proto files...');

    // Define proto files inline to avoid loading issues
    const protoFiles = {
      'Common.proto': `
syntax = "proto3";
package ProtoOA;

message ProtoMessage {
  uint32 payloadType = 1;
  bytes payload = 2;
}
      `,
      'OpenApi.proto': `
syntax = "proto3";
package ProtoOA;

message ProtoOAApplicationAuthReq {
  string clientId = 1;
  string clientSecret = 2;
}

message ProtoOAApplicationAuthRes {
  bool result = 1;
}

message ProtoOAGetAccountListByAccessTokenReq {
  string accessToken = 1;
}

message ProtoOAGetAccountListByAccessTokenRes {
  repeated ProtoOATraderAccount ctidTraderAccount = 1;
}

message ProtoOATraderAccount {
  uint64 ctidTraderAccountId = 1;
  string accountId = 2;
}

message ProtoOAAccountAuthReq {
  uint64 ctidTraderAccountId = 1;
  string accessToken = 2;
}

message ProtoOAAccountAuthRes {
  bool result = 1;
}

message ProtoOADealListReq {
  uint64 ctidTraderAccountId = 1;
  int64 fromTimestamp = 2;
  int64 toTimestamp = 3;
}

message ProtoOADealListRes {
  repeated ProtoOADeal deal = 1;
}

message ProtoOADeal {
  uint64 dealId = 1;
  uint64 positionId = 2;
  uint64 volume = 3;
  string symbolId = 4;
  double executedPrice = 5;
  double profit = 6;
  string dealStatus = 7;
  string tradeSide = 8;
  int64 createTimestamp = 9;
  int64 closeTimestamp = 10;
}

message ProtoOAErrorRes {
  uint32 errorCode = 1;
  string description = 2;
  string maintenanceEndTimestamp = 3;
}
      `,
      'OpenApiMessages.proto': `
syntax = "proto3";
package ProtoOA;
      `,
      'OpenApiModelMessages.proto': `
syntax = "proto3";
package ProtoOA;
      `
    };

    protoRoot = await protobuf.load(Object.values(protoFiles));
    console.log('✅ Proto files loaded successfully (inline)');

    return protoRoot;
  } catch (error) {
    console.error('❌ Failed to load cTrader proto files:', error);
    throw new Error('Failed to load cTrader protobuf definitions');
  }
};

// Helper to send message over WS
const sendMessage = (ws, messageType, payload) => {
  const ProtoMessage = protoRoot.lookupType('ProtoMessage');
  const fullMessageType = messageType.startsWith('ProtoOA.') ? messageType : 'ProtoOA.' + messageType;
  const payloadType = protoRoot.lookupType(fullMessageType).payloadType;
  const encodedPayload = protoRoot.lookupType(fullMessageType).encode(payload).finish();
  const message = ProtoMessage.create({ payloadType, payload: encodedPayload });
  console.log('📤 Sending message:', fullMessageType, 'payloadType:', payloadType);
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
    client_id: import.meta.env.VITE_CTRADER_FULL_CLIENT_ID, // Use full Client ID for consistency
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
  console.log('🚀 fetchAndAnalyzeTrades called with isDemo:', isDemo);

  try {
    let tokens = getTokens();
    console.log('🔑 Token check - has tokens:', !!tokens.access_token, 'expires_at:', tokens.expires_at ? new Date(tokens.expires_at).toLocaleString() : 'none');

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
    console.log('🔌 Connecting to WebSocket:', wsUrl);
    const ws = new WebSocket(wsUrl);

  return new Promise((resolve, reject) => {
    let selectedAccountId = null; // Store selected account ID for later use

    ws.onopen = () => {
      console.log('🔌 WebSocket opened successfully');

      // Check environment variables - use FULL client ID for WebSocket auth
      const fullClientId = import.meta.env.VITE_CTRADER_FULL_CLIENT_ID;
      const clientSecret = import.meta.env.VITE_CTRADER_CLIENT_SECRET;

      if (!fullClientId) {
        console.error('❌ VITE_CTRADER_FULL_CLIENT_ID is not set in environment variables');
        reject(new Error('cTrader WebSocket client ID not configured. Please set VITE_CTRADER_FULL_CLIENT_ID environment variable.'));
        ws.close();
        return;
      }

      if (!clientSecret) {
        console.error('❌ VITE_CTRADER_CLIENT_SECRET is not set in environment variables');
        reject(new Error('cTrader client secret not configured. Please set VITE_CTRADER_CLIENT_SECRET environment variable.'));
        ws.close();
        return;
      }

      console.log('🔍 Environment check passed. Using FULL clientId:', fullClientId.substring(0, 20) + '...');
      console.log('🔍 clientId length:', fullClientId.length, 'clientSecret length:', clientSecret.length);

      // App auth payload - CRITICAL: Use FULL public Client ID string for ProtoOAApplicationAuthReq
      const appPayload = {
        clientId: fullClientId,  // Full public key string (e.g., 19506_ZNLG80oi7Bj6mt9wi4g9KYgRh3OcEbHele1YzBfeOFvKL0A0nF)
        clientSecret: clientSecret
      };
      console.log('📡 Sending ProtoOAApplicationAuthReq with clientId:', appPayload.clientId);
      console.log('📡 App payload keys:', Object.keys(appPayload));
      sendMessage(ws, 'ProtoOAApplicationAuthReq', appPayload);
    };

    ws.onmessage = async (event) => {
      try {
        const ProtoMessage = root.lookupType('ProtoMessage');
        const message = ProtoMessage.decode(new Uint8Array(await event.data.arrayBuffer()));
        const payloadType = message.payloadType;
        console.log('📨 WebSocket message received, payloadType:', payloadType);

        // Map payload types to message types (without ProtoOA. prefix)
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
          case 50: messageType = 'ProtoOAErrorRes'; break; // Error response
          default: messageType = null;
        }

        if (!messageType) {
          console.warn('⚠️ Unknown payload type:', payloadType);
          return;
        }

        const payload = root.lookupType(messageType).decode(message.payload);
        console.log('📋 Decoded message:', messageType, 'payload:', JSON.stringify(payload, null, 2));

        // Handle different message types
        if (messageType === 'ProtoOAApplicationAuthRes') {
          if (payload.result === true) {
            console.log('✅ Application authentication successful (ProtoOAApplicationAuthRes result=true)');
            // Get account list
            const accountListPayload = { accessToken: tokens.access_token };
            console.log('📡 Requesting account list with accessToken...');
            sendMessage(ws, 'ProtoOAGetAccountListByAccessTokenReq', accountListPayload);
          } else {
            console.error('❌ Application authentication failed (ProtoOAApplicationAuthRes result=false or missing)');
            console.error('❌ Full payload:', JSON.stringify(payload, null, 2));
            const errorMsg = payload.description || 'Application authentication failed: Malformed clientId parameter or invalid credentials';
            reject(new Error(errorMsg));
            ws.close();
          }
        } else if (messageType === 'ProtoOAErrorRes') {
          console.error('🚨 Spotware API Error:', payload.errorCode, payload.description);
          console.error('🚨 Full error payload:', JSON.stringify(payload, null, 2));
          const errorMsg = payload.description || `cTrader API Error ${payload.errorCode}: Unknown error`;
          reject(new Error(errorMsg));
          ws.close();
        } else if (messageType === 'ProtoOAGetAccountListByAccessTokenRes') {
          console.log('📊 Account list received:', payload.ctidTraderAccount?.length || 0, 'accounts');
          console.log('📊 Full account list:', JSON.stringify(payload.ctidTraderAccount, null, 2));

          if (payload.ctidTraderAccount && payload.ctidTraderAccount.length > 0) {
            // Use first account for demo, or find live account
            const account = isDemo ?
              payload.ctidTraderAccount.find(acc => acc.accountId?.includes('DEMO')) || payload.ctidTraderAccount[0] :
              payload.ctidTraderAccount.find(acc => !acc.accountId?.includes('DEMO')) || payload.ctidTraderAccount[0];

            selectedAccountId = account.ctidTraderAccountId; // Store for later use
            console.log('🎯 Using account:', account.accountId, 'ctid:', selectedAccountId, 'isDemo mode:', isDemo);

            // Authenticate account
            const accountAuthPayload = {
              ctidTraderAccountId: selectedAccountId,
              accessToken: tokens.access_token
            };
            console.log('🔐 Authenticating account with payload:', JSON.stringify(accountAuthPayload, null, 2));
            sendMessage(ws, 'ProtoOAAccountAuthReq', accountAuthPayload);
          } else {
            console.error('❌ No trading accounts found in response');
            reject(new Error('No trading accounts found'));
          }
        } else if (messageType === 'ProtoOAAccountAuthRes') {
          if (payload.result) {
            console.log('✅ Account authentication successful');
            // Get deals for last 30 days
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            const dealListPayload = {
              ctidTraderAccountId: selectedAccountId, // Use stored account ID
              fromTimestamp: Math.floor(thirtyDaysAgo / 1000), // cTrader expects seconds
              toTimestamp: Math.floor(Date.now() / 1000) // cTrader expects seconds
            };
            console.log('📈 Requesting trading deals from', new Date(thirtyDaysAgo).toLocaleDateString(), 'to now...');
            console.log('📈 Deal list payload:', JSON.stringify(dealListPayload, null, 2));
            sendMessage(ws, 'ProtoOADealListReq', dealListPayload);
          } else {
            console.error('❌ Account authentication failed');
            reject(new Error('Account authentication failed'));
          }
        } else if (messageType === 'ProtoOADealListRes') {
          console.log('💰 Trading deals received:', payload.deal?.length || 0, 'deals');
          console.log('💰 First few deals sample:', JSON.stringify(payload.deal?.slice(0, 3), null, 2));

          if (payload.deal && payload.deal.length > 0) {
            // Transform deals to our format
            const trades = payload.deal
              .filter(deal => deal.closeTimestamp && deal.closeTimestamp > 0) // Only closed deals
              .map(deal => {
                // Determine if timestamps are in seconds or milliseconds
                const timestamp = deal.closeTimestamp > 1e10 ? deal.closeTimestamp : deal.closeTimestamp * 1000;

                // Debug deal data
                console.log('🔍 Processing deal:', deal.dealId, 'symbol:', deal.symbolId, 'side:', deal.tradeSide, 'profit:', deal.profit);

                return {
                  id: deal.dealId.toString(),
                  timestamp: new Date(timestamp),
                  symbol: deal.symbolId || 'UNKNOWN',
                  side: deal.tradeSide === 1 ? 'buy' : deal.tradeSide === 2 ? 'sell' : 'unknown',
                  volume: deal.volume / 100000, // Convert from base units (may need adjustment)
                  price: deal.executedPrice / 100000, // Convert from points (may need adjustment)
                  profit: deal.profit / 100, // Convert from cents (may need adjustment)
                  commission: 0, // Not provided in basic deal data
                  swap: 0, // Not provided
                  status: 'closed'
                };
              });

            console.log('✅ Successfully processed', trades.length, 'closed trades from', payload.deal.length, 'total deals');
            console.log('📊 Sample processed trade:', JSON.stringify(trades[0], null, 2));

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
