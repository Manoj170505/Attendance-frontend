import React, { useState } from 'react';
import JSZip from 'jszip';
import {
  Server,
  Download,
  Terminal,
  Cpu,
  Globe,
  HardDrive,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  Info,
  Loader2,
  FileCode
} from 'lucide-react';

const AGENT_JS_CODE = `const ZKLib = require('node-zklib');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const net = require('net');
const os = require('os');

// Defensive patch for node-zklib to prevent null subarray crash on device timeout
try {
  const ZKLibTCP = require('node-zklib/zklibtcp');
  const { createTCPHeader, decodeTCPHeader, checkNotEventTCP } = require('node-zklib/utils');
  const { COMMANDS, MAX_CHUNK } = require('node-zklib/constants');

  ZKLibTCP.prototype.readWithBuffer = function (reqData, cb) {
    var self = this;
    return new Promise(function (resolve, reject) {
      self.replyId++;
      var buf = createTCPHeader(COMMANDS.CMD_DATA_WRRQ, self.sessionId, self.replyId, reqData);

      self.requestData(buf)
        .then(function (reply) {
          if (!reply || reply.length < 16) {
            return reject(new Error('Device returned empty or invalid response buffer on port 4370'));
          }

          var header = decodeTCPHeader(reply.subarray(0, 16));
          switch (header.commandId) {
            case COMMANDS.CMD_DATA: {
              return resolve({ data: reply.subarray(16), mode: 8 });
            }
            case COMMANDS.CMD_ACK_OK:
            case COMMANDS.CMD_PREPARE_DATA: {
              var recvData = reply.subarray(16);
              if (!recvData || recvData.length < 5) {
                return reject(new Error('Device response payload too short'));
              }
              var size = recvData.readUIntLE(1, 4);
              var remain = size % MAX_CHUNK;
              var numberChunks = Math.round(size - remain) / MAX_CHUNK;
              var totalPackets = numberChunks + (remain > 0 ? 1 : 0);
              var replyData = Buffer.from([]);
              var totalBuffer = Buffer.from([]);
              var realTotalBuffer = Buffer.from([]);

              var timeout = 10000;
              var timer = setTimeout(function () {
                internalCallback(replyData, new Error('TIMEOUT WHEN RECEIVING PACKET'));
              }, timeout);

              var internalCallback = function (data, err) {
                if (timer) clearTimeout(timer);
                resolve({ data: data, err: err || null });
              };

              var handleOnData = function (packet) {
                if (checkNotEventTCP(packet)) return;
                if (timer) clearTimeout(timer);
                timer = setTimeout(function () {
                  internalCallback(replyData, new Error('TIMEOUT ON PACKETS REMAINING: ' + totalPackets));
                }, timeout);

                totalBuffer = Buffer.concat([totalBuffer, packet]);
                var packetLength = totalBuffer.readUIntLE(4, 2);
                if (totalBuffer.length >= 8 + packetLength) {
                  realTotalBuffer = Buffer.concat([realTotalBuffer, totalBuffer.subarray(16, 8 + packetLength)]);
                  totalBuffer = totalBuffer.subarray(8 + packetLength);

                  if (
                    (totalPackets > 1 && realTotalBuffer.length === MAX_CHUNK + 8) ||
                    (totalPackets === 1 && realTotalBuffer.length === remain + 8)
                  ) {
                    replyData = Buffer.concat([replyData, realTotalBuffer.subarray(8)]);
                    totalBuffer = Buffer.from([]);
                    realTotalBuffer = Buffer.from([]);

                    totalPackets -= 1;
                    if (cb) cb(replyData.length, size);

                    if (totalPackets <= 0) {
                      internalCallback(replyData);
                    }
                  }
                }
              };

              self.socket.on('data', handleOnData);

              for (var i = 0; i < totalPackets; i++) {
                var sizeReq = i === totalPackets - 1 ? remain : MAX_CHUNK;
                self.sendChunkRequest(i * MAX_CHUNK, sizeReq);
              }
              break;
            }
            default: {
              return reject(new Error('Invalid command response code: ' + header.commandId));
            }
          }
        })
        .catch(function (err) {
          reject(err);
        });
    });
  };
  const { REQUEST_DATA } = require('node-zklib/constants');
  const { parseTimeToDate } = require('node-zklib/utils');

  function customDecodeRecordData40(recordData) {
    const b26 = recordData.length > 26 ? recordData.readUInt8(26) : 1;
    const b30 = recordData.length > 30 ? recordData.readUInt8(30) : 0;
    const b31 = recordData.length > 31 ? recordData.readUInt8(31) : 0;
    
    let detectedState = 0;
    if (b31 >= 1 && b31 <= 5) {
      detectedState = b31;
    } else if (b30 >= 1 && b30 <= 5) {
      detectedState = b30;
    }

    return {
      userSn: recordData.readUIntLE(0, 2),
      deviceUserId: recordData.slice(2, 26).toString('ascii').split('\\0').shift().trim(),
      verifyType: b26,
      recordTime: parseTimeToDate ? parseTimeToDate(recordData.readUInt32LE(27)) : new Date(),
      recordType: detectedState,
      status: detectedState,
      state: detectedState,
      workCode: recordData.length >= 36 ? recordData.readUInt32LE(32) : 0,
      _rawHex: recordData.toString('hex')
    };
  }

  ZKLibTCP.prototype.getAttendances = async function (callbackInProcess = () => { }) {
    if (this.socket) {
      try { await this.freeData(); } catch (err) { return Promise.reject(err); }
    }
    let data = null;
    try {
      data = await this.readWithBuffer(REQUEST_DATA.GET_ATTENDANCE_LOGS, callbackInProcess);
    } catch (err) {
      return Promise.reject(err);
    }
    if (this.socket) {
      try { await this.freeData(); } catch (err) { return Promise.reject(err); }
    }
    const RECORD_PACKET_SIZE = 40;
    let recordData = data.data.subarray(4);
    let records = [];
    while (recordData.length >= RECORD_PACKET_SIZE) {
      const record = customDecodeRecordData40(recordData.subarray(0, RECORD_PACKET_SIZE));
      records.push({ ...record, ip: this.ip });
      recordData = recordData.subarray(RECORD_PACKET_SIZE);
    }
    return { data: records, err: data.err };
  };
} catch (patchErr) {
  console.warn('⚠️ Could not apply ZKLibTCP monkey-patch:', patchErr.message);
}

const CONFIG_PATH = path.join(__dirname, 'config.json');
const CACHE_PATH = path.join(__dirname, 'synced_cache.json');

// Load Configuration
let config = {
  deviceIp: '192.168.137.41',
  devicePort: 4370,
  deviceSerial: 'NFZ8235301513',
  cloudApiUrl: 'https://attendance-backend-production-48ca.up.railway.app',
  pollIntervalSeconds: 3
};

if (fs.existsSync(CONFIG_PATH)) {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
    config = Object.assign({}, config, JSON.parse(raw));
  } catch (err) {
    console.error('⚠️ Could not parse config.json, using defaults:', err.message);
  }
}

function saveConfig() {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    console.log(\`💾 [AUTO-SAVED] Updated config.json with discovered IP: \${config.deviceIp}\`);
  } catch (err) {
    console.error('⚠️ Error saving config:', err.message);
  }
}

// Load Cache of Synced Punches and Cursor Tracking
let syncedCache = new Set();
let latestSyncedTimestamp = 0;

if (fs.existsSync(CACHE_PATH)) {
  try {
    const raw = fs.readFileSync(CACHE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      syncedCache = new Set(parsed);
    } else if (parsed && typeof parsed === 'object') {
      syncedCache = new Set(parsed.keys || []);
      latestSyncedTimestamp = Number(parsed.latestTimestamp || 0);
    }
  } catch (err) {
    syncedCache = new Set();
  }
}

function saveCache() {
  try {
    const data = {
      latestTimestamp: latestSyncedTimestamp,
      keys: Array.from(syncedCache).slice(-10000)
    };
    fs.writeFileSync(CACHE_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('⚠️ Error saving synced cache:', err.message);
  }
}

console.log('================================================================');
console.log('🚀 UNIVERSAL BIOMETRIC LOCAL SYNC AGENT (eSSL / ZKTeco / BioMax)');
console.log('================================================================');
console.log(\`🔒 Target Device IP:    \${config.deviceIp}:\${config.devicePort}\`);
console.log(\`🏷️ Device Serial No:    \${config.deviceSerial}\`);
console.log(\`☁️ Cloud Server URL:    \${config.cloudApiUrl}\`);
console.log(\`⏱️ Sync Polling Rate:   Every \${config.pollIntervalSeconds} seconds\`);
console.log('================================================================\\n');

let zk = new ZKLib(config.deviceIp, config.devicePort, 10000, 4000);
let isConnected = false;
let isPolling = false;
let consecutiveFailures = 0;

function testPort(ip, port, timeoutMs = 800) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let isSettled = false;

    socket.setTimeout(timeoutMs);
    socket.on('connect', () => {
      if (!isSettled) {
        isSettled = true;
        socket.destroy();
        resolve(true);
      }
    });
    socket.on('timeout', () => {
      if (!isSettled) {
        isSettled = true;
        socket.destroy();
        resolve(false);
      }
    });
    socket.on('error', () => {
      if (!isSettled) {
        isSettled = true;
        socket.destroy();
        resolve(false);
      }
    });
    socket.connect(port, ip);
  });
}

async function discoverDeviceIp() {
  console.log('🔍 [AUTO-DISCOVERY] Searching local network for eSSL / ZKTeco machine on port 4370...');
  const interfaces = os.networkInterfaces();
  const candidatePrefixes = new Set();

  for (const name of Object.keys(interfaces)) {
    for (const netInfo of interfaces[name] || []) {
      if (netInfo.family === 'IPv4' && !netInfo.internal) {
        const parts = netInfo.address.split('.');
        if (parts.length === 4) {
          candidatePrefixes.add(\`\${parts[0]}.\${parts[1]}.\${parts[2]}\`);
        }
      }
    }
  }

  candidatePrefixes.add('192.168.137');
  candidatePrefixes.add('192.168.1');
  candidatePrefixes.add('192.168.0');

  for (const prefix of candidatePrefixes) {
    const batchSize = 35;
    for (let start = 1; start <= 254; start += batchSize) {
      const promises = [];
      for (let i = start; i < Math.min(start + batchSize, 255); i++) {
        const ip = \`\${prefix}.\${i}\`;
        promises.push(testPort(ip, config.devicePort).then(isOpen => isOpen ? ip : null));
      }
      const results = await Promise.all(promises);
      const foundIp = results.find(ip => ip !== null);
      if (foundIp) {
        console.log(\`🎯 [DEVICE FOUND] Discovered active biometric terminal at: \${foundIp}:\${config.devicePort}\`);
        return foundIp;
      }
    }
  }
  return null;
}

// Fetch the latest timestamp recorded in cloud to avoid fetching old history
async function initHighWaterMark() {
  try {
    const res = await axios.get(\`\${config.cloudApiUrl.replace(/\\/$/, '')}/api/attendance/latest-timestamp?deviceSerial=\${config.deviceSerial}\`, {
      timeout: 8000
    });
    if (res.data && res.data.latestTimestamp) {
      const serverTime = new Date(res.data.latestTimestamp).getTime();
      if (serverTime > latestSyncedTimestamp) {
        latestSyncedTimestamp = serverTime;
        console.log(\`📍 [HIGH-WATER MARK] Resuming sync from: \${new Date(latestSyncedTimestamp).toLocaleString()}\`);
      }
    }
  } catch (err) {
    console.log(\`ℹ️ [CURSOR SYNC] Starting fresh sync cursor.\`);
  }
}

async function pushPunchToCloud(record) {
  try {
    const employeeId = String(record.deviceUserId || record.userId || record.pin || record.user_sn || record.uid);
    const punchTime = record.recordTime || record.timestamp || record.time || new Date();
    const punchTimeMs = new Date(punchTime).getTime();

    const rawState = record.recordType !== undefined ? record.recordType : (record.status !== undefined ? record.status : (record.state !== undefined ? record.state : 0));
    const stateCode = String(rawState);

    const stateMap = {
      '0': 'CHECK_IN',
      '1': 'CHECK_OUT',
      '2': 'BREAK_OUT',
      '3': 'BREAK_IN',
      '4': 'OVERTIME_IN',
      '5': 'OVERTIME_OUT'
    };

    const verifyMap = {
      '1': 'FINGERPRINT',
      '2': 'PIN_PASSWORD',
      '3': 'CARD_RFID',
      '4': 'FINGER_CARD',
      '15': 'FACE_RECOGNITION',
      '200': 'PALM_VEIN'
    };
    const verifyCode = String(record.verifyType || 1);

    const payload = {
      deviceSerial: config.deviceSerial,
      employeeId,
      timestamp: new Date(punchTime).toISOString(),
      state: stateMap[stateCode] || 'CHECK_IN',
      punchType: verifyMap[verifyCode] || 'FINGERPRINT',
      rawData: \`AGENT_PUNCH: \${employeeId}\\t\${new Date(punchTime).toISOString()}\\t\${stateMap[stateCode] || 'CHECK_IN'}\`
    };

    const response = await axios.post(\`\${config.cloudApiUrl.replace(/\\/$/, '')}/api/attendance/punch\`, payload, {
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.data && response.data.success) {
      if (punchTimeMs > latestSyncedTimestamp) {
        latestSyncedTimestamp = punchTimeMs;
      }
      if (response.data.isDuplicate) {
        return true;
      }
      console.log(\`✅ [SYNCED TO CLOUD] Employee PIN: \${employeeId} | \${new Date(punchTime).toLocaleTimeString()} | State: \${payload.state} | Type: \${payload.punchType}\`);
      return true;
    }
  } catch (err) {
    const errMsg = (err.response && err.response.data && err.response.data.error) || err.message;
    console.error(\`❌ [CLOUD SYNC ERROR] Failed to push punch:\`, errMsg);
    return false;
  }
  return false;
}

let lastUserSyncTime = 0;
const USER_SYNC_INTERVAL_MS = 60 * 1000;

async function syncUsersFromDevice() {
  if (!isConnected || !zk) return;
  try {
    const usersData = await zk.getUsers().catch((err) => {
      console.warn(\`⚠️ [USER SYNC WARNING] Device returned empty or timed out on getUsers:\`, err ? err.message : 'timeout');
      return null;
    });

    if (usersData && usersData.data && Array.isArray(usersData.data) && usersData.data.length > 0) {
      const usersToSync = usersData.data.map(u => ({
        employeeId: String(u.userId || u.deviceUserId || u.uid || '').trim(),
        name: u.name ? String(u.name).replace(/\\0/g, '').trim() : '',
        cardNo: u.cardno ? String(u.cardno) : null,
        role: u.role
      })).filter(u => u.employeeId);

      if (usersToSync.length > 0) {
        const response = await axios.post(\`\${config.cloudApiUrl.replace(/\\/$/, '')}/api/attendance/sync-users\`, {
          deviceSerial: config.deviceSerial,
          users: usersToSync
        }, {
          timeout: 15000,
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.data && response.data.success) {
          console.log(\`👥 [USER SYNC] Successfully synced \${usersToSync.length} employee name(s) from biometric machine to cloud dashboard.\`);
        }
      }
    }
  } catch (err) {
    console.warn(\`⚠️ [USER SYNC WARNING] Could not fetch/sync device users: \${err ? err.message : err}\`);
  }
}

async function sendHeartbeat() {
  try {
    await axios.get(\`\${config.cloudApiUrl.replace(/\\/$/, '')}/iclock/cdata?SN=\${config.deviceSerial}\`, {
      timeout: 10000
    });
  } catch (err) {}
}

async function pollAttendanceLogs() {
  if (isPolling || !isConnected || !zk) return;
  isPolling = true;

  try {
    const logs = await zk.getAttendances().catch((err) => {
      console.warn(\`⚠️ [POLL WARNING] Device returned empty or timed out on getAttendances:\`, err ? err.message : 'timeout');
      return null;
    });

    if (logs && logs.data && Array.isArray(logs.data)) {
      let newPunches = 0;

      for (const log of logs.data) {
        const punchTimeMs = new Date(log.recordTime).getTime();
        const uniqueKey = \`\${config.deviceSerial}_\${log.deviceUserId}_\${punchTimeMs}\`;

        if (syncedCache.has(uniqueKey)) {
          continue;
        }

        if (latestSyncedTimestamp > 0 && punchTimeMs < latestSyncedTimestamp) {
          syncedCache.add(uniqueKey);
          continue;
        }

        const success = await pushPunchToCloud(log);
        if (success) {
          syncedCache.add(uniqueKey);
          newPunches++;
        }
      }

      if (newPunches > 0) {
        saveCache();
        console.log(\`✨ [LIVE PUNCH SYNC] Successfully registered \${newPunches} new biometric punch(es).\\n\`);
      }
    }
  } catch (err) {
    console.warn(\`⚠️ [POLL WARNING] \${err ? err.message : err}\`);
    if (err && err.message && (err.message.includes('timeout') || err.message.includes('closed') || err.message.includes('ECONNRESET'))) {
      isConnected = false;
    }
  } finally {
    isPolling = false;
  }
}

async function connectToDevice() {
  while (true) {
    if (!isConnected) {
      try {
        console.log(\`📡 Connecting to eSSL / ZKTeco machine at \${config.deviceIp}:\${config.devicePort}...\`);
        await zk.createSocket();
        isConnected = true;
        consecutiveFailures = 0;
        console.log(\`🟢 [CONNECTED TO DEVICE] Ready to capture live attendance punches!\\n\`);

        await sendHeartbeat();
        await initHighWaterMark();
        await syncUsersFromDevice();
        lastUserSyncTime = Date.now();
      } catch (err) {
        consecutiveFailures++;
        console.error(\`🔴 [CONNECT FAILED] Could not reach machine at \${config.deviceIp}:\${config.devicePort} (\${err ? err.message : err}).\`);
        isConnected = false;
        try { await zk.disconnect(); } catch (e) {}

        if (consecutiveFailures >= 2) {
          const autoFoundIp = await discoverDeviceIp();
          if (autoFoundIp && autoFoundIp !== config.deviceIp) {
            config.deviceIp = autoFoundIp;
            saveConfig();
            zk = new ZKLib(config.deviceIp, config.devicePort, 10000, 4000);
            consecutiveFailures = 0;
            continue;
          }
        }
      }
    }

    if (isConnected) {
      await pollAttendanceLogs();
      await sendHeartbeat();

      if (Date.now() - lastUserSyncTime >= USER_SYNC_INTERVAL_MS) {
        await syncUsersFromDevice();
        lastUserSyncTime = Date.now();
      }
    }

    await new Promise((resolve) => setTimeout(resolve, config.pollIntervalSeconds * 1000));
  }
}

process.on('uncaughtException', (err) => {
  console.warn('⚠️ [SOCKET RECOVERED] Handled unexpected socket error:', err ? err.message : err);
  isConnected = false;
});

process.on('unhandledRejection', (reason) => {
  console.warn('⚠️ [PROMISE RECOVERED] Handled unhandled rejection:', reason ? reason.message || reason : 'Rejection');
  isConnected = false;
});

connectToDevice().catch(console.error);

process.on('SIGINT', async () => {
  console.log('\\n🛑 Stopping Biometric Sync Agent...');
  try { await zk.disconnect(); } catch (e) {}
  process.exit(0);
});
`;

