import React from 'react';
import type { ScheduleSummaryResponse } from '../types/booking';
import { useBookingStore } from '../store/useBookingStore';
import { SeatMap } from './SeatMap';
import { Clock, Award } from 'lucide-react';

interface ScheduleListProps {
  schedules: ScheduleSummaryResponse[];
}

export const ScheduleList: React.FC<ScheduleListProps> = ({ schedules }) => {
  const { selectedSchedule, setSelectedSchedule, operators } = useBookingStore();

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    const hrs = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${hrs}:${mins}`;
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    const date = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${date}/${month}/${year}`;
  };

  const calculateDuration = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  if (schedules.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-10 text-center space-y-2">
        <Clock className="mx-auto text-gray-300" size={40} />
        <h4 className="font-bold text-gray-700">Không tìm thấy lịch trình chuyến xe nào</h4>
        <p className="text-xs text-gray-400">Vui lòng chọn ngày khác hoặc thử tuyến khác.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {schedules.map((schedule) => {
        const isSelected = selectedSchedule?.id === schedule.id;
        const operator = operators.find((op) => op.id === schedule.operatorId);

        return (
          <div 
            key={schedule.id}
            className={`bg-white border rounded-lg transition overflow-hidden shadow-sm ${
              isSelected ? 'border-baolau-cyan shadow-md' : 'border-gray-100 hover:shadow-md'
            }`}
          >
            {/* Header info */}
            <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              
              {/* Operator details */}
              <div className="flex items-center space-x-3 lg:w-1/5">
                {operator?.avatarUrl ? (
                  <img 
                    src={operator.avatarUrl} 
                    alt={operator.companyName} 
                    className="w-10 h-10 rounded-full object-cover border border-gray-100"
                  />
                ) : (
                  <div className="w-10 h-10 bg-baolau-dark/5 text-baolau-dark rounded-full flex items-center justify-center font-bold text-sm">
                    {(operator?.companyName || 'Nhà Xe').charAt(0)}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">{operator?.companyName || 'Nhà Xe Đối Tác'}</h4>
                  {operator?.contactPhone && (
                    <p className="text-[10px] text-gray-500 font-semibold mt-0.5">Hotline: {operator.contactPhone}</p>
                  )}
                </div>
              </div>

              {/* Route Cities */}
              <div className="flex flex-col justify-center lg:w-1/5">
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Tuyến đường</span>
                <div className="flex items-center space-x-1.5 mt-1">
                  <span className="font-bold text-gray-800 text-xs">
                    {schedule.routeDetailResponse?.departureCityName || schedule.departureCityName || 'N/A'}
                  </span>
                  <span className="text-baolau-cyan font-extrabold text-sm">→</span>
                  <span className="font-bold text-gray-800 text-xs">
                    {schedule.routeDetailResponse?.arrivalCityName || schedule.arrivalCityName || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Timing & duration */}
              <div className="flex items-center justify-between lg:justify-center space-x-8 lg:w-1/4">
                <div className="text-center">
                  <span className="block font-bold text-[#132B40] text-base">{formatTime(schedule.departureTime)}</span>
                  <span className="block text-[10px] text-gray-500 font-bold mt-0.5">{formatDate(schedule.departureTime)}</span>
                  <span className="text-[10px] text-gray-400 font-medium mt-1 block">Khởi hành</span>
                </div>
                <div className="flex flex-col items-center justify-center flex-grow max-w-[120px]">
                  <span className="text-[10px] text-gray-400 font-bold mb-1 flex items-center space-x-1">
                    <Clock size={10} />
                    <span>{calculateDuration(schedule.departureTime, schedule.arrivalTime)}</span>
                  </span>
                  <div className="relative w-full h-[2px] bg-gray-200">
                    <div className="absolute top-1/2 left-0 -translate-y-1/2 w-2 h-2 rounded-full bg-gray-300" />
                    <div className="absolute top-1/2 right-0 -translate-y-1/2 w-2 h-2 rounded-full bg-baolau-cyan" />
                  </div>
                </div>
                <div className="text-center">
                  <span className="block font-bold text-[#132B40] text-base">{formatTime(schedule.arrivalTime)}</span>
                  <span className="block text-[10px] text-gray-500 font-bold mt-0.5">{formatDate(schedule.arrivalTime)}</span>
                  <span className="text-[10px] text-gray-400 font-medium mt-1 block">Đến nơi</span>
                </div>
              </div>

              {/* Available seat capacity */}
              <div className="flex flex-col justify-center items-start lg:items-center text-xs lg:w-1/6">
                <span className="text-gray-500">Ghế trống:</span>
                <span className={`text-sm font-bold mt-0.5 ${
                  schedule.availableSeats > 5 ? 'text-baolau-green' : 'text-red-500'
                }`}>
                  {schedule.availableSeats} / {schedule.totalSeats} ghế
                </span>
              </div>

              {/* Price range */}
              <div className="flex flex-col justify-center items-start lg:items-end lg:w-1/6">
                <span className="text-gray-500 text-xs">Giá vé:</span>
                <span className="text-base text-baolau-green font-bold mt-0.5">
                  {formatPrice(schedule.basePrice)}
                </span>
                {schedule.vipPrice > schedule.basePrice && (
                  <span className="text-[10px] text-amber-600 font-bold flex items-center space-x-0.5">
                    <Award size={10} />
                    <span>VIP: {formatPrice(schedule.vipPrice)}</span>
                  </span>
                )}
              </div>

              {/* Action booking button */}
              <div className="flex items-center justify-end">
                <button
                  onClick={() => setSelectedSchedule(isSelected ? null : schedule)}
                  className={`w-full lg:w-auto px-5 py-2.5 rounded font-bold text-xs uppercase tracking-wider transition ${
                    isSelected
                      ? 'bg-baolau-dark text-white shadow-sm'
                      : 'bg-baolau-yellow hover:bg-baolau-yellow/90 text-baolau-dark shadow-sm'
                  }`}
                >
                  {isSelected ? 'Đóng sơ đồ' : 'Chọn chỗ'}
                </button>
              </div>

            </div>

            {/* In-place seat selection */}
            {isSelected && (
              <div className="border-t border-gray-100 bg-gray-50/50 p-4 lg:p-6 animate-in fade-in slide-in-from-top-1 duration-200">
                <SeatMap scheduleId={schedule.id} />
              </div>
            )}

          </div>
        );
      })}
    </div>
  );
};
