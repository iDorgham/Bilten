import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Scatter, ScatterChart, FunnelChart, Funnel
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, TrendingUp, Users, Eye, MousePointer, Target, Activity, Download } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const AdvancedAnalyticsDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('24h');
  const [realTimeData, setRealTimeData] = useState(null);
  const [userJourneyData, setUserJourneyData] = useState(null);
  const [funnelData, setFunnelData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRealTimeData();
    const interval = setInterval(fetchRealTimeData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchRealTimeData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/tracking/real-time?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setRealTimeData(data.data);
      }
    } catch (error) {
      console.error('Error fetching real-time data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserJourney = async (userId) => {
    try {
      const response = await fetch(`/api/v1/tracking/user-journey/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setUserJourneyData(data.data);
      }
    } catch (error) {
      console.error('Error fetching user journey:', error);
    }
  };

  const fetchFunnelAnalysis = async () => {
    try {
      const funnelConfig = {
        funnelSteps: [
          { name: 'Page View', eventType: 'page_view' },
          { name: 'Event View', eventType: 'event_view' },
          { name: 'Add to Cart', eventType: 'add_to_cart' },
          { name: 'Purchase', eventType: 'purchase' }
        ],
        timeRange: '30d'
      };

      const response = await fetch('/api/v1/tracking/funnel-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(funnelConfig)
      });
      const data = await response.json();
      if (data.success) {
        setFunnelData(data.data);
      }
    } catch (error) {
      console.error('Error fetching funnel analysis:', error);
    }
  };

  const exportAnalyticsData = async (dataType, format = 'json') => {
    try {
      const response = await fetch('/api/v1/tracking/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          dataType,
          format,
          dateRange: {
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date().toISOString()
          }
        })
      });
      const data = await response.json();
      if (data.success) {
        // Download the file
        const blob = new Blob([format === 'csv' ? data.data.data : JSON.stringify(data.data.data, null, 2)], {
          type: format === 'csv' ? 'text/csv' : 'application/json'
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.data.fileName;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const renderRealTimeMetrics = () => {
    if (!realTimeData) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Sessions</p>
                <p className="text-2xl font-bold">{realTimeData.activeSessions}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold">
                  {realTimeData.realTimeActivity?.reduce((sum, item) => sum + item.count, 0) || 0}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conversions</p>
                <p className="text-2xl font-bold">
                  {realTimeData.realTimeConversions?.reduce((sum, item) => sum + item.count, 0) || 0}
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
                <p className="text-2xl font-bold">
                  {realTimeData.performanceMetrics?.length > 0 
                    ? Math.round(realTimeData.performanceMetrics.reduce((sum, item) => sum + item.avg_response_time, 0) / realTimeData.performanceMetrics.length)
                    : 0}ms
                </p>
              </div>
              <Eye className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderRealTimeCharts = () => {
    if (!realTimeData) return null;

    const activityData = realTimeData.realTimeActivity?.map(item => ({
      time: new Date(item.time_bucket).toLocaleTimeString(),
      count: item.count,
      type: item.event_type
    })) || [];

    const conversionData = realTimeData.realTimeConversions?.map(item => ({
      time: new Date(item.time_bucket).toLocaleTimeString(),
      count: item.count,
      value: item.total_value,
      type: item.conversion_type
    })) || [];

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Real-Time Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#0088FE" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Real-Time Conversions</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={conversionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="count" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                <Area type="monotone" dataKey="value" stackId="2" stroke="#8884d8" fill="#8884d8" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderFunnelAnalysis = () => {
    if (!funnelData) return null;

    const funnelChartData = funnelData.funnelSteps.map((step, index) => ({
      name: step.step,
      value: step.count,
      fill: COLORS[index % COLORS.length]
    }));

    return (
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
          <p className="text-sm text-muted-foreground">
            Overall conversion rate: {funnelData.overallConversionRate}%
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <FunnelChart>
              <Tooltip />
              <Funnel
                dataKey="value"
                data={funnelChartData}
                isAnimationActive
                labelFormatter={(value) => `${value} users`}
              />
            </FunnelChart>
          </ResponsiveContainer>
          
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {funnelData.funnelSteps.map((step, index) => (
              <div key={index} className="text-center">
                <p className="text-sm font-medium">{step.step}</p>
                <p className="text-2xl font-bold text-blue-600">{step.count}</p>
                <p className="text-xs text-muted-foreground">
                  {step.conversionRate}% conversion
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderUserJourney = () => {
    if (!userJourneyData) return null;

    const journeyData = userJourneyData.userActivity.map((activity, index) => ({
      step: index + 1,
      event: activity.event_type,
      page: activity.page_url,
      time: new Date(activity.created_at).toLocaleTimeString()
    }));

    return (
      <Card>
        <CardHeader>
          <CardTitle>User Journey Analysis</CardTitle>
          <p className="text-sm text-muted-foreground">
            User: {userJourneyData.userId} | Total Sessions: {userJourneyData.totalSessions}
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={journeyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="step" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="step" fill="#8884d8" />
              <Line type="monotone" dataKey="step" stroke="#ff7300" />
            </ComposedChart>
          </ResponsiveContainer>
          
          <div className="mt-4">
            <h4 className="font-medium mb-2">Journey Details</h4>
            <div className="space-y-2">
              {journeyData.map((item, index) => (
                <div key={index} className="flex items-center space-x-4 p-2 bg-gray-50 rounded">
                  <Badge variant="secondary">{item.step}</Badge>
                  <span className="font-medium">{item.event}</span>
                  <span className="text-sm text-muted-foreground">{item.page}</span>
                  <span className="text-sm text-muted-foreground">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderPerformanceMetrics = () => {
    if (!realTimeData?.performanceMetrics) return null;

    const performanceData = realTimeData.performanceMetrics.map(item => ({
      endpoint: item.endpoint,
      avgResponseTime: item.avg_response_time,
      requestCount: item.request_count,
      errorCount: item.error_count,
      errorRate: item.request_count > 0 ? (item.error_count / item.request_count * 100).toFixed(2) : 0
    }));

    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="endpoint" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="avgResponseTime" fill="#8884d8" name="Avg Response Time (ms)" />
              <Bar dataKey="errorRate" fill="#ff8042" name="Error Rate (%)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Advanced Analytics Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive tracking and analytics insights</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">1 Hour</SelectItem>
              <SelectItem value="6h">6 Hours</SelectItem>
              <SelectItem value="24h">24 Hours</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={() => exportAnalyticsData('user_activity', 'csv')} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="real-time">Real-Time</TabsTrigger>
          <TabsTrigger value="funnel">Funnel Analysis</TabsTrigger>
          <TabsTrigger value="journey">User Journey</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {renderRealTimeMetrics()}
          {renderRealTimeCharts()}
          {renderPerformanceMetrics()}
        </TabsContent>

        <TabsContent value="real-time" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Real-Time Analytics</h2>
            <Button onClick={fetchRealTimeData} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
          {renderRealTimeMetrics()}
          {renderRealTimeCharts()}
          {renderPerformanceMetrics()}
        </TabsContent>

        <TabsContent value="funnel" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Conversion Funnel Analysis</h2>
            <Button onClick={fetchFunnelAnalysis}>Analyze Funnel</Button>
          </div>
          {renderFunnelAnalysis()}
        </TabsContent>

        <TabsContent value="journey" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">User Journey Analysis</h2>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Enter User ID"
                className="px-3 py-2 border rounded"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    fetchUserJourney(e.target.value);
                  }
                }}
              />
              <Button onClick={() => {
                const userId = document.querySelector('input[placeholder="Enter User ID"]').value;
                if (userId) fetchUserJourney(userId);
              }}>
                Analyze Journey
              </Button>
            </div>
          </div>
          {renderUserJourney()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;
