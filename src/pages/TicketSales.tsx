import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase, TicketSale, Issuer, Diary, getDiaryFromLotteryNumber, validateLotteryNumberForDiary } from '../lib/supabase';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Save, 
  X,
  AlertCircle,
  CheckCircle,
  Calendar,
  User,
  Phone,
  MapPin,
  BookOpen
} from 'lucide-react';
import toast from 'react-hot-toast';

interface TicketFormData {
  lottery_number: number;
  purchaser_name: string;
  purchaser_contact: string;
  purchaser_address: string;
  issuer_id: string;
  diary_id: string;
  purchase_date: string;
  amount_paid: number;
}

const TicketSales: React.FC = () => {
  const [tickets, setTickets] = useState<TicketSale[]>([]);
  const [issuers, setIssuers] = useState<Issuer[]>([]);
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTicket, setEditingTicket] = useState<TicketSale | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [autoFillData, setAutoFillData] = useState<{ issuer?: Issuer; diary?: Diary } | null>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<TicketFormData>();

  const watchedLotteryNumber = watch('lottery_number');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (watchedLotteryNumber && watchedLotteryNumber >= 1 && watchedLotteryNumber <= 39999) {
      handleLotteryNumberChange(watchedLotteryNumber);
    }
  }, [watchedLotteryNumber]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch tickets with joined data
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('ticket_sales')
        .select(`
          *,
          issuer:issuers(*),
          diary:diaries(*)
        `)
        .order('created_at', { ascending: false });

      if (ticketsError) throw ticketsError;

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

      setTickets(ticketsData || []);
      setIssuers(issuersData || []);
      setDiaries(diariesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleLotteryNumberChange = async (lotteryNumber: number) => {
    try {
      const diaryNumber = getDiaryFromLotteryNumber(lotteryNumber);
      const diary = diaries.find(d => d.diary_number === diaryNumber);
      
      if (diary) {
        // Check if diary is allotted to an issuer
        const { data: allotmentData, error } = await supabase
          .from('diary_allotments')
          .select(`
            *,
            issuer:issuers(*)
          `)
          .eq('diary_id', diary.id)
          .eq('status', 'allotted')
          .single();

        if (error || !allotmentData) {
          setAutoFillData({ diary });
          toast.error(`Diary ${diaryNumber} is not allotted to any issuer`);
        } else {
          setAutoFillData({ 
            issuer: allotmentData.issuer, 
            diary 
          });
          
          // Auto-fill form fields
          setValue('diary_id', diary.id);
          setValue('issuer_id', allotmentData.issuer.id);
          setValue('amount_paid', 500);
          setValue('purchase_date', new Date().toISOString().split('T')[0]);
          
          toast.success(`Auto-filled diary ${diaryNumber} details`);
        }
      }
    } catch (error) {
      console.error('Error auto-filling data:', error);
    }
  };

  const onSubmit = async (data: TicketFormData) => {
    try {
      // Validate lottery number range for diary
      if (data.diary_id) {
        const diary = diaries.find(d => d.id === data.diary_id);
        if (diary && !validateLotteryNumberForDiary(data.lottery_number, diary.diary_number)) {
          toast.error(`Lottery number ${data.lottery_number} is not valid for diary ${diary.diary_number}`);
          return;
        }
      }

      if (editingTicket) {
        // Update existing ticket
        const { error } = await supabase
          .from('ticket_sales')
          .update({
            lottery_number: data.lottery_number,
            purchaser_name: data.purchaser_name,
            purchaser_contact: data.purchaser_contact,
            purchaser_address: data.purchaser_address,
            issuer_id: data.issuer_id,
            diary_id: data.diary_id,
            purchase_date: data.purchase_date,
            amount_paid: data.amount_paid,
          })
          .eq('id', editingTicket.id);

        if (error) throw error;
        toast.success('Ticket updated successfully');
      } else {
        // Create new ticket
        const { error } = await supabase
          .from('ticket_sales')
          .insert([data]);

        if (error) throw error;
        toast.success('Ticket added successfully');
      }

      reset();
      setShowForm(false);
      setEditingTicket(null);
      setAutoFillData(null);
      fetchData();
    } catch (error: any) {
      console.error('Error saving ticket:', error);
      if (error.code === '23505') {
        toast.error('Lottery number already exists');
      } else {
        toast.error('Failed to save ticket');
      }
    }
  };

  const handleEdit = (ticket: TicketSale) => {
    setEditingTicket(ticket);
    setValue('lottery_number', ticket.lottery_number);
    setValue('purchaser_name', ticket.purchaser_name);
    setValue('purchaser_contact', ticket.purchaser_contact);
    setValue('purchaser_address', ticket.purchaser_address || '');
    setValue('issuer_id', ticket.issuer_id);
    setValue('diary_id', ticket.diary_id);
    setValue('purchase_date', ticket.purchase_date);
    setValue('amount_paid', ticket.amount_paid);
    setShowForm(true);
  };

  const handleDelete = async (ticketId: string) => {
    if (!window.confirm('Are you sure you want to delete this ticket?')) return;

    try {
      const { error } = await supabase
        .from('ticket_sales')
        .delete()
        .eq('id', ticketId);

      if (error) throw error;
      toast.success('Ticket deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting ticket:', error);
      toast.error('Failed to delete ticket');
    }
  };

  const handleCancel = () => {
    reset();
    setShowForm(false);
    setEditingTicket(null);
    setAutoFillData(null);
  };

  const filteredTickets = tickets.filter(ticket =>
    ticket.lottery_number.toString().includes(searchTerm) ||
    ticket.purchaser_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.purchaser_contact.includes(searchTerm) ||
    ticket.issuer?.issuer_name.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-2xl font-bold text-secondary-900">Ticket Sales</h1>
          <p className="mt-1 text-sm text-secondary-500">
            Manage lottery ticket sales and purchaser information
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Ticket
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
          <input
            type="text"
            placeholder="Search by lottery number, name, contact, or issuer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-secondary-900 bg-opacity-50 transition-opacity" onClick={handleCancel}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-strong transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-secondary-900">
                      {editingTicket ? 'Edit Ticket' : 'Add New Ticket'}
                    </h3>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="text-secondary-400 hover:text-secondary-600"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Lottery Number */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Lottery Number *
                      </label>
                      <input
                        type="number"
                        {...register('lottery_number', { 
                          required: 'Lottery number is required',
                          min: { value: 1, message: 'Minimum lottery number is 1' },
                          max: { value: 39999, message: 'Maximum lottery number is 39999' }
                        })}
                        className="input"
                        placeholder="Enter lottery number (1-39999)"
                      />
                      {errors.lottery_number && (
                        <p className="mt-1 text-sm text-danger-600">{errors.lottery_number.message}</p>
                      )}
                    </div>

                    {/* Auto-fill Info */}
                    {autoFillData && (
                      <div className="bg-primary-50 border border-primary-200 rounded-md p-3">
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-primary-600 mr-2" />
                          <span className="text-sm font-medium text-primary-800">Auto-filled Information</span>
                        </div>
                        {autoFillData.diary && (
                          <p className="text-sm text-primary-700 mt-1">
                            Diary: {autoFillData.diary.diary_number} (Tickets: {autoFillData.diary.ticket_start_range}-{autoFillData.diary.ticket_end_range})
                          </p>
                        )}
                        {autoFillData.issuer && (
                          <p className="text-sm text-primary-700">
                            Issuer: {autoFillData.issuer.issuer_name} ({autoFillData.issuer.contact_number})
                          </p>
                        )}
                      </div>
                    )}

                    {/* Purchaser Name */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        <User className="h-4 w-4 inline mr-1" />
                        Purchaser Name *
                      </label>
                      <input
                        type="text"
                        {...register('purchaser_name', { required: 'Purchaser name is required' })}
                        className="input"
                        placeholder="Enter purchaser name"
                      />
                      {errors.purchaser_name && (
                        <p className="mt-1 text-sm text-danger-600">{errors.purchaser_name.message}</p>
                      )}
                    </div>

                    {/* Contact Number */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        <Phone className="h-4 w-4 inline mr-1" />
                        Contact Number *
                      </label>
                      <input
                        type="tel"
                        {...register('purchaser_contact', { required: 'Contact number is required' })}
                        className="input"
                        placeholder="Enter contact number"
                      />
                      {errors.purchaser_contact && (
                        <p className="mt-1 text-sm text-danger-600">{errors.purchaser_contact.message}</p>
                      )}
                    </div>

                    {/* Address */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        <MapPin className="h-4 w-4 inline mr-1" />
                        Address
                      </label>
                      <textarea
                        {...register('purchaser_address')}
                        className="input min-h-[80px] resize-none"
                        placeholder="Enter purchaser address"
                        rows={3}
                      />
                    </div>

                    {/* Issuer */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Issuer *
                      </label>
                      <select
                        {...register('issuer_id', { required: 'Issuer is required' })}
                        className="input"
                      >
                        <option value="">Select issuer</option>
                        {issuers.map(issuer => (
                          <option key={issuer.id} value={issuer.id}>
                            {issuer.issuer_name} ({issuer.contact_number})
                          </option>
                        ))}
                      </select>
                      {errors.issuer_id && (
                        <p className="mt-1 text-sm text-danger-600">{errors.issuer_id.message}</p>
                      )}
                    </div>

                    {/* Diary */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        <BookOpen className="h-4 w-4 inline mr-1" />
                        Diary *
                      </label>
                      <select
                        {...register('diary_id', { required: 'Diary is required' })}
                        className="input"
                      >
                        <option value="">Select diary</option>
                        {diaries.map(diary => (
                          <option key={diary.id} value={diary.id}>
                            Diary {diary.diary_number} (Tickets: {diary.ticket_start_range}-{diary.ticket_end_range})
                          </option>
                        ))}
                      </select>
                      {errors.diary_id && (
                        <p className="mt-1 text-sm text-danger-600">{errors.diary_id.message}</p>
                      )}
                    </div>

                    {/* Purchase Date */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        Purchase Date *
                      </label>
                      <input
                        type="date"
                        {...register('purchase_date', { required: 'Purchase date is required' })}
                        className="input"
                      />
                      {errors.purchase_date && (
                        <p className="mt-1 text-sm text-danger-600">{errors.purchase_date.message}</p>
                      )}
                    </div>

                    {/* Amount Paid */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Amount Paid (₹) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register('amount_paid', { 
                          required: 'Amount is required',
                          min: { value: 0, message: 'Amount must be positive' }
                        })}
                        className="input"
                        placeholder="500.00"
                      />
                      {errors.amount_paid && (
                        <p className="mt-1 text-sm text-danger-600">{errors.amount_paid.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-secondary-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="btn btn-primary sm:ml-3 sm:w-auto"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {editingTicket ? 'Update' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
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

      {/* Tickets Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-secondary-900">
            Tickets ({filteredTickets.length})
          </h3>
        </div>
        <div className="card-content">
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
                  <th className="table-header-cell">Actions</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {filteredTickets.map((ticket) => (
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
                    <td className="table-cell">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(ticket)}
                          className="text-primary-600 hover:text-primary-800"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(ticket.id)}
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
    </div>
  );
};

export default TicketSales;
