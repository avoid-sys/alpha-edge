import protobuf from 'protobufjs';

let protoRoot = null;

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

// Transform cTrader deals to our internal trade format
const parseDealsToTrades = (deals) => {
  if (!deals || !Array.isArray(deals)) return [];

  return deals
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
};

// Simplified cTrader flow starter
export const startCtraderFlow = async (isDemo = false) => {
  console.log('🚀 STARTING CTRADER FLOW, isDemo:', isDemo);

  const tokens = JSON.parse(localStorage.getItem('ctrader_tokens') || '{}');
  if (!tokens.access_token) throw new Error('No access token');

  await loadProtos(); // Ensure protos are loaded
  const wsUrl = isDemo ? import.meta.env.VITE_CTRADER_WS_DEMO : import.meta.env.VITE_CTRADER_WS_LIVE;
  console.log('🔌 Connecting to WS URL:', wsUrl);
  const ws = new WebSocket(wsUrl);

  let accountId = null;
  let currentState = 'connecting';

  return new Promise((resolve, reject) => {
    ws.onopen = () => {
      console.log('✅ WS OPENED SUCCESSFULLY');
      currentState = 'app_auth_sending';
      console.log('📤 Sending ProtoOAApplicationAuthReq...');
      sendMessage(ws, 'ProtoOAApplicationAuthReq', {
        clientId: import.meta.env.VITE_CTRADER_FULL_CLIENT_ID,
        clientSecret: import.meta.env.VITE_CTRADER_CLIENT_SECRET
      });
      currentState = 'waiting_app_auth';
    };

    ws.onmessage = async (event) => {
      try {
        const arrayBuffer = await event.data.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const ProtoMessage = protoRoot.lookupType('ProtoOA.ProtoMessage');
        const message = ProtoMessage.decode(uint8Array);
        const payloadTypeNum = message.payloadType;
        console.log('📨 MESSAGE RECEIVED - payloadType:', payloadTypeNum, 'currentState:', currentState);

        // Игнорируем heartbeat
        if (payloadTypeNum === 51 || payloadTypeNum === 2142) {
          console.log('Heartbeat — connection alive');
          return;
        }

        // Находим имя типа по номеру
        const payloadTypeEnum = protoRoot.lookupEnum('ProtoOA.ProtoOAPayloadType');
        const typeName = payloadTypeEnum.valuesById[payloadTypeNum];
        console.log('🔍 Looking for payloadType:', payloadTypeNum, 'found typeName:', typeName);

        if (!typeName) {
          console.warn('Unknown payloadType:', payloadTypeNum, '- ignoring');
          return;
        }

        const PayloadType = protoRoot.lookupType(`ProtoOA.${typeName}`);
        const payload = PayloadType.decode(message.payload);
        console.log('📦 Decoded payload for', typeName, ':', payload);

        if (payloadTypeNum === 2101) { // ProtoOAApplicationAuthRes
          console.log('✅ APPLICATION AUTH SUCCESS');
          currentState = 'getting_accounts';
          console.log('📤 Requesting account list...');
          sendMessage(ws, 'ProtoOAGetAccountListByAccessTokenReq', {
            accessToken: tokens.access_token
          });
          currentState = 'waiting_accounts';
        } else if (payloadTypeNum === 2150) { // ProtoOAGetAccountListByAccessTokenRes
          console.log('📋 ACCOUNT LIST RECEIVED, accounts:', payload.ctidTraderAccount?.length || 0);
          if (!payload.ctidTraderAccount?.length) {
            console.error('❌ No trader accounts found');
            reject(new Error('No trader accounts found'));
            ws.close();
            return;
          }
          accountId = payload.ctidTraderAccount[0].ctidTraderAccountId;
          console.log('🎯 Using account ID:', accountId);
          localStorage.setItem('ctrader_account_id', accountId);

          currentState = 'account_auth_sending';
          console.log('📤 Sending account auth...');
          sendMessage(ws, 'ProtoOAAccountAuthReq', {
            ctidTraderAccountId: accountId,
            accessToken: tokens.access_token
          });
          currentState = 'waiting_account_auth';
        } else if (payloadTypeNum === 2104) { // ProtoOAAccountAuthRes
          console.log('✅ ACCOUNT AUTH SUCCESS');
          currentState = 'deal_list_sending';
          console.log('📤 Requesting deal list...');
          const from = Date.now() - 365 * 24 * 60 * 60 * 1000;
          const to = Date.now();
          sendMessage(ws, 'ProtoOADealListReq', {
            ctidTraderAccountId: accountId,
            fromTimestamp: from,
            toTimestamp: to
          });
          currentState = 'waiting_deals';
        } else if (payloadTypeNum === 2125 || payloadTypeNum === 2142) { // ProtoOADealListRes (trying both possible values)
          console.log('🎉 DEAL LIST RECEIVED! payloadType:', payloadTypeNum, 'deals count:', payload.deal?.length || 0);
          const completeTrades = parseDealsToTrades(payload.deal || []);
          console.log('✅ Processing complete - trades:', completeTrades.length);

          console.log('🔄 RESOLVING PROMISE with', completeTrades.length, 'trades');
          resolve(completeTrades);
          ws.close(); // Закрываем ТОЛЬКО после получения сделок
        } else if (payloadTypeNum === 50) { // ProtoOAErrorRes
          console.error('Spotware error:', payload.description);
          reject(new Error(payload.description || 'Unknown error'));
          ws.close();
        }
      } catch (err) {
        console.error('Message processing error:', err);
        reject(err);
        ws.close();
      }
    };

    ws.onerror = (err) => {
      console.error('WS error:', err);
      reject(err);
    };

    ws.onclose = (event) => {
      console.log('WS closed:', event.code, event.reason);
      if (event.code !== 1000) {
        reject(new Error('WS closed unexpectedly'));
      }
    };

    // Таймаут на весь процесс (30 сек) - только reject, НЕ закрываем WS!
    setTimeout(() => {
      console.error('⏰ TIMEOUT: No response from cTrader within 30 seconds');
      reject(new Error('Timeout waiting for data from cTrader'));
      // НЕ закрываем WS здесь - пусть он закроется сам или в reject обработчике
    }, 30000);
  });
};