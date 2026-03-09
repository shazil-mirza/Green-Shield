
import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { DetectionAnalyticsData, SubscriptionAnalyticsData } from '../types';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';
import { BarChart2, PieChart, Users, Activity, RefreshCw } from 'lucide-react';

const AdminAnalyticsPage: React.FC = () => {
  const [detectionAnalytics, setDetectionAnalytics] = useState<DetectionAnalyticsData | null>(null);
  const [subscriptionAnalytics, setSubscriptionAnalytics] = useState<SubscriptionAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [detData, subData] = await Promise.all([
        apiService.get<DetectionAnalyticsData>('/admin/analytics/detections'),
        apiService.get<SubscriptionAnalyticsData>('/admin/analytics/subscriptions')
      ]);
      setDetectionAnalytics(detData);
      setSubscriptionAnalytics(subData);
    } catch (err: any) {
      setError(err.data?.message || err.message || "Failed to load analytics data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode, details?: string }> = ({ title, value, icon, details }) => (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4">
      <div className="p-3 bg-primary rounded-full text-white">
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-neutral">{value}</p>
        {details && <p className="text-xs text-gray-400">{details}</p>}
      </div>
    </div>
  );

  if (isLoading && !detectionAnalytics && !subscriptionAnalytics) {
    return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-primary flex items-center">
          <BarChart2 size={32} className="mr-3 text-green-600" /> Application Analytics
        </h1>
         <button
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-md text-sm transition-colors disabled:opacity-50"
        >
            <RefreshCw size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Refresh Data
        </button>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {isLoading && (detectionAnalytics || subscriptionAnalytics) && <div className="my-4"><Spinner/></div>}


      {/* Detection Analytics Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-neutral flex items-center"><Activity size={24} className="mr-2 text-accent"/>Detection Statistics</h2>
        {detectionAnalytics ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard title="Total Detections" value={detectionAnalytics.totalDetections} icon={<Activity size={24} />} />
            <StatCard title="Registered Users" value={detectionAnalytics.totalUsers} icon={<Users size={24} />} />
            {/* Placeholder for another key stat or specific disease */}
            {Object.keys(detectionAnalytics.detectionsPerDisease).length > 0 ? (
                 <StatCard 
                    title="Most Common Disease" 
                    value={Object.entries(detectionAnalytics.detectionsPerDisease).sort(([,a],[,b]) => b-a)[0][0]} 
                    icon={<PieChart size={24} />} 
                    details={`${Object.entries(detectionAnalytics.detectionsPerDisease).sort(([,a],[,b]) => b-a)[0][1]} detections`}
                />
            ) : (
                 <StatCard title="Most Common Disease" value="N/A" icon={<PieChart size={24}/>} details="No detections yet"/>
            )}
          </div>
        ) : (
          <p className="text-gray-500">Detection analytics data is not available.</p>
        )}
        {detectionAnalytics && Object.keys(detectionAnalytics.detectionsPerDisease).length > 0 && (
            <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-neutral mb-3">Detections Per Disease</h3>
                <div className="max-h-80 overflow-y-auto">
                    <ul className="divide-y divide-gray-200">
                        {Object.entries(detectionAnalytics.detectionsPerDisease)
                            .sort(([, countA], [, countB]) => countB - countA) // Sort by count descending
                            .map(([disease, count]) => (
                            <li key={disease} className="py-3 flex justify-between items-center">
                                <span className="text-gray-700">{disease}</span>
                                <span className="font-semibold text-primary px-2 py-1 bg-green-50 rounded-full text-sm">{count}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        )}
      </section>

      {/* Subscription Analytics Section */}
      <section className="space-y-4 mt-10">
        <h2 className="text-2xl font-semibold text-neutral flex items-center"><Users size={24} className="mr-2 text-blue-500"/>Subscription Statistics</h2>
        {subscriptionAnalytics ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard title="Active Premium Subscribers" value={subscriptionAnalytics.totalActivePremiumSubscribers} icon={<Users size={24} />} />
            {/* Add more subscription stats if available */}
          </div>
        ) : (
          <p className="text-gray-500">Subscription analytics data is not available.</p>
        )}
      </section>
    </div>
  );
};

export default AdminAnalyticsPage;
