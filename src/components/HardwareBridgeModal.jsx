import React, { useState } from 'react';
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
  Info
} from 'lucide-react';

export default function HardwareBridgeModal({ isOpen, onClose, devices = [], companies = [] }) {
  const [activeMode, setActiveMode] = useState('cloud'); // 'cloud' | 'agent'
  const [selectedDeviceSn, setSelectedDeviceSn] = useState(devices[0]?.serialNumber || 'NFZ8235301513');
  const [deviceIp, setDeviceIp] = useState('192.168.137.188');
  const [copiedCode, setCopiedCode] = useState(false);
  const [showIpManual, setShowIpManual] = useState(false);
  const [showSnManual, setShowSnManual] = useState(false);

  if (!isOpen) return null;

  const cloudServerDomain = 'attendance-backend-production-48ca.up.railway.app';
  const tcpProxyHost = 'thomas.proxy.rlwy.net:35845';
  const tcpNumericIp = '66.33.22.225';
  const tcpPort = '35845';

  const agentConfigJson = JSON.stringify(
    {
      deviceIp: deviceIp || '192.168.137.188',
      devicePort: 4370,
      deviceSerial: selectedDeviceSn || 'NFZ8235301513',
      cloudApiUrl: 'https://attendance-backend-production-48ca.up.railway.app',
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

  const handleDownloadBat = () => {
    const batContent = `@echo off\ntitle Universal Biometric Cloud Sync Agent\necho ================================================================\necho  Starting Universal Biometric Cloud Sync Agent...\necho ================================================================\necho.\nnode agent.js\npause\n`;
    const blob = new Blob([batContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'start-agent.bat';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-3xl rounded-2xl p-6 border border-slate-700 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Biometric Hardware Connection Hub</h3>
              <p className="text-xs text-slate-400">Universal support for both Cloud ADMS devices and Local Port 4370 machines</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 gap-3 my-5">
          <button
            onClick={() => setActiveMode('cloud')}
            className={`p-3.5 rounded-xl border text-left transition flex items-start space-x-3 ${
              activeMode === 'cloud'
                ? 'bg-brand-600/20 border-brand-500/40 text-brand-300'
                : 'bg-dark-850 border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            <Globe className="w-5 h-5 mt-0.5 flex-shrink-0 text-brand-400" />
            <div>
              <div className="font-bold text-xs text-white">Mode 1: Direct Cloud ADMS</div>
              <div className="text-[11px] text-slate-400 mt-0.5">BioMax, ZKTeco SpeedFace & eSSL Cloud Series (Native Push)</div>
            </div>
          </button>

          <button
            onClick={() => setActiveMode('agent')}
            className={`p-3.5 rounded-xl border text-left transition flex items-start space-x-3 ${
              activeMode === 'agent'
                ? 'bg-sky-600/20 border-sky-500/40 text-sky-300'
                : 'bg-dark-850 border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            <Layers className="w-5 h-5 mt-0.5 flex-shrink-0 text-sky-400" />
            <div>
              <div className="font-bold text-xs text-white">Mode 2: Local Desktop Sync Agent</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Legacy eSSL X 2008, i9C, K20 on Port 4370 (Local Bridge)</div>
            </div>
          </button>
        </div>

        {/* Mode 1: Cloud ADMS Direct Push */}
        {activeMode === 'cloud' && (
          <div className="space-y-4 text-xs">
            <div className="bg-dark-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="font-bold text-sm text-slate-100 flex items-center space-x-2">
                <Zap className="w-4 h-4 text-brand-400" />
                <span>On-Screen Settings for Cloud Devices:</span>
              </h4>
              <p className="text-slate-400 text-xs">
                In your biometric device menu ➔ <strong>Comm. ➔ Cloud Server Setting (or ADMS / Web Server)</strong>:
              </p>

              <div className="space-y-2 font-mono text-[11px]">
                <div className="flex justify-between items-center p-2.5 rounded-lg bg-dark-900 border border-slate-800">
                  <span className="text-slate-400">Enable Domain Name:</span>
                  <span className="text-emerald-400 font-bold">ON (for Domain) / OFF (for Direct IP)</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-lg bg-dark-900 border border-slate-800">
                  <span className="text-slate-400">Server Address / URL:</span>
                  <span className="text-brand-300 font-bold">{cloudServerDomain}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-lg bg-dark-900 border border-slate-800">
                  <span className="text-slate-400">Direct TCP IP / Port (for HTTP hardware):</span>
                  <span className="text-amber-400 font-bold">{tcpNumericIp} : {tcpPort}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-lg bg-dark-900 border border-slate-800">
                  <span className="text-slate-400">Enable Proxy Server:</span>
                  <span className="text-slate-300">OFF</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-400" />
              <span>No local software or bridge is required. The biometric machine pushes punches straight across the internet to this dashboard.</span>
            </div>
          </div>
        )}

        {/* Mode 2: Local Desktop Sync Agent */}
        {activeMode === 'agent' && (
          <div className="space-y-4 text-xs">
            <div className="bg-dark-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="font-bold text-sm text-slate-100 flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-sky-400" />
                <span>1-Click Local Agent Setup (eSSL X 2008 & Port 4370 Hardware):</span>
              </h4>
              <p className="text-slate-400 text-xs">
                For devices connected via Ethernet to an office reception PC, the agent reads port 4370 and streams punches directly into your cloud dashboard.
              </p>

              {/* Device Selector & IP Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-400 font-semibold">Device Serial Number (SN / ID):</label>
                    <button
                      type="button"
                      onClick={() => setShowSnManual(!showSnManual)}
                      className="inline-flex items-center space-x-1 text-[11px] text-sky-400 hover:text-sky-300 transition"
                      title="How to find your machine's Serial Number on screen"
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
                    className="w-full bg-dark-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                  <datalist id="device-sn-suggestions">
                    {devices.map(d => (
                      <option key={d.id} value={d.serialNumber}>
                        {d.name} ({d.serialNumber})
                      </option>
                    ))}
                  </datalist>

                  {/* Expandable Manual for Serial Number */}
                  {showSnManual && (
                    <div className="mt-2.5 p-3 rounded-xl bg-sky-950/40 border border-sky-500/30 text-sky-200 text-[11px] space-y-1.5 animate-fade-in">
                      <div className="font-bold text-white flex items-center space-x-1.5">
                        <Info className="w-3.5 h-3.5 text-sky-400" />
                        <span>How to find Serial Number on the Machine:</span>
                      </div>
                      <ol className="list-decimal list-inside space-y-1 text-slate-300">
                        <li>Press <strong className="text-white">M/OK</strong> button on the biometric machine.</li>
                        <li>Navigate to <strong className="text-white">System Info ➔ Device Info</strong> (or read the barcode sticker on the back).</li>
                        <li>Look for <strong className="text-sky-300">Serial Number / SN</strong> (e.g. <code className="bg-dark-950 px-1 py-0.5 rounded text-sky-300 font-mono">NFZ8235301513</code>).</li>
                        <li>Type that exact Serial Number into this field.</li>
                      </ol>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-400 font-semibold">Device Local IP (on Ethernet):</label>
                    <button
                      type="button"
                      onClick={() => setShowIpManual(!showIpManual)}
                      className="inline-flex items-center space-x-1 text-[11px] text-sky-400 hover:text-sky-300 transition"
                      title="How to find your machine's IP on screen"
                    >
                      <Info className="w-3.5 h-3.5" />
                      <span>How to find IP?</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={deviceIp}
                    onChange={(e) => setDeviceIp(e.target.value)}
                    placeholder="192.168.137.188"
                    className="w-full bg-dark-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                  />

                  {/* Expandable Manual for Local Ethernet IP */}
                  {showIpManual && (
                    <div className="mt-2.5 p-3 rounded-xl bg-sky-950/40 border border-sky-500/30 text-sky-200 text-[11px] space-y-1.5 animate-fade-in">
                      <div className="font-bold text-white flex items-center space-x-1.5">
                        <Info className="w-3.5 h-3.5 text-sky-400" />
                        <span>Manual: How to get Device IP & Port on screen</span>
                      </div>
                      <ol className="list-decimal list-inside space-y-1 text-slate-300">
                        <li>Press <strong className="text-white">M/OK</strong> button on the eSSL/ZKTeco machine.</li>
                        <li>Navigate to <strong className="text-white">Comm. (Communication) ➔ Ethernet</strong> (or Network).</li>
                        <li>Read the <strong className="text-sky-300">IP Address</strong> field (e.g. <code className="bg-dark-950 px-1 py-0.5 rounded text-sky-300 font-mono">192.168.137.188</code>).</li>
                        <li>Enter that exact number in the box above.</li>
                        <li>Under <strong className="text-white">Comm. ➔ PC Connection</strong>, ensure <strong className="text-emerald-300">TCP Comm.Port</strong> is set to <code className="bg-dark-950 px-1 py-0.5 rounded text-emerald-300 font-mono">4370</code>.</li>
                      </ol>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Downloads */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  onClick={handleDownloadConfig}
                  className="flex items-center space-x-1.5 px-3.5 py-2 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 rounded-lg font-semibold transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download config.json</span>
                </button>

                <button
                  onClick={handleDownloadBat}
                  className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg font-semibold transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download start-agent.bat</span>
                </button>

                <button
                  onClick={() => handleCopy(`cd agent\nnode agent.js`)}
                  className="flex items-center space-x-1.5 px-3.5 py-2 bg-dark-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg font-semibold transition ml-auto"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied Command!' : 'Copy Terminal Command'}</span>
                </button>
              </div>
            </div>

            {/* Terminal Command Snippet */}
            <div className="bg-dark-950 p-3.5 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300">
              <div className="text-slate-500 mb-1"># Run Agent on the Reception / Local PC:</div>
              <div className="text-emerald-400">node agent.js</div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center space-x-1.5">
            <Activity className="w-3.5 h-3.5 text-brand-400" />
            <span>Cloud API Endpoint: <code className="text-slate-400 font-mono">/api/attendance/punch</code></span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
