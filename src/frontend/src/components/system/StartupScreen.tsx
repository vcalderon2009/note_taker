'use client';

import React from 'react';
import { Loader2, Database, Brain, CheckCircle, AlertCircle } from 'lucide-react';
import { useSystemStatus } from '@/hooks/useSystemStatus';
import { cn } from '@/lib/utils';

interface StartupScreenProps {
  className?: string;
}

export function StartupScreen({ className }: StartupScreenProps) {
  const { health, isLoading, error, isReady } = useSystemStatus(3000);

  if (isReady) {
    return null; // Don't show startup screen when ready
  }

  return (
    <div className={cn(
      "fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center",
      className
    )}>
      <div className="max-w-md w-full mx-4">
        <div className="bg-card border rounded-lg p-6 shadow-lg">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-4">
              <Brain className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Note-Taker AI</h1>
            <p className="text-muted-foreground">
              Initializing AI models and services...
            </p>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Checking system status...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-700">Error: {error}</span>
            </div>
          )}

          {health && (
            <div className="space-y-3">
              <div className="text-sm font-medium mb-3">System Status:</div>
              
              <div className="space-y-2">
                <ServiceStatus
                  icon={<Database className="h-4 w-4" />}
                  name="Database"
                  status={health.services.database.status}
                  error={health.services.database.error}
                />
                
                <ServiceStatus
                  icon={<Brain className="h-4 w-4" />}
                  name="Ollama AI"
                  status={health.services.ollama.status}
                  error={health.services.ollama.error}
                />
                
                <ServiceStatus
                  icon={<Brain className="h-4 w-4" />}
                  name="AI Models"
                  status={health.models.length >= 2 ? 'healthy' : 'degraded'}
                  error={health.models.length < 2 ? `Only ${health.models.length}/2 models loaded` : undefined}
                />
              </div>

              {health.models.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs text-muted-foreground mb-2">Available models:</div>
                  <div className="flex flex-wrap gap-1">
                    {health.models.map((model) => (
                      <span
                        key={model}
                        className="px-2 py-1 bg-muted rounded text-xs"
                      >
                        {model}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 text-xs text-muted-foreground text-center">
                Last updated: {new Date(health.timestamp).toLocaleTimeString()}
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <div className="text-sm text-muted-foreground">
              This may take a few minutes on first startup while models are downloaded.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ServiceStatusProps {
  icon: React.ReactNode;
  name: string;
  status: string;
  error?: string;
}

function ServiceStatus({ icon, name, status, error }: ServiceStatusProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'unhealthy':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin text-gray-500" />;
    }
  };


  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
      {icon}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{name}</span>
          {getStatusIcon()}
        </div>
        {error && (
          <div className="text-xs text-muted-foreground mt-1">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
