/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ActivityNotification } from '../types.js';
import { 
  Sparkles, 
  Send, 
  FileCheck, 
  FileWarning, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock 
} from 'lucide-react';

interface ActivityFeedProps {
  notifications: ActivityNotification[];
  onMarkRead: (id: string) => void;
}

export default function ActivityFeed({ notifications, onMarkRead }: ActivityFeedProps) {
  
  // Icon and color mapper based on notification action types
  const getNotificationIcon = (type: ActivityNotification['type']) => {
    switch (type) {
      case 'match':
        return <Sparkles className="w-4 h-4 text-[#F8C463]" />;
      case 'auto_fill':
        return <FileCheck className="w-4 h-4 text-[#F8C463]" />;
      case 'submission':
        return <Send className="w-4 h-4 text-[#81912F]" />;
      case 'status_change':
        return <Clock className="w-4 h-4 text-[#F8C463]" />;
      case 'doc_request':
        return <FileWarning className="w-4 h-4 text-[#E03F4F]" />;
      case 'approval':
        return <CheckCircle className="w-4 h-4 text-[#81912F] animate-bounce" />;
      case 'denial':
        return <XCircle className="w-4 h-4 text-[#E03F4F]" />;
      default:
        return <AlertCircle className="w-4 h-4 text-[#181C06]" />;
    }
  };

  const getSeverityColors = (severity: ActivityNotification['severity']) => {
    switch (severity) {
      case 'success':
        return {
          bg: 'rgba(129, 145, 47, 0.08)',
          border: 'border-[#81912F]',
          text: 'text-[#81912F]'
        };
      case 'warning':
        return {
          bg: 'rgba(248, 196, 99, 0.08)',
          border: 'border-[#F8C463]',
          text: 'text-[#181C06]'
        };
      case 'alert':
        return {
          bg: 'rgba(224, 63, 79, 0.08)',
          border: 'border-[#E03F4F]',
          text: 'text-[#E03F4F]'
        };
      case 'info':
      default:
        return {
          bg: 'rgba(129, 145, 47, 0.04)',
          border: 'border-opacity-20 border-[#181C06]',
          text: 'text-[#181C06]'
        };
    }
  };

  return (
    <div className="bg-[#FFFAF0] border-2 border-[#81912F] border-opacity-30 rounded-xl overflow-hidden shadow-sm flex flex-col h-full">
      
      {/* Feed Header */}
      <div className="p-4 bg-[#FFFAF0] border-b border-[#81912F] border-opacity-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#E03F4F]" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#181C06]">
            Agent Live activity Logs
          </h2>
        </div>
        <span className="text-[10px] font-bold bg-[#E03F4F] text-[#FFFAF0] px-2 py-0.5 rounded-full animate-pulse">
          Live stream
        </span>
      </div>

      {/* Live Stream Body Container */}
      <div className="flex-grow p-4 overflow-y-auto space-y-3.5 max-h-[480px]">
        {notifications.length === 0 ? (
          <div className="text-center py-16 text-xs text-[#181C06] opacity-60 flex flex-col items-center justify-center space-y-2">
            <Clock className="w-8 h-8 text-[#81912F] opacity-40 animate-pulse" />
            <span className="font-semibold">Awaiting Agent Initialization...</span>
            <span className="text-[10px] leading-relaxed max-w-xs block">
              Complete your profile intake details to trigger eligibility matching and live agent submission sequences.
            </span>
          </div>
        ) : (
          notifications.map((notif, idx) => {
            const colors = getSeverityColors(notif.severity);
            const isUnread = notif.status === 'unread';
            
            return (
              <div
                id={`notif-${notif.id}`}
                key={notif.id}
                onClick={() => onMarkRead(notif.id)}
                className={`group border-l-4 rounded-r-xl p-4 transition-all duration-300 relative overflow-hidden cursor-pointer ${
                  colors.bg
                } ${colors.border} ${
                  isUnread ? 'translate-x-1 border-opacity-100 shadow-[0_2px_10px_rgba(24,28,6,0.05)]' : 'opacity-85 hover:opacity-100'
                } ${idx === 0 ? 'animate-slide-in-top' : ''}`}
              >
                {/* Visual Unread Glow */}
                {isUnread && (
                  <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#E03F4F] rounded-bl-lg"></div>
                )}

                <div className="flex gap-3">
                  {/* Icon */}
                  <div className="w-8 h-8 rounded-lg bg-[#FFFAF0] border border-opacity-15 border-[#181C06] flex items-center justify-center flex-shrink-0 shadow-sm">
                    {getNotificationIcon(notif.type)}
                  </div>

                  {/* Text Details */}
                  <div className="flex-grow">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-[#181C06]">
                        {notif.title}
                      </h4>
                      <span className="text-[9px] font-semibold text-[#181C06] opacity-50 flex-shrink-0">
                        {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#181C06] opacity-80 mt-1 leading-relaxed">
                      {notif.message}
                    </p>

                    {isUnread && (
                      <span className="inline-block mt-2 text-[9px] font-bold text-[#E03F4F] uppercase tracking-wider group-hover:underline">
                        Mark as read
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
