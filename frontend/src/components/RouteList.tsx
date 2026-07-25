import React, { useState } from 'react';
import type { RouteSummaryResponse, RouteStopResponse } from '../types/booking';
import { bookingService } from '../services/bookingService';
import { MapPin, Navigation, Clock, ChevronDown, ChevronUp, Loader } from 'lucide-react';

interface RouteListProps {
  routes: RouteSummaryResponse[];
}

export const RouteList: React.FC<RouteListProps> = ({ routes }) => {
  const [expandedRouteId, setExpandedRouteId] = useState<number | null>(null);
  const [stops, setStops] = useState<RouteStopResponse[]>([]);
  const [loadingStops, setLoadingStops] = useState(false);

  const handleToggleStops = async (routeId: number) => {
    if (expandedRouteId === routeId) {
      setExpandedRouteId(null);
      setStops([]);
      return;
    }

    try {
      setExpandedRouteId(routeId);
      setLoadingStops(true);
      const detail = await bookingService.getRouteDetail(routeId);
      // Sort stops by order
      const sortedStops = (detail.routeStopResponse || []).sort((a, b) => a.stopOrder - b.stopOrder);
      setStops(sortedStops);
    } catch (err) {
      console.error("Failed to load route stops", err);
    } finally {
      setLoadingStops(false);
    }
  };

  const formatDuration = (mins: number) => {
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return hrs > 0 ? `${hrs}h ${remainingMins}m` : `${remainingMins}m`;
  };

  if (routes.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-10 text-center space-y-2">
        <Navigation className="mx-auto text-gray-300" size={40} />
        <h4 className="font-bold text-gray-700">Không tìm thấy tuyến xe nào</h4>
        <p className="text-xs text-gray-400">Vui lòng điều chỉnh điều kiện lọc hoặc tìm thành phố khác.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {routes.map((route) => {
        const isExpanded = expandedRouteId === route.id;

        return (
          <div 
            key={route.id} 
            className="bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition overflow-hidden"
          >
            {/* Main card info */}
            <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Left: Origin to Destination */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2.5">
                  <span className="font-bold text-gray-800 text-base">{route.departureCityName}</span>
                  <span className="text-baolau-cyan font-bold text-lg">→</span>
                  <span className="font-bold text-gray-800 text-base">{route.arrivalCityName}</span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono font-semibold">
                    {route.routeCode}
                  </span>
                  {route.operatorResponse && (
                    <span className="flex items-center space-x-1">
                      <span>Nhà xe:</span>
                      <strong className="text-gray-700">{route.operatorResponse.companyName}</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Middle: Distance & Duration */}
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-1.5">
                  <MapPin size={16} className="text-gray-400" />
                  <span>{route.distance} km</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Clock size={16} className="text-gray-400" />
                  <span>{formatDuration(route.estimatedDurationMinutes)}</span>
                </div>
              </div>

              {/* Right: Expand buttons */}
              <div className="flex items-center justify-end">
                <button
                  onClick={() => handleToggleStops(route.id)}
                  className={`flex items-center space-x-1 px-4 py-2 rounded text-xs font-bold uppercase transition focus:outline-none border ${
                    isExpanded 
                      ? 'bg-baolau-dark text-white border-baolau-dark' 
                      : 'bg-white text-baolau-dark border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span>{isExpanded ? 'Ẩn trạm dừng' : 'Lịch trình trạm dừng'}</span>
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
            </div>

            {/* Expandable stops timeline */}
            {isExpanded && (
              <div className="bg-gray-50 border-t border-gray-100 p-6">
                <h5 className="font-bold text-xs text-gray-500 uppercase tracking-wider mb-6">
                  Danh sách trạm đón trả khách
                </h5>
                
                {loadingStops ? (
                  <div className="flex justify-center py-4">
                    <Loader className="animate-spin text-baolau-cyan" size={20} />
                  </div>
                ) : stops.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Không có dữ liệu trạm dừng.</p>
                ) : (
                  <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-baolau-cyan/20">
                    {stops.map((stop, idx) => {
                      const isFirst = idx === 0;
                      const isLast = idx === stops.length - 1;

                      let dotClass = 'absolute left-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold z-10 ';
                      if (isFirst) {
                        dotClass += 'bg-baolau-green text-white border-baolau-green';
                      } else if (isLast) {
                        dotClass += 'bg-red-500 text-white border-red-500';
                      } else {
                        dotClass += 'bg-white text-baolau-cyan border-baolau-cyan';
                      }

                      return (
                        <div key={stop.id} className="relative pl-6">
                          {/* Timeline dot */}
                          <div className={dotClass}>
                            {stop.stopOrder}
                          </div>

                          {/* Stop content */}
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-gray-800 text-sm">{stop.stopName}</span>
                              <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.2 rounded">
                                {stop.cityName}
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>Khoảng cách: {stop.distanceFromStart} km</span>
                              <span>•</span>
                              <span>Dự kiến: +{stop.estimatedArrivalOffsetMinutes} phút</span>
                              {stop.isPickup && (
                                <span className="bg-emerald-50 text-emerald-600 px-1 py-0.1 text-[9px] rounded font-semibold uppercase">Đón</span>
                              )}
                              {stop.isDropOff && (
                                <span className="bg-red-50 text-red-600 px-1 py-0.1 text-[9px] rounded font-semibold uppercase">Trả</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
