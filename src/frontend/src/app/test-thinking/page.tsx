'use client';

import React, { useState } from 'react';
import { ThinkingIndicator, THINKING_STEPS } from '@/components/chat/ThinkingIndicator';
import { useThinkingSteps } from '@/hooks/useThinkingSteps';
import { Button } from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card/Card';

export default function TestThinkingPage() {
  const {
    steps,
    isThinking,
    startThinking,
    completeStep,
    errorStep,
    completeThinking,
    resetThinking
  } = useThinkingSteps();

  const [testResults, setTestResults] = useState<Array<{
    type: string;
    duration: number;
    success: boolean;
    timestamp: Date;
    classification?: string;
    message?: string;
  }>>([]);

  const [customMessage, setCustomMessage] = useState('');
  const [stepTiming, setStepTiming] = useState(1000);

  const runTest = (type: keyof typeof THINKING_STEPS, customDetails?: string, message?: string) => {
    const startTime = Date.now();
    startThinking(type);
    
    const stepTemplates = THINKING_STEPS[type];
    let currentStepIndex = 0;

    const progressStep = () => {
      if (currentStepIndex < stepTemplates.length) {
        const step = stepTemplates[currentStepIndex];
        const details = customDetails || getStepDetails(step.id, type);
        completeStep(step.id, details);
        currentStepIndex++;
        
        if (currentStepIndex < stepTemplates.length) {
          setTimeout(progressStep, stepTiming);
        } else {
          setTimeout(() => {
            completeThinking();
            const duration = Date.now() - startTime;
            setTestResults(prev => [...prev, {
              type,
              duration,
              success: true,
              timestamp: new Date(),
              classification: `Classified as: ${type.replace('_', ' ')}`,
              message: message || `Test message for ${type.toLowerCase()}`
            }]);
          }, stepTiming);
        }
      }
    };

    // Start first step after a delay
    setTimeout(progressStep, 500);
  };

  const getStepDetails = (stepId: string, type: string): string => {
    const details = {
      'analyze': `Processing ${type.toLowerCase()} content...`,
      'context': 'Reviewing conversation history...',
      'intent': type === 'BRAIN_DUMP' ? 'Detected complex input (brain dump)' : 'Detected simple request',
      'process': 'Structuring information...',
      'create': 'Creating items...',
      'extract': 'Identifying key points...',
      'categorize': 'Organizing by category...',
      'structure': 'Formatting notes...',
      'tasks': 'Generating action items...',
      'finalize': 'Finalizing organization...',
      'validate': 'Validating details...'
    };
    return details[stepId as keyof typeof details] || 'Processing...';
  };

  const handleTestBrainDump = () => runTest('BRAIN_DUMP', undefined, 'Meeting notes: Discussed new features, need to update database, schedule user testing, and prepare demo for next week');
  const handleTestSimpleTask = () => runTest('SIMPLE_TASK', undefined, 'Create a task to review the quarterly reports');
  const handleTestSimpleNote = () => runTest('SIMPLE_NOTE', undefined, 'Remember to call the client about project updates');
  const handleTestMessageAnalysis = () => runTest('MESSAGE_ANALYSIS', undefined, 'Can you help me organize my thoughts on the new project proposal?');

  const handleTestWithError = () => {
    const startTime = Date.now();
    startThinking('SIMPLE_TASK');
    
    setTimeout(() => completeStep('analyze', 'Analyzing task request...'), 1000);
    setTimeout(() => errorStep('validate', 'Validation failed - invalid input format'), 2000);
    setTimeout(() => {
      completeThinking();
      const duration = Date.now() - startTime;
      setTestResults(prev => [...prev, {
        type: 'SIMPLE_TASK (Error)',
        duration,
        success: false,
        timestamp: new Date()
      }]);
    }, 3000);
  };

  const handleCustomTest = () => {
    if (!customMessage.trim()) return;
    
    // Determine step type based on message content
    const isLongMessage = customMessage.length > 100;
    const hasMultipleItems = customMessage.includes(' and ') || customMessage.includes(',');
    const isMeetingNotes = customMessage.toLowerCase().includes('meeting');
    
    let stepType: keyof typeof THINKING_STEPS = 'MESSAGE_ANALYSIS';
    if (isLongMessage && (hasMultipleItems || isMeetingNotes)) {
      stepType = 'BRAIN_DUMP';
    } else if (customMessage.toLowerCase().includes('task')) {
      stepType = 'SIMPLE_TASK';
    } else if (customMessage.toLowerCase().includes('note')) {
      stepType = 'SIMPLE_NOTE';
    }

    runTest(stepType, `Processing: "${customMessage.substring(0, 50)}${customMessage.length > 50 ? '...' : ''}"`, customMessage);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Thinking UI Test Suite
          </h1>
          <p className="text-muted-foreground mb-8 text-lg">
            Comprehensive testing environment for the AI Thinking UI system
          </p>
        </div>

        {/* Control Panel */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Button 
              onClick={handleTestBrainDump} 
              disabled={isThinking}
              className="h-12"
            >
              🧠 Brain Dump Test
            </Button>
            <Button 
              onClick={handleTestSimpleTask} 
              disabled={isThinking}
              className="h-12"
            >
              ✅ Simple Task Test
            </Button>
            <Button 
              onClick={handleTestSimpleNote} 
              disabled={isThinking}
              className="h-12"
            >
              📝 Simple Note Test
            </Button>
            <Button 
              onClick={handleTestMessageAnalysis} 
              disabled={isThinking}
              className="h-12"
            >
              🔍 Message Analysis Test
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Button 
              onClick={handleTestWithError} 
              disabled={isThinking}
              variant="destructive"
              className="h-12"
            >
              ❌ Error Handling Test
            </Button>
            <Button 
              onClick={resetThinking} 
              variant="outline"
              className="h-12"
            >
              🔄 Reset All
            </Button>
          </div>

          {/* Custom Message Test */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Custom Message Test</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Enter a custom message to test step detection..."
                className="flex-1 px-3 py-2 border border-border rounded-md bg-background"
              />
              <Button 
                onClick={handleCustomTest} 
                disabled={isThinking || !customMessage.trim()}
              >
                Test Custom
              </Button>
            </div>
          </div>

          {/* Step Timing Control */}
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">
              Step Timing: {stepTiming}ms
            </label>
            <input
              type="range"
              min="500"
              max="3000"
              step="250"
              value={stepTiming}
              onChange={(e) => setStepTiming(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Fast (500ms)</span>
              <span>Slow (3000ms)</span>
            </div>
          </div>
        </Card>

        {/* Thinking Indicator Display */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Live Thinking Indicator</h2>
          <div className="space-y-6">
            <ThinkingIndicator
              steps={steps}
              isVisible={isThinking}
              className="mx-auto max-w-2xl"
            />

            {!isThinking && steps.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <div className="text-6xl mb-4">🤖</div>
                <p className="text-lg">Click a test button above to see the thinking UI in action</p>
              </div>
            )}

            {!isThinking && steps.length > 0 && (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">✅</div>
                <p className="text-lg text-green-600 dark:text-green-400">
                  Thinking process completed successfully!
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Test Results */}
        {testResults.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Test Results History</h2>
            <div className="space-y-2">
              {testResults.slice(-10).reverse().map((result, index) => (
                <div 
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    result.success 
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                      : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {result.success ? '✅' : '❌'}
                    </span>
                    <div className="flex-1">
                      <div className="font-medium">{result.type}</div>
                      <div className="text-sm text-muted-foreground">
                        {result.timestamp.toLocaleTimeString()}
                      </div>
                      {result.classification && (
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          {result.classification}
                        </div>
                      )}
                      {result.message && (
                        <div className="text-xs text-muted-foreground mt-1 italic">
                          &quot;{result.message.substring(0, 60)}{result.message.length > 60 ? '...' : ''}&quot;
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-sm font-mono">
                    {result.duration}ms
                  </div>
                </div>
              ))}
            </div>
            {testResults.length > 10 && (
              <p className="text-sm text-muted-foreground mt-2 text-center">
                Showing last 10 results
              </p>
            )}
          </Card>
        )}

        {/* Step Documentation */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Thinking Step Documentation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(THINKING_STEPS).map(([type, steps]) => (
              <div key={type} className="space-y-3">
                <h3 className="font-medium text-lg capitalize">
                  {type.replace('_', ' ').toLowerCase()}
                </h3>
                <div className="space-y-2">
                  {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center gap-3 text-sm">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span>{step.icon}</span>
                          <span className="font-medium">{step.label}</span>
                        </div>
                        <div className="text-xs text-muted-foreground ml-6">
                          ID: {step.id}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Performance Metrics */}
        {testResults.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {testResults.length}
                </div>
                <div className="text-sm text-muted-foreground">Total Tests</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {testResults.filter(r => r.success).length}
                </div>
                <div className="text-sm text-muted-foreground">Successful</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(testResults.reduce((acc, r) => acc + r.duration, 0) / testResults.length)}ms
                </div>
                <div className="text-sm text-muted-foreground">Avg Duration</div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
