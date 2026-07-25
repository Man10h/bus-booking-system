import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useBookingStore } from '../store/useBookingStore';
import { 
  CreditCard, 
  Ticket, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight
} from 'lucide-react';

export const PaymentHistory: React.FC = () => {
  const { 
    myPayments, 
    myPaymentsPage, 
    isLoading, 
    error, 
    fetchMyPayments 
  } = useBookingStore();

  const currentPage = myPaymentsPage.currentPage || 0;
  const totalPages = myPaymentsPage.totalPages || 0;

  useEffect(() => {
    fetchMyPayments(0, 10);
  }, []);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const formatDate = (isoString: string | null) => {
    if (!isoString) return '-';
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
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
            <CheckCircle2 size={10} />
            <span>Thành Công</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center space-x-1 bg-red-50 text-red-700 border border-red-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
            <XCircle size={10} />
            <span>Thất Bại</span>
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center space-x-1 bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
            <Clock size={10} />
            <span>Đang Xử Lý</span>
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans pt-16">
      
      {/* Header Banner */}
      <div className="bg-baolau-dark text-white py-10 border-b border-white/5">
        <div className="max-w-5xl w-full mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-oswald text-2xl md:text-3xl font-bold uppercase tracking-wider text-white">
                Lịch sử giao dịch thanh toán
              </h1>
              <p className="text-gray-400 text-xs mt-1">
                Xem lại lịch sử thanh toán qua cổng VNPay cho các vé xe đã đặt.
              </p>
            </div>
            <div className="flex space-x-3 text-xs">
              <Link to="/" className="text-gray-400 hover:text-white transition">Trang chủ</Link>
              <span className="text-gray-600">/</span>
              <span className="text-baolau-yellow font-bold">Lịch sử thanh toán</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-grow max-w-5xl w-full mx-auto px-4 md:px-8 py-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-12 space-y-6">
            
            {/* Quick Menu Tabs */}
            <div className="flex border-b border-gray-200 space-x-6 pb-px">
              <Link
                to="/my-bookings"
                className="flex items-center space-x-1.5 pb-3 text-xs font-bold uppercase tracking-wider border-b-2 border-transparent text-gray-400 hover:text-gray-600 transition focus:outline-none"
              >
                <Ticket size={14} />
                <span>Vé xe đã đặt</span>
              </Link>
              <Link
                to="/payment-history"
                className="flex items-center space-x-1.5 pb-3 text-xs font-bold uppercase tracking-wider border-b-2 border-baolau-yellow text-baolau-dark focus:outline-none"
              >
                <CreditCard size={14} />
                <span>Lịch sử giao dịch ({myPaymentsPage.totalElements})</span>
              </Link>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-md flex items-center space-x-2">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* List Payments */}
            {isLoading && myPayments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-200 rounded-lg shadow-sm">
                <Loader2 className="animate-spin text-baolau-cyan" size={40} />
                <span className="text-gray-500 font-medium text-xs mt-3">Đang tải lịch sử giao dịch...</span>
              </div>
            ) : myPayments.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-12 text-center space-y-4 shadow-sm">
                <CreditCard className="mx-auto text-gray-300" size={48} />
                <h4 className="font-bold text-gray-700">Chưa có giao dịch nào</h4>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Bạn chưa thực hiện bất kỳ giao dịch thanh toán nào trên hệ thống. Hãy hoàn tất thanh toán cho các đơn đặt chỗ còn hiệu lực.
                </p>
              </div>
            ) : (
              <div className="bg-white border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider">
                        <th className="p-4">Mã giao dịch / Ref</th>
                        <th className="p-4">Cổng thanh toán</th>
                        <th className="p-4">Số tiền</th>
                        <th className="p-4">Trạng thái</th>
                        <th className="p-4">Thời gian thanh toán</th>
                        <th className="p-4">Mã đơn đặt vé</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      {myPayments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50/50 transition">
                          <td className="p-4 font-mono font-bold text-gray-800">
                            {payment.transactionId || '-'} <br />
                            <span className="text-[10px] text-gray-400 font-normal">Ref: {payment.txnRef}</span>
                          </td>
                          <td className="p-4">
                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-bold">
                              {payment.provider}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-baolau-green">
                            {formatPrice(payment.amount)}
                          </td>
                          <td className="p-4">
                            {getStatusBadge(payment.status)}
                          </td>
                          <td className="p-4 text-gray-500">
                            {payment.paidAt ? formatDate(payment.paidAt) : formatDate(payment.createdAt)}
                          </td>
                          <td className="p-4">
                            <Link 
                              to="/my-bookings" 
                              className="text-baolau-cyan hover:underline font-bold inline-flex items-center space-x-1"
                            >
                              <span>Chi tiết vé</span>
                              <ArrowRight size={10} />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center space-x-2 pt-6">
                <button
                  disabled={currentPage === 0 || isLoading}
                  onClick={() => fetchMyPayments(currentPage - 1, 10)}
                  className="px-3 py-1 bg-white border border-gray-300 rounded text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  Trước
                </button>
                <span className="text-xs text-gray-500 flex items-center px-2">
                  Trang {currentPage + 1} / {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages - 1 || isLoading}
                  onClick={() => fetchMyPayments(currentPage + 1, 10)}
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
