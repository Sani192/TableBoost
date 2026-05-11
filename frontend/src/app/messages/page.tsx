'use client';
import { useEffect, useState } from 'react';
import { getMessageLogs, MessageLogResponse } from '@/lib/api';
import { Star, Megaphone } from 'lucide-react';

export default function MessagesPage() {
  const [logs, setLogs] = useState<MessageLogResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMessageLogs().then(setLogs).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold text-stone-900">Message Logs</h1>
      </header>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-stone-100 rounded-xl"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map(log => (
            <div key={log.id} className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold text-stone-900">{log.customer_name || log.phone_number}</p>
                  <p className="text-xs text-stone-500">{new Date(log.sent_at).toLocaleString()}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-bold rounded-full ${log.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {log.status.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-stone-700 bg-stone-50 p-2 rounded">{log.message_text}</p>
              <div className="mt-3 flex items-center">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold border ${
                  log.type === 'review' 
                    ? 'bg-blue-50 text-blue-700 border-blue-200' 
                    : log.type === 'campaign' 
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : 'bg-stone-50 text-stone-700 border-stone-200'
                }`}>
                  {log.type === 'review' ? <Star className="w-3 h-3" /> : log.type === 'campaign' ? <Megaphone className="w-3 h-3" /> : null}
                  {log.type.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
