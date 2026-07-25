import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useBookingStore } from '../store/useBookingStore';
import { paymentService } from '../services/paymentService';
import { bookingService } from '../services/bookingService';
import type { OperatorResponse } from '../types/booking';
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
  ArrowRight,
  ExternalLink
} from 'lucide-react';

export const MyBookings: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { 
    myBookings, 
    myBookingsPage, 
    isLoading, 
    error, 
    fetchMyBookings, 
    cancelBooking 
  } = useBookingStore();

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [detailedBooking, setDetailedBooking] = useState<any>(null);
  const [loadingDetailId, setLoadingDetailId] = useState<number | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  
  // Callback status modal
  const [callbackStatus, setCallbackStatus] = useState<'SUCCESS' | 'FAILED' | null>(null);
  const [callbackMsg, setCallbackMsg] = useState('');

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
        setOperators(data);
      } catch (err) {
        console.error("Failed to fetch operators:", err);
      }
    };
    fetchOperators();
  }, []);

  // Handle VNPay Callback
  useEffect(() => {
    const responseCode = searchParams.get('vnp_ResponseCode');
    const txnRef = searchParams.get('vnp_TxnRef');
    if (responseCode) {
      if (responseCode === '00') {
        setCallbackStatus('SUCCESS');
        setCallbackMsg(`Thanh toán thành công đơn đặt chỗ mã giao dịch: ${txnRef || ''}. Vé xe của bạn đã được xác nhận.`);
      } else {
        setCallbackStatus('FAILED');
        setCallbackMsg(`Thanh toán không thành công (Mã lỗi: ${responseCode}). Vui lòng thử lại.`);
      }
      
      // Clear query params to prevent double alerts on refresh
      setSearchParams({});
      // Refresh list to update statuses
      fetchMyBookings(0, 10);
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
      await useBookingStore.getState().fetchBookingDetail(bookingId);
      // Wait store updates
      const activeDetail = useBookingStore.getState().activeBookingDetail;
      setDetailedBooking(activeDetail);
      setExpandedId(bookingId);
    } catch (err) {
      console.error("Failed to load booking detail", err);
    } finally {
      setLoadingDetailId(null);
    }
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
    if (!window.confirm("Bạn có chắc chắn muốn hủy đặt chỗ này không? Ghế ngồi của bạn sẽ được giải phóng.")) {
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

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
      case 'COMPLETED':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider">Đã Thanh Toán</span>;
      case 'CANCELLED':
        return <span className="bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider">Đã Hủy</span>;
      case 'PENDING_PAYMENT':
      default:
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider">Chờ Thanh Toán</span>;
    }
  };

  const getOperatorName = (operatorId: string) => {
    const op = operators.find(o => o.id === operatorId);
    if (op) return op.companyName;
    if (operatorId.includes('futa') || operatorId.includes('9837a28f')) return 'Phương Trang (FUTA)';
    if (operatorId.includes('sao_viet')) return 'Sao Việt';
    if (operatorId.includes('hanh_cafe')) return 'Hạnh Cafe';
    if (operatorId.includes('cuc_tung')) return 'Cúc Tùng';
    return 'Nhà Xe Đối Tác';
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
                Theo dõi tình trạng đơn đặt vé, hoàn tất thanh toán hoặc hủy vé xe khách trực tuyến.
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
            {callbackStatus === 'SUCCESS' ? (
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
              className="text-xs font-bold uppercase hover:underline opacity-80"
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
                {myBookings.map((booking) => {
                  const isExpanded = expandedId === booking.id;
                  const isPending = booking.status === 'PENDING_PAYMENT';
                  const isActionLoading = actionLoadingId === booking.id;

                  return (
                    <div 
                      key={booking.id}
                      className={`bg-white border rounded-lg shadow-sm overflow-hidden transition ${
                        isExpanded ? 'border-baolau-cyan shadow-md' : 'border-gray-100 hover:shadow-md'
                      }`}
                    >
                      {/* Main booking summary */}
                      <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-3">
                            <span className="bg-baolau-dark text-white px-2 py-0.5 rounded font-mono font-bold text-xs">
                              {booking.bookingCode}
                            </span>
                            {getStatusBadge(booking.status)}
                          </div>
                          
                          <div className="pt-2 text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                            <span>Nhà xe: <strong className="text-gray-800">{getOperatorName(booking.operatorId)}</strong></span>
                            <span>•</span>
                            <span>Ngày đặt: <strong className="text-gray-800">{formatDate(booking.createAt)}</strong></span>
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="flex flex-col md:items-end">
                          <span className="text-xs text-gray-400 font-medium">Tổng tiền vé:</span>
                          <span className="text-base text-baolau-green font-bold">
                            {formatPrice(booking.totalAmount)}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 md:justify-end">
                          {/* Payment deadline for Pending */}
                          {isPending && (
                            <div className="text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100 hidden sm:block">
                              Hạn thanh toán: <br/>
                              <strong>{formatDate(booking.paymentDeadline)}</strong>
                            </div>
                          )}

                          <button
                            onClick={() => handleToggleDetail(booking.id)}
                            disabled={loadingDetailId === booking.id}
                            className="p-2 border border-gray-300 rounded hover:bg-gray-50 text-gray-600 transition"
                            title="Xem chi tiết"
                          >
                            {loadingDetailId === booking.id ? (
                              <Loader2 className="animate-spin text-baolau-cyan" size={16} />
                            ) : isExpanded ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Detail Accordion Panel */}
                      {isExpanded && detailedBooking && (
                        <div className="bg-gray-50 border-t border-gray-100 p-5 space-y-4 animate-in fade-in duration-200">
                          
                          {/* Schedule info */}
                          <div className="bg-white p-4 rounded border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                            <div className="space-y-1">
                              <span className="text-gray-400 uppercase tracking-wider block font-bold text-[9px]">Lịch trình di chuyển</span>
                              <div className="flex items-center space-x-2 pt-1">
                                <span className="font-bold text-gray-800 text-sm">
                                  {detailedBooking.scheduleSummaryResponse.departureTime ? new Date(detailedBooking.scheduleSummaryResponse.departureTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) : ''}
                                </span>
                                <ArrowRight size={12} className="text-baolau-cyan" />
                                <span className="font-bold text-gray-800 text-sm">
                                  {detailedBooking.scheduleSummaryResponse.arrivalTime ? new Date(detailedBooking.scheduleSummaryResponse.arrivalTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) : ''}
                                </span>
                              </div>
                              <span className="text-gray-500 block">
                                Ngày đi: {detailedBooking.scheduleSummaryResponse.departureTime ? new Date(detailedBooking.scheduleSummaryResponse.departureTime).toLocaleDateString('vi-VN') : ''}
                              </span>
                            </div>

                            <div className="space-y-1">
                              <span className="text-gray-400 uppercase tracking-wider block font-bold text-[9px]">Vị trí ghế đã chọn</span>
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {detailedBooking.scheduleSeatResponseList?.map((seat: any) => (
                                  <span 
                                    key={seat.id}
                                    className={`px-2 py-0.5 rounded font-bold ${
                                      seat.seatResponse.isVip 
                                        ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                                        : 'bg-baolau-cyan/15 text-baolau-cyan border border-baolau-cyan/20'
                                    }`}
                                  >
                                    {seat.seatResponse.seatNumber}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <span className="text-gray-400 uppercase tracking-wider block font-bold text-[9px]">Thời hạn & Trạng thái thanh toán</span>
                              <div className="pt-1">
                                {isPending ? (
                                  <div className="text-amber-700 font-medium">
                                    Cần thanh toán trước:<br/>
                                    <strong>{formatDate(booking.paymentDeadline)}</strong>
                                  </div>
                                ) : (booking.status === 'PAID' || booking.status === 'COMPLETED') ? (
                                  <div className="text-emerald-700 font-bold flex items-center space-x-1">
                                    <CheckCircle2 size={12} />
                                    <span>Vé của bạn đã có hiệu lực</span>
                                  </div>
                                ) : (
                                  <div className="text-gray-500">
                                    Vé đã bị hủy.
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Control Buttons */}
                          {isPending && (
                            <div className="flex flex-wrap justify-end gap-3 pt-2">
                              <button
                                onClick={() => handleCancel(booking.id)}
                                disabled={isActionLoading}
                                className="px-4 py-2 border border-red-300 text-red-600 rounded text-xs font-bold uppercase tracking-wider hover:bg-red-50 hover:text-red-700 transition disabled:opacity-50 flex items-center space-x-1"
                              >
                                {isActionLoading ? (
                                  <Loader2 className="animate-spin" size={12} />
                                ) : (
                                  <Trash2 size={12} />
                                )}
                                <span>Hủy đặt chỗ</span>
                              </button>
                              
                              <button
                                onClick={() => handlePayment(booking.id)}
                                disabled={isActionLoading}
                                className="px-5 py-2 bg-baolau-green hover:bg-baolau-green-hover text-white rounded text-xs font-bold uppercase tracking-wider transition shadow-sm disabled:opacity-50 flex items-center space-x-1.5"
                              >
                                {isActionLoading ? (
                                  <Loader2 className="animate-spin" size={12} />
                                ) : (
                                  <CreditCard size={12} />
                                )}
                                <span>Thanh toán ngay (VNPay)</span>
                                <ExternalLink size={10} />
                              </button>
                            </div>
                          )}
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
                  className="px-3 py-1 bg-white border border-gray-300 rounded text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  Trước
                </button>
                <span className="text-xs text-gray-500 flex items-center px-2">
                  Trang {currentPage + 1} / {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages - 1 || isLoading}
                  onClick={() => fetchMyBookings(currentPage + 1, 10)}
                  className="px-3 py-1 bg-white border border-gray-300 rounded text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
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
