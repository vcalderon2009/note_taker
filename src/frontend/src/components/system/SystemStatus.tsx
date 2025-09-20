'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SystemStatusProps {
  className?: string;
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: {
      status: string;
      error?: string;
      details?: Record<string, unknown>;
    };
    ollama: {
      status: string;
      error?: string;
      details?: Record<string, unknown>;
    };
  };
  models: string[];
  system_ready: boolean;
}

export function SystemStatus({ className }: SystemStatusProps) {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiBaseUrl}/api/health`);
        if (!response.ok) {
          throw new Error(`Health check failed: ${response.status}`);
        }
        const data = await response.json();
        setHealth(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
        // Continue checking every 5 seconds until system is ready
        if (!health?.system_ready) {
          setTimeout(checkHealth, 5000);
        }
      }
    };

    checkHealth();
  }, [health?.system_ready]);

  if (isLoading) {
    return (
      <div className={cn(
        "flex items-center gap-2 p-3 bg-muted/50 rounded-lg",
        className
      )}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Checking system status...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(
        "flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg",
        className
      )}>
        <AlertCircle className="h-4 w-4 text-red-500" />
        <span className="text-sm text-red-700">System check failed: {error}</span>
      </div>
    );
  }

  if (!health) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'unhealthy':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'degraded':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'unhealthy':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={cn(
      "space-y-3 p-4 border rounded-lg",
      getStatusColor(health.status),
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon(health.status)}
          <span className="font-medium">
            System Status: {health.status.toUpperCase()}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {new Date(health.timestamp).toLocaleTimeString()}
        </span>
      </div>

      {!health.system_ready && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Initialization Progress:</div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              {getStatusIcon(health.services.database.status)}
              <span>Database: {health.services.database.status}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              {getStatusIcon(health.services.ollama.status)}
              <span>Ollama: {health.services.ollama.status}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              {health.models.length >= 2 ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Clock className="h-4 w-4 text-yellow-500" />
              )}
              <span>Models: {health.models.length}/2 loaded</span>
            </div>
          </div>

          {health.models.length > 0 && (
            <div className="mt-2">
              <div className="text-xs text-muted-foreground mb-1">Available models:</div>
              <div className="flex flex-wrap gap-1">
                {health.models.map((model) => (
                  <span
                    key={model}
                    className="px-2 py-1 bg-white/50 rounded text-xs"
                  >
                    {model}
                  </span>
                ))}
              </div>
            </div>
          )}

          {health.services.ollama.error && (
            <div className="text-xs text-red-600 mt-2">
              Ollama error: {health.services.ollama.error}
            </div>
          )}
        </div>
      )}

      {health.system_ready && (
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>All systems ready! You can start using the application.</span>
        </div>
      )}
    </div>
  );
}
