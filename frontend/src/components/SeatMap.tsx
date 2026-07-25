import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingService } from '../services/bookingService';
import { paymentService } from '../services/paymentService';
import { useBookingStore } from '../store/useBookingStore';
import { useAuthStore } from '../store/useAuthStore';
import type { ScheduleSeatResponse } from '../types/booking';
import { Sparkles, Loader, X, CheckCircle2, CreditCard, Ticket, Clock } from 'lucide-react';

interface SeatMapProps {
  scheduleId: number;
}

export const SeatMap: React.FC<SeatMapProps> = ({ scheduleId }) => {
  const [seats, setSeats] = useState<ScheduleSeatResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [activeFloor, setActiveFloor] = useState<number>(1);
  
  // Checkout Modal State
  const [showCheckout, setShowCheckout] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<any>(null);
  const [paymentLinkLoading, setPaymentLinkLoading] = useState(false);

  const { toggleSeatSelection, selectedSeats, clearSeatSelection } = useBookingStore();
  const { isAuthenticated, currentUser } = useAuthStore();
  const navigate = useNavigate();

  const fetchSeats = async () => {
    try {
      setLoading(true);
      const data = await bookingService.getScheduleSeats(scheduleId);
      setSeats(data);
      
      // Auto detect floors available
      const floors = Array.from(new Set(data.map(s => s.seatResponse.floor)));
      if (floors.length > 0) {
        setActiveFloor(Math.min(...floors));
      }
    } catch (err) {
      console.error("Failed to load seats", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeats();
    clearSeatSelection();
  }, [scheduleId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3">
        <Loader className="animate-spin text-baolau-cyan" size={32} />
        <span className="text-sm text-gray-500 font-medium">Đang tải sơ đồ ghế...</span>
      </div>
    );
  }

  // Floors available
  const floors = Array.from(new Set(seats.map(s => s.seatResponse.floor))).sort((a, b) => a - b);
  
  // Filter seats by active floor
  const floorSeats = seats.filter(s => s.seatResponse.floor === activeFloor);

  // Compute grid size
  const maxRow = floorSeats.length > 0 ? Math.max(...floorSeats.map(s => s.seatResponse.row)) : 0;
  const maxCol = floorSeats.length > 0 ? Math.max(...floorSeats.map(s => s.seatResponse.col)) : 0;

  // Generate grid cells
  const gridRows = Array.from({ length: maxRow }, (_, i) => i + 1);
  const gridCols = Array.from({ length: maxCol }, (_, i) => i + 1);

  // Helper to format currency
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  // Helper to format ISO datetime string to time
  const formatTime = (isoString: string | null) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      const hrs = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      const date = d.toLocaleDateString('vi-VN');
      return `${hrs}:${mins} ngày ${date}`;
    } catch {
      return isoString;
    }
  };

  // Detect vehicle seating/sleeper type dynamically
  const isSleeperVehicle = seats.some(s => s.seatResponse.seatType === 'SLEEPER');
  const typeLabel = isSleeperVehicle ? 'Giường' : 'Ghế';

  const handleCloseCheckout = async () => {
    setShowCheckout(false);
    setCreatedBooking(null);
    clearSeatSelection();
    await fetchSeats();
  };

  const handleDirectPayment = async () => {
    if (!createdBooking) return;
    try {
      setPaymentLinkLoading(true);
      const paymentUrl = await paymentService.createPaymentLink(createdBooking.id);
      window.location.href = paymentUrl;
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || "Không thể khởi tạo link thanh toán");
    } finally {
      setPaymentLinkLoading(false);
    }
  };

  const handleGoToMyBookings = () => {
    setShowCheckout(false);
    setCreatedBooking(null);
    clearSeatSelection();
    navigate('/my-bookings');
  };

  const handleBooking = async () => {
    if (!isAuthenticated || !currentUser) {
      alert("Vui lòng đăng nhập trước khi thực hiện đặt chỗ.");
      return;
    }

    if (currentUser.role !== 'USER') {
      alert("Chỉ khách hàng có vai trò USER mới được đặt vé trên hệ thống.");
      return;
    }

    if (selectedSeats.length === 0) {
      alert("Vui lòng chọn ít nhất một chỗ ngồi.");
      return;
    }

    try {
      setBookingLoading(true);
      const seatIds = selectedSeats.map(s => s.id);
      const response = await bookingService.createBooking(scheduleId, seatIds);
      
      setCreatedBooking(response);
      setShowCheckout(true);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Đặt chỗ thất bại';
      alert(errMsg);
    } finally {
      setBookingLoading(false);
    }
  };

  return (

    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-inner mt-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-4 mb-6 gap-4">
        <div>
          <h4 className="font-bold text-gray-900 text-lg flex items-center space-x-2">
            <span>Sơ đồ đặt {typeLabel.toLowerCase()}</span>
            {floors.length > 1 && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                Xe {typeLabel.toLowerCase()} {floors.length} tầng
              </span>
            )}
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">Chọn vị trí ngồi mong muốn của bạn trên xe. Tối đa 5 chỗ.</p>
        </div>

        {/* Floor Switcher */}
        {floors.length > 1 && (
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {floors.map(floor => (
              <button
                key={floor}
                onClick={() => setActiveFloor(floor)}
                className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase transition ${
                  activeFloor === floor 
                    ? 'bg-baolau-dark text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Tầng {floor}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Visual Seat Grid Map */}
        <div className="lg:col-span-8 flex justify-center bg-gray-50/50 p-6 rounded-xl border border-gray-100 relative">
          
          {/* Driver seat indicator */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            <div className="w-10 h-7 bg-gray-300 rounded-t-lg flex items-center justify-center text-white mb-1 shadow-sm">
               vô lăng
            </div>
            phía trước đầu xe
          </div>

          <div className="mt-14 inline-block bg-white p-6 rounded-2xl border border-gray-200/80 shadow-md">
            <div className="space-y-4">
              {gridRows.map(rowNum => (
                <div key={rowNum} className="flex space-x-4 justify-center">
                  {gridCols.map(colNum => {
                    const seat = floorSeats.find(s => s.seatResponse.row === rowNum && s.seatResponse.col === colNum);
                    
                    if (!seat) {
                      // Aisle (empty space)
                      return (
                        <div 
                          key={`empty-${rowNum}-${colNum}`} 
                          className="w-12 h-12 flex items-center justify-center text-[10px] text-gray-300"
                        />
                      );
                    }

                    const isSelected = selectedSeats.some(s => s.id === seat.id);
                    const isBooked = seat.status === 'BOOKED';
                    const isHeld = seat.status === 'HELD';
                    const isVip = seat.seatResponse.isVip;

                    let buttonClass = 'relative w-12 h-12 rounded-lg flex flex-col items-center justify-center font-bold text-xs transition border ';
                    let statusLabel = 'Trống';

                    if (isBooked) {
                      buttonClass += 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed';
                      statusLabel = 'Đã bán';
                    } else if (isHeld) {
                      buttonClass += 'bg-amber-100 text-amber-500 border-amber-200 cursor-not-allowed';
                      statusLabel = 'Đang giữ';
                    } else if (isSelected) {
                      buttonClass += 'bg-baolau-yellow text-baolau-dark border-baolau-yellow shadow-md hover:bg-baolau-yellow/90';
                      statusLabel = 'Đang chọn';
                    } else {
                      // Available
                      if (isVip) {
                        buttonClass += 'bg-amber-50/50 text-amber-700 border-amber-300 hover:border-baolau-yellow hover:bg-amber-100/50';
                        statusLabel = 'Trống (VIP)';
                      } else {
                        buttonClass += 'bg-white text-gray-700 border-gray-300 hover:border-baolau-cyan hover:bg-gray-50';
                      }
                    }

                    return (
                      <div key={seat.id} className="relative group">
                        <button
                          disabled={isBooked || isHeld}
                          onClick={() => toggleSeatSelection(seat)}
                          className={buttonClass}
                        >
                          {/* VIP Badge icon */}
                          {isVip && !isBooked && !isHeld && (
                            <Sparkles className="absolute top-1 right-1 text-amber-500" size={10} />
                          )}
                          <span>{seat.seatResponse.seatNumber}</span>
                          <span className="text-[8px] opacity-75 font-normal">
                            {seat.seatResponse.seatType === 'SLEEPER' ? 'Nằm' : 'Ngồi'}
                          </span>
                        </button>

                        {/* Tooltip on Hover */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 bg-baolau-dark text-white text-[10px] rounded p-2 opacity-0 pointer-events-none group-hover:opacity-100 transition z-20 text-center shadow-lg border border-white/10 space-y-1">
                          <p className="font-bold text-baolau-yellow text-xs">{seat.seatResponse.seatNumber}</p>
                          <p>Loại: {seat.seatResponse.seatType === 'SLEEPER' ? 'Giường nằm' : 'Ghế ngồi'} {isVip ? 'VIP' : 'Thường'}</p>
                          <p>Giá: {formatPrice(seat.price)}</p>
                          <p className="border-t border-white/10 pt-1 font-bold text-gray-300">
                            Trạng thái: {statusLabel}
                          </p>
                          {isHeld && seat.heldBy && (
                            <p className="text-[9px] text-amber-300">Giữ bởi: {seat.heldBy}</p>
                          )}
                          {isHeld && seat.expiresAt && (
                            <p className="text-[9px] text-amber-300">Hết hạn: {formatTime(seat.expiresAt)}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Seats Sidebar Summary */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <h5 className="font-bold text-gray-900 text-sm border-b border-gray-200 pb-2 mb-3">Chú thích sơ đồ</h5>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-white border border-gray-300 rounded" />
                <span className="text-gray-600">{typeLabel} thường</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-amber-50/50 border border-amber-300 rounded relative">
                  <Sparkles className="absolute top-0.5 right-0.5 text-amber-500" size={8} />
                </div>
                <span className="text-amber-700 font-medium">{typeLabel} VIP</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-baolau-yellow border border-baolau-yellow rounded" />
                <span className="text-gray-800 font-semibold">{typeLabel} chọn</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-amber-100 border border-amber-200 rounded" />
                <span className="text-amber-600">Đang giữ</span>
              </div>
              <div className="flex items-center space-x-2 col-span-2">
                <div className="w-6 h-6 bg-gray-200 border border-gray-300 rounded flex items-center justify-center text-[10px] text-gray-400">X</div>
                <span className="text-gray-500">{typeLabel} đã bán</span>
              </div>
            </div>
          </div>

          {/* Booking calculation */}
          <div className="border border-gray-200 rounded-xl p-4 space-y-4">
            <h5 className="font-bold text-gray-900 text-sm border-b border-gray-200 pb-2">Thông tin chọn chỗ</h5>
            
            {selectedSeats.length === 0 ? (
              <p className="text-xs text-gray-500 italic py-2 text-center">Chưa chọn {typeLabel.toLowerCase()} nào.</p>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {selectedSeats.map(s => (
                    <span 
                      key={s.id} 
                      className={`text-xs font-bold px-2.5 py-1 rounded-md flex items-center space-x-1 ${
                        s.seatResponse.isVip 
                          ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                          : 'bg-baolau-cyan/10 text-baolau-cyan border border-baolau-cyan/20'
                      }`}
                    >
                      <span>{s.seatResponse.seatNumber} ({s.seatResponse.seatType === 'SLEEPER' ? 'Nằm' : 'Ngồi'})</span>
                      {s.seatResponse.isVip && <Sparkles size={10} />}
                    </span>
                  ))}
                </div>
                
                <div className="border-t border-gray-100 pt-3 space-y-1.5 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Số lượng vé:</span>
                    <strong className="text-gray-900">{selectedSeats.length} vé</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Tạm tính:</span>
                    <strong className="text-base text-baolau-green font-bold">
                      {formatPrice(selectedSeats.reduce((sum, s) => sum + s.price, 0))}
                    </strong>
                  </div>
                </div>

                <button
                  disabled={bookingLoading}
                  onClick={handleBooking}
                  className="w-full bg-baolau-green hover:bg-baolau-green-hover disabled:bg-gray-400 text-white font-bold py-2.5 rounded shadow text-xs uppercase tracking-wider transition flex items-center justify-center space-x-2"
                >
                  {bookingLoading ? (
                    <>
                      <Loader className="animate-spin" size={14} />
                      <span>Đang xử lý đặt vé...</span>
                    </>
                  ) : (
                    <span>Xác nhận đặt chỗ</span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && createdBooking && (
        <div className="fixed inset-0 bg-baolau-dark/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-emerald-50 p-6 text-center border-b border-emerald-100 relative">
              <button 
                onClick={handleCloseCheckout}
                className="absolute top-4 right-4 text-emerald-700/60 hover:text-emerald-700 transition"
              >
                <X size={20} />
              </button>
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="font-oswald text-lg font-bold text-emerald-800 uppercase tracking-wide">Đặt chỗ thành công!</h3>
              <p className="text-emerald-600 text-xs mt-1">Hệ thống đã giữ chỗ và tạo hóa đơn thanh toán cho bạn</p>
            </div>

            {/* Details */}
            <div className="p-6 space-y-4 text-xs text-gray-600">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span>Mã đặt chỗ:</span>
                <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-sm">
                  {createdBooking.bookingCode}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span>Số ghế đã đặt:</span>
                <span className="font-bold text-gray-900">
                  {selectedSeats.map(s => s.seatResponse.seatNumber).join(', ')}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span>Tổng số tiền:</span>
                <strong className="text-base text-baolau-green font-bold">
                  {formatPrice(createdBooking.totalAmount)}
                </strong>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded p-3 text-amber-800 flex items-start space-x-2">
                <Clock size={16} className="shrink-0 mt-0.5 text-amber-600" />
                <p className="text-[10px]">
                  Vui lòng thanh toán trước ngày <strong>{formatTime(createdBooking.paymentDeadline)}</strong>. Quá thời hạn này, vé xe của bạn sẽ tự động bị hủy và ghế sẽ được mở lại cho khách khác.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-gray-50 px-6 py-4 flex flex-col space-y-2">
              <button
                disabled={paymentLinkLoading}
                onClick={handleDirectPayment}
                className="w-full bg-baolau-green hover:bg-baolau-green-hover text-white font-bold py-2.5 rounded shadow text-xs uppercase tracking-wider transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                {paymentLinkLoading ? (
                  <Loader className="animate-spin" size={14} />
                ) : (
                  <CreditCard size={14} />
                )}
                <span>Thanh toán ngay qua VNPay</span>
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleGoToMyBookings}
                  className="w-full bg-white border border-gray-300 text-gray-700 font-bold py-2 rounded text-[10px] uppercase tracking-wider hover:bg-gray-50 transition flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <Ticket size={12} />
                  <span>Vé của tôi</span>
                </button>
                <button
                  onClick={handleCloseCheckout}
                  className="w-full bg-white border border-gray-300 text-gray-700 font-bold py-2 rounded text-[10px] uppercase tracking-wider hover:bg-gray-50 transition cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

