import React from 'react';
import {
  HelpCircle,
  Radio,
  Server,
  Globe,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Wifi
} from 'lucide-react';

export default function CloudConfigGuideModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-2xl rounded-2xl p-6 border border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">BioMax / eSSL Hardware Setup Guide</h3>
              <p className="text-xs text-slate-400">How to configure your biometric device's ADMS / Cloud Server settings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 space-y-6 text-xs text-slate-300">
          {/* Step 1 */}
          <div className="flex items-start space-x-3.5">
            <div className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
              1
            </div>
            <div>
              <h4 className="font-bold text-slate-100 text-sm">Navigate to Device Cloud / ADMS Settings Menu</h4>
              <p className="text-slate-400 mt-1">
                On the BioMax / eSSL biometric machine screen, press <strong className="text-white">M/OK</strong> (or Menu) &gt; Go to <strong className="text-brand-400">Comm. (Communication)</strong> &gt; Select <strong className="text-brand-400">Cloud Server Setting</strong> (or <em>ADMS / Web Server Setting</em> on older models).
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start space-x-3.5">
            <div className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
              2
            </div>
            <div>
              <h4 className="font-bold text-slate-100 text-sm">Enter Server Address & Port</h4>
              <p className="text-slate-400 mt-1">
                Configure the fields based on your deployment:
              </p>
              <div className="mt-2.5 bg-dark-950 p-3.5 rounded-xl border border-slate-800 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Enable Domain Name:</span>
                  <span className="text-amber-400 font-bold">ON (if using domain/Render/Railway) / OFF (if using IP)</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Server Address / URL:</span>
                  <span className="text-emerald-400 font-bold">your-app.onrender.com (or your Public IP)</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Server Port:</span>
                  <span className="text-sky-400 font-bold">80 or 443 (for HTTPS) / 5000 (Local)</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">Enable Proxy Server:</span>
                  <span className="text-slate-300">OFF</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start space-x-3.5">
            <div className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
              3
            </div>
            <div>
              <h4 className="font-bold text-slate-100 text-sm">Register Device Serial Number in Dashboard</h4>
              <p className="text-slate-400 mt-1">
                Check the serial number on the device (or in <strong className="text-white">Menu &gt; System Info &gt; Device Info &gt; Serial Number</strong>). Register this exact serial number in this dashboard and assign it to the correct tenant company.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex items-start space-x-3.5">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
              ✓
            </div>
            <div>
              <h4 className="font-bold text-emerald-400 text-sm">Automatic Ingestion Active!</h4>
              <p className="text-slate-400 mt-1">
                The device will automatically initiate a handshake with <code className="text-slate-200 font-mono">/iclock/cdata</code>. Whenever an employee punches in or out, the record will push to this cloud server and appear instantly in the live feed.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold transition"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
