import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useBookingStore } from '../store/useBookingStore';
import { useAuthStore } from '../store/useAuthStore';
import { paymentService } from '../services/paymentService';
import { bookingService } from '../services/bookingService';
import type { 
  OperatorResponse, 
  BookingDetailResponse,
  BookingSummaryResponse 
} from '../types/booking';
import { 
  CreditCard, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Ticket,
  ExternalLink,
  User,
  Calendar,
  Clock,
  MapPin,
  Bus,
  Layers,
  Check,
  Copy,
  Building2,
  AlertTriangle
} from 'lucide-react';

// ==========================================
// 1. Countdown Timer Sub-Component
// ==========================================
interface CountdownTimerProps {
  deadline?: string | null;
  onExpire?: () => void;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ deadline, onExpire }) => {
  const calculateRemaining = () => {
    if (!deadline) return { minutes: 0, seconds: 0, isExpired: true };
    const diff = new Date(deadline).getTime() - Date.now();
    if (diff <= 0) return { minutes: 0, seconds: 0, isExpired: true };
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    return { minutes, seconds, isExpired: false };
  };

  const [remaining, setRemaining] = useState(calculateRemaining);

  useEffect(() => {
    if (!deadline) return;
    const interval = setInterval(() => {
      const current = calculateRemaining();
      setRemaining(current);
      if (current.isExpired) {
        clearInterval(interval);
        if (onExpire) onExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  if (remaining.isExpired) {
    return (
      <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 text-[11px] font-bold">
        <AlertTriangle size={12} className="shrink-0 text-red-500" />
        <span>Đã hết hạn thanh toán</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">
      <Clock size={12} className="shrink-0 text-amber-600 animate-pulse" />
      <span>
        Còn lại: <strong className="text-amber-900 font-mono">{String(remaining.minutes).padStart(2, '0')}:{String(remaining.seconds).padStart(2, '0')}</strong>
      </span>
    </div>
  );
};

// ==========================================
// 2. Status Stepper / Timeline Sub-Component
// ==========================================
interface StatusStepperProps {
  bookingStatus: 'PENDING_PAYMENT' | 'PAID' | 'CANCELLED' | 'COMPLETED' | string;
  scheduleStatus?: 'OPEN' | 'RUNNING' | 'COMPLETED' | 'CANCELLED' | string;
}

const StatusStepper: React.FC<StatusStepperProps> = ({ bookingStatus, scheduleStatus }) => {
  if (bookingStatus === 'CANCELLED') {
    return (
      <div className="bg-red-50/70 border border-red-200 rounded-lg p-3 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2 text-red-800 font-bold">
          <XCircle size={16} className="text-red-600" />
          <span>Đơn đặt chỗ đã bị hủy</span>
        </div>
        <span className="text-[11px] text-red-600">
          Ghế ngồi đã được tự động hoàn trả lại hệ thống
        </span>
      </div>
    );
  }

  // Steps definition based on lifecycle
  const steps = [
    {
      id: 'booked',
      label: 'Đặt giữ chỗ',
      isCompleted: true,
      isActive: false
    },
    {
      id: 'paid',
      label: 'Thanh toán vé',
      isCompleted: bookingStatus === 'PAID' || bookingStatus === 'COMPLETED',
      isActive: bookingStatus === 'PENDING_PAYMENT'
    },
    {
      id: 'running',
      label: scheduleStatus === 'RUNNING' ? 'Đang di chuyển' : 'Khởi hành',
      isCompleted: bookingStatus === 'COMPLETED' || scheduleStatus === 'RUNNING' || scheduleStatus === 'COMPLETED',
      isActive: bookingStatus === 'PAID' && scheduleStatus !== 'COMPLETED'
    },
    {
      id: 'completed',
      label: 'Hoàn thành',
      isCompleted: bookingStatus === 'COMPLETED' || scheduleStatus === 'COMPLETED',
      isActive: false
    }
  ];

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-3">
      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between">
        <span>Tiến trình chuyến đi</span>
        <span className="text-gray-400 font-normal">Mã trạng thái: {bookingStatus}</span>
      </div>

      <div className="relative flex items-center justify-between">
        {/* Progress Bar background line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 z-0" />
        
        {steps.map((step, index) => {
          const isDone = step.isCompleted;
          const isCurrent = step.isActive;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center space-y-1.5 flex-1">
              <div 
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition shadow-sm ${
                  isDone 
                    ? 'bg-emerald-500 text-white' 
                    : isCurrent 
                    ? 'bg-baolau-yellow text-baolau-dark border-2 border-baolau-dark font-black animate-pulse' 
                    : 'bg-gray-100 text-gray-400 border border-gray-200'
                }`}
              >
                {isDone ? <Check size={14} /> : index + 1}
              </div>
              <span className={`text-[11px] text-center font-medium ${
                isDone 
                  ? 'text-emerald-700 font-bold' 
                  : isCurrent 
                  ? 'text-baolau-dark font-black' 
                  : 'text-gray-400'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==========================================
// 3. Main MyBookings Component
// ==========================================
export const MyBookings: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useAuthStore();
  const { 
    myBookings, 
    myBookingsPage, 
    isLoading, 
    error, 
    fetchMyBookings, 
    cancelBooking 
  } = useBookingStore();

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [detailedBooking, setDetailedBooking] = useState<BookingDetailResponse | null>(null);
  const [loadingDetailId, setLoadingDetailId] = useState<number | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  // Callback status modal
  const [callbackStatus, setCallbackStatus] = useState<'SUCCESS' | 'FAILED' | null>(null);
  const [callbackMsg, setCallbackMsg] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Filter states
  const [filterOperatorId, setFilterOperatorId] = useState('');
  const [filterDepDate, setFilterDepDate] = useState('');
  const [filterArrDate, setFilterArrDate] = useState('');
  const [operators, setOperators] = useState<OperatorResponse[]>([]);

  const currentPage = myBookingsPage.currentPage || 0;
  const totalPages = myBookingsPage.totalPages || 0;

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const departureTime = filterDepDate ? `${filterDepDate}T00:00:00` : undefined;
    const arrivalTime = filterArrDate ? `${filterArrDate}T23:59:59` : undefined;

    useBookingStore.getState().setMyBookingsFilter({
      operatorId: filterOperatorId || undefined,
      departureTime,
      arrivalTime
    });

    fetchMyBookings(0, 10);
  };

  const handleClearFilter = () => {
    setFilterOperatorId('');
    setFilterDepDate('');
    setFilterArrDate('');

    useBookingStore.getState().setMyBookingsFilter({});
    fetchMyBookings(0, 10);
  };

  useEffect(() => {
    // Clear filter on mount to avoid stale filter state
    useBookingStore.getState().setMyBookingsFilter({});
    fetchMyBookings(0, 10);

    const fetchOperators = async () => {
      try {
        const data = await bookingService.getOperators();
        setOperators(data || []);
      } catch (err) {
        console.error("Failed to fetch operators:", err);
      }
    };
    fetchOperators();
  }, []);

  // Handle VNPay Callback & Event Polling Sync
  useEffect(() => {
    const responseCode = searchParams.get('vnp_ResponseCode');
    const txnRef = searchParams.get('vnp_TxnRef');
    if (responseCode) {
      if (responseCode === '00') {
        setCallbackStatus('SUCCESS');
        setIsSyncing(true);
        setCallbackMsg(`Thanh toán thành công qua VNPay (Mã giao dịch: ${txnRef || ''}). Hệ thống đang cập nhật trạng thái vé...`);
        
        // Initial fetch
        fetchMyBookings(0, 10);

        // Polling sync after 2.5s to wait for Payment -> Outbox -> Kafka -> Core Service
        const timer = setTimeout(() => {
          fetchMyBookings(0, 10);
          setIsSyncing(false);
          setCallbackMsg(`Thanh toán thành công đơn đặt chỗ mã giao dịch: ${txnRef || ''}. Vé xe của bạn đã được xác nhận.`);
        }, 2500);

        return () => clearTimeout(timer);
      } else {
        setCallbackStatus('FAILED');
        setCallbackMsg(`Thanh toán không thành công (Mã lỗi: ${responseCode}). Vui lòng kiểm tra lại tài khoản hoặc thử lại.`);
        fetchMyBookings(0, 10);
      }
      
      // Clear query params to prevent double alerts on refresh
      setSearchParams({});
    }
  }, [searchParams]);

  const handleToggleDetail = async (bookingId: number) => {
    if (expandedId === bookingId) {
      setExpandedId(null);
      setDetailedBooking(null);
      return;
    }

    try {
      setLoadingDetailId(bookingId);
      const detail = await bookingService.getBookingDetail(bookingId);
      setDetailedBooking(detail);
      setExpandedId(bookingId);
    } catch (err) {
      console.error("Failed to load booking detail", err);
    } finally {
      setLoadingDetailId(null);
    }
  };

  const handleCopyBookingCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  const handlePayment = async (bookingId: number) => {
    try {
      setActionLoadingId(bookingId);
      const paymentUrl = await paymentService.createPaymentLink(bookingId);
      // Redirect to VNPay
      window.location.href = paymentUrl;
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || "Không thể khởi tạo link thanh toán");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancel = async (bookingId: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đặt chỗ này không? Ghế ngồi của bạn sẽ được giải phóng cho người khác.")) {
      return;
    }

    try {
      setActionLoadingId(bookingId);
      await cancelBooking(bookingId);
      alert("Hủy đặt chỗ thành công!");
      if (expandedId === bookingId) {
        setExpandedId(null);
        setDetailedBooking(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || "Hủy đặt chỗ thất bại");
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatPrice = (value?: number | null) => {
    if (value === undefined || value === null) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const formatDateTime = (isoString?: string | null) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return isoString;
    }
  };

  const formatTimeOnly = (isoString?: string | null) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const formatDateOnly = (isoString?: string | null) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return isoString;
    }
  };

  const isDeadlinePassed = (deadlineStr?: string | null) => {
    if (!deadlineStr) return false;
    return new Date(deadlineStr).getTime() <= Date.now();
  };

  const getStatusBadge = (status?: string | null) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 size={12} />
            <span>Đã Thanh Toán</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center space-x-1 bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 size={12} />
            <span>Hoàn Thành</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center space-x-1 bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider">
            <XCircle size={12} />
            <span>Đã Hủy</span>
          </span>
        );
      case 'PENDING_PAYMENT':
      default:
        return (
          <span className="inline-flex items-center space-x-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider">
            <Clock size={12} />
            <span>Chờ Thanh Toán</span>
          </span>
        );
    }
  };

  const getSeatStatusBadge = (status?: string | null) => {
    switch (status) {
      case 'BOOKED':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">Đã đặt</span>;
      case 'HELD':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">Đang giữ chỗ</span>;
      case 'AVAILABLE':
        return <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded">Trống</span>;
      default:
        return <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded">{status || '—'}</span>;
    }
  };

  const getScheduleStatusLabel = (status?: string | null) => {
    switch (status) {
      case 'OPEN':
        return 'Mở bán vé';
      case 'RUNNING':
        return 'Đang di chuyển';
      case 'COMPLETED':
        return 'Đã hoàn thành';
      case 'CANCELLED':
        return 'Đã hủy chuyến';
      default:
        return status || '—';
    }
  };

  const getSeatTypeLabel = (seatType?: string | null) => {
    if (!seatType) return 'Ghế tiêu chuẩn';
    if (seatType === 'SLEEPER' || seatType === 'BED') return 'Giường nằm';
    if (seatType === 'STANDARD' || seatType === 'SEAT') return 'Ghế ngồi';
    return seatType;
  };

  const getOperator = (operatorId?: string | null): OperatorResponse | undefined => {
    if (!operatorId) return undefined;
    return operators.find(o => o.id === operatorId);
  };

  const getOperatorName = (operatorId?: string | null) => {
    if (!operatorId) return 'Nhà xe đối tác';
    const op = getOperator(operatorId);
    if (op && op.companyName) return op.companyName;
    return `Nhà xe (#${operatorId.substring(0, Math.min(8, operatorId.length))})`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans pt-16">
      
      {/* Header Banner */}
      <div className="bg-baolau-dark text-white py-10 border-b border-white/5">
        <div className="max-w-5xl w-full mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-oswald text-2xl md:text-3xl font-bold uppercase tracking-wider text-white">
                Quản lý đặt chỗ của tôi
              </h1>
              <p className="text-gray-400 text-xs mt-1">
                Theo dõi tình trạng đơn đặt vé, tiến trình chuyến xe, vị trí ghế và hoàn tất thanh toán vé trực tuyến.
              </p>
            </div>
            <div className="flex space-x-3 text-xs">
              <Link to="/" className="text-gray-400 hover:text-white transition">Trang chủ</Link>
              <span className="text-gray-600">/</span>
              <span className="text-baolau-yellow font-bold">Vé của tôi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-grow max-w-5xl w-full mx-auto px-4 md:px-8 py-8">
        
        {/* VNPay Callback Message Card */}
        {callbackStatus && (
          <div className={`mb-6 p-4 rounded-lg border flex items-start space-x-3 shadow-sm ${
            callbackStatus === 'SUCCESS' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {isSyncing ? (
              <Loader2 className="animate-spin text-emerald-600 shrink-0 mt-0.5" size={20} />
            ) : callbackStatus === 'SUCCESS' ? (
              <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={20} />
            ) : (
              <XCircle className="text-red-600 shrink-0 mt-0.5" size={20} />
            )}
            <div className="flex-grow">
              <h4 className="font-bold text-sm">
                {callbackStatus === 'SUCCESS' ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
              </h4>
              <p className="text-xs mt-1">{callbackMsg}</p>
            </div>
            <button 
              onClick={() => setCallbackStatus(null)}
              className="text-xs font-bold uppercase hover:underline opacity-80 cursor-pointer"
            >
              Đóng
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main List Section */}
          <div className="lg:col-span-12 space-y-6">
            
            {/* Quick Menu Tabs */}
            <div className="flex border-b border-gray-200 space-x-6 pb-px">
              <Link
                to="/my-bookings"
                className="flex items-center space-x-1.5 pb-3 text-xs font-bold uppercase tracking-wider border-b-2 border-baolau-yellow text-baolau-dark focus:outline-none"
              >
                <Ticket size={14} />
                <span>Vé xe đã đặt ({myBookingsPage.totalElements})</span>
              </Link>
              <Link
                to="/payment-history"
                className="flex items-center space-x-1.5 pb-3 text-xs font-bold uppercase tracking-wider border-b-2 border-transparent text-gray-400 hover:text-gray-600 transition focus:outline-none"
              >
                <CreditCard size={14} />
                <span>Lịch sử giao dịch</span>
              </Link>
            </div>

            {/* Filter Panel */}
            <form onSubmit={handleApplyFilter} className="bg-white border border-gray-200 shadow-sm p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end font-sans">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nhà xe</label>
                <select
                  value={filterOperatorId}
                  onChange={(e) => setFilterOperatorId(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-none px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-baolau-cyan"
                >
                  <option value="">Tất cả nhà xe</option>
                  {operators.map(op => (
                    <option key={op.id} value={op.id}>{op.companyName}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Khởi hành từ ngày</label>
                <input
                  type="date"
                  value={filterDepDate}
                  onChange={(e) => setFilterDepDate(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-none px-3 py-1.5 text-xs focus:outline-none focus:border-baolau-cyan"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Đến ngày</label>
                <input
                  type="date"
                  value={filterArrDate}
                  onChange={(e) => setFilterArrDate(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-none px-3 py-1.5 text-xs focus:outline-none focus:border-baolau-cyan"
                />
              </div>

              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="flex-grow bg-baolau-cyan hover:bg-baolau-cyan/90 text-white font-bold text-xs uppercase tracking-wider py-2 rounded-none transition shadow-sm cursor-pointer text-center"
                >
                  Lọc kết quả
                </button>
                {(filterOperatorId || filterDepDate || filterArrDate) && (
                  <button
                    type="button"
                    onClick={handleClearFilter}
                    className="px-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs uppercase tracking-wider py-2 rounded-none transition border border-gray-300 cursor-pointer"
                  >
                    Xóa
                  </button>
                )}
              </div>
            </form>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-md flex items-center space-x-2">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* List Bookings */}
            {isLoading && myBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-200 rounded-lg shadow-sm">
                <Loader2 className="animate-spin text-baolau-cyan" size={40} />
                <span className="text-gray-500 font-medium text-xs mt-3">Đang tải danh sách đặt vé...</span>
              </div>
            ) : myBookings.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-12 text-center space-y-4 shadow-sm">
                <Ticket className="mx-auto text-gray-300" size={48} />
                <h4 className="font-bold text-gray-700">Chưa có vé xe nào được đặt</h4>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Bạn chưa đặt vé nào trên hệ thống. Hãy tìm kiếm chuyến xe thích hợp và đặt ghế ngay hôm nay!
                </p>
                <Link 
                  to="/" 
                  className="inline-block bg-baolau-yellow hover:bg-baolau-yellow/90 text-baolau-dark font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded shadow transition"
                >
                  Tìm Chuyến Đi Ngay
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {myBookings.map((booking: BookingSummaryResponse) => {
                  const isExpanded = expandedId === booking.id;
                  const isPending = booking.status === 'PENDING_PAYMENT';
                  const isExpired = isPending && isDeadlinePassed(booking.paymentDeadline);
                  const isActionLoading = actionLoadingId === booking.id;
                  const op = getOperator(booking.operatorId);

                  return (
                    <div 
                      key={booking.id}
                      className={`bg-white border rounded-lg shadow-sm overflow-hidden transition ${
                        isExpanded ? 'border-baolau-cyan shadow-md' : 'border-gray-200 hover:shadow-md'
                      }`}
                    >
                      {/* Main booking summary row */}
                      <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center space-x-1.5 bg-baolau-dark text-white px-2.5 py-1 rounded font-mono font-bold text-xs">
                              <span>{booking.bookingCode}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyBookingCode(booking.bookingCode);
                                }}
                                className="text-gray-400 hover:text-white transition ml-1 cursor-pointer"
                                title="Sao chép mã vé"
                              >
                                {copiedCode === booking.bookingCode ? (
                                  <Check size={12} className="text-emerald-400" />
                                ) : (
                                  <Copy size={12} />
                                )}
                              </button>
                            </div>

                            <span className="text-[11px] text-gray-500 font-semibold">
                              Mã đơn: #{booking.id}
                            </span>

                            {getStatusBadge(booking.status)}

                            {/* Realtime Countdown for Pending Payments */}
                            {isPending && (
                              <CountdownTimer 
                                deadline={booking.paymentDeadline} 
                                onExpire={() => fetchMyBookings(currentPage, 10)}
                              />
                            )}
                          </div>
                          
                          <div className="text-xs text-gray-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                            <span className="inline-flex items-center space-x-1">
                              <Building2 size={13} className="text-gray-400" />
                              <span>Nhà xe: <strong className="text-gray-800">{getOperatorName(booking.operatorId)}</strong></span>
                            </span>
                            <span>•</span>
                            <span className="inline-flex items-center space-x-1">
                              <Calendar size={13} className="text-gray-400" />
                              <span>Ngày đặt: <strong className="text-gray-800">{formatDateTime(booking.createAt)}</strong></span>
                            </span>
                          </div>
                        </div>

                        {/* Amount & Deadline */}
                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                          <div className="text-left md:text-right">
                            <span className="text-[11px] text-gray-400 font-medium block">Tổng tiền vé:</span>
                            <span className="text-base md:text-lg text-baolau-green font-bold block">
                              {formatPrice(booking.totalAmount)}
                            </span>
                          </div>

                          {isPending && booking.paymentDeadline && (
                            <div className="text-[10px] text-gray-500 mt-1">
                              Hạn chót: <strong>{formatDateTime(booking.paymentDeadline)}</strong>
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center space-x-2 justify-end border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                          {isPending && !isExpired && (
                            <button
                              onClick={() => handlePayment(booking.id)}
                              disabled={isActionLoading}
                              className="px-3 py-1.5 bg-baolau-green hover:bg-baolau-green-hover text-white rounded text-xs font-bold uppercase tracking-wider transition shadow-sm disabled:opacity-50 flex items-center space-x-1 cursor-pointer"
                            >
                              {isActionLoading ? (
                                <Loader2 className="animate-spin" size={12} />
                              ) : (
                                <CreditCard size={12} />
                              )}
                              <span>Thanh toán</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleToggleDetail(booking.id)}
                            disabled={loadingDetailId === booking.id}
                            className={`px-3 py-1.5 border rounded text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                              isExpanded 
                                ? 'bg-baolau-cyan text-white border-baolau-cyan' 
                                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
                            }`}
                            title="Xem chi tiết vé"
                          >
                            {loadingDetailId === booking.id ? (
                              <Loader2 className="animate-spin text-baolau-cyan" size={14} />
                            ) : (
                              <>
                                <span>{isExpanded ? 'Thu gọn' : 'Chi tiết'}</span>
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Detail Accordion Panel (Complete e-Ticket Information) */}
                      {isExpanded && detailedBooking && (
                        <div className="bg-slate-50/80 border-t border-gray-200 p-5 md:p-6 space-y-5 animate-in fade-in duration-200">
                          
                          {/* 1. Status Progress Stepper */}
                          <StatusStepper 
                            bookingStatus={detailedBooking.status} 
                            scheduleStatus={detailedBooking.scheduleSummaryResponse?.status}
                          />

                          {/* 2. Trip & Route Header Banner */}
                          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                              <div className="flex items-center space-x-2">
                                <MapPin className="text-baolau-cyan shrink-0" size={18} />
                                <h3 className="font-oswald text-base md:text-lg font-bold text-gray-800 uppercase tracking-wide">
                                  Tuyến xe: {detailedBooking.scheduleSummaryResponse?.departureCityName || 'Nơi đi'} 
                                  <span className="mx-2 text-baolau-cyan">→</span>
                                  {detailedBooking.scheduleSummaryResponse?.arrivalCityName || 'Nơi đến'}
                                </h3>
                              </div>
                              <div className="text-xs text-gray-500 flex items-center space-x-2">
                                <span>Mã chuyến: <strong>#{detailedBooking.scheduleSummaryResponse?.id || '—'}</strong></span>
                                <span>•</span>
                                <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-semibold text-[11px]">
                                  {getScheduleStatusLabel(detailedBooking.scheduleSummaryResponse?.status)}
                                </span>
                              </div>
                            </div>

                            {/* Departure & Arrival Time Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-slate-50 p-3.5 rounded border border-gray-200 space-y-1">
                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center space-x-1">
                                  <Clock size={12} className="text-baolau-cyan" />
                                  <span>Điểm đi / Giờ khởi hành</span>
                                </div>
                                <div className="text-sm font-bold text-gray-900">
                                  {detailedBooking.scheduleSummaryResponse?.departureCityName || '—'}
                                </div>
                                <div className="text-xs text-gray-600">
                                  Thời gian: <strong className="text-gray-900">{formatTimeOnly(detailedBooking.scheduleSummaryResponse?.departureTime)}</strong> - Ngày: <strong className="text-gray-900">{formatDateOnly(detailedBooking.scheduleSummaryResponse?.departureTime)}</strong>
                                </div>
                              </div>

                              <div className="bg-slate-50 p-3.5 rounded border border-gray-200 space-y-1">
                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center space-x-1">
                                  <Clock size={12} className="text-baolau-yellow" />
                                  <span>Điểm đến / Giờ dự kiến</span>
                                </div>
                                <div className="text-sm font-bold text-gray-900">
                                  {detailedBooking.scheduleSummaryResponse?.arrivalCityName || '—'}
                                </div>
                                <div className="text-xs text-gray-600">
                                  Thời gian: <strong className="text-gray-900">{formatTimeOnly(detailedBooking.scheduleSummaryResponse?.arrivalTime)}</strong> - Ngày: <strong className="text-gray-900">{formatDateOnly(detailedBooking.scheduleSummaryResponse?.arrivalTime)}</strong>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 3. Passenger Info & Operator Details Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            
                            {/* Passenger Card */}
                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-3">
                              <div className="flex items-center space-x-2 text-xs font-bold text-gray-700 uppercase tracking-wider pb-2 border-b border-gray-100">
                                <User size={15} className="text-baolau-cyan" />
                                <span>Thông tin hành khách</span>
                              </div>
                              <div className="text-xs space-y-2 text-gray-600">
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Họ và tên:</span>
                                  <span className="font-bold text-gray-800">{currentUser?.fullName || 'Hành khách'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Số điện thoại:</span>
                                  <span className="font-semibold text-gray-800">{currentUser?.phone || '—'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Email:</span>
                                  <span className="text-gray-800">{currentUser?.email || '—'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Mã khách hàng:</span>
                                  <span className="font-mono text-[11px] text-gray-500">{detailedBooking.userId}</span>
                                </div>
                              </div>
                            </div>

                            {/* Operator & Vehicle Details */}
                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-3">
                              <div className="flex items-center space-x-2 text-xs font-bold text-gray-700 uppercase tracking-wider pb-2 border-b border-gray-100">
                                <Bus size={15} className="text-baolau-yellow" />
                                <span>Nhà xe & Phương tiện</span>
                              </div>
                              <div className="text-xs space-y-2 text-gray-600">
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Nhà xe vận hành:</span>
                                  <span className="font-bold text-gray-800">{getOperatorName(detailedBooking.operatorId || detailedBooking.scheduleSummaryResponse?.operatorId)}</span>
                                </div>
                                {op?.contactPhone && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Hotline nhà xe:</span>
                                    <span className="font-semibold text-gray-800">{op.contactPhone}</span>
                                  </div>
                                )}
                                {op?.taxCode && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Mã số thuế:</span>
                                    <span className="text-gray-800">{op.taxCode}</span>
                                  </div>
                                )}
                                {detailedBooking.scheduleSummaryResponse?.vehicleResponse?.licensePlate && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Biển số xe:</span>
                                    <span className="font-bold font-mono text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded">
                                      {detailedBooking.scheduleSummaryResponse.vehicleResponse.licensePlate}
                                    </span>
                                  </div>
                                )}
                                {detailedBooking.scheduleSummaryResponse?.vehicleResponse?.brand && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Dòng xe:</span>
                                    <span className="text-gray-800">
                                      {detailedBooking.scheduleSummaryResponse.vehicleResponse.brand} {detailedBooking.scheduleSummaryResponse.vehicleResponse.model || ''}
                                    </span>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Số ghế chuyến xe:</span>
                                  <span className="text-gray-800">
                                    {detailedBooking.scheduleSummaryResponse?.totalSeats ? `${detailedBooking.scheduleSummaryResponse.totalSeats} chỗ` : '—'}
                                  </span>
                                </div>
                              </div>
                            </div>

                          </div>

                          {/* 4. Selected Seats Table / Cancelled Seats Note */}
                          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                            <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                              <div className="flex items-center space-x-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
                                <Layers size={15} className="text-baolau-cyan" />
                                <span>Danh sách ghế đã chọn ({detailedBooking.scheduleSeatResponseList?.length || 0} ghế)</span>
                              </div>
                              <span className="text-xs text-gray-500 font-medium">
                                Tổng cộng: <strong className="text-baolau-green text-sm">{formatPrice(detailedBooking.totalAmount)}</strong>
                              </span>
                            </div>

                            {detailedBooking.scheduleSeatResponseList && detailedBooking.scheduleSeatResponseList.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                  <thead>
                                    <tr className="bg-white border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                                      <th className="py-3 px-4">Số ghế</th>
                                      <th className="py-3 px-4">Vị trí (Tầng/Hàng/Cột)</th>
                                      <th className="py-3 px-4">Hạng ghế</th>
                                      <th className="py-3 px-4">Loại chỗ</th>
                                      <th className="py-3 px-4">Trạng thái</th>
                                      <th className="py-3 px-4 text-right">Giá vé</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100 text-gray-700">
                                    {detailedBooking.scheduleSeatResponseList.map((seat) => (
                                      <tr key={seat.id} className="hover:bg-gray-50/60 transition">
                                        <td className="py-3 px-4 font-bold font-mono text-sm text-gray-900">
                                          <span className={`inline-block px-2.5 py-0.5 rounded border ${
                                            seat.seatResponse.isVip
                                              ? 'bg-amber-50 text-amber-900 border-amber-300'
                                              : 'bg-baolau-cyan/10 text-baolau-cyan border-baolau-cyan/30'
                                          }`}>
                                            {seat.seatResponse.seatNumber}
                                          </span>
                                        </td>
                                        <td className="py-3 px-4 text-gray-600">
                                          Tầng {seat.seatResponse.floor} • Hàng {seat.seatResponse.row}, Cột {seat.seatResponse.col}
                                        </td>
                                        <td className="py-3 px-4">
                                          {seat.seatResponse.isVip ? (
                                            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                                              VIP
                                            </span>
                                          ) : (
                                            <span className="bg-gray-100 text-gray-600 text-[10px] font-semibold px-2 py-0.5 rounded uppercase">
                                              Thường
                                            </span>
                                          )}
                                        </td>
                                        <td className="py-3 px-4 text-gray-600">
                                          {getSeatTypeLabel(seat.seatResponse.seatType)}
                                        </td>
                                        <td className="py-3 px-4">
                                          {getSeatStatusBadge(seat.status)}
                                        </td>
                                        <td className="py-3 px-4 text-right font-bold text-baolau-green">
                                          {formatPrice(seat.price)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="p-6 text-center text-xs text-gray-500 bg-gray-50/50">
                                {detailedBooking.status === 'CANCELLED' 
                                  ? 'Đơn đặt chỗ đã bị hủy. Toàn bộ ghế ngồi đã được hoàn trả lại hệ thống.' 
                                  : 'Không có thông tin ghế ngồi cho đơn đặt vé này.'}
                              </div>
                            )}
                          </div>

                          {/* 5. Payment Status & Booking Controls */}
                          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1 text-xs">
                              <span className="text-gray-400 uppercase tracking-wider block font-bold text-[10px]">Tình trạng thanh toán:</span>
                              {detailedBooking.status === 'PENDING_PAYMENT' ? (
                                <div className="text-amber-800 font-medium">
                                  Đơn đặt chỗ đang chờ thanh toán. Vui lòng hoàn tất trước:<br />
                                  <strong className="text-amber-900 font-bold">{formatDateTime(detailedBooking.paymentDeadline)}</strong>
                                </div>
                              ) : (detailedBooking.status === 'PAID' || detailedBooking.status === 'COMPLETED') ? (
                                <div className="text-emerald-700 font-bold flex items-center space-x-1.5">
                                  <CheckCircle2 size={16} />
                                  <span>Vé đã thanh toán thành công. Quý khách vui lòng có mặt tại điểm đón trước giờ khởi hành 15-30 phút.</span>
                                </div>
                              ) : (
                                <div className="text-red-700 font-medium flex items-center space-x-1.5">
                                  <XCircle size={16} />
                                  <span>Đơn đặt chỗ này đã bị hủy hoặc quá hạn thanh toán.</span>
                                </div>
                              )}
                            </div>

                            {/* Control Buttons */}
                            {detailedBooking.status === 'PENDING_PAYMENT' && !isDeadlinePassed(detailedBooking.paymentDeadline) && (
                              <div className="flex flex-wrap items-center gap-3 shrink-0">
                                <button
                                  onClick={() => handleCancel(booking.id)}
                                  disabled={isActionLoading}
                                  className="px-4 py-2 border border-red-300 text-red-600 rounded text-xs font-bold uppercase tracking-wider hover:bg-red-50 transition disabled:opacity-50 flex items-center space-x-1 cursor-pointer"
                                >
                                  {isActionLoading ? (
                                    <Loader2 className="animate-spin" size={13} />
                                  ) : (
                                    <Trash2 size={13} />
                                  )}
                                  <span>Hủy đặt chỗ</span>
                                </button>
                                
                                <button
                                  onClick={() => handlePayment(booking.id)}
                                  disabled={isActionLoading}
                                  className="px-5 py-2 bg-baolau-green hover:bg-baolau-green-hover text-white rounded text-xs font-bold uppercase tracking-wider transition shadow-sm disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
                                >
                                  {isActionLoading ? (
                                    <Loader2 className="animate-spin" size={13} />
                                  ) : (
                                    <CreditCard size={13} />
                                  )}
                                  <span>Thanh toán ngay (VNPay)</span>
                                  <ExternalLink size={11} />
                                </button>
                              </div>
                            )}
                          </div>

                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center space-x-2 pt-6">
                <button
                  disabled={currentPage === 0 || isLoading}
                  onClick={() => fetchMyBookings(currentPage - 1, 10)}
                  className="px-3 py-1 bg-white border border-gray-300 rounded text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                >
                  Trước
                </button>
                <span className="text-xs text-gray-500 flex items-center px-2">
                  Trang {currentPage + 1} / {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages - 1 || isLoading}
                  onClick={() => fetchMyBookings(currentPage + 1, 10)}
                  className="px-3 py-1 bg-white border border-gray-300 rounded text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                >
                  Sau
                </button>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
};
