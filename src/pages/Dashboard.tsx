import React, { useState, useEffect } from 'react';
import { supabase, DashboardStats, IssuerPerformance } from '../lib/supabase';
import { 
  Ticket, 
  DollarSign, 
  BookOpen, 
  TrendingUp, 
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  RotateCcw
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [issuerPerformance, setIssuerPerformance] = useState<IssuerPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // For now, use mock data since Supabase isn't configured
      const mockStats = {
        total_tickets_sold: 0,
        total_revenue: 0,
        diaries_allotted: 0,
        diaries_fully_sold: 0,
        diaries_paid: 0,
        diaries_returned: 0,
        total_amount_collected: 0,
        expected_amount_from_allotted: 0
      };

      const mockIssuerPerformance: IssuerPerformance[] = [];

      setStats(mockStats);
      setIssuerPerformance(mockIssuerPerformance);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'allotted':
        return <Clock className="h-4 w-4 text-warning-500" />;
      case 'fully_sold':
        return <CheckCircle className="h-4 w-4 text-success-500" />;
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-success-500" />;
      case 'returned':
        return <RotateCcw className="h-4 w-4 text-danger-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-secondary-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'allotted':
        return 'text-warning-600';
      case 'fully_sold':
        return 'text-success-600';
      case 'paid':
        return 'text-success-600';
      case 'returned':
        return 'text-danger-600';
      default:
        return 'text-secondary-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-danger-400" />
        <h3 className="mt-2 text-sm font-medium text-secondary-900">No data available</h3>
        <p className="mt-1 text-sm text-secondary-500">Unable to load dashboard statistics.</p>
      </div>
    );
  }

  const pieData = [
    { name: 'Allotted', value: stats.diaries_allotted, color: '#f59e0b' },
    { name: 'Fully Sold', value: stats.diaries_fully_sold, color: '#22c55e' },
    { name: 'Paid', value: stats.diaries_paid, color: '#16a34a' },
    { name: 'Returned', value: stats.diaries_returned, color: '#ef4444' },
  ];

  const topIssuers = issuerPerformance.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Dashboard</h1>
        <p className="mt-1 text-sm text-secondary-500">
          Overview of lottery ticket sales and diary management
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="stat-card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Ticket className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="stat-label">Tickets Sold</dt>
                <dd className="stat-value">{stats.total_tickets_sold.toLocaleString()}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-success-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="stat-label">Total Revenue</dt>
                <dd className="stat-value">₹{stats.total_revenue.toLocaleString()}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BookOpen className="h-8 w-8 text-warning-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="stat-label">Diaries Allotted</dt>
                <dd className="stat-value">{stats.diaries_allotted}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="stat-label">Collection Rate</dt>
                <dd className="stat-value">
                  {stats.expected_amount_from_allotted > 0 
                    ? Math.round((stats.total_amount_collected / stats.expected_amount_from_allotted) * 100)
                    : 0}%
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Diary Status Pie Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-secondary-900">Diary Status Distribution</h3>
          </div>
          <div className="card-content">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top Issuers Bar Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-secondary-900">Top Issuers by Collection</h3>
          </div>
          <div className="card-content">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topIssuers}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="issuer_name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Amount Collected']}
                  />
                  <Bar dataKey="total_collected" fill="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Issuer Performance Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-secondary-900">Issuer Performance</h3>
        </div>
        <div className="card-content">
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Issuer Name</th>
                  <th className="table-header-cell">Contact</th>
                  <th className="table-header-cell">Diaries Allotted</th>
                  <th className="table-header-cell">Tickets Sold</th>
                  <th className="table-header-cell">Amount Collected</th>
                  <th className="table-header-cell">Expected Amount</th>
                  <th className="table-header-cell">Collection %</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {issuerPerformance.map((issuer) => (
                  <tr key={issuer.id} className="table-row">
                    <td className="table-cell font-medium">{issuer.issuer_name}</td>
                    <td className="table-cell">{issuer.contact_number}</td>
                    <td className="table-cell">{issuer.diaries_allotted}</td>
                    <td className="table-cell">{issuer.tickets_sold}</td>
                    <td className="table-cell">₹{issuer.total_collected.toLocaleString()}</td>
                    <td className="table-cell">₹{issuer.expected_amount.toLocaleString()}</td>
                    <td className="table-cell">
                      <span className={`
                        badge
                        ${issuer.collection_percentage >= 80 ? 'badge-success' : 
                          issuer.collection_percentage >= 50 ? 'badge-warning' : 'badge-danger'}
                      `}>
                        {issuer.collection_percentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
