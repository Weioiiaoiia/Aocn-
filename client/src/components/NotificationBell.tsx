/*
 * AOCN Notification Bell — Real-time alert indicator
 * Shows new SBT updates, price changes, and activity alerts
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { Bell, X, TrendingUp, Shield, Zap, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { connectSSE, type RealTimeEvent } from '@/lib/api';

interface Notification {
  id: string;
  type: 'arbitrage' | 'sbt' | 'price' | 'activity';
  title: string;
  titleEn: string;
  message: string;
  messageEn: string;
  timestamp: Date;
  read: boolean;
}

const MAX_NOTIFICATIONS = 20;

export default function NotificationBell() {
  const { t } = useLang();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const sseRef = useRef<EventSource | null>(null);

  // Close panel on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Add notification helper
  const addNotification = useCallback((notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: Notification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, MAX_NOTIFICATIONS));
    setUnreadCount(prev => prev + 1);
  }, []);

  // Connect to SSE for real-time events
  useEffect(() => {
    const handleSSEEvent = (event: RealTimeEvent) => {
      if (event.type === 'arbitrage_alert' && event.cardName) {
        addNotification({
          type: 'arbitrage',
          title: `套利机会: ${event.cardName}`,
          titleEn: `Arbitrage: ${event.cardName}`,
          message: `价差 +${event.spreadPct?.toFixed(1)}% ($${event.price?.toFixed(2)} → FMV $${event.fmv?.toFixed(2)})`,
          messageEn: `Spread +${event.spreadPct?.toFixed(1)}% ($${event.price?.toFixed(2)} → FMV $${event.fmv?.toFixed(2)})`,
        });
      } else if (event.type === 'sbt_update') {
        addNotification({
          type: 'sbt',
          title: 'SBT 更新',
          titleEn: 'SBT Update',
          message: event.message || '新的 SBT 数据已更新',
          messageEn: event.message || 'New SBT data updated',
        });
      }
    };

    sseRef.current = connectSSE(handleSSEEvent);

    return () => {
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
    };
  }, [addNotification]);

  // Periodic simulated activity updates (for demo when SSE not available)
  useEffect(() => {
    const timer = setInterval(() => {
      // Only add if no SSE connection
      if (!sseRef.current || sseRef.current.readyState !== EventSource.OPEN) {
        // Silently skip — no fake notifications
      }
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'arbitrage': return <TrendingUp className="w-3.5 h-3.5 text-green-500" />;
      case 'sbt': return <Shield className="w-3.5 h-3.5 text-purple-500" />;
      case 'price': return <Zap className="w-3.5 h-3.5 text-amber-500" />;
      default: return <Clock className="w-3.5 h-3.5 text-blue-500" />;
    }
  };

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    if (diff < 60000) return t('刚刚', 'Just now');
    if (diff < 3600000) return `${Math.floor(diff / 60000)}${t('分钟前', 'm ago')}`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}${t('小时前', 'h ago')}`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) markAllRead();
        }}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
        title={t('通知', 'Notifications')}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-80 max-h-96 rounded-xl border border-border bg-background shadow-xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">{t('通知', 'Notifications')}</h3>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t('清空', 'Clear')}
                  </button>
                )}
                <button onClick={() => setIsOpen(false)}>
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="overflow-y-auto max-h-72">
              {notifications.length === 0 ? (
                <div className="py-8 text-center">
                  <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">{t('暂无通知', 'No notifications')}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                    {t('实时事件将在这里显示', 'Real-time events will appear here')}
                  </p>
                </div>
              ) : (
                notifications.map((notif, i) => (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`px-4 py-3 border-b border-border/50 hover:bg-secondary/50 transition-colors ${
                      !notif.read ? 'bg-primary/[0.02]' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 shrink-0">{getIcon(notif.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">
                          {t(notif.title, notif.titleEn)}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                          {t(notif.message, notif.messageEn)}
                        </p>
                        <p className="text-[9px] text-muted-foreground/60 mt-1">
                          {formatTime(notif.timestamp)}
                        </p>
                      </div>
                      {!notif.read && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
