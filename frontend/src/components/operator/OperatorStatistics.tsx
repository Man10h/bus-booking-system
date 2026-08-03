import React, { useEffect, useState } from 'react';
import { useOperatorStore } from '../../store/useOperatorStore';
import { 
  TrendingUp, 
  ShoppingBag, 
  Map, 
  Truck, 
  CalendarDays, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Calendar,
  Loader2
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

  const renderRevenueChart = () => {
    if (isStatsLoading && (!revenueChartData || revenueChartData.length === 0)) {
      return (
        <div className="h-64 flex flex-col items-center justify-center border border-gray-200 rounded bg-white">
          <Loader2 className="animate-spin text-baolau-cyan mb-2" size={24} />
          <span className="text-xs text-gray-500">Đang tải biểu đồ doanh thu...</span>
        </div>
      );
    }

    if (!revenueChartData || revenueChartData.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center border border-dashed border-gray-200 rounded text-gray-400 text-xs bg-white">
          Không có dữ liệu doanh thu trong khoảng thời gian này
        </div>
      );
    }

    const revenues = revenueChartData.map(d => d.revenue);
    const maxRevenue = Math.max(...revenues, 1000000);
    const minRevenue = Math.min(...revenues, 0);
    const range = maxRevenue - minRevenue;

    const width = 800;
    const height = 240;
    const padding = 45;
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
      <div className="w-full overflow-x-auto bg-white border border-gray-200 rounded p-4 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-oswald text-xs font-bold uppercase tracking-wider text-[#132B40] flex items-center">
            <TrendingUp size={14} className="mr-1.5 text-baolau-cyan" /> Xu hướng doanh thu VNĐ
          </h4>
          <span className="text-[10px] text-gray-400">Đơn vị: Đồng</span>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[600px] h-auto">
          <defs>
            <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0096AF" stopOpacity="0.2"/>
              <stop offset="100%" stopColor="#0096AF" stopOpacity="0.0"/>
            </linearGradient>
          </defs>
          
          <path d={areaData} fill="url(#chart-grad)" />

          <path d={pathData} fill="none" stroke="#0096AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = padding + ratio * chartHeight;
            const value = maxRevenue - ratio * range;
            return (
              <g key={i} className="opacity-30">
                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#CCCCCC" strokeDasharray="4 4" />
                <text x={padding - 8} y={y + 4} fill="#132B40" fontSize="9" textAnchor="end" className="font-bold">
                  {formatCurrency(value).replace(' ₫', '')}
                </text>
              </g>
            );
          })}

          {points.map((p, i) => {
            const shouldShowLabel = revenueChartData.length <= 10 || i % Math.ceil(revenueChartData.length / 8) === 0 || i === revenueChartData.length - 1;
            return (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="3.5" fill="#FFFFFF" stroke="#0096AF" strokeWidth="2" />
                {shouldShowLabel && (
                  <text x={p.x} y={height - 12} fill="#777777" fontSize="9" textAnchor="middle">
                    {p.label.substring(5)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Filter bar */}
      <div className="bg-white border border-gray-200 p-6 shadow-sm rounded flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-oswald text-xl font-bold uppercase tracking-wider text-[#132B40]">
            Báo cáo hiệu suất & Doanh thu
          </h2>
          <p className="text-xs text-gray-500 font-sans">
            Thống kê thời gian thực dựa trên các đơn vé và xe của nhà xe
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto font-sans">
          <div className="flex items-center space-x-1.5 bg-gray-50 border border-gray-200 rounded px-2.5 py-1.5">
            <Calendar size={14} className="text-gray-400" />
            <input 
              type="date" 
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-transparent border-none text-xs focus:outline-none cursor-pointer"
            />
            <span className="text-gray-400 text-xs">~</span>
            <input 
              type="date" 
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-transparent border-none text-xs focus:outline-none cursor-pointer"
            />
          </div>

          <select 
            value={statType}
            onChange={(e) => setStatType(e.target.value as 'DAY' | 'MONTH')}
            className="bg-gray-50 border border-gray-200 rounded text-xs px-2.5 py-1.5 cursor-pointer focus:outline-none font-bold"
          >
            <option value="DAY">Theo Ngày</option>
            <option value="MONTH">Theo Tháng</option>
          </select>
        </div>
      </div>

      {/* Stats Cards Grid */}
      {isStatsLoading && !statisticOverview ? (
        <div className="flex items-center justify-center h-48 bg-white border border-gray-200 rounded shadow-sm">
          <div className="text-center space-y-2">
            <Loader2 className="animate-spin text-baolau-cyan mx-auto" size={28} />
            <p className="text-xs text-gray-500">Đang tải số liệu tổng quan...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-sans">
            
            {/* Total Revenue */}
            <div className="bg-white border border-gray-200 p-5 shadow-sm rounded relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Doanh thu tổng</span>
                  <h3 className="text-xl font-bold text-[#FFA800]">{formatCurrency(statisticOverview?.totalRevenue)}</h3>
                </div>
                <div className="p-2 bg-[#FFA800]/10 text-[#FFA800] rounded">
                  <TrendingUp size={18} />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-[10px] text-gray-400">
                <span>Tháng này: <strong>{formatCurrency(statisticOverview?.monthRevenue)}</strong></span>
                <span>Hôm nay: <strong>{formatCurrency(statisticOverview?.todayRevenue)}</strong></span>
              </div>
            </div>

            {/* Bookings Overview */}
            <div className="bg-white border border-gray-200 p-5 shadow-sm rounded">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tổng Đơn đặt vé</span>
                  <h3 className="text-xl font-bold text-[#132B40]">{statisticOverview?.totalBookings || 0} vé</h3>
                </div>
                <div className="p-2 bg-[#132B40]/10 text-[#132B40] rounded">
                  <ShoppingBag size={18} />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-[10px] text-gray-400">
                <span className="flex items-center text-green-600 font-semibold">
                  <CheckCircle size={10} className="mr-0.5" /> Xong: {statisticOverview?.completedBookings}
                </span>
                <span className="flex items-center text-red-500 font-semibold">
                  <XCircle size={10} className="mr-0.5" /> Hủy: {statisticOverview?.cancelledBookings}
                </span>
                <span className="flex items-center text-yellow-500 font-semibold">
                  <AlertCircle size={10} className="mr-0.5" /> Chờ: {statisticOverview?.pendingBookings}
                </span>
              </div>
            </div>

            {/* Infrastructure */}
            <div className="bg-white border border-gray-200 p-5 shadow-sm rounded">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Hạ tầng hoạt động</span>
                  <h3 className="text-base font-bold text-baolau-cyan truncate">
                    {statisticOverview?.activeRoute || 0} Tuyến / {statisticOverview?.activeVehicle || 0} Xe
                  </h3>
                </div>
                <div className="p-2 bg-baolau-cyan/10 text-baolau-cyan rounded">
                  <Map size={18} />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 text-[10px] text-gray-400 flex items-center space-x-1.5">
                <Truck size={12} className="text-gray-400" />
                <span>Số tuyến chạy và phương tiện vận hành</span>
              </div>
            </div>

            {/* Schedules */}
            <div className="bg-white border border-gray-200 p-5 shadow-sm rounded">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Lịch chạy mở bán</span>
                  <h3 className="text-xl font-bold text-baolau-green">{statisticOverview?.openSchedule || 0} chuyến</h3>
                </div>
                <div className="p-2 bg-baolau-green/10 text-baolau-green rounded">
                  <CalendarDays size={18} />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 text-[10px] text-gray-400 flex justify-between">
                <span>Đang chạy trên đường: <strong>{statisticOverview?.runningSchedule || 0}</strong></span>
              </div>
            </div>

          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
            
            {/* Revenue Trend Line Chart */}
            <div className="lg:col-span-2 space-y-2">
              {renderRevenueChart()}
            </div>

            {/* Booking Ratio distribution card */}
            <div className="bg-white border border-gray-200 p-6 shadow-sm rounded flex flex-col justify-between">
              <div>
                <h4 className="font-oswald text-xs font-bold uppercase tracking-wider text-gray-700 mb-6">
                  Tỷ lệ vé đặt thành công
                </h4>
                {statisticOverview && statisticOverview.totalBookings > 0 ? (
                  <div className="space-y-6">
                    <div className="h-4 w-full bg-gray-100 rounded overflow-hidden flex">
                      <div 
                        style={{ width: `${(statisticOverview.completedBookings / statisticOverview.totalBookings) * 100}%` }}
                        className="bg-green-500 h-full"
                        title="Thành công"
                      />
                      <div 
                        style={{ width: `${(statisticOverview.pendingBookings / statisticOverview.totalBookings) * 100}%` }}
                        className="bg-yellow-500 h-full"
                        title="Chờ thanh toán"
                      />
                      <div 
                        style={{ width: `${(statisticOverview.cancelledBookings / statisticOverview.totalBookings) * 100}%` }}
                        className="bg-red-500 h-full"
                        title="Đã hủy"
                      />
                    </div>

                    <div className="space-y-3 pt-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="flex items-center text-gray-600">
                          <span className="w-2.5 h-2.5 bg-green-500 rounded-full mr-2" />
                          Hoàn thành
                        </span>
                        <span className="font-bold text-gray-800">
                          {((statisticOverview.completedBookings / statisticOverview.totalBookings) * 100).toFixed(1)}% ({statisticOverview.completedBookings})
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center text-gray-600">
                          <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full mr-2" />
                          Chờ thanh toán
                        </span>
                        <span className="font-bold text-gray-800">
                          {((statisticOverview.pendingBookings / statisticOverview.totalBookings) * 100).toFixed(1)}% ({statisticOverview.pendingBookings})
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center text-gray-600">
                          <span className="w-2.5 h-2.5 bg-red-500 rounded-full mr-2" />
                          Đã hủy vé
                        </span>
                        <span className="font-bold text-gray-800">
                          {((statisticOverview.cancelledBookings / statisticOverview.totalBookings) * 100).toFixed(1)}% ({statisticOverview.cancelledBookings})
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center text-gray-400 text-xs">
                    Không có dữ liệu đơn hàng
                  </div>
                )}
              </div>
              <div className="text-[10px] text-gray-400 mt-4 border-t border-gray-50 pt-3">
                Tổng đơn vé ghi nhận: <strong>{statisticOverview?.totalBookings || 0}</strong>
              </div>
            </div>

          </div>

          {/* Top Leaderboards Table Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
            
            {/* Top Routes */}
            <div className="bg-white border border-gray-200 p-6 shadow-sm rounded">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                <h4 className="font-oswald text-xs font-bold uppercase tracking-wider text-[#132B40] flex items-center">
                  <Map size={14} className="mr-1.5 text-baolau-cyan" /> Top Tuyến đường có Doanh thu lớn
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase text-[9px] tracking-wider">
                      <th className="py-2">Mã Tuyến</th>
                      <th className="py-2 text-right">Tổng Doanh Thu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topRoutes && topRoutes.length > 0 ? (
                      topRoutes.map((r, i) => (
                        <tr key={r.routeId || i} className="border-b border-gray-100 hover:bg-gray-50/50">
                          <td className="py-3 font-semibold text-[#132B40] flex items-center">
                            <span className="w-5 text-gray-400 font-normal">{i + 1}.</span>
                            {r.routeCode}
                          </td>
                          <td className="py-3 text-right font-bold text-[#FFA800]">
                            {formatCurrency(r.revenue)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2} className="py-8 text-center text-gray-400 text-xs">
                          Chưa ghi nhận doanh thu tuyến chạy nào
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Vehicles */}
            <div className="bg-white border border-gray-200 p-6 shadow-sm rounded">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                <h4 className="font-oswald text-xs font-bold uppercase tracking-wider text-[#132B40] flex items-center">
                  <Truck size={14} className="mr-1.5 text-baolau-cyan" /> Top Xe khách đạt Hiệu quả Doanh thu
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase text-[9px] tracking-wider">
                      <th className="py-2">Biển Số Xe</th>
                      <th className="py-2 text-right">Tổng Doanh Thu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topVehicles && topVehicles.length > 0 ? (
                      topVehicles.map((v, i) => (
                        <tr key={v.vehicleId || i} className="border-b border-gray-100 hover:bg-gray-50/50">
                          <td className="py-3 font-semibold text-[#132B40] flex items-center">
                            <span className="w-5 text-gray-400 font-normal">{i + 1}.</span>
                            {v.licensePlate}
                          </td>
                          <td className="py-3 text-right font-bold text-[#FFA800]">
                            {formatCurrency(v.revenue)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2} className="py-8 text-center text-gray-400 text-xs">
                          Chưa ghi nhận doanh thu phương tiện nào
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
};
