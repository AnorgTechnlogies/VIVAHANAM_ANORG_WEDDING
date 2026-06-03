import { useNavigate } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import { useEffect, useState } from "react";
import useVendorNavigation from "../hooks/useVendorNavigation";
import VendorCard from "../components/VendorCard";
import heroImage from "../assets/hero3.jpg.jpeg";

const API_BASE = import.meta.env.VITE_API_KEY || "http://localhost:8000/api";
const ROOT_API_BASE = API_BASE.replace(/\/admin\/?$/, "");

const Home = () => {
  const navigate = useNavigate();
  const { handleVendorNavigation } = useVendorNavigation();
  const [scrolled, setScrolled] = useState(false);
  const [categories, setCategories] = useState([]);
  const [featuredVendors, setFeaturedVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getImageUrl = (img) => {
    if (!img) return null;
    if (img.startsWith("http")) return img;
    return `${ROOT_API_BASE.replace("/api", "")}${img}`;
  };

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const FORM_KEY = "vendor_onboarding";
        const [formRes, vendorRes] = await Promise.all([
          fetch(`${API_BASE}/marketplace/forms/${FORM_KEY}/config`),
          fetch(`${API_BASE}/vendors?status=approved&limit=4`),
        ]);

        const formData = await formRes.json().catch(() => ({}));
        const vendorData = await vendorRes.json().catch(() => ({}));

        const sections = formData?.data?.sections || [];
        const categoryField = sections
          .flatMap((section) => section?.fields || [])
          .find((field) => field?.key === "category");

        let categoryOptions = [];
        if (categoryField?.options && categoryField.options.length > 0) {
          categoryOptions = categoryField.options.map((option) => ({
            value: option?.value || option?.label || "",
            label: option?.label || option?.value || "",
          })).filter((option) => option.value && option.label);
        }

        if (categoryOptions.length === 0) {
          const catRes = await fetch(`${ROOT_API_BASE}/categories`);
          const catData = await catRes.json().catch(() => ({}));
          categoryOptions = (catData?.data || []).map((item) => ({
            value: item?.value || item?.name || item?.label || "",
            label: item?.label || item?.name || item?.value || "",
          })).filter((item) => item.value && item.label);
        }

        // Dynamic category images mapping
        const categoryImages = {
          venues: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=600&auto=format&fit=crop",
          photographers: "https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=600&auto=format&fit=crop",
          photography: "https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=600&auto=format&fit=crop",
          makeup: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?q=80&w=600&auto=format&fit=crop",
          bridal: "https://images.unsplash.com/photo-1594552072238-b8a33785b261?q=80&w=600&auto=format&fit=crop",
          clothing: "https://images.unsplash.com/photo-1594552072238-b8a33785b261?q=80&w=600&auto=format&fit=crop",
          wear: "https://images.unsplash.com/photo-1594552072238-b8a33785b261?q=80&w=600&auto=format&fit=crop",
          decorators: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=600&auto=format&fit=crop",
          decor: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=600&auto=format&fit=crop",
          mehndi: "https://images.unsplash.com/photo-1583097148529-57e05fc86bc9?q=80&w=600&auto=format&fit=crop",
          mehendi: "https://images.unsplash.com/photo-1583097148529-57e05fc86bc9?q=80&w=600&auto=format&fit=crop",
          catering: "https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=600&auto=format&fit=crop",
          caterers: "https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=600&auto=format&fit=crop",
          band: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=600&auto=format&fit=crop",
          music: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600&auto=format&fit=crop",
          dj: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600&auto=format&fit=crop",
        };

        const finalCats = categoryOptions.map((cat) => {
          const valLower = (cat.value || "").toLowerCase();
          const lblLower = (cat.label || "").toLowerCase();

          // Find case-insensitive substring match in categoryImages keys
          let matchedImg = null;
          for (const [key, url] of Object.entries(categoryImages)) {
            if (valLower.includes(key) || lblLower.includes(key)) {
              matchedImg = url;
              break;
            }
          }

          return {
            ...cat,
            name: cat.value,
            label: cat.label,
            image: matchedImg || "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=600&auto=format&fit=crop"
          };
        });

        // Featured Vendors
        const finalVendors =
          vendorData?.data && vendorData.data.length > 0
            ? vendorData.data
            : [];

        setCategories(finalCats);
        setFeaturedVendors(finalVendors);
      } catch (error) {
        console.error("Failed to load home data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  const handleSearch = ({ category, location }) => {
    const query = new URLSearchParams();
    if (category) query.set("category", category);
    if (location) query.set("location", location);
    navigate(`/vendors?${query.toString()}`);
  };

  return (
    <div className="w-full bg-gray-50 min-h-screen -mt-8">

      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center pt-20">
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt="Wedding Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight drop-shadow-lg">
            Your Wedding, Your Way
          </h1>
          <p className="text-lg md:text-2xl text-white/90 mb-10 font-medium drop-shadow-md">
            Find the best wedding vendors with thousands of trusted reviews
          </p>

          <div className="w-full max-w-4xl transform transition-transform duration-500 hover:scale-[1.01]">
            <SearchBar key="home-search" onSearch={handleSearch} />
          </div>

          <p className="mt-6 text-sm md:text-base text-white/80 font-medium">
            Popular: Venues, Photographers, Makeup Artists
          </p>
        </div>
      </section>

      {/* Vendor Registration CTA Banner - Beautiful Version */}
      <section className="py-16 bg-gradient-to-br from-rose-50 via-white to-red-50 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(#e11d48_0.8px,transparent_1px)] bg-[length:30px_30px] opacity-10"></div>

        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="bg-white rounded-3xl p-10 md:p-16 shadow-xl shadow-red-100/50 border border-red-100 overflow-hidden relative">

            {/* Floating Decorative Elements */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-red-100/30 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-rose-100/30 rounded-full blur-3xl"></div>

            <div className="flex flex-col lg:flex-row items-center gap-12">

              {/* Left Content */}
              <div className="flex-1 text-center lg:text-left">


                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
                  Grow Your Wedding Business
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-600">
                    with USA #1 Platform
                  </span>
                </h2>

                <p className="text-xl text-gray-600 max-w-lg">
                  Get discovered by thousands of couples, receive verified inquiries,
                  and boost your bookings effortlessly.
                </p>
              </div>

              {/* Right Side - Visual + CTA */}
              <div className="flex-shrink-0 flex flex-col items-center">
                <div className="relative mb-8">
                  <div className="w-48 h-48 md:w-56 md:h-56 bg-gradient-to-br from-red-500 to-rose-500 rounded-3xl rotate-6 shadow-2xl flex items-center justify-center">
                    <div className="bg-white w-[92%] h-[92%] rounded-3xl flex items-center justify-center -rotate-6">
                      <div className="text-center">
                        <div className="text-6xl mb-2">💍</div>
                        <div className="text-red-600 font-bold text-xl">+450%</div>
                        <div className="text-gray-500 text-sm">Average growth</div>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleVendorNavigation()}
                  className="group relative bg-gradient-to-r from-red-600 to-rose-600 text-white px-10 py-5 rounded-2xl font-semibold text-xl shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transition-all duration-300 hover:-translate-y-1 flex items-center gap-3 whitespace-nowrap overflow-hidden"
                >
                  <span>Register as a Vendor</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>

                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-700"></div>
                </button>

                <p className="text-xs text-gray-400 mt-4">Takes only 2 minutes • Free to join</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories - Auto Scroll Carousel */}
      <section className="py-16 max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Popular Categories</h2>
            <p className="text-gray-600 mt-2">Browse through some of the most requested categories</p>
          </div>
          <button
            onClick={() => navigate("/vendors")}
            className="text-red-600 font-semibold hover:text-red-800 hidden md:block"
          >
            View All Categories &rarr;
          </button>
        </div>

        {/* Carousel */}
        <div className="overflow-hidden w-full">
          <div
            className="flex gap-5 w-max"
            style={{ animation: "slideLeft 28s linear infinite" }}
            onMouseEnter={(e) => (e.currentTarget.style.animationPlayState = "paused")}
            onMouseLeave={(e) => (e.currentTarget.style.animationPlayState = "running")}
          >
            {[...categories, ...categories].map((cat, index) => (
              <div
                key={index}
                onClick={() => navigate(`/vendors?category=${cat.name}`)}
                className="group cursor-pointer flex flex-col items-center flex-shrink-0 w-[170px] md:w-[210px]"
              >
                {/* Card Image */}
                <div className="w-full aspect-[4/5] rounded-2xl overflow-hidden mb-3 shadow-md group-hover:shadow-xl transition-shadow duration-300">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out"
                  />
                </div>

                {/* Label */}
                <h3 className="text-gray-900 font-semibold text-center text-sm md:text-base group-hover:text-red-600 transition-colors">
                  {cat.label || cat.name}
                </h3>
              </div>
            ))}
          </div>
        </div>

        {/* CSS keyframe */}
        <style>{`
          @keyframes slideLeft {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>

        <button
          onClick={() => navigate("/vendors")}
          className="w-full mt-6 text-red-600 font-semibold hover:text-red-800 md:hidden block text-center"
        >
          View All Categories &rarr;
        </button>
      </section>

      {/* Featured Vendors */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Featured Vendors</h2>
          <p className="text-gray-600 mb-8">Highly rated vendors for your big day</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredVendors.map((vendor, index) => (
              <VendorCard key={vendor._id || index} vendor={vendor} />
            ))}
          </div>
        </div>
      </section>

      {/* Wedding Inspiration */}
      <section className="py-16 max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">Wedding Inspiration</h2>
        <p className="text-gray-600 mb-10 text-center">Discover the latest wedding trends and ideas</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[200px]">
          <div className="col-span-2 row-span-2 rounded-2xl overflow-hidden group relative">
            <img
              src="https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=800&auto=format&fit=crop"
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
              alt="Real Weddings"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-4 left-4 text-white">
              <h3 className="text-xl font-bold">Real Weddings</h3>
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden group relative">
            <img
              src="https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=400&auto=format&fit=crop"
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
              alt="Inspiration"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
          </div>
          <div className="rounded-2xl overflow-hidden group relative">
            <img
              src="https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=400&auto=format&fit=crop"
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
              alt="Inspiration"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
          </div>
          <div className="col-span-2 rounded-2xl overflow-hidden group relative">
            <img
              src="https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=400&auto=format&fit=crop"
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
              alt="Bridal Fashion"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-4 left-4 text-white">
              <h3 className="text-xl font-bold">Bridal Fashion</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section - NEW */}
      <section className="py-20 bg-gradient-to-br from-white to-rose-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Choose Us?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We make wedding planning effortless, reliable, and enjoyable
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="group text-center p-6 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Trusted Vendors</h3>
              <p className="text-gray-600">
                All vendors are verified with real customer reviews and ratings
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group text-center p-6 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Best Price Guarantee</h3>
              <p className="text-gray-600">
                Compare prices from multiple vendors and get the best deals
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group text-center p-6 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Secure Payments</h3>
              <p className="text-gray-600">
                Safe and secure payment options with full buyer protection
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group text-center p-6 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">24/7 Support</h3>
              <p className="text-gray-600">
                Dedicated customer support team ready to help you anytime
              </p>
            </div>
          </div>


        </div>
      </section>

      {/* App Download Banner */}
      <section className="bg-rose-50 py-16">
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
          <div className="mb-8 md:mb-0 md:mr-8 text-center md:text-left max-w-lg">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Plan Your Wedding Anywhere</h2>
            <p className="text-gray-600 text-lg mb-6">
              Download our app to discover vendors, get inspiration, and manage your wedding planning on the go.
            </p>
            <div className="flex gap-4 justify-center md:justify-start">
              <button className="bg-black text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:bg-gray-800 transition">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.26-.74 3.58-.79 1.5-.04 2.54.54 3.21 1.35-2.81 1.5-2.45 4.88.24 5.92-.61 1.77-1.48 3.56-2.11 5.69zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                App Store
              </button>
              <button className="bg-black text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:bg-gray-800 transition">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 20.5v-17c0-.83.67-1.5 1.5-1.5h15c.83 0 1.5.67 1.5 1.5v17c0 .83-.67 1.5-1.5 1.5h-15c-.83 0-1.5-.67-1.5-1.5zM12 2v20M2 12h20M2 7h20M2 17h20" />
                </svg>
                Google Play
              </button>
            </div>
          </div>
          <div className="w-full md:w-1/3">
            <div className="bg-white p-6 rounded-3xl shadow-xl transform rotate-3">
              <div className="bg-gray-100 rounded-2xl h-80 overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=400&auto=format&fit=crop"
                  className="w-full h-full object-cover"
                  alt="App Preview"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-red-600/80 to-transparent flex items-end p-4">
                  <p className="text-white font-bold text-lg">Your Wedding Planner in your pocket</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;