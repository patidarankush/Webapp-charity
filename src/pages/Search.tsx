import React, { useState, useEffect } from 'react';
import { supabase, TicketSale, DiaryAllotment, Issuer, Diary } from '../lib/supabase';
import { 
  Search as SearchIcon, 
  Filter, 
  Download, 
  Calendar,
  User,
  Phone,
  MapPin,
  BookOpen,
  DollarSign,
  Ticket,
  AlertCircle,
  CheckCircle,
  Clock,
  RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';

interface SearchFilters {
  lottery_number: string;
  purchaser_name: string;
  purchaser_contact: string;
  issuer_name: string;
  diary_number: string;
  date_from: string;
  date_to: string;
  status: string;
  amount_min: string;
  amount_max: string;
}

const Search: React.FC = () => {
  const [filters, setFilters] = useState<SearchFilters>({
    lottery_number: '',
    purchaser_name: '',
    purchaser_contact: '',
    issuer_name: '',
    diary_number: '',
    date_from: '',
    date_to: '',
    status: '',
    amount_min: '',
    amount_max: '',
  });
  
  const [searchResults, setSearchResults] = useState<{
    tickets: TicketSale[];
    allotments: DiaryAllotment[];
  }>({ tickets: [], allotments: [] });
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'tickets' | 'allotments'>('tickets');
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const performSearch = async () => {
    try {
      setLoading(true);
      
      // Build search queries
      let ticketQuery = supabase
        .from('ticket_sales')
        .select(`
          *,
          issuer:issuers(*),
          diary:diaries(*)
        `);

      let allotmentQuery = supabase
        .from('diary_allotments')
        .select(`
          *,
          diary:diaries(*),
          issuer:issuers(*)
        `);

      // Apply filters
      if (filters.lottery_number) {
        ticketQuery = ticketQuery.eq('lottery_number', parseInt(filters.lottery_number));
      }

      if (filters.purchaser_name) {
        ticketQuery = ticketQuery.ilike('purchaser_name', `%${filters.purchaser_name}%`);
      }

      if (filters.purchaser_contact) {
        ticketQuery = ticketQuery.ilike('purchaser_contact', `%${filters.purchaser_contact}%`);
      }

      if (filters.issuer_name) {
        ticketQuery = ticketQuery.ilike('issuer.issuer_name', `%${filters.issuer_name}%`);
        allotmentQuery = allotmentQuery.ilike('issuer.issuer_name', `%${filters.issuer_name}%`);
      }

      if (filters.diary_number) {
        const diaryNumber = parseInt(filters.diary_number);
        ticketQuery = ticketQuery.eq('diary.diary_number', diaryNumber);
        allotmentQuery = allotmentQuery.eq('diary.diary_number', diaryNumber);
      }

      if (filters.date_from) {
        ticketQuery = ticketQuery.gte('purchase_date', filters.date_from);
        allotmentQuery = allotmentQuery.gte('allotment_date', filters.date_from);
      }

      if (filters.date_to) {
        ticketQuery = ticketQuery.lte('purchase_date', filters.date_to);
        allotmentQuery = allotmentQuery.lte('allotment_date', filters.date_to);
      }

      if (filters.status) {
        allotmentQuery = allotmentQuery.eq('status', filters.status);
      }

      if (filters.amount_min) {
        ticketQuery = ticketQuery.gte('amount_paid', parseFloat(filters.amount_min));
      }

      if (filters.amount_max) {
        ticketQuery = ticketQuery.lte('amount_paid', parseFloat(filters.amount_max));
      }

      // Execute queries
      const [ticketsResult, allotmentsResult] = await Promise.all([
        ticketQuery.order('created_at', { ascending: false }),
        allotmentQuery.order('created_at', { ascending: false })
      ]);

      if (ticketsResult.error) throw ticketsResult.error;
      if (allotmentsResult.error) throw allotmentsResult.error;

      setSearchResults({
        tickets: ticketsResult.data || [],
        allotments: allotmentsResult.data || []
      });

      toast.success(`Found ${ticketsResult.data?.length || 0} tickets and ${allotmentsResult.data?.length || 0} allotments`);
    } catch (error) {
      console.error('Error performing search:', error);
      toast.error('Failed to perform search');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      lottery_number: '',
      purchaser_name: '',
      purchaser_contact: '',
      issuer_name: '',
      diary_number: '',
      date_from: '',
      date_to: '',
      status: '',
      amount_min: '',
      amount_max: '',
    });
    setSearchResults({ tickets: [], allotments: [] });
  };

  const exportResults = () => {
    const data = activeTab === 'tickets' ? searchResults.tickets : searchResults.allotments;
    
    if (data.length === 0) {
      toast.error('No data to export');
      return;
    }

    const csvContent = generateCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeTab}_search_results_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Data exported successfully');
  };

  const generateCSV = (data: any[]) => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]).filter(key => 
      !['id', 'created_at', 'updated_at'].includes(key)
    );
    
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'object' && value !== null) {
            return `"${value.issuer_name || value.diary_number || ''}"`;
          }
          return `"${value || ''}"`;
        }).join(',')
      )
    ];
    
    return csvRows.join('\n');
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'allotted':
        return 'badge-warning';
      case 'fully_sold':
        return 'badge-success';
      case 'paid':
        return 'badge-success';
      case 'returned':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Advanced Search</h1>
          <p className="mt-1 text-sm text-secondary-500">
            Search across tickets and diary allotments with multiple criteria
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-secondary"
          >
            <Filter className="h-4 w-4 mr-2" />
            {showFilters ? 'Hide' : 'Show'} Filters
          </button>
          <button
            onClick={exportResults}
            className="btn btn-primary"
            disabled={searchResults.tickets.length === 0 && searchResults.allotments.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Search Filters */}
      {showFilters && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-secondary-900">Search Filters</h3>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Lottery Number */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  <Ticket className="h-4 w-4 inline mr-1" />
                  Lottery Number
                </label>
                <input
                  type="number"
                  value={filters.lottery_number}
                  onChange={(e) => handleFilterChange('lottery_number', e.target.value)}
                  className="input"
                  placeholder="Enter lottery number"
                />
              </div>

              {/* Purchaser Name */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  <User className="h-4 w-4 inline mr-1" />
                  Purchaser Name
                </label>
                <input
                  type="text"
                  value={filters.purchaser_name}
                  onChange={(e) => handleFilterChange('purchaser_name', e.target.value)}
                  className="input"
                  placeholder="Enter purchaser name"
                />
              </div>

              {/* Contact Number */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  <Phone className="h-4 w-4 inline mr-1" />
                  Contact Number
                </label>
                <input
                  type="tel"
                  value={filters.purchaser_contact}
                  onChange={(e) => handleFilterChange('purchaser_contact', e.target.value)}
                  className="input"
                  placeholder="Enter contact number"
                />
              </div>

              {/* Issuer Name */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  <User className="h-4 w-4 inline mr-1" />
                  Issuer Name
                </label>
                <input
                  type="text"
                  value={filters.issuer_name}
                  onChange={(e) => handleFilterChange('issuer_name', e.target.value)}
                  className="input"
                  placeholder="Enter issuer name"
                />
              </div>

              {/* Diary Number */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  <BookOpen className="h-4 w-4 inline mr-1" />
                  Diary Number
                </label>
                <input
                  type="number"
                  value={filters.diary_number}
                  onChange={(e) => handleFilterChange('diary_number', e.target.value)}
                  className="input"
                  placeholder="Enter diary number"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="input"
                >
                  <option value="">All Statuses</option>
                  <option value="allotted">Allotted</option>
                  <option value="fully_sold">Fully Sold</option>
                  <option value="paid">Paid</option>
                  <option value="returned">Returned</option>
                </select>
              </div>

              {/* Date From */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Date From
                </label>
                <input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                  className="input"
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Date To
                </label>
                <input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => handleFilterChange('date_to', e.target.value)}
                  className="input"
                />
              </div>

              {/* Amount Range */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  Amount Range
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={filters.amount_min}
                    onChange={(e) => handleFilterChange('amount_min', e.target.value)}
                    className="input"
                    placeholder="Min"
                  />
                  <input
                    type="number"
                    value={filters.amount_max}
                    onChange={(e) => handleFilterChange('amount_max', e.target.value)}
                    className="input"
                    placeholder="Max"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={clearFilters}
                className="btn btn-secondary"
              >
                Clear Filters
              </button>
              <button
                onClick={performSearch}
                disabled={loading}
                className="btn btn-primary"
              >
                <SearchIcon className="h-4 w-4 mr-2" />
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Tabs */}
      <div className="border-b border-secondary-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('tickets')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tickets'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
            }`}
          >
            Tickets ({searchResults.tickets.length})
          </button>
          <button
            onClick={() => setActiveTab('allotments')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'allotments'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
            }`}
          >
            Allotments ({searchResults.allotments.length})
          </button>
        </nav>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-secondary-900">
              Search Results - {activeTab === 'tickets' ? 'Tickets' : 'Allotments'}
            </h3>
          </div>
          <div className="card-content">
            {activeTab === 'tickets' ? (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">Lottery #</th>
                      <th className="table-header-cell">Purchaser</th>
                      <th className="table-header-cell">Contact</th>
                      <th className="table-header-cell">Issuer</th>
                      <th className="table-header-cell">Diary</th>
                      <th className="table-header-cell">Date</th>
                      <th className="table-header-cell">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {searchResults.tickets.map((ticket) => (
                      <tr key={ticket.id} className="table-row">
                        <td className="table-cell font-mono font-medium">
                          {ticket.lottery_number}
                        </td>
                        <td className="table-cell">
                          <div>
                            <div className="font-medium">{ticket.purchaser_name}</div>
                            {ticket.purchaser_address && (
                              <div className="text-sm text-secondary-500 truncate max-w-xs">
                                {ticket.purchaser_address}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="table-cell font-mono">{ticket.purchaser_contact}</td>
                        <td className="table-cell">{ticket.issuer?.issuer_name}</td>
                        <td className="table-cell">
                          <span className="badge badge-secondary">
                            Diary {ticket.diary?.diary_number}
                          </span>
                        </td>
                        <td className="table-cell">
                          {new Date(ticket.purchase_date).toLocaleDateString('en-IN')}
                        </td>
                        <td className="table-cell font-medium">₹{ticket.amount_paid}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">Diary</th>
                      <th className="table-header-cell">Issuer</th>
                      <th className="table-header-cell">Contact</th>
                      <th className="table-header-cell">Allotment Date</th>
                      <th className="table-header-cell">Status</th>
                      <th className="table-header-cell">Amount Collected</th>
                      <th className="table-header-cell">Expected Amount</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {searchResults.allotments.map((allotment) => (
                      <tr key={allotment.id} className="table-row">
                        <td className="table-cell">
                          <span className="badge badge-secondary">
                            Diary {allotment.diary?.diary_number}
                          </span>
                          <div className="text-xs text-secondary-500 mt-1">
                            Tickets: {allotment.diary?.ticket_start_range}-{allotment.diary?.ticket_end_range}
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="font-medium">{allotment.issuer?.issuer_name}</div>
                          {allotment.issuer?.address && (
                            <div className="text-sm text-secondary-500 truncate max-w-xs">
                              {allotment.issuer.address}
                            </div>
                          )}
                        </td>
                        <td className="table-cell font-mono">{allotment.issuer?.contact_number}</td>
                        <td className="table-cell">
                          {new Date(allotment.allotment_date).toLocaleDateString('en-IN')}
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(allotment.status)}
                            <span className={`badge ${getStatusBadge(allotment.status)}`}>
                              {allotment.status.replace('_', ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="table-cell font-medium">₹{allotment.amount_collected.toLocaleString()}</td>
                        <td className="table-cell">₹{allotment.diary?.expected_amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {((activeTab === 'tickets' && searchResults.tickets.length === 0) ||
              (activeTab === 'allotments' && searchResults.allotments.length === 0)) && (
              <div className="text-center py-12">
                <SearchIcon className="mx-auto h-12 w-12 text-secondary-400" />
                <h3 className="mt-2 text-sm font-medium text-secondary-900">No results found</h3>
                <p className="mt-1 text-sm text-secondary-500">
                  Try adjusting your search criteria or filters.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;
