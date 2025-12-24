import protobuf from 'protobufjs';

let protoRoot = null;

// Singleton state for cTrader WebSocket connection
let ctraderWS = null;
let ctraderState = 'idle'; // 'idle' | 'connecting' | 'app_auth' | 'account_list' | 'account_auth' | 'deal_list' | 'ready' | 'error'
let ctraderResolve = null;
let ctraderReject = null;
let selectedAccountId = null;

// Load proto files (run once on init)
const loadProtos = async () => {
  if (protoRoot) return protoRoot;

  try {
    console.log('🔧 Loading cTrader proto definitions from inline strings...');

    // Complete proto definitions from spotware/OpenAPI
    const protoDefinitions = {
      Common: `
syntax = "proto3";
package ProtoOA;

import "google/protobuf/timestamp.proto";

message ProtoMessage {
  uint32 payloadType = 1;
  bytes payload = 2;
}

enum ProtoOAPayloadType {
  PROTO_MESSAGE = 0;

  PROTO_OA_APPLICATION_AUTH_REQ = 2100;
  PROTO_OA_APPLICATION_AUTH_RES = 2101;
  PROTO_OA_ACCOUNT_AUTH_REQ = 2103;
  PROTO_OA_ACCOUNT_AUTH_RES = 2104;
  PROTO_OA_ERROR_RES = 50;
  PROTO_OA_CLIENT_DISCONNECT_EVENT = 2107;

  PROTO_OA_GET_ACCOUNTS_BY_ACCESS_TOKEN_REQ = 2149;
  PROTO_OA_GET_ACCOUNTS_BY_ACCESS_TOKEN_RES = 2150;

  PROTO_OA_GET_ACCOUNT_AUTHORIZED_DATA_REQ = 2155;
  PROTO_OA_GET_ACCOUNT_AUTHORIZED_DATA_RES = 2156;

  PROTO_OA_SUBSCRIBE_SPOTS_REQ = 52;
  PROTO_OA_SUBSCRIBE_SPOTS_RES = 53;
  PROTO_OA_UNSUBSCRIBE_SPOTS_REQ = 54;
  PROTO_OA_UNSUBSCRIBE_SPOTS_RES = 55;
  PROTO_OA_SPOT_EVENT = 56;

  PROTO_OA_SUBSCRIBE_LIVE_TRENDBAR_REQ = 60;
  PROTO_OA_SUBSCRIBE_LIVE_TRENDBAR_RES = 61;
  PROTO_OA_UNSUBSCRIBE_LIVE_TRENDBAR_REQ = 62;
  PROTO_OA_UNSUBSCRIBE_LIVE_TRENDBAR_RES = 63;
  PROTO_OA_GET_TRENDBAR_REQ = 64;
  PROTO_OA_GET_TRENDBAR_RES = 65;

  PROTO_OA_SYMBOLS_LIST_REQ = 67;
  PROTO_OA_SYMBOLS_LIST_RES = 68;
  PROTO_OA_SYMBOL_BY_ID_REQ = 69;
  PROTO_OA_SYMBOL_BY_ID_RES = 70;
  PROTO_OA_SYMBOLS_FOR_CONVERSION_REQ = 71;
  PROTO_OA_SYMBOLS_FOR_CONVERSION_RES = 72;

  PROTO_OA_ASSET_LIST_REQ = 75;
  PROTO_OA_ASSET_LIST_RES = 76;
  PROTO_OA_ASSET_CLASS_LIST_REQ = 77;
  PROTO_OA_ASSET_CLASS_LIST_RES = 78;

  PROTO_OA_GET_TICKDATA_REQ = 79;
  PROTO_OA_GET_TICKDATA_RES = 80;

  PROTO_OA_TRADER_REQ = 81;
  PROTO_OA_TRADER_RES = 82;
  PROTO_OA_TRADER_UPDATE_EVENT = 83;

  PROTO_OA_RECONCILE_REQ = 84;
  PROTO_OA_RECONCILE_RES = 85;

  PROTO_OA_EXECUTION_EVENT = 86;

  PROTO_OA_SUBSCRIBE_DEPTH_QUOTES_REQ = 87;
  PROTO_OA_SUBSCRIBE_DEPTH_QUOTES_RES = 88;
  PROTO_OA_UNSUBSCRIBE_DEPTH_QUOTES_REQ = 89;
  PROTO_OA_UNSUBSCRIBE_DEPTH_QUOTES_RES = 90;
  PROTO_OA_DEPTH_EVENT = 91;

  PROTO_OA_GET_CASH_FLOW_HISTORY_REQ = 92;
  PROTO_OA_GET_CASH_FLOW_HISTORY_RES = 93;

  PROTO_OA_ORDER_LIST_REQ = 94;
  PROTO_OA_ORDER_LIST_RES = 95;

  PROTO_OA_NEW_ORDER_REQ = 96;
  PROTO_OA_NEW_ORDER_RES = 97;
  PROTO_OA_CANCEL_ORDER_REQ = 98;
  PROTO_OA_CANCEL_ORDER_RES = 99;
  PROTO_OA_AMEND_ORDER_REQ = 100;
  PROTO_OA_AMEND_ORDER_RES = 101;
  PROTO_OA_CLOSE_POSITION_REQ = 102;
  PROTO_OA_CLOSE_POSITION_RES = 103;

  PROTO_OA_DEAL_LIST_REQ = 2124;
  PROTO_OA_DEAL_LIST_RES = 2125;

  PROTO_OA_SUBSCRIBE_DEALS_REQ = 2126;
  PROTO_OA_SUBSCRIBE_DEALS_RES = 2127;
  PROTO_OA_UNSUBSCRIBE_DEALS_REQ = 2128;
  PROTO_OA_UNSUBSCRIBE_DEALS_RES = 2129;
  PROTO_OA_DEAL_LIST_REQ_BY_POSITION = 2130;
  PROTO_OA_DEAL_LIST_RES_BY_POSITION = 2131;

  PROTO_OA_EXPECTED_MARGIN_REQ = 2132;
  PROTO_OA_EXPECTED_MARGIN_RES = 2133;

  PROTO_OA_MARGIN_CHANGED_EVENT = 2134;

  PROTO_OA_GET_AVAILABLE_MARGIN_REQ = 2135;
  PROTO_OA_GET_AVAILABLE_MARGIN_RES = 2136;

  PROTO_OA_CASH_FLOW_HISTORY_LIST_REQ = 2137;
  PROTO_OA_CASH_FLOW_HISTORY_LIST_RES = 2138;

  PROTO_OA_CHANGE_PASSWORD_REQ = 2139;
  PROTO_OA_CHANGE_PASSWORD_RES = 2140;

  PROTO_OA_GET_DYNAMIC_LEVERAGE_REQ = 2141;
  PROTO_OA_GET_DYNAMIC_LEVERAGE_RES = 2142;
}
      `,
      OpenApi: `
syntax = "proto3";
package ProtoOA;

import "Common.proto";

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
  bool isLive = 3;
  bool isTradeAllowed = 4;
  bool hasServerSideRequotes = 5;
  uint32 brokerName = 6;
  uint32 leverageInCents = 7;
  uint32 maxLeverage = 8;
  double depositAssetRate = 9;
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
  bool hasMore = 2;
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
  string commission = 11;
  string swap = 12;
  uint32 commissionCurrency = 13;
  uint32 swapCurrency = 14;
  double balance = 15;
  double balanceVersion = 16;
  string comment = 17;
  string executionTimestamp = 18;
  double marginRate = 19;
  uint32 balanceCurrency = 20;
  double grossProfit = 21;
  double grossProfitCurrency = 22;
  string nextStreamBarrierId = 23;
  string prevStreamBarrierId = 24;
  double distance = 25;
  string dealIdString = 26;
  string positionIdString = 27;
}

message ProtoOAErrorRes {
  uint32 errorCode = 1;
  string description = 2;
  string maintenanceEndTimestamp = 3;
}
      `,
      OpenApiMessages: `
syntax = "proto3";
package ProtoOA;

import "Common.proto";
      `,
      OpenApiModelMessages: `
syntax = "proto3";
package ProtoOA;

import "Common.proto";
      `
    };

    protoRoot = new protobuf.Root();

    // Parse each proto string and add to Root
    for (const [name, protoString] of Object.entries(protoDefinitions)) {
      const parsed = protobuf.parse(protoString, { keepCase: true });
      protoRoot.add(parsed.root);
      console.log(`✅ Parsed ${name}.proto successfully`);
    }

    protoRoot.resolveAll(); // Resolve imports between proto files
    console.log('✅ All proto definitions loaded and resolved');

    return protoRoot;
  } catch (error) {
    console.error('❌ Failed to load cTrader proto files:', error);
    throw new Error('Failed to load cTrader protobuf definitions');
  }
};

