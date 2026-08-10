import React from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Bus, 
  Clock, 
  ArrowRight, 
  Calendar, 
  ShieldCheck, 
  Info, 
  HelpCircle,
  TrendingUp,
  Map,
  Compass as ExploreIcon
} from 'lucide-react';

export const Explore: React.FC = () => {
  const destinations = [
    {
      id: 1,
      name: 'Hà Nội',
      title: 'Thủ đô ngàn năm văn hiến',
      desc: 'Điểm khởi đầu lý tưởng để khám phá miền Bắc với Phố cổ trầm mặc, ẩm thực đường phố phong phú và các tuyến xe đi khắp các tỉnh thành.',
      bestSeason: 'Tháng 9 - Tháng 11 (Mùa thu)',
      popularRoute: 'Hà Nội ⇄ Sapa, Hà Nội ⇄ Hạ Long',
      image: 'https://images.unsplash.com/photo-1568515045052-f9a854d70bfd?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 2,
      name: 'Sapa',
      title: 'Thị trấn trong sương',
      desc: 'Nổi tiếng với những thửa ruộng bậc thang kỳ vĩ, đỉnh Fansipan hùng vĩ và bản sắc văn hóa đa dạng của các dân tộc thiểu số vùng cao.',
      bestSeason: 'Tháng 3 - Tháng 5 & Tháng 9 - Tháng 11',
      popularRoute: 'Hà Nội ⇄ Sapa',
      image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 3,
      name: 'Đà Nẵng',
      title: 'Thành phố đáng sống nhất Việt Nam',
      desc: 'Trung tâm kết nối miền Trung với những cây cầu độc đáo, bãi biển Mỹ Khê trải dài và danh thắng Ngũ Hành Sơn kỳ ảo.',
      bestSeason: 'Tháng 2 - Tháng 8 (Mùa khô)',
      popularRoute: 'Đà Nẵng ⇄ Hội An, Đà Nẵng ⇄ Huế',
      image: '/da_nang.jfif'
    },
    {
      id: 4,
      name: 'Hội An',
      title: 'Hoài niệm phố cổ ven sông',
      desc: 'Di sản Văn hóa Thế giới yên bình với những ngôi nhà cổ sơn vàng, đèn lồng rực rỡ sắc màu về đêm và dòng sông Hoài thơ mộng.',
      bestSeason: 'Tháng 2 - Tháng 4',
      popularRoute: 'Hội An ⇄ Đà Nẵng, Hội An ⇄ Nha Trang',
      image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 5,
      name: 'Đà Lạt',
      title: 'Thành phố ngàn hoa',
      desc: 'Khí hậu mát mẻ quanh năm, những đồi thông reo trong gió, những hồ nước sương khói mờ ảo và là thiên đường nghỉ dưỡng lãng mạn.',
      bestSeason: 'Tháng 11 - Tháng 3 (Mùa khô & hoa dã quỳ)',
      popularRoute: 'Sài Gòn ⇄ Đà Lạt, Nha Trang ⇄ Đà Lạt',
      image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 6,
      name: 'Sài Gòn (TP. HCM)',
      title: 'Đô thị năng động không ngủ',
      desc: 'Trung tâm kinh tế sầm uất với nhịp sống hối hả, sự giao thoa kiến trúc Pháp cổ kính và những tòa nhà chọc trời hiện đại.',
      bestSeason: 'Tháng 12 - Tháng 4 (Mùa khô)',
      popularRoute: 'Sài Gòn ⇄ Đà Lạt, Sài Gòn ⇄ Phan Thiết',
      image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=600&q=80'
    }
  ];

  const routes = [
    { from: 'Hà Nội', to: 'Sapa', time: '5 giờ 30 phút', price: '280,000đ - 450,000đ', type: 'Xe giường nằm VIP / Cabin' },
    { from: 'Sài Gòn', to: 'Đà Lạt', time: '6 giờ 30 phút', price: '300,000đ - 500,000đ', type: 'Xe Limousine phòng nằm' },
    { from: 'Đà Nẵng', to: 'Hội An', time: '45 phút', price: '120,000đ - 180,000đ', type: 'Xe trung chuyển / Limousine' },
    { from: 'Nha Trang', to: 'Đà Lạt', time: '3 giờ 30 phút', price: '220,000đ - 300,000đ', type: 'Ghế ngồi ngả / Ghế massage' },
    { from: 'Hà Nội', to: 'Hạ Long', time: '2 giờ 30 phút', price: '200,000đ - 280,000đ', type: 'Xe Limousine Dcar 9 chỗ' },
    { from: 'Sài Gòn', to: 'Mũi Né', time: '4 giờ 15 phút', price: '250,000đ - 350,000đ', type: 'Xe giường nằm chất lượng cao' }
  ];

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-[#333333] pt-16 font-sans">
      
      {/* Hero Banner Section */}
      <div className="relative bg-baolau-dark text-white py-16 px-4 md:px-8 text-center overflow-hidden border-b-4 border-baolau-yellow">
        <div className="absolute inset-0 bg-cover bg-center opacity-30 pointer-events-none" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1920&q=80')` }}></div>
        <div className="relative max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 bg-baolau-yellow/20 border border-baolau-yellow/30 px-3 py-1 text-baolau-yellow text-[10px] font-bold uppercase tracking-widest rounded-none">
            <ExploreIcon size={12} />
            <span>Khám phá Đông Nam Á</span>
          </div>
          <h1 className="font-oswald text-3xl md:text-5xl font-bold uppercase tracking-wider">
            HÀNH TRÌNH KHÔNG GIỚI HẠN
          </h1>
          <p className="text-sm md:text-base text-gray-300 font-sans max-w-2xl mx-auto leading-relaxed">
            Lên kế hoạch và tìm kiếm các tuyến xe khách liên tỉnh kết nối các thành phố du lịch hàng đầu Việt Nam một cách nhanh chóng và an toàn.
          </p>
          <div className="pt-2">
            <Link 
              to="/" 
              className="inline-flex items-center space-x-2 bg-baolau-yellow hover:bg-baolau-yellow/90 text-baolau-dark font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-none transition shadow-md"
            >
              <span>Tìm kiếm hành trình ngay</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-12">
        
        {/* Section 1: Popular Destinations */}
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-3 flex items-center justify-between">
            <h2 className="font-oswald text-xl font-bold uppercase tracking-wider text-baolau-dark flex items-center space-x-2">
              <MapPin size={20} className="text-baolau-cyan" />
              <span>Điểm đến du lịch hàng đầu</span>
            </h2>
            <span className="text-xs text-gray-400 font-medium">Khám phá cẩm nang các thành phố</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {destinations.map((dest) => (
              <div 
                key={dest.id} 
                className="bg-white border border-gray-200 shadow-sm rounded-none overflow-hidden hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="h-44 relative bg-gray-200">
                    <img 
                      src={dest.image} 
                      alt={dest.name} 
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3 bg-baolau-cyan text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5">
                      {dest.name}
                    </div>
                  </div>
                  <div className="p-5 space-y-2">
                    <h3 className="font-oswald text-base font-bold text-gray-800 uppercase tracking-wide">
                      {dest.title}
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed font-sans">
                      {dest.desc}
                    </p>
                  </div>
                </div>
                <div className="px-5 pb-5 pt-2 border-t border-gray-100 bg-gray-50/50 space-y-1.5 text-[11px] font-sans">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Calendar size={12} className="text-baolau-yellow shrink-0" />
                    <span><strong>Mùa đẹp nhất:</strong> {dest.bestSeason}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Bus size={12} className="text-baolau-cyan shrink-0" />
                    <span><strong>Tuyến phổ biến:</strong> {dest.popularRoute}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Recommended Routes Table & Info */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Routes list (Col-8) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="border-b border-gray-200 pb-3">
              <h2 className="font-oswald text-xl font-bold uppercase tracking-wider text-baolau-dark flex items-center space-x-2">
                <Map size={20} className="text-baolau-yellow" />
                <span>Tuyến đường xe khách nổi bật</span>
              </h2>
            </div>

            <div className="bg-white border border-gray-200 shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider text-[10px] bg-gray-50">
                    <th className="py-3 px-4">Tuyến đường</th>
                    <th className="py-3 px-4">Thời gian chạy</th>
                    <th className="py-3 px-4">Giá vé tham khảo</th>
                    <th className="py-3 px-4">Loại xe khách</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {routes.map((route, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition">
                      <td className="py-3 px-4 font-bold text-gray-700">
                        <div className="flex items-center space-x-1.5">
                          <span>{route.from}</span>
                          <ArrowRight size={10} className="text-baolau-cyan" />
                          <span>{route.to}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-500 flex items-center space-x-1">
                        <Clock size={12} className="text-gray-400" />
                        <span>{route.time}</span>
                      </td>
                      <td className="py-3 px-4 text-baolau-cyan font-bold font-mono">
                        {route.price}
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {route.type}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick FAQ / Travel Tips (Col-4) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="border-b border-gray-200 pb-3">
              <h2 className="font-oswald text-xl font-bold uppercase tracking-wider text-baolau-dark flex items-center space-x-2">
                <Info size={20} className="text-baolau-cyan" />
                <span>Lời khuyên hành trình</span>
              </h2>
            </div>

            <div className="bg-white border border-gray-200 shadow-sm p-5 space-y-5 font-sans">
              <div className="flex items-start space-x-3">
                <div className="bg-baolau-cyan/10 text-baolau-cyan p-1.5 shrink-0 mt-0.5">
                  <ShieldCheck size={16} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide">Đặt vé trực tuyến sớm</h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Đặt vé trước tối thiểu 2-3 ngày đối với ngày thường và 1-2 tuần đối với các dịp lễ Tết để giữ được ghế ngồi tốt và tránh tình trạng hết vé.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-baolau-yellow/15 text-baolau-yellow p-1.5 shrink-0 mt-0.5">
                  <Clock size={16} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide">Có mặt trước giờ khởi hành</h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Hãy có mặt tại văn phòng nhà xe hoặc bến xe ít nhất 30-45 phút trước giờ xe chạy để thực hiện thủ tục đổi vé giấy và sắp xếp hành lý ký gửi.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-1.5 shrink-0 mt-0.5">
                  <HelpCircle size={16} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Quy định về hành lý</h4>
                  <p className="text-[11px] text-emerald-600/90 leading-relaxed">
                    Hầu hết các nhà xe cho phép mang theo hành lý xách tay nhỏ gọn và tối đa 20kg ký gửi dưới gầm xe. Hãy gắn thẻ ghi tên và số điện thoại lên hành lý để tránh nhầm lẫn.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Booking CTA Banner */}
        <div className="bg-baolau-dark text-white border-l-4 border-baolau-cyan p-6 md:p-8 flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="space-y-1">
            <h3 className="font-oswald text-lg font-bold uppercase tracking-wider flex items-center space-x-2">
              <TrendingUp size={16} className="text-baolau-cyan" />
              <span>SẴN SÀNG CHO HÀNH TRÌNH CỦA BẠN?</span>
            </h3>
            <p className="text-xs text-gray-300 font-sans max-w-xl">
              Hệ thống của chúng tôi kết nối trực tiếp với dữ liệu lịch trình thực tế của các hãng xe đối tác chất lượng hàng đầu.
            </p>
          </div>
          <Link 
            to="/" 
            className="bg-baolau-cyan hover:bg-baolau-cyan/95 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-none transition shrink-0 shadow-sm"
          >
            Bắt đầu tìm kiếm vé xe
          </Link>
        </div>

      </div>
    </div>
  );
};
