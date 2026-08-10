import React, { useEffect, useState } from 'react';
import { useOperatorStore } from '../../store/useOperatorStore';
import { 
  TrendingUp, 
  ShoppingBag, 
  Map, 
  Truck, 
  CalendarDays, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Calendar,
  Loader2,
  Trophy,
  Medal,
  Award,
  BarChart3,
  Sparkles
} from 'lucide-react';

export const OperatorStatistics: React.FC = () => {
  const { 
    statisticOverview, 
    revenueChartData, 
    topRoutes, 
    topVehicles, 
    isStatsLoading,
    fetchStatsOverview,
    fetchRevenueChart,
    fetchTopRoutes,
    fetchTopVehicles
  } = useOperatorStore();

  // Filter states: Default 30 days
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const formatDateString = (date: Date) => date.toISOString().split('T')[0];

  const [dateFrom, setDateFrom] = useState(formatDateString(thirtyDaysAgo));
  const [dateTo, setDateTo] = useState(formatDateString(today));
  const [statType, setStatType] = useState<'DAY' | 'MONTH'>('DAY');
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; label: string; val: number } | null>(null);

  useEffect(() => {
    fetchStatsOverview();
    fetchTopRoutes();
    fetchTopVehicles();
  }, []);

  useEffect(() => {
    fetchRevenueChart(dateFrom, dateTo, statType);
  }, [dateFrom, dateTo, statType]);

  const formatCurrency = (val: number | undefined) => {
    if (val === undefined) return '0 đ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  // Rank Medal helper for Top Leaderboard tables
  const getRankBadge = (index: number) => {
    if (index === 0) {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
          <Trophy size={11} className="text-amber-600 fill-amber-500" />
          <span>Top 1</span>
        </span>
      );
    }
    if (index === 1) {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-300">
          <Medal size={11} className="text-slate-500" />
          <span>Top 2</span>
        </span>
      );
    }
    if (index === 2) {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200">
          <Award size={11} className="text-amber-700" />
          <span>Top 3</span>
        </span>
      );
    }
    return <span className="text-slate-400 font-bold text-xs ml-2">#{index + 1}</span>;
  };

  const renderRevenueChart = () => {
    if (isStatsLoading && (!revenueChartData || revenueChartData.length === 0)) {
      return (
        <div className="h-72 flex flex-col items-center justify-center border border-slate-200/80 rounded-2xl bg-white/80 backdrop-blur-md shadow-xs">
          <Loader2 className="animate-spin text-teal-600 mb-2" size={28} />
          <span className="text-xs text-slate-500 font-medium">Đang tải biểu đồ xu hướng doanh thu...</span>
        </div>
      );
    }

    if (!revenueChartData || revenueChartData.length === 0) {
      return (
        <div className="h-72 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs bg-white p-6">
          <BarChart3 size={32} className="text-slate-300 mb-2" />
          <span>Không có dữ liệu doanh thu trong khoảng thời gian này</span>
        </div>
      );
    }

    const revenues = revenueChartData.map(d => d.revenue);
    const maxRevenue = Math.max(...revenues, 1000000);
    const minRevenue = Math.min(...revenues, 0);
    const range = maxRevenue - minRevenue || 1;

    const width = 800;
    const height = 260;
    const padding = 50;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const points = revenueChartData.map((d, index) => {
      const x = padding + (index / (revenueChartData.length - 1 || 1)) * chartWidth;
      const y = height - padding - ((d.revenue - minRevenue) / range) * chartHeight;
      return { x, y, label: d.label, val: d.revenue };
    });

    const pathData = points.reduce((acc, p, index) => {
      return acc + `${index === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
    }, '');

    const areaData = pathData + ` L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    return (
      <div className="w-full bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-6 shadow-sm relative transition-all duration-300">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2 border-b border-slate-100 pb-4">
          <div>
            <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 flex items-center">
              <TrendingUp size={16} className="mr-2 text-teal-600" /> 
              Xu hướng Doanh thu (VNĐ)
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">Biểu đồ thể hiện biến động tổng thu nhập theo mốc thời gian chọn</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-teal-500" />
            <span className="text-xs font-bold text-slate-600">Doanh thu vé</span>
          </div>
        </div>

        <div className="relative">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[600px] h-auto overflow-visible">
            <defs>
              <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0d9488" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="#0d9488" stopOpacity="0.01"/>
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            
            {/* Area gradient background */}
            <path d={areaData} fill="url(#chart-area-grad)" />

            {/* Main curve line */}
            <path 
              d={pathData} 
              fill="none" 
              stroke="#0d9488" 
              strokeWidth="3" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              filter="url(#glow)"
            />

            {/* Grid lines & Y Axis */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y = padding + ratio * chartHeight;
              const value = maxRevenue - ratio * range;
              return (
                <g key={i} className="opacity-30">
                  <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#cbd5e1" strokeDasharray="4 4" />
                  <text x={padding - 10} y={y + 4} fill="#64748b" fontSize="10" textAnchor="end" className="font-bold">
                    {formatCurrency(value).replace(' ₫', '')}
                  </text>
                </g>
              );
            })}

            {/* Data Points */}
            {points.map((p, i) => {
              const shouldShowLabel = revenueChartData.length <= 12 || i % Math.ceil(revenueChartData.length / 8) === 0 || i === revenueChartData.length - 1;
              const isHovered = hoveredPoint?.x === p.x;

              return (
                <g 
                  key={i} 
                  className="cursor-pointer group"
                  onMouseEnter={() => setHoveredPoint(p)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <circle 
                    cx={p.x} 
                    cy={p.y} 
                    r={isHovered ? "6" : "4"} 
                    fill={isHovered ? "#0d9488" : "#ffffff"} 
                    stroke="#0d9488" 
                    strokeWidth={isHovered ? "3" : "2"}
                    className="transition-all duration-150"
                  />
                  {shouldShowLabel && (
                    <text x={p.x} y={height - 12} fill="#64748b" fontSize="10" textAnchor="middle" className="font-semibold">
                      {p.label.substring(5)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Interactive Hover Callout Card */}
          {hoveredPoint && (
            <div 
              className="absolute bg-slate-900/95 backdrop-blur-md text-white text-xs rounded-xl p-3 shadow-2xl border border-slate-700/60 pointer-events-none transition-all z-20 space-y-1"
              style={{
                left: `${(hoveredPoint.x / width) * 100}%`,
                top: `${(hoveredPoint.y / height) * 100 - 15}%`,
                transform: 'translate(-50%, -100%)'
              }}
            >
              <p className="text-slate-300 font-medium text-[10px] border-b border-slate-700 pb-1">{hoveredPoint.label}</p>
              <p className="text-emerald-400 font-black text-sm">{formatCurrency(hoveredPoint.val)}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Max route revenue for progress bar calculation
  const maxRouteRevenue = topRoutes && topRoutes.length > 0 ? Math.max(...topRoutes.map(r => r.revenue)) : 1;
  const maxVehicleRevenue = topVehicles && topVehicles.length > 0 ? Math.max(...topVehicles.map(v => v.revenue)) : 1;

  return (
    <div className="space-y-6">
      
      {/* Title & Filter Bar Header */}
      <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 p-6 shadow-sm rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase">
            Báo cáo Hiệu suất & Doanh thu
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Thống kê thời gian thực dựa trên các đơn vé và phương tiện của nhà xe
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto font-sans">
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 shadow-2xs">
            <Calendar size={15} className="text-teal-600" />
            <input 
              type="date" 
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            />
            <span className="text-slate-400 text-xs font-bold">~</span>
            <input 
              type="date" 
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            />
          </div>

          <select 
            value={statType}
            onChange={(e) => setStatType(e.target.value as 'DAY' | 'MONTH')}
            className="bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2 cursor-pointer focus:outline-none font-bold text-slate-800 shadow-2xs"
          >
            <option value="DAY">Theo Ngày</option>
            <option value="MONTH">Theo Tháng</option>
          </select>
        </div>
      </div>

      {/* Stats Cards Grid */}
      {isStatsLoading && !statisticOverview ? (
        <div className="flex items-center justify-center h-48 bg-white/80 border border-slate-200 rounded-2xl shadow-xs">
          <div className="text-center space-y-2">
            <Loader2 className="animate-spin text-teal-600 mx-auto" size={32} />
            <p className="text-xs text-slate-500 font-medium">Đang nạp số liệu tổng quan...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Total Revenue Card */}
            <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white border border-amber-200/80 p-5 shadow-sm rounded-2xl relative overflow-hidden group hover:shadow-md transition-all">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Doanh thu tổng</span>
                  <h3 className="text-2xl font-black text-amber-600">{formatCurrency(statisticOverview?.totalRevenue)}</h3>
                </div>
                <div className="p-3 bg-amber-500/15 text-amber-700 rounded-xl shadow-xs group-hover:scale-110 transition-transform">
                  <TrendingUp size={22} />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-amber-100 flex justify-between text-[11px] text-slate-600 font-medium">
                <span>Tháng này: <strong className="text-slate-900">{formatCurrency(statisticOverview?.monthRevenue)}</strong></span>
                <span>Hôm nay: <strong className="text-slate-900">{formatCurrency(statisticOverview?.todayRevenue)}</strong></span>
              </div>
            </div>

            {/* Bookings Overview Card */}
            <div className="bg-gradient-to-br from-slate-900/5 via-slate-900/0 to-white border border-slate-200 p-5 shadow-sm rounded-2xl relative overflow-hidden group hover:shadow-md transition-all">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tổng Đơn đặt vé</span>
                  <h3 className="text-2xl font-black text-slate-900">{statisticOverview?.totalBookings || 0} vé</h3>
                </div>
                <div className="p-3 bg-slate-900/10 text-slate-900 rounded-xl shadow-xs group-hover:scale-110 transition-transform">
                  <ShoppingBag size={22} />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-[10px] font-bold">
                <span className="flex items-center text-emerald-600">
                  <CheckCircle2 size={12} className="mr-1" /> Xong: {statisticOverview?.completedBookings}
                </span>
                <span className="flex items-center text-rose-500">
                  <XCircle size={12} className="mr-1" /> Hủy: {statisticOverview?.cancelledBookings}
                </span>
                <span className="flex items-center text-amber-600">
                  <AlertCircle size={12} className="mr-1" /> Chờ: {statisticOverview?.pendingBookings}
                </span>
              </div>
            </div>

            {/* Infrastructure Card */}
            <div className="bg-gradient-to-br from-teal-500/10 via-teal-500/5 to-white border border-teal-200/80 p-5 shadow-sm rounded-2xl relative overflow-hidden group hover:shadow-md transition-all">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-teal-800 uppercase tracking-widest">Hạ tầng vận hành</span>
                  <h3 className="text-lg font-black text-teal-700 truncate">
                    {statisticOverview?.activeRoute || 0} Tuyến / {statisticOverview?.activeVehicle || 0} Xe
                  </h3>
                </div>
                <div className="p-3 bg-teal-500/15 text-teal-700 rounded-xl shadow-xs group-hover:scale-110 transition-transform">
                  <Map size={22} />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-teal-100 text-[11px] text-slate-600 font-medium flex items-center space-x-1.5">
                <Truck size={14} className="text-teal-600" />
                <span>Tuyến đường & Đội xe đang hoạt động</span>
              </div>
            </div>

            {/* Schedules Card */}
            <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-white border border-emerald-200/80 p-5 shadow-sm rounded-2xl relative overflow-hidden group hover:shadow-md transition-all">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Lịch chạy mở bán</span>
                  <h3 className="text-2xl font-black text-emerald-600">{statisticOverview?.openSchedule || 0} chuyến</h3>
                </div>
                <div className="p-3 bg-emerald-500/15 text-emerald-700 rounded-xl shadow-xs group-hover:scale-110 transition-transform">
                  <CalendarDays size={22} />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-emerald-100 text-[11px] text-slate-600 font-medium flex justify-between">
                <span>Đang chạy trên đường: <strong className="text-slate-900 font-bold">{statisticOverview?.runningSchedule || 0} chuyến</strong></span>
              </div>
            </div>

          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Revenue Trend Line Chart */}
            <div className="lg:col-span-2">
              {renderRevenueChart()}
            </div>

            {/* Booking Ratio distribution card */}
            <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 p-6 shadow-sm rounded-2xl flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 mb-6 flex items-center">
                  <Sparkles size={14} className="mr-1.5 text-amber-500" />
                  Tỷ lệ Phân bổ đơn hàng
                </h4>
                {statisticOverview && statisticOverview.totalBookings > 0 ? (
                  <div className="space-y-6">
                    {/* Visual Segmented Progress Bar */}
                    <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner p-0.5 border border-slate-200/60">
                      <div 
                        style={{ width: `${(statisticOverview.completedBookings / statisticOverview.totalBookings) * 100}%` }}
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-l-full transition-all duration-500"
                        title="Thành công"
                      />
                      <div 
                        style={{ width: `${(statisticOverview.pendingBookings / statisticOverview.totalBookings) * 100}%` }}
                        className="bg-amber-400 h-full transition-all duration-500"
                        title="Chờ thanh toán"
                      />
                      <div 
                        style={{ width: `${(statisticOverview.cancelledBookings / statisticOverview.totalBookings) * 100}%` }}
                        className="bg-rose-500 h-full rounded-r-full transition-all duration-500"
                        title="Đã hủy"
                      />
                    </div>

                    <div className="space-y-3.5 pt-2 text-xs">
                      <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="flex items-center text-slate-700 font-semibold">
                          <span className="w-3 h-3 bg-emerald-500 rounded-full mr-2 shadow-xs" />
                          Hoàn tất
                        </span>
                        <span className="font-extrabold text-slate-900">
                          {((statisticOverview.completedBookings / statisticOverview.totalBookings) * 100).toFixed(1)}% ({statisticOverview.completedBookings})
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="flex items-center text-slate-700 font-semibold">
                          <span className="w-3 h-3 bg-amber-400 rounded-full mr-2 shadow-xs" />
                          Chờ thanh toán
                        </span>
                        <span className="font-extrabold text-slate-900">
                          {((statisticOverview.pendingBookings / statisticOverview.totalBookings) * 100).toFixed(1)}% ({statisticOverview.pendingBookings})
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="flex items-center text-slate-700 font-semibold">
                          <span className="w-3 h-3 bg-rose-500 rounded-full mr-2 shadow-xs" />
                          Đã hủy vé
                        </span>
                        <span className="font-extrabold text-slate-900">
                          {((statisticOverview.cancelledBookings / statisticOverview.totalBookings) * 100).toFixed(1)}% ({statisticOverview.cancelledBookings})
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-40 flex items-center justify-center text-slate-400 text-xs italic">
                    Chưa ghi nhận dữ liệu đơn hàng
                  </div>
                )}
              </div>
              <div className="text-[11px] text-slate-400 mt-6 border-t border-slate-100 pt-3 flex justify-between font-medium">
                <span>Tổng vé ghi nhận:</span>
                <strong className="text-slate-800 font-extrabold">{statisticOverview?.totalBookings || 0} vé</strong>
              </div>
            </div>

          </div>

          {/* Top Leaderboards Tables Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Top Routes */}
            <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 p-6 shadow-sm rounded-2xl">
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center">
                  <Map size={16} className="mr-2 text-teal-600" /> Top Tuyến đường Doanh thu Cao
                </h4>
                <span className="text-[10px] font-bold bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full border border-teal-200/60">
                  Xếp hạng
                </span>
              </div>
              
              <div className="space-y-4">
                {topRoutes && topRoutes.length > 0 ? (
                  topRoutes.map((r, i) => {
                    const percentage = Math.round((r.revenue / maxRouteRevenue) * 100);
                    return (
                      <div key={r.routeId || i} className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 transition-all space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center space-x-2">
                            {getRankBadge(i)}
                            <span className="font-extrabold text-slate-900">{r.routeCode}</span>
                          </div>
                          <span className="font-black text-amber-600 text-sm">{formatCurrency(r.revenue)}</span>
                        </div>
                        {/* Revenue Share Bar */}
                        <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${percentage}%` }}
                            className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-slate-400 text-xs italic">
                    Chưa ghi nhận doanh thu tuyến chạy nào
                  </div>
                )}
              </div>
            </div>

            {/* Top Vehicles */}
            <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 p-6 shadow-sm rounded-2xl">
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center">
                  <Truck size={16} className="mr-2 text-teal-600" /> Top Xe khách Đạt Hiệu quả Doanh thu
                </h4>
                <span className="text-[10px] font-bold bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full border border-teal-200/60">
                  Xếp hạng
                </span>
              </div>

              <div className="space-y-4">
                {topVehicles && topVehicles.length > 0 ? (
                  topVehicles.map((v, i) => {
                    const percentage = Math.round((v.revenue / maxVehicleRevenue) * 100);
                    return (
                      <div key={v.vehicleId || i} className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 transition-all space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center space-x-2">
                            {getRankBadge(i)}
                            <span className="font-mono font-black text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                              {v.licensePlate}
                            </span>
                          </div>
                          <span className="font-black text-amber-600 text-sm">{formatCurrency(v.revenue)}</span>
                        </div>
                        {/* Revenue Share Bar */}
                        <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${percentage}%` }}
                            className="bg-gradient-to-r from-amber-500 to-yellow-500 h-full rounded-full transition-all duration-500"
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-slate-400 text-xs italic">
                    Chưa ghi nhận doanh thu phương tiện nào
                  </div>
                )}
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
};
