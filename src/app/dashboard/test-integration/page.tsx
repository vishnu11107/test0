'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Play } from 'lucide-react';
import { toast } from 'sonner';

interface TestResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export default function TestIntegrationPage() {
  const [openaiResult, setOpenaiResult] = useState<TestResult | null>(null);
  const [inngestResult, setInngestResult] = useState<TestResult | null>(null);
  const [postCallResult, setPostCallResult] = useState<TestResult | null>(null);
  const [openaiLoading, setOpenaiLoading] = useState(false);
  const [inngestLoading, setInngestLoading] = useState(false);
  const [postCallLoading, setPostCallLoading] = useState(false);

  const testOpenAI = async () => {
    setOpenaiLoading(true);
    setOpenaiResult(null);

    try {
      const response = await fetch('/api/test/openai');
      const data = await response.json();
      
      setOpenaiResult(data);
      
      if (data.success) {
        toast.success('OpenAI integration test passed!');
      } else {
        toast.error('OpenAI integration test failed');
      }
    } catch (error) {
      const result = {
        success: false,
        message: 'Failed to test OpenAI integration',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      setOpenaiResult(result);
      toast.error('OpenAI test failed');
    } finally {
      setOpenaiLoading(false);
    }
  };

  const testInngest = async () => {
    setInngestLoading(true);
    setInngestResult(null);

    try {
      const response = await fetch('/api/test/inngest', {
        method: 'POST',
      });
      const data = await response.json();
      
      setInngestResult(data);
      
      if (data.success) {
        toast.success('Inngest integration test passed!');
      } else {
        toast.error('Inngest integration test failed');
      }
    } catch (error) {
      const result = {
        success: false,
        message: 'Failed to test Inngest integration',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      setInngestResult(result);
      toast.error('Inngest test failed');
    } finally {
      setInngestLoading(false);
    }
  };

  const testPostCall = async () => {
    setPostCallLoading(true);
    setPostCallResult(null);

    try {
      const response = await fetch('/api/test/post-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Use default sample data
      });
      const data = await response.json();
      
      setPostCallResult(data);
      
      if (data.success) {
        toast.success('Post-call processing test passed!');
      } else {
        toast.error('Post-call processing test failed');
      }
    } catch (error) {
      const result = {
        success: false,
        message: 'Failed to test post-call processing',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      setPostCallResult(result);
      toast.error('Post-call processing test failed');
    } finally {
      setPostCallLoading(false);
    }
  };

  const testAll = async () => {
    await Promise.all([testOpenAI(), testInngest(), testPostCall()]);
  };

  const ResultCard = ({ 
    title, 
    result, 
    loading, 
    onTest 
  }: { 
    title: string; 
    result: TestResult | null; 
    loading: boolean; 
    onTest: () => void;
  }) => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {title}
              {result && (
                result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )
              )}
            </CardTitle>
            <CardDescription>
              Test the {title.toLowerCase()} integration
            </CardDescription>
          </div>
          <Button onClick={onTest} disabled={loading} size="sm">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Test
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {result && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant={result.success ? 'default' : 'destructive'}>
                {result.success ? 'Success' : 'Failed'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {result.message}
              </span>
            </div>
            
            {result.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700 font-medium">Error:</p>
                <p className="text-sm text-red-600">{result.error}</p>
              </div>
            )}
            
            {result.data && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <p className="text-sm font-medium mb-2">Response Data:</p>
                <pre className="text-xs text-gray-600 overflow-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Integration Testing</h1>
        <p className="text-muted-foreground mt-2">
          Test the OpenAI and Inngest integrations to ensure everything is working correctly.
        </p>
      </div>

      <div className="flex gap-4">
        <Button onClick={testAll} disabled={openaiLoading || inngestLoading || postCallLoading}>
          {(openaiLoading || inngestLoading || postCallLoading) ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Play className="h-4 w-4 mr-2" />
          )}
          Test All Integrations
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <ResultCard
          title="OpenAI"
          result={openaiResult}
          loading={openaiLoading}
          onTest={testOpenAI}
        />
        
        <ResultCard
          title="Inngest"
          result={inngestResult}
          loading={inngestLoading}
          onTest={testInngest}
        />

        <ResultCard
          title="Post-Call Processing"
          result={postCallResult}
          loading={postCallLoading}
          onTest={testPostCall}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
          <CardDescription>
            Follow these steps to complete the integration setup
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">1. OpenAI Setup</h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">OpenAI Platform</a></li>
              <li>• Add it to your .env.local file as OPENAI_API_KEY</li>
              <li>• Make sure you have sufficient credits in your OpenAI account</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">2. Inngest Setup</h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Sign up at <a href="https://www.inngest.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Inngest</a></li>
              <li>• Create a new app and get your Event Key and Signing Key</li>
              <li>• Add them to your .env.local file as INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY</li>
              <li>• Configure your app URL in Inngest dashboard: http://localhost:3000/api/inngest</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">3. Environment Variables</h4>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
              <pre className="text-xs text-gray-600">
{`OPENAI_API_KEY="sk-..."
INNGEST_EVENT_KEY="..."
INNGEST_SIGNING_KEY="signkey-..."`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}