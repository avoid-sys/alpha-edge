import React, { useState, useEffect } from 'react';
import { securityService } from '../services/securityService';
import { NeumorphicCard } from './NeumorphicUI';
import { Shield, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function SecurityMonitor() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show for development/admin purposes
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      setAuditLogs(securityService.getAuditLog());
    }
  }, []);

  const getEventIcon = (event) => {
    if (event.includes('failed') || event.includes('blocked')) return <XCircle size={16} className="text-red-500" />;
    if (event.includes('passed') || event.includes('successful')) return <CheckCircle size={16} className="text-green-500" />;
    if (event.includes('started') || event.includes('accessed')) return <Clock size={16} className="text-blue-500" />;
    return <Shield size={16} className="text-gray-500" />;
  };

  const getSeverityColor = (event) => {
    if (event.includes('failed') || event.includes('blocked')) return 'border-red-200 bg-red-50';
    if (event.includes('passed') || event.includes('successful')) return 'border-green-200 bg-green-50';
    return 'border-gray-200 bg-gray-50';
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 p-3 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
        title="Security Monitor"
      >
        <Shield size={20} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96 overflow-hidden">
      <NeumorphicCard className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Shield size={20} />
            Security Monitor
          </h3>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircle size={16} />
          </button>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {auditLogs.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No security events logged</p>
          ) : (
            auditLogs.slice(-10).reverse().map((log, index) => (
              <div
                key={index}
                className={`p-2 rounded border text-xs ${getSeverityColor(log.event)}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {getEventIcon(log.event)}
                  <span className="font-medium capitalize">{log.event.replace(/_/g, ' ')}</span>
                </div>
                <div className="text-gray-600 space-y-1">
                  <div>{new Date(log.timestamp).toLocaleString()}</div>
                  {log.data && Object.keys(log.data).length > 0 && (
                    <div className="text-xs">
                      {Object.entries(log.data).map(([key, value]) => (
                        <div key={key}>{key}: {String(value)}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {auditLogs.length > 0 && (
          <div className="mt-3 pt-2 border-t border-gray-200">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Total Events: {auditLogs.length}</span>
              <button
                onClick={() => setAuditLogs(securityService.getAuditLog())}
                className="text-blue-600 hover:text-blue-800"
              >
                Refresh
              </button>
            </div>
          </div>
        )}
      </NeumorphicCard>
    </div>
  );
}