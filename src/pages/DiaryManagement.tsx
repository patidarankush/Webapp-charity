import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase, DiaryAllotment, Issuer, Diary } from '../lib/supabase';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Save, 
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  RotateCcw,
  User,
  Phone,
  MapPin,
  BookOpen,
  DollarSign,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

interface IssuerFormData {
  issuer_name: string;
  contact_number: string;
  address: string;
}

interface AllotmentFormData {
  diary_id: string;
  issuer_id: string;
  allotment_date: string;
  notes: string;
}

const DiaryManagement: React.FC = () => {
  const [allotments, setAllotments] = useState<DiaryAllotment[]>([]);
  const [issuers, setIssuers] = useState<Issuer[]>([]);
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'allotments' | 'issuers'>('allotments');
  const [showIssuerForm, setShowIssuerForm] = useState(false);
  const [showAllotmentForm, setShowAllotmentForm] = useState(false);
  const [editingIssuer, setEditingIssuer] = useState<Issuer | null>(null);
  const [editingAllotment, setEditingAllotment] = useState<DiaryAllotment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const issuerForm = useForm<IssuerFormData>();
  const allotmentForm = useForm<AllotmentFormData>();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch allotments with joined data
      const { data: allotmentsData, error: allotmentsError } = await supabase
        .from('diary_allotments')
        .select(`
          *,
          diary:diaries(*),
          issuer:issuers(*)
        `)
        .order('created_at', { ascending: false });

      if (allotmentsError) throw allotmentsError;

      // Fetch issuers
      const { data: issuersData, error: issuersError } = await supabase
        .from('issuers')
        .select('*')
        .order('issuer_name');

      if (issuersError) throw issuersError;

      // Fetch diaries
      const { data: diariesData, error: diariesError } = await supabase
        .from('diaries')
        .select('*')
        .order('diary_number');

      if (diariesError) throw diariesError;

      setAllotments(allotmentsData || []);
      setIssuers(issuersData || []);
      setDiaries(diariesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const onSubmitIssuer = async (data: IssuerFormData) => {
    try {
      if (editingIssuer) {
        // Update existing issuer
        const { error } = await supabase
          .from('issuers')
          .update(data)
          .eq('id', editingIssuer.id);

        if (error) throw error;
        toast.success('Issuer updated successfully');
      } else {
        // Create new issuer
        const { error } = await supabase
          .from('issuers')
          .insert([data]);

        if (error) throw error;
        toast.success('Issuer added successfully');
      }

      issuerForm.reset();
      setShowIssuerForm(false);
      setEditingIssuer(null);
      fetchData();
    } catch (error: any) {
      console.error('Error saving issuer:', error);
      toast.error('Failed to save issuer');
    }
  };

  const onSubmitAllotment = async (data: AllotmentFormData) => {
    try {
      if (editingAllotment) {
        // Update existing allotment
        const { error } = await supabase
          .from('diary_allotments')
          .update({
            diary_id: data.diary_id,
            issuer_id: data.issuer_id,
            allotment_date: data.allotment_date,
            notes: data.notes,
          })
          .eq('id', editingAllotment.id);

        if (error) throw error;
        toast.success('Allotment updated successfully');
      } else {
        // Create new allotment
        const { error } = await supabase
          .from('diary_allotments')
          .insert([{
            ...data,
            status: 'allotted',
            amount_collected: 0,
          }]);

        if (error) throw error;
        toast.success('Diary allotted successfully');
      }

      allotmentForm.reset();
      setShowAllotmentForm(false);
      setEditingAllotment(null);
      fetchData();
    } catch (error: any) {
      console.error('Error saving allotment:', error);
      if (error.code === '23505') {
        toast.error('This diary is already allotted to an issuer');
      } else {
        toast.error('Failed to save allotment');
      }
    }
  };

  const handleEditIssuer = (issuer: Issuer) => {
    setEditingIssuer(issuer);
    issuerForm.setValue('issuer_name', issuer.issuer_name);
    issuerForm.setValue('contact_number', issuer.contact_number);
    issuerForm.setValue('address', issuer.address || '');
    setShowIssuerForm(true);
  };

  const handleEditAllotment = (allotment: DiaryAllotment) => {
    setEditingAllotment(allotment);
    allotmentForm.setValue('diary_id', allotment.diary_id);
    allotmentForm.setValue('issuer_id', allotment.issuer_id);
    allotmentForm.setValue('allotment_date', allotment.allotment_date);
    allotmentForm.setValue('notes', allotment.notes || '');
    setShowAllotmentForm(true);
  };

  const handleDeleteIssuer = async (issuerId: string) => {
    if (!window.confirm('Are you sure you want to delete this issuer? This will also delete all their allotments.')) return;

    try {
      const { error } = await supabase
        .from('issuers')
        .delete()
        .eq('id', issuerId);

      if (error) throw error;
      toast.success('Issuer deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting issuer:', error);
      toast.error('Failed to delete issuer');
    }
  };

  const handleDeleteAllotment = async (allotmentId: string) => {
    if (!window.confirm('Are you sure you want to delete this allotment?')) return;

    try {
      const { error } = await supabase
        .from('diary_allotments')
        .delete()
        .eq('id', allotmentId);

      if (error) throw error;
      toast.success('Allotment deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting allotment:', error);
      toast.error('Failed to delete allotment');
    }
  };

  const updateAllotmentStatus = async (allotmentId: string, status: DiaryAllotment['status']) => {
    try {
      const { error } = await supabase
        .from('diary_allotments')
        .update({ status })
        .eq('id', allotmentId);

      if (error) throw error;
      toast.success(`Status updated to ${status}`);
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
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

  const filteredAllotments = allotments.filter(allotment =>
    allotment.diary?.diary_number.toString().includes(searchTerm) ||
    allotment.issuer?.issuer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    allotment.issuer?.contact_number.includes(searchTerm) ||
    allotment.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredIssuers = issuers.filter(issuer =>
    issuer.issuer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    issuer.contact_number.includes(searchTerm) ||
    issuer.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Diary Management</h1>
          <p className="mt-1 text-sm text-secondary-500">
            Manage diary allotments and issuer information
          </p>
        </div>
        <div className="flex space-x-3">
          {activeTab === 'allotments' && (
            <button
              onClick={() => setShowAllotmentForm(true)}
              className="btn btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Allot Diary
            </button>
          )}
          {activeTab === 'issuers' && (
            <button
              onClick={() => setShowIssuerForm(true)}
              className="btn btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Issuer
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-secondary-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('allotments')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'allotments'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
            }`}
          >
            Diary Allotments ({allotments.length})
          </button>
          <button
            onClick={() => setActiveTab('issuers')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'issuers'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
            }`}
          >
            Issuers ({issuers.length})
          </button>
        </nav>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Issuer Form Modal */}
      {showIssuerForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-secondary-900 bg-opacity-50 transition-opacity" onClick={() => setShowIssuerForm(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-strong transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={issuerForm.handleSubmit(onSubmitIssuer)}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-secondary-900">
                      {editingIssuer ? 'Edit Issuer' : 'Add New Issuer'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowIssuerForm(false)}
                      className="text-secondary-400 hover:text-secondary-600"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        <User className="h-4 w-4 inline mr-1" />
                        Issuer Name *
                      </label>
                      <input
                        type="text"
                        {...issuerForm.register('issuer_name', { required: 'Issuer name is required' })}
                        className="input"
                        placeholder="Enter issuer name"
                      />
                      {issuerForm.formState.errors.issuer_name && (
                        <p className="mt-1 text-sm text-danger-600">{issuerForm.formState.errors.issuer_name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        <Phone className="h-4 w-4 inline mr-1" />
                        Contact Number *
                      </label>
                      <input
                        type="tel"
                        {...issuerForm.register('contact_number', { required: 'Contact number is required' })}
                        className="input"
                        placeholder="Enter contact number"
                      />
                      {issuerForm.formState.errors.contact_number && (
                        <p className="mt-1 text-sm text-danger-600">{issuerForm.formState.errors.contact_number.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        <MapPin className="h-4 w-4 inline mr-1" />
                        Address
                      </label>
                      <textarea
                        {...issuerForm.register('address')}
                        className="input min-h-[80px] resize-none"
                        placeholder="Enter issuer address"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-secondary-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="btn btn-primary sm:ml-3 sm:w-auto"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {editingIssuer ? 'Update' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowIssuerForm(false)}
                    className="btn btn-secondary sm:w-auto"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Allotment Form Modal */}
      {showAllotmentForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-secondary-900 bg-opacity-50 transition-opacity" onClick={() => setShowAllotmentForm(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-strong transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={allotmentForm.handleSubmit(onSubmitAllotment)}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-secondary-900">
                      {editingAllotment ? 'Edit Allotment' : 'Allot Diary'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowAllotmentForm(false)}
                      className="text-secondary-400 hover:text-secondary-600"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        <BookOpen className="h-4 w-4 inline mr-1" />
                        Diary *
                      </label>
                      <select
                        {...allotmentForm.register('diary_id', { required: 'Diary is required' })}
                        className="input"
                      >
                        <option value="">Select diary</option>
                        {diaries.map(diary => (
                          <option key={diary.id} value={diary.id}>
                            Diary {diary.diary_number} (Tickets: {diary.ticket_start_range}-{diary.ticket_end_range})
                          </option>
                        ))}
                      </select>
                      {allotmentForm.formState.errors.diary_id && (
                        <p className="mt-1 text-sm text-danger-600">{allotmentForm.formState.errors.diary_id.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        <User className="h-4 w-4 inline mr-1" />
                        Issuer *
                      </label>
                      <select
                        {...allotmentForm.register('issuer_id', { required: 'Issuer is required' })}
                        className="input"
                      >
                        <option value="">Select issuer</option>
                        {issuers.map(issuer => (
                          <option key={issuer.id} value={issuer.id}>
                            {issuer.issuer_name} ({issuer.contact_number})
                          </option>
                        ))}
                      </select>
                      {allotmentForm.formState.errors.issuer_id && (
                        <p className="mt-1 text-sm text-danger-600">{allotmentForm.formState.errors.issuer_id.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        Allotment Date *
                      </label>
                      <input
                        type="date"
                        {...allotmentForm.register('allotment_date', { required: 'Allotment date is required' })}
                        className="input"
                      />
                      {allotmentForm.formState.errors.allotment_date && (
                        <p className="mt-1 text-sm text-danger-600">{allotmentForm.formState.errors.allotment_date.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Notes
                      </label>
                      <textarea
                        {...allotmentForm.register('notes')}
                        className="input min-h-[80px] resize-none"
                        placeholder="Enter any notes about this allotment"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-secondary-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="btn btn-primary sm:ml-3 sm:w-auto"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {editingAllotment ? 'Update' : 'Allot'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAllotmentForm(false)}
                    className="btn btn-secondary sm:w-auto"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {activeTab === 'allotments' ? (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-secondary-900">
              Diary Allotments ({filteredAllotments.length})
            </h3>
          </div>
          <div className="card-content">
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
                    <th className="table-header-cell">Actions</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {filteredAllotments.map((allotment) => (
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
                      <td className="table-cell">
                        <div className="flex items-center space-x-2">
                          <select
                            value={allotment.status}
                            onChange={(e) => updateAllotmentStatus(allotment.id, e.target.value as DiaryAllotment['status'])}
                            className="text-xs border border-secondary-300 rounded px-2 py-1"
                          >
                            <option value="allotted">Allotted</option>
                            <option value="fully_sold">Fully Sold</option>
                            <option value="paid">Paid</option>
                            <option value="returned">Returned</option>
                          </select>
                          <button
                            onClick={() => handleEditAllotment(allotment)}
                            className="text-primary-600 hover:text-primary-800"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAllotment(allotment.id)}
                            className="text-danger-600 hover:text-danger-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-secondary-900">
              Issuers ({filteredIssuers.length})
            </h3>
          </div>
          <div className="card-content">
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Name</th>
                    <th className="table-header-cell">Contact</th>
                    <th className="table-header-cell">Address</th>
                    <th className="table-header-cell">Created</th>
                    <th className="table-header-cell">Actions</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {filteredIssuers.map((issuer) => (
                    <tr key={issuer.id} className="table-row">
                      <td className="table-cell font-medium">{issuer.issuer_name}</td>
                      <td className="table-cell font-mono">{issuer.contact_number}</td>
                      <td className="table-cell">
                        {issuer.address ? (
                          <div className="text-sm text-secondary-600 truncate max-w-xs">
                            {issuer.address}
                          </div>
                        ) : (
                          <span className="text-secondary-400">No address</span>
                        )}
                      </td>
                      <td className="table-cell">
                        {new Date(issuer.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditIssuer(issuer)}
                            className="text-primary-600 hover:text-primary-800"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteIssuer(issuer.id)}
                            className="text-danger-600 hover:text-danger-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiaryManagement;
