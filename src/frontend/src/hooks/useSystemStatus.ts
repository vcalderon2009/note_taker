'use client';

import { useState, useEffect, useCallback } from 'react';

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

interface UseSystemStatusReturn {
  health: HealthStatus | null;
  isLoading: boolean;
  error: string | null;
  isReady: boolean;
  checkHealth: () => Promise<void>;
}

export function useSystemStatus(intervalMs: number = 5000): UseSystemStatusReturn {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = useCallback(async () => {
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
    }
  }, []);

  useEffect(() => {
    checkHealth();

    // Set up polling if system is not ready
    const interval = setInterval(() => {
      if (!health?.system_ready) {
        checkHealth();
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [checkHealth, health?.system_ready, intervalMs]);

  return {
    health,
    isLoading,
    error,
    isReady: health?.system_ready ?? false,
    checkHealth,
  };
}
