import React, { useState, useEffect } from 'react';
import { Activity, Database, HardDrive, Clock, AlertTriangle, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

interface SystemStats {
  timestamp: string;
  uptime: number | null;
  environment: string;
  performance: {
    metrics: Record<string, any>;
    slowOperations: Array<{
      name: string;
      duration: number;
      timestamp: number;
    }>;
    memory: {
      heapUsed: number;
      heapTotal: number;
      external: number;
      rss: number;
    } | null;
  };
  cache: {
    total: number;
    active: number;
    expired: number;
    tags: number;
  };
  logging: {
    total: number;
    byLevel: {
      debug: number;
      info: number;
      warn: number;
      error: number;
      fatal: number;
    };
    recentErrors: Array<{
      timestamp: string;
      message: string;
      error?: string;
    }>;
  };
  database: {
    status: string;
    responseTime?: number;
    stats?: {
      users: number;
      courses: number;
      assignments: number;
      exams: number;
      conversations: number;
      notifications: number;
    };
    error?: string;
  };
}

export const SystemMonitor: React.FC = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/system/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch system stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching system stats:', error);
      toast.error('Không thể tải thống kê hệ thống');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const formatUptime = (seconds: number | null): string => {
    if (seconds === null) return 'N/A';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatBytes = (mb: number): string => {
    if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
    return `${mb.toFixed(2)} MB`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Đang tải thống kê hệ thống..." />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-600">Không thể tải thống kê hệ thống</p>
          <button
            onClick={fetchStats}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Giám sát hệ thống</h1>
          <p className="text-gray-600 mt-1">
            Cập nhật lần cuối: {new Date(stats.timestamp).toLocaleString('vi-VN')}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-600">Tự động làm mới</span>
          </label>
          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Làm mới
          </button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-6 h-6 text-blue-500" />
            <h3 className="font-semibold text-gray-900">Thời gian hoạt động</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatUptime(stats.uptime)}</p>
          <p className="text-sm text-gray-600 mt-1">Môi trường: {stats.environment}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Database className="w-6 h-6 text-green-500" />
            <h3 className="font-semibold text-gray-900">Cơ sở dữ liệu</h3>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(stats.database.status)}
            <p className="text-lg font-semibold capitalize">{stats.database.status}</p>
          </div>
          {stats.database.responseTime && (
            <p className="text-sm text-gray-600 mt-1">
              Thời gian phản hồi: {stats.database.responseTime}ms
            </p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <HardDrive className="w-6 h-6 text-purple-500" />
            <h3 className="font-semibold text-gray-900">Bộ nhớ</h3>
          </div>
          {stats.performance.memory ? (
            <>
              <p className="text-2xl font-bold text-gray-900">
                {formatBytes(stats.performance.memory.heapUsed)}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                / {formatBytes(stats.performance.memory.heapTotal)}
              </p>
            </>
          ) : (
            <p className="text-gray-600">N/A</p>
          )}
        </div>
      </div>

      {/* Database Statistics */}
      {stats.database.stats && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Database className="w-6 h-6" />
            Thống kê dữ liệu
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">{stats.database.stats.users}</p>
              <p className="text-sm text-gray-600 mt-1">Người dùng</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{stats.database.stats.courses}</p>
              <p className="text-sm text-gray-600 mt-1">Khóa học</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-3xl font-bold text-purple-600">{stats.database.stats.assignments}</p>
              <p className="text-sm text-gray-600 mt-1">Bài tập</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-3xl font-bold text-orange-600">{stats.database.stats.exams}</p>
              <p className="text-sm text-gray-600 mt-1">Bài kiểm tra</p>
            </div>
          </div>
        </div>
      )}

      {/* Cache Statistics */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6" />
          Bộ nhớ đệm
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Tổng số</p>
            <p className="text-2xl font-bold text-gray-900">{stats.cache.total}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Đang hoạt động</p>
            <p className="text-2xl font-bold text-green-600">{stats.cache.active}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Đã hết hạn</p>
            <p className="text-2xl font-bold text-red-600">{stats.cache.expired}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Tags</p>
            <p className="text-2xl font-bold text-blue-600">{stats.cache.tags}</p>
          </div>
        </div>
      </div>

      {/* Logging Statistics */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-6 h-6" />
          Nhật ký hệ thống
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600">Tổng số</p>
            <p className="text-2xl font-bold text-gray-900">{stats.logging.total}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Info</p>
            <p className="text-2xl font-bold text-blue-600">{stats.logging.byLevel.info}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Warning</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.logging.byLevel.warn}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Error</p>
            <p className="text-2xl font-bold text-red-600">{stats.logging.byLevel.error}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Fatal</p>
            <p className="text-2xl font-bold text-red-800">{stats.logging.byLevel.fatal}</p>
          </div>
        </div>

        {stats.logging.recentErrors.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold text-gray-900 mb-2">Lỗi gần đây</h3>
            <div className="space-y-2">
              {stats.logging.recentErrors.map((error, index) => (
                <div key={index} className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm font-medium text-red-900">{error.message}</p>
                  {error.error && (
                    <p className="text-xs text-red-700 mt-1">{error.error}</p>
                  )}
                  <p className="text-xs text-gray-600 mt-1">
                    {new Date(error.timestamp).toLocaleString('vi-VN')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Slow Operations */}
      {stats.performance.slowOperations.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
            Thao tác chậm
          </h2>
          <div className="space-y-2">
            {stats.performance.slowOperations.map((op, index) => (
              <div key={index} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">{op.name}</p>
                  <p className="text-sm font-bold text-yellow-700">{Math.round(op.duration)}ms</p>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {new Date(op.timestamp).toLocaleString('vi-VN')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemMonitor;
