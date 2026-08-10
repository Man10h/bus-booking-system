import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingService } from '../services/bookingService';
import { paymentService } from '../services/paymentService';
import { useBookingStore } from '../store/useBookingStore';
import { useAuthStore } from '../store/useAuthStore';
import type { ScheduleSeatResponse } from '../types/booking';
import { Sparkles, Loader, X, CheckCircle2, CreditCard, Ticket, Clock, ShieldCheck, Check, Info } from 'lucide-react';

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
      <div className="flex flex-col items-center justify-center py-16 space-y-4 bg-white/80 backdrop-blur-md rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-teal-200 animate-ping absolute inset-0" />
          <Loader className="animate-spin text-teal-600 relative z-10" size={48} />
        </div>
        <span className="text-sm font-semibold text-slate-700 tracking-wide">Đang nạp sơ đồ ghế ngồi trực quan...</span>
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
  const isSleeper = (type?: string) => type === 'SLEEPER' || type === 'BED';
  const isSleeperVehicle = seats.some(s => isSleeper(s.seatResponse.seatType));
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
    <div className="bg-white/90 backdrop-blur-md p-6 lg:p-8 rounded-3xl border border-slate-100 shadow-xl mt-6 transition-all duration-300">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-5 mb-8 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h4 className="font-extrabold text-slate-900 text-xl tracking-tight">
              Sơ đồ đặt {typeLabel.toLowerCase()} trực quan
            </h4>
            {floors.length > 1 && (
              <span className="text-[11px] font-bold bg-gradient-to-r from-teal-500 to-emerald-600 text-white px-3 py-1 rounded-full shadow-sm">
                {floors.length} Tầng
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center space-x-1 font-medium">
            <Info size={13} className="text-teal-600" />
            <span>Chọn vị trí mong muốn trên xe. Nhấn trực tiếp vào sơ đồ để chọn/bỏ chọn. Tối đa 5 chỗ.</span>
          </p>
        </div>

        {/* Floor Switcher Tabs */}
        {floors.length > 1 && (
          <div className="flex space-x-1.5 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/60 shadow-inner">
            {floors.map(floor => (
              <button
                key={floor}
                onClick={() => setActiveFloor(floor)}
                className={`px-5 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  activeFloor === floor 
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20 scale-100' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                Tầng {floor}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Visual Seat Grid Container */}
        <div className="lg:col-span-8 flex justify-center bg-gradient-to-b from-slate-50/80 to-slate-100/50 p-6 md:p-8 rounded-2xl border border-slate-200/70 relative shadow-inner">
          
          {/* Driver Cabin Bar */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <div className="w-14 h-8 bg-gradient-to-r from-slate-700 to-slate-900 rounded-t-xl flex items-center justify-center text-white mb-1 shadow-md border border-slate-600">
              <span className="text-[10px] font-black tracking-widest uppercase text-teal-400">ĐẦU XE</span>
            </div>
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Khu vực vô lăng lái xe</span>
          </div>

          <div className="mt-16 w-full overflow-auto max-h-[520px] p-2 scrollbar-thin">
            <div className="bg-white/95 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl min-w-max mx-auto w-fit block">
              <div 
                className="grid gap-3.5 justify-center items-center"
                style={{
                  gridTemplateColumns: `repeat(${maxCol}, minmax(0, 1fr))`
                }}
              >
                {gridRows.map(rowNum => (
                  gridCols.map(colNum => {
                    const seat = floorSeats.find(s => s.seatResponse.row === rowNum && s.seatResponse.col === colNum);
                    
                    if (!seat) {
                      // Walkway / Empty cell
                      return (
                        <div 
                          key={`empty-${rowNum}-${colNum}`} 
                          className="w-12 h-12 pointer-events-none select-none"
                        />
                      );
                    }

                    const isSelected = selectedSeats.some(s => s.id === seat.id);
                    const isBooked = seat.status === 'BOOKED';
                    const isHeld = seat.status === 'HELD';
                    const isVip = seat.seatResponse.isVip;

                    let buttonClass = 'relative w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold text-xs transition-all duration-200 cursor-pointer shadow-sm ';
                    let statusBadge = '';

                    if (isBooked) {
                      buttonClass += 'bg-slate-200/90 text-slate-400 border border-slate-300 cursor-not-allowed shadow-inner opacity-75';
                      statusBadge = 'Đã bán';
                    } else if (isHeld) {
                      buttonClass += 'bg-amber-100/90 text-amber-800 border border-amber-300 cursor-not-allowed animate-pulse shadow-inner';
                      statusBadge = 'Đang giữ';
                    } else if (isSelected) {
                      buttonClass += 'bg-gradient-to-r from-teal-600 via-emerald-600 to-green-600 text-white border-none shadow-lg shadow-teal-500/30 scale-105 ring-2 ring-teal-400 ring-offset-2';
                      statusBadge = 'Đã chọn';
                    } else {
                      // Available
                      if (isVip) {
                        buttonClass += 'bg-gradient-to-br from-amber-50 to-amber-100/80 border border-amber-300 text-amber-900 shadow-sm hover:border-amber-500 hover:shadow-amber-200 hover:scale-105 active:scale-95';
                        statusBadge = 'VIP Trống';
                      } else {
                        buttonClass += 'bg-white/95 text-slate-700 border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 hover:scale-105 active:scale-95';
                        statusBadge = 'Trống';
                      }
                    }

                    return (
                      <div key={seat.id} className="relative group">
                        <button
                          disabled={isBooked || isHeld}
                          onClick={() => toggleSeatSelection(seat)}
                          className={buttonClass}
                        >
                          {/* Selected Checkmark Badge */}
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 bg-white text-teal-600 rounded-full p-0.5 shadow">
                              <Check size={10} strokeWidth={3} />
                            </div>
                          )}

                          {/* VIP Sparkles Badge */}
                          {isVip && !isBooked && !isHeld && !isSelected && (
                            <div className="absolute top-1 right-1 flex items-center bg-amber-200/80 text-amber-900 text-[8px] font-black px-1 rounded-sm shadow-2xs">
                              <Sparkles size={8} className="mr-0.5 text-amber-600" /> VIP
                            </div>
                          )}

                          {/* Booked / Held overlay icon */}
                          {isBooked && (
                            <span className="text-[10px] font-black text-slate-400">X</span>
                          )}
                          {isHeld && (
                            <Clock size={10} className="text-amber-600 mb-0.5" />
                          )}

                          <span className="font-extrabold tracking-tight text-xs">{seat.seatResponse.seatNumber}</span>
                          <span className="text-[8px] font-medium opacity-80">
                            {isSleeper(seat.seatResponse.seatType) ? 'Nằm' : 'Ngồi'}
                          </span>
                        </button>

                        {/* Hover Glassmorphism Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-44 bg-slate-900/95 backdrop-blur-md text-white text-[11px] rounded-xl p-3 opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-30 text-center shadow-2xl border border-slate-700/60 space-y-1">
                          <div className="flex items-center justify-between font-bold border-b border-slate-700 pb-1 mb-1">
                            <span className="text-teal-400 font-extrabold text-xs">{seat.seatResponse.seatNumber}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${
                              isVip ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40' : 'bg-slate-700 text-slate-300'
                            }`}>
                              {isVip ? 'VIP' : 'Thường'}
                            </span>
                          </div>
                          <p className="text-slate-300">Loại: {isSleeper(seat.seatResponse.seatType) ? 'Giường nằm' : 'Ghế ngồi'}</p>
                          <p className="text-emerald-400 font-bold">{formatPrice(seat.price)}</p>
                          <div className="pt-1 border-t border-slate-800 text-[10px] text-slate-400">
                            Trạng thái: <strong className="text-white">{statusBadge}</strong>
                          </div>
                          {isHeld && seat.heldBy && (
                            <p className="text-[9px] text-amber-300">Giữ bởi: {seat.heldBy}</p>
                          )}
                          {isHeld && seat.expiresAt && (
                            <p className="text-[9px] text-amber-300">Hết hạn: {formatTime(seat.expiresAt)}</p>
                          )}
                        </div>
                      </div>
                    );
                  })
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Selected Seats Sidebar Summary */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Legend */}
          <div className="bg-slate-50/80 backdrop-blur-sm p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <h5 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-200/60 pb-2 flex items-center">
              <ShieldCheck size={14} className="mr-1.5 text-teal-600" />
              Chú thích trạng thái ghế
            </h5>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-white border border-slate-300 rounded-lg shadow-xs" />
                <span className="text-slate-600 font-medium">{typeLabel} thường</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-amber-50 border border-amber-300 rounded-lg shadow-xs flex items-center justify-center">
                  <Sparkles size={10} className="text-amber-600" />
                </div>
                <span className="text-amber-800 font-bold">{typeLabel} VIP</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-lg shadow-xs flex items-center justify-center text-white">
                  <Check size={10} strokeWidth={3} />
                </div>
                <span className="text-slate-900 font-extrabold">Đang chọn</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-amber-100 border border-amber-300 rounded-lg shadow-xs flex items-center justify-center">
                  <Clock size={10} className="text-amber-600" />
                </div>
                <span className="text-amber-700 font-medium">Đang giữ</span>
              </div>
              <div className="flex items-center space-x-2 col-span-2">
                <div className="w-5 h-5 bg-slate-200 border border-slate-300 rounded-lg shadow-xs flex items-center justify-center text-[9px] font-black text-slate-400">X</div>
                <span className="text-slate-500 font-medium">{typeLabel} đã được bán</span>
              </div>
            </div>
          </div>

          {/* Booking Summary Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-md space-y-4">
            <h5 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>Thông tin đặt chỗ</span>
              {selectedSeats.length > 0 && (
                <span className="bg-teal-100 text-teal-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  {selectedSeats.length} chỗ
                </span>
              )}
            </h5>
            
            {selectedSeats.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs italic space-y-1">
                <p>Chưa chọn {typeLabel.toLowerCase()} nào.</p>
                <p className="text-[10px] text-slate-400 font-normal">Nhấn vào sơ đồ ghế bên trái để chọn chỗ.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
                  {selectedSeats.map(s => (
                    <span 
                      key={s.id} 
                      className={`text-xs font-extrabold px-3 py-1.5 rounded-xl flex items-center space-x-1.5 shadow-xs ${
                        s.seatResponse.isVip 
                          ? 'bg-amber-100/90 text-amber-900 border border-amber-300' 
                          : 'bg-teal-50 text-teal-800 border border-teal-200'
                      }`}
                    >
                      <span>{s.seatResponse.seatNumber} ({isSleeper(s.seatResponse.seatType) ? 'Nằm' : 'Ngồi'})</span>
                      {s.seatResponse.isVip && <Sparkles size={10} className="text-amber-600" />}
                    </span>
                  ))}
                </div>
                
                <div className="border-t border-slate-100 pt-3 space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between items-center">
                    <span>Số lượng vé:</span>
                    <strong className="text-slate-900 font-extrabold text-sm">{selectedSeats.length} vé</strong>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-100 pt-2">
                    <span className="font-bold text-slate-700">Tổng tiền tạm tính:</span>
                    <strong className="text-lg text-emerald-600 font-black">
                      {formatPrice(selectedSeats.reduce((sum, s) => sum + s.price, 0))}
                    </strong>
                  </div>
                </div>

                <button
                  disabled={bookingLoading}
                  onClick={handleBooking}
                  className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 disabled:opacity-50 text-white font-extrabold py-3 rounded-xl shadow-lg shadow-teal-600/30 text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
                >
                  {bookingLoading ? (
                    <>
                      <Loader className="animate-spin" size={16} />
                      <span>Đang giữ chỗ...</span>
                    </>
                  ) : (
                    <>
                      <Ticket size={16} />
                      <span>Xác nhận đặt vé ngay</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && createdBooking && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 text-center border-b border-emerald-100 relative">
              <button 
                onClick={handleCloseCheckout}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X size={20} />
              </button>
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="font-extrabold text-xl text-emerald-900 uppercase tracking-wide">Đặt chỗ thành công!</h3>
              <p className="text-emerald-700 text-xs mt-1 font-medium">Hệ thống đã giữ chỗ và khởi tạo mã đơn vé cho bạn</p>
            </div>

            {/* Details */}
            <div className="p-6 space-y-4 text-xs text-slate-600">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="font-medium text-slate-500">Mã đơn vé:</span>
                <span className="font-mono font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg text-sm border border-slate-200">
                  {createdBooking.bookingCode}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="font-medium text-slate-500">Vị trí ghế đã giữ:</span>
                <span className="font-extrabold text-slate-900">
                  {selectedSeats.map(s => s.seatResponse.seatNumber).join(', ')}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="font-medium text-slate-500">Tổng thanh toán:</span>
                <strong className="text-lg text-emerald-600 font-black">
                  {formatPrice(createdBooking.totalAmount)}
                </strong>
              </div>
              <div className="bg-amber-50/90 border border-amber-200/80 rounded-xl p-3.5 text-amber-900 flex items-start space-x-2.5 shadow-2xs">
                <Clock size={18} className="shrink-0 mt-0.5 text-amber-600" />
                <p className="text-[11px] leading-relaxed">
                  Vui lòng thanh toán trước <strong>{formatTime(createdBooking.paymentDeadline)}</strong>. Quá thời hạn này, vé của bạn sẽ tự động bị hủy và ghế được giải phóng.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-slate-50 p-6 flex flex-col space-y-2.5 border-t border-slate-100">
              <button
                disabled={paymentLinkLoading}
                onClick={handleDirectPayment}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold py-3 rounded-xl shadow-lg shadow-emerald-600/30 text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
              >
                {paymentLinkLoading ? (
                  <Loader className="animate-spin" size={16} />
                ) : (
                  <CreditCard size={16} />
                )}
                <span>Thanh toán ngay qua VNPay Sandbox</span>
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleGoToMyBookings}
                  className="w-full bg-white border border-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider hover:bg-slate-100 transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
                >
                  <Ticket size={14} />
                  <span>Vé của tôi</span>
                </button>
                <button
                  onClick={handleCloseCheckout}
                  className="w-full bg-white border border-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider hover:bg-slate-100 transition cursor-pointer shadow-2xs"
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