// Helper to send message over WS
const sendMessage = (ws, messageTypeName, payloadObj) => {
  try {
    // Get payload type from enum
    const payloadTypeEnum = protoRoot.lookupEnum('ProtoOA.ProtoOAPayloadType').values;

    // Map message type names to payload type numbers
    const payloadTypeMap = {
      'ProtoOAApplicationAuthReq': payloadTypeEnum.PROTO_OA_APPLICATION_AUTH_REQ, // 2100
      'ProtoOAGetAccountListByAccessTokenReq': payloadTypeEnum.PROTO_OA_GET_ACCOUNTS_BY_ACCESS_TOKEN_REQ, // 2149
      'ProtoOAAccountAuthReq': payloadTypeEnum.PROTO_OA_ACCOUNT_AUTH_REQ, // 2103
      'ProtoOADealListReq': payloadTypeEnum.PROTO_OA_DEAL_LIST_REQ, // 2124
    };

    console.log('🔍 Available payload types:', Object.keys(payloadTypeMap));
    console.log('🔍 Requested message type:', messageTypeName);

    const payloadType = payloadTypeMap[messageTypeName];
    if (typeof payloadType !== 'number') {
      throw new Error(`Unknown message type: ${messageTypeName}`);
    }

    // Find and encode the message type
    const fullMessageType = messageTypeName.startsWith('ProtoOA.') ? messageTypeName : 'ProtoOA.' + messageTypeName;
    const MessageType = protoRoot.lookupType(fullMessageType);
    const encodedPayload = MessageType.encode(payloadObj).finish();

    // Create wrapper message
    const ProtoMessage = protoRoot.lookupType('ProtoOA.ProtoMessage');
    const wrapper = ProtoMessage.create({
      payloadType: payloadType,
      payload: encodedPayload
    });

    // Encode and send
    const buffer = ProtoMessage.encode(wrapper).finish();
    ws.send(buffer);

    console.log(`✅ Sent ${messageTypeName} (payloadType: ${payloadType})`);
  } catch (err) {
    console.error(`❌ Failed to send ${messageTypeName}:`, err);
  }
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

// Singleton cTrader flow starter
export const startCtraderFlow = async (isDemo = false) => {
  console.log('🚀 startCtraderFlow called with isDemo:', isDemo);

  // Prevent multiple simultaneous flows
  if (ctraderState !== 'idle') {
    console.warn('⚠️ cTrader flow already in progress, state:', ctraderState);
    return;
  }

  ctraderState = 'connecting';

  return new Promise(async (resolve, reject) => {
    ctraderResolve = resolve;
    ctraderReject = reject;

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
            ctraderState = 'idle';
            reject(new Error('Access token expired and refresh failed. Please reconnect to cTrader.'));
            return;
          }
        } else {
          ctraderState = 'idle';
          reject(new Error('Access token expired. Please reconnect to cTrader.'));
          return;
        }
      }

      const root = await loadProtos();
      const wsUrl = isDemo ? import.meta.env.VITE_CTRADER_WS_DEMO : import.meta.env.VITE_CTRADER_WS_LIVE;
      console.log('🔌 Connecting to WebSocket:', wsUrl);

      // Clean up existing connection if any
      if (ctraderWS && ctraderWS.readyState === WebSocket.OPEN) {
        ctraderWS.close();
      }

      ctraderWS = new WebSocket(wsUrl);

      ctraderWS.onopen = () => {
        console.log('🔌 WebSocket opened successfully');

        // Check environment variables
        const fullClientId = import.meta.env.VITE_CTRADER_FULL_CLIENT_ID;
        const clientSecret = import.meta.env.VITE_CTRADER_CLIENT_SECRET;

        if (!fullClientId) {
          console.error('❌ VITE_CTRADER_FULL_CLIENT_ID is not set in environment variables');
          ctraderState = 'idle';
          reject(new Error('cTrader WebSocket client ID not configured. Please set VITE_CTRADER_FULL_CLIENT_ID environment variable.'));
          ctraderWS.close();
          return;
        }

        if (!clientSecret) {
          console.error('❌ VITE_CTRADER_CLIENT_SECRET is not set in environment variables');
          ctraderState = 'idle';
          reject(new Error('cTrader client secret not configured. Please set VITE_CTRADER_CLIENT_SECRET environment variable.'));
          ctraderWS.close();
          return;
        }

        console.log('🔍 Environment check passed. Starting cTrader auth sequence...');

        // Start with application authentication
        ctraderState = 'app_auth';
        const appPayload = {
          clientId: fullClientId,
          clientSecret: clientSecret
        };
        console.log('📡 Sending ProtoOAApplicationAuthReq...');
        sendMessage(ctraderWS, 'ProtoOAApplicationAuthReq', appPayload);
      };

    ws.onmessage = async (event) => {
      try {
        // Validate WebSocket connection
        if (!ctraderWS || ctraderWS.readyState !== WebSocket.OPEN) {
          console.error('❌ WebSocket is not connected, ignoring message');
          return;
        }

        // Decode the protobuf message
        const arrayBuffer = await event.data.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        const ProtoMessage = root.lookupType('ProtoOA.ProtoMessage');
        const message = ProtoMessage.decode(uint8Array);

        // Validate message structure
        if (!message || typeof message.payloadType === 'undefined') {
          console.error('❌ Invalid cTrader message structure:', message);
          return;
        }

        const payloadType = message.payloadType;
        console.log('📨 WebSocket message received, payloadType:', payloadType, 'current state:', ctraderState);

        // Handle heartbeat (ignore)
        if (payloadType === 51) { // HEARTBEAT_EVENT
          console.log('💓 Heartbeat received - connection alive');
          return;
        }

        // Handle errors
        if (payloadType === 50) { // ERROR_RES
          const errorPayload = root.lookupType('ProtoOA.ProtoOAErrorRes').decode(message.payload);
          console.error('🚨 Spotware API Error:', errorPayload.errorCode, errorPayload.description);
          ctraderState = 'idle';
          ctraderReject(new Error(`cTrader API Error ${errorPayload.errorCode}: ${errorPayload.description}`));
          ctraderWS.close();
          return;
        }

        // Process messages based on current auth state
        switch (ctraderState) {
          case 'app_auth':
            if (payloadType === 2101) { // PROTO_OA_APPLICATION_AUTH_RES
              const payload = root.lookupType('ProtoOA.ProtoOAApplicationAuthRes').decode(message.payload);
              if (payload.result === true) {
                console.log('✅ Application authentication successful');
                ctraderState = 'account_list';
                // Request account list
                const accountListPayload = { accessToken: tokens.access_token };
                console.log('📡 Requesting account list...');
                sendMessage(ctraderWS, 'ProtoOAGetAccountListByAccessTokenReq', accountListPayload);
              } else {
                console.error('❌ Application authentication failed');
                ctraderState = 'idle';
                ctraderReject(new Error('Application authentication failed'));
                ctraderWS.close();
              }
            }
            break;

          case 'account_list':
            if (payloadType === 2150) { // PROTO_OA_GET_ACCOUNTS_BY_ACCESS_TOKEN_RES
              const payload = root.lookupType('ProtoOA.ProtoOAGetAccountListByAccessTokenRes').decode(message.payload);
              console.log('📊 Account list received:', payload.ctidTraderAccount?.length || 0, 'accounts');

              if (payload.ctidTraderAccount && payload.ctidTraderAccount.length > 0) {
                // Use first account or find live account
                const account = isDemo ?
                  payload.ctidTraderAccount.find(acc => acc.accountId?.includes('DEMO')) || payload.ctidTraderAccount[0] :
                  payload.ctidTraderAccount.find(acc => !acc.accountId?.includes('DEMO')) || payload.ctidTraderAccount[0];

                selectedAccountId = account.ctidTraderAccountId;
                console.log('🎯 Using account:', account.accountId, 'ctid:', selectedAccountId);

                ctraderState = 'account_auth';
                // Authenticate account
                const accountAuthPayload = {
                  ctidTraderAccountId: selectedAccountId,
                  accessToken: tokens.access_token
                };
                console.log('🔐 Authenticating account...');
                sendMessage(ctraderWS, 'ProtoOAAccountAuthReq', accountAuthPayload);
              } else {
                console.error('❌ No trading accounts found');
                ctraderState = 'idle';
                ctraderReject(new Error('No trading accounts found'));
                ctraderWS.close();
              }
            }
            break;

          case 'account_auth':
            if (payloadType === 2104) { // PROTO_OA_ACCOUNT_AUTH_RES
              const payload = root.lookupType('ProtoOA.ProtoOAAccountAuthRes').decode(message.payload);
              if (payload.result === true) {
                console.log('✅ Account authentication successful');
                ctraderState = 'deal_list';
                // Request deals for last 30 days
                const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
                const dealListPayload = {
                  ctidTraderAccountId: selectedAccountId,
                  fromTimestamp: Math.floor(thirtyDaysAgo / 1000),
                  toTimestamp: Math.floor(Date.now() / 1000)
                };
                console.log('📈 Requesting trading deals...');
                sendMessage(ctraderWS, 'ProtoOADealListReq', dealListPayload);
              } else {
                console.error('❌ Account authentication failed');
                ctraderState = 'idle';
                ctraderReject(new Error('Account authentication failed'));
                ctraderWS.close();
              }
            }
            break;

          case 'deal_list':
            if (payloadType === 2125) { // PROTO_OA_DEAL_LIST_RES
              const payload = root.lookupType('ProtoOA.ProtoOADealListRes').decode(message.payload);
              console.log('💰 Trading deals received:', payload.deal?.length || 0, 'deals');

              ctraderState = 'ready';

              if (payload.deal && payload.deal.length > 0) {
                // Transform deals to our format
                const trades = payload.deal
                  .filter(deal => deal.closeTimestamp && deal.closeTimestamp > 0) // Only closed deals
                  .map(deal => {
                    const timestamp = deal.closeTimestamp > 1e10 ? deal.closeTimestamp : deal.closeTimestamp * 1000;
                    return {
                      id: deal.dealId.toString(),
                      timestamp: new Date(timestamp),
                      symbol: deal.symbolId || 'UNKNOWN',
                      side: deal.tradeSide === 1 ? 'buy' : deal.tradeSide === 2 ? 'sell' : 'unknown',
                      volume: deal.volume / 100000,
                      price: deal.executedPrice / 100000,
                      profit: deal.profit / 100,
                      commission: 0,
                      swap: 0,
                      status: 'closed'
                    };
                  });

                console.log('✅ Successfully processed', trades.length, 'trades');
                ctraderState = 'idle';
                ctraderResolve(trades);
              } else {
                console.warn('⚠️ No trading deals found');
                ctraderState = 'idle';
                ctraderResolve([]);
              }
              ctraderWS.close(); // Close after getting deals
            }
            break;

          default:
            console.warn('⚠️ Unexpected message in state', ctraderState, 'payloadType:', payloadType);
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

      ctraderWS.onclose = (event) => {
        console.log('🔌 WebSocket closed:', event.code, event.reason);
        if (event.code !== 1000 && ctraderState !== 'idle' && ctraderState !== 'ready') {
          ctraderState = 'idle';
          ctraderReject(new Error(`WebSocket closed unexpectedly: ${event.code} ${event.reason}`));
        }
      };

      ctraderWS.onerror = (error) => {
        console.error('🚨 WebSocket error:', error);
        ctraderState = 'idle';
        ctraderReject(new Error('WebSocket connection error'));
      };

      // Timeout after 60 seconds (full auth sequence takes time)
      setTimeout(() => {
        if (ctraderWS.readyState === WebSocket.OPEN && ctraderState !== 'idle' && ctraderState !== 'ready') {
          ctraderWS.close();
          ctraderState = 'idle';
          ctraderReject(new Error('cTrader authentication timeout'));
        }
      }, 60000);
    });
  } catch (error) {
    console.error('cTrader integration error:', error);
    ctraderState = 'idle';
    throw error;
  }
};

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

export { startCtraderFlow, refreshToken };