const PACKAGE_JSON_CONTENT = JSON.stringify(
  {
    name: 'biomax-essl-local-agent',
    version: '1.0.0',
    description: 'Universal Local Sync Agent for eSSL, ZKTeco, and BioMax Biometric Terminals',
    main: 'agent.js',
    scripts: {
      start: 'node agent.js'
    },
    dependencies: {
      axios: '^1.20.0',
      dotenv: '^16.6.1',
      'node-zklib': '^1.3.0'
    }
  },
  null,
  2
);

const START_BAT_CONTENT = `@echo off
title Universal Biometric Cloud Sync Agent
cd /d "%~dp0"
echo ================================================================
echo  Universal Biometric Cloud Sync Agent
echo ================================================================
echo.

if not exist "node_modules" (
    echo [Setup] First time setup: Installing required biometric drivers...
    call npm install
    echo [Setup] Installation complete!
    echo.
)

echo [Connecting] Starting Biometric Sync Engine...
echo.
node agent.js
pause
`;

export default function HardwareBridgeModal({ isOpen, onClose, devices = [], companies = [] }) {
  const [activeMode, setActiveMode] = useState('agent'); // 'cloud' | 'agent'
  const [selectedDeviceSn, setSelectedDeviceSn] = useState(devices[0]?.serialNumber || 'NFZ8235301513');
  const [deviceIp, setDeviceIp] = useState('192.168.137.41');
  const [cloudApiUrl, setCloudApiUrl] = useState('https://attendance-backend-production-48ca.up.railway.app');
  const [copiedCode, setCopiedCode] = useState(false);
  const [showIpManual, setShowIpManual] = useState(false);
  const [showSnManual, setShowSnManual] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  if (!isOpen) return null;

  const cloudServerDomain = 'attendance-backend-production-48ca.up.railway.app';
  const tcpNumericIp = '66.33.22.225';
  const tcpPort = '35845';

  const agentConfigJson = JSON.stringify(
    {
      deviceIp: deviceIp || '192.168.137.41',
      devicePort: 4370,
      deviceSerial: selectedDeviceSn || 'NFZ8235301513',
      cloudApiUrl: cloudApiUrl || 'https://attendance-backend-production-48ca.up.railway.app',
      pollIntervalSeconds: 3
    },
    null,
    2
  );

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadConfig = () => {
    const blob = new Blob([agentConfigJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Dynamic Browser-side ZIP Generator with JSZip!
  const handleDynamicZipDownload = async () => {
    try {
      setIsZipping(true);
      const zip = new JSZip();

      // Create folder inside zip
      const folderName = `biomax-attendance-agent-${selectedDeviceSn || 'client'}`;
      const root = zip.folder(folderName);

      // Add customized files
      root.file('config.json', agentConfigJson);
      root.file('agent.js', AGENT_JS_CODE);
      root.file('package.json', PACKAGE_JSON_CONTENT);
      root.file('start-agent.bat', START_BAT_CONTENT);
      root.file(
        'README.txt',
        `================================================================\nUNIVERSAL BIOMETRIC CLOUD SYNC AGENT\n================================================================\n\nConfigured specifically for Device SN: ${selectedDeviceSn || 'NFZ8235301513'}\nTarget Local Machine IP: ${deviceIp || '192.168.137.41'}:4370\nTarget Cloud Server: ${cloudApiUrl}\n\nHOW TO RUN:\n1. Ensure your PC and Biometric Machine are connected.\n2. Double-click "start-agent.bat".\n3. punches will stream automatically to the cloud!\n`
      );

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${folderName}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating dynamic agent zip:', err);
      alert('Could not generate ZIP: ' + err.message);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white w-full max-w-3xl rounded-2xl p-6 border border-slate-200 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Biometric Hardware Connection Hub</h3>
              <p className="text-xs text-slate-500">Universal support for both Cloud ADMS devices and Local Port 4370 machines</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            ✕
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 gap-3 my-5">
          <button
            onClick={() => setActiveMode('agent')}
            className={`p-3.5 rounded-xl border text-left transition flex items-start space-x-3 ${
              activeMode === 'agent'
                ? 'bg-sky-50 border-sky-300 text-sky-900 ring-2 ring-sky-200'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-5 h-5 mt-0.5 flex-shrink-0 text-sky-600" />
            <div>
              <div className="font-bold text-xs text-slate-900">Mode 1: Local Desktop Sync Agent (Port 4370)</div>
              <div className="text-[11px] text-slate-500 mt-0.5">eSSL X 2008, i9C, K20, BioMax on LAN / Ethernet (Local Bridge)</div>
            </div>
          </button>

          <button
            onClick={() => setActiveMode('cloud')}
            className={`p-3.5 rounded-xl border text-left transition flex items-start space-x-3 ${
              activeMode === 'cloud'
                ? 'bg-brand-50 border-brand-300 text-brand-900 ring-2 ring-brand-200'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Globe className="w-5 h-5 mt-0.5 flex-shrink-0 text-brand-600" />
            <div>
              <div className="font-bold text-xs text-slate-900">Mode 2: Direct Cloud ADMS Push</div>
              <div className="text-[11px] text-slate-500 mt-0.5">BioMax & ZKTeco SpeedFace with Cloud Server menu (Native Push)</div>
            </div>
          </button>
        </div>

        {/* Mode 1: Local Desktop Sync Agent (Dynamic Zip Generator) */}
        {activeMode === 'agent' && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-sky-600" />
                <span>Dynamic Custom Agent Generator for Client PC:</span>
              </h4>
              <p className="text-slate-600 text-xs">
                Fill your client's machine details below. Clicking <strong>Download Agent (.ZIP)</strong> will instantly package a ready-to-run ZIP with pre-filled <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-sky-700 font-mono">config.json</code> and smart auto-discovery!
              </p>

              {/* Device Selector & IP Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-700 font-semibold">Device Serial Number (SN / ID):</label>
                    <button
                      type="button"
                      onClick={() => setShowSnManual(!showSnManual)}
                      className="inline-flex items-center space-x-1 text-[11px] text-sky-600 hover:text-sky-700 font-semibold"
                    >
                      <Info className="w-3.5 h-3.5" />
                      <span>How to find SN?</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    list="device-sn-suggestions"
                    value={selectedDeviceSn}
                    onChange={(e) => setSelectedDeviceSn(e.target.value)}
                    placeholder="e.g. NFZ8235301513 or BMX-101"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-sky-500"
                  />
                  <datalist id="device-sn-suggestions">
                    {devices.map(d => (
                      <option key={d.id} value={d.serialNumber}>
                        {d.name} ({d.serialNumber})
                      </option>
                    ))}
                  </datalist>

                  {showSnManual && (
                    <div className="mt-2.5 p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-[11px] space-y-1.5">
                      <div className="font-bold flex items-center space-x-1.5">
                        <Info className="w-3.5 h-3.5 text-sky-600" />
                        <span>How to find Serial Number on Machine:</span>
                      </div>
                      <ol className="list-decimal list-inside space-y-1 text-slate-600">
                        <li>Press <strong>M/OK</strong> on biometric machine.</li>
                        <li>Go to <strong>System Info ➔ Device Info</strong>.</li>
                        <li>Copy the <strong>Serial Number (SN)</strong> into the box above.</li>
                      </ol>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-700 font-semibold">Device Local IP (on Ethernet/Wi-Fi):</label>
                    <button
                      type="button"
                      onClick={() => setShowIpManual(!showIpManual)}
                      className="inline-flex items-center space-x-1 text-[11px] text-sky-600 hover:text-sky-700 font-semibold"
                    >
                      <Info className="w-3.5 h-3.5" />
                      <span>How to find IP?</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={deviceIp}
                    onChange={(e) => setDeviceIp(e.target.value)}
                    placeholder="192.168.137.41"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-sky-500"
                  />

                  {showIpManual && (
                    <div className="mt-2.5 p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-[11px] space-y-1.5">
                      <div className="font-bold flex items-center space-x-1.5">
                        <Info className="w-3.5 h-3.5 text-sky-600" />
                        <span>How to get Device IP & Port:</span>
                      </div>
                      <ol className="list-decimal list-inside space-y-1 text-slate-600">
                        <li>Press <strong>M/OK</strong> on machine ➔ <strong>Comm. ➔ Ethernet</strong>.</li>
                        <li>Read <strong>IP Address</strong> (e.g. <code className="bg-white px-1 py-0.5 rounded border border-slate-200 text-sky-700 font-mono">192.168.137.41</code>).</li>
                        <li>Under <strong>PC Connection</strong>, ensure <strong>Comm. Port: 4370</strong> and <strong>Comm Key: 0</strong>.</li>
                      </ol>
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic 1-Click Package Generator */}
              <div className="p-4 bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 rounded-xl space-y-3 mt-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h5 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                      <Download className="w-4 h-4 text-sky-600" />
                      <span>Dynamic 1-Click Custom Agent Package:</span>
                    </h5>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      Includes pre-configured <code className="text-sky-700 font-semibold font-mono">config.json</code> with IP <strong className="text-slate-900">{deviceIp || '192.168.137.41'}</strong>, auto-installer, and 1-click launcher.
                    </p>
                  </div>
                  <button
                    onClick={handleDynamicZipDownload}
                    disabled={isZipping}
                    className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold shadow-md shadow-sky-600/20 transition flex-shrink-0 text-xs disabled:opacity-50"
                  >
                    {isZipping ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Bundling ZIP...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Download Custom Agent (.ZIP)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 2-Step Client Setup */}
                <div className="pt-2 border-t border-sky-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                  <div className="flex items-start space-x-2">
                    <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold flex-shrink-0 text-[10px]">1</span>
                    <span className="text-slate-700">Unzip the downloaded folder on the client's PC.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold flex-shrink-0 text-[10px]">2</span>
                    <span className="text-slate-700">Double-click <strong className="text-emerald-700">start-agent.bat</strong> — it connects & auto-discovers!</span>
                  </div>
                </div>
              </div>

              {/* Advanced config download & manual copy */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={handleDownloadConfig}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-[11px] font-semibold transition"
                >
                  <FileCode className="w-3.5 h-3.5 text-slate-500" />
                  <span>Download Custom config.json only</span>
                </button>

                <button
                  onClick={() => handleCopy(`cd agent\nnode agent.js`)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-[11px] font-semibold transition ml-auto"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copiedCode ? 'Copied Command' : 'Copy Terminal Command'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mode 2: Cloud ADMS Direct Push */}
        {activeMode === 'cloud' && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                <Zap className="w-4 h-4 text-brand-600" />
                <span>On-Screen Settings for Cloud ADMS Machines:</span>
              </h4>
              <p className="text-slate-600 text-xs">
                In your biometric machine menu ➔ <strong>Comm. ➔ Cloud Server Setting (or ADMS / Web Server)</strong>:
              </p>

              <div className="space-y-2 font-mono text-[11px]">
                <div className="flex justify-between items-center p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-slate-500">Enable Domain Name:</span>
                  <span className="text-emerald-700 font-bold">ON (for Domain) / OFF (for Direct IP)</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-slate-500">Server Address / URL:</span>
                  <span className="text-brand-700 font-bold">{cloudServerDomain}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-slate-500">Direct TCP IP / Port (for HTTP hardware):</span>
                  <span className="text-amber-800 font-bold">{tcpNumericIp} : {tcpPort}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-slate-500">Enable Proxy Server:</span>
                  <span className="text-slate-700">OFF</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-600" />
              <span>No local software or bridge is required. The machine pushes punches directly across the internet to your cloud dashboard.</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center space-x-1.5">
            <Activity className="w-3.5 h-3.5 text-brand-600" />
            <span>Cloud API Endpoint: <code className="text-slate-700 font-mono">/api/attendance/punch</code></span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
