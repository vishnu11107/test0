'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function TestMeetingPage() {
  const [loading, setLoading] = useState(false);
  const [demoData, setDemoData] = useState<any>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  const createDemoData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test/create-demo-data', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        setDemoData(data.data);
        toast.success('Demo data created successfully!');
      } else {
        toast.error('Failed to create demo data');
      }
    } catch (error) {
      toast.error('Error creating demo data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setLoginLoading(true);
    try {
      const response = await fetch('/api/test/login', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        setIsLoggedIn(true);
        toast.success('Test login successful! You can now use the dashboard.');
      } else {
        toast.error('Test login failed');
      }
    } catch (error) {
      toast.error('Error during test login');
      console.error(error);
    } finally {
      setLoginLoading(false);
    }
  };

  const startMeeting = (meetingId: string) => {
    router.push(`/test-call/${meetingId}`);
  };

  const startDashboardMeeting = (meetingId: string) => {
    router.push(`/dashboard/meetings/${meetingId}/call`);
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Test Meeting Setup</h1>
        <p className="text-muted-foreground mt-2">
          Create demo data and test the meeting functionality.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Step 1: Create Demo Data & Login</CardTitle>
          <CardDescription>
            Create demo data and optionally log in to test the full dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={createDemoData} disabled={loading}>
            {loading ? 'Creating...' : 'Create Demo Data'}
          </Button>
          
          <Button 
            onClick={testLogin} 
            disabled={loginLoading}
            variant="outline"
          >
            {loginLoading ? 'Logging in...' : 'Test Login (for Dashboard)'}
          </Button>
          
          {isLoggedIn && (
            <p className="text-sm text-green-600">
              ✅ Logged in as demo user! You can now use dashboard features.
            </p>
          )}
        </CardContent>
      </Card>

      {demoData && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Test Meetings</CardTitle>
            <CardDescription>
              Demo data created! You can now test the meetings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Created User:</h4>
              <p className="text-sm text-muted-foreground">
                {demoData.user.name} ({demoData.user.email})
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Created Agents:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {demoData.agents.map((agent: any) => (
                  <li key={agent.id}>• {agent.name}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Created Meetings:</h4>
              <div className="space-y-2">
                {demoData.meetings.map((meeting: any) => (
                  <div key={meeting.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{meeting.name}</p>
                      <p className="text-sm text-muted-foreground">ID: {meeting.id}</p>
                    </div>
                    <div className="space-x-2">
                      <Button 
                        size="sm" 
                        onClick={() => startMeeting(meeting.id)}
                      >
                        Test Call
                      </Button>
                      {isLoggedIn && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => startDashboardMeeting(meeting.id)}
                        >
                          Dashboard Call
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => window.open(`/api/debug/meeting/${meeting.id}`, '_blank')}
                      >
                        Debug
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Direct Meeting Links</CardTitle>
          <CardDescription>
            If you already have meeting IDs, you can test them directly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard/test-integration')}
            >
              Test OpenAI Integration
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard/meetings')}
            >
              Go to Meetings Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}