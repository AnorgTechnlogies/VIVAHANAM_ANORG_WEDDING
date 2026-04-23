import { useNavigate } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import { useEffect, useState } from "react";
import useVendorNavigation from "../hooks/useVendorNavigation";

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

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [catRes, vendorRes] = await Promise.all([
          fetch(`${ROOT_API_BASE}/categories`),
          fetch(`${API_BASE}/vendors?status=approved&limit=4`)
        ]);

        const catData = await catRes.json();
        const vendorData = await vendorRes.json();

        // Fallback mock data if database is empty
        const defaultCategories = [
          { name: "Venues", image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=600&auto=format&fit=crop" },
          { name: "Photographers", image: "https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=600&auto=format&fit=crop" },
          { name: "Makeup", image: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?q=80&w=600&auto=format&fit=crop" },
          { name: "Bridal Wear", image: "https://images.unsplash.com/photo-1596450514735-111a2fe02935?q=80&w=600&auto=format&fit=crop" },
          { name: "Decorators", image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=600&auto=format&fit=crop" },
          { name: "Mehndi", image: "https://images.unsplash.com/photo-1583097148529-57e05fc86bc9?q=80&w=600&auto=format&fit=crop" },
        ];

        const defaultVendors = [
          { _id: "mock1", name: "The Grand Palace", category: "Venue", location: { city: "Delhi", state: "India" }, rating: 4.8, reviews: 120, image: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?q=80&w=600&auto=format&fit=crop" },
          { _id: "mock2", name: "Lens & Lights", category: "Photographer", location: { city: "Mumbai", state: "India" }, rating: 4.9, reviews: 85, image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=600&auto=format&fit=crop" },
          { _id: "mock3", name: "Glow by Sarah", category: "Makeup", location: { city: "Bangalore", state: "India" }, rating: 4.7, reviews: 54, image: "https://images.unsplash.com/photo-1512496015851-a71b4eb827a5?q=80&w=600&auto=format&fit=crop" },
          { _id: "mock4", name: "Royal Threads", category: "Bridal Wear", location: { city: "Jaipur", state: "India" }, rating: 4.6, reviews: 42, image: "https://images.unsplash.com/photo-1585914924626-15adac1e6402?q=80&w=600&auto=format&fit=crop" },
        ];

        let finalCats = catData?.data && catData.data.length > 0 ? catData.data : defaultCategories;
        let finalVendors = vendorData?.data && vendorData.data.length > 0 ? vendorData.data : defaultVendors;

        // Assign placeholder images to DB categories if they don't have one
        if (catData?.data && catData.data.length > 0) {
          finalCats = finalCats.slice(0, 6).map((cat, i) => {
             return { ...cat, image: cat.image || defaultCategories[i % defaultCategories.length].image };
          });
        }

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
    navigate(`/wedding-shop/vendors?${query.toString()}`);
  };

  return (
    <div className="w-full bg-gray-50 min-h-screen -mt-24">
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center pt-20">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2000&auto=format&fit=crop"
            alt="Wedding Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40"></div>
          {/* Subtle gradient at the bottom to blend with the next section */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-50 to-transparent"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight drop-shadow-lg">
            Your Wedding, Your Way
          </h1>
          <p className="text-lg md:text-2xl text-white/90 mb-10 font-medium drop-shadow-md">
            Find the best wedding vendors with thousands of trusted reviews
          </p>

          {/* Search Bar Container */}
          <div className="w-full max-w-4xl transform transition-transform duration-500 hover:scale-[1.01]">
            <SearchBar key="home-search" onSearch={handleSearch} />
          </div>

          <p className="mt-6 text-sm md:text-base text-white/80 font-medium">
            Popular: Venues, Photographers, Makeup Artists
          </p>
        </div>
      </section>

      {/* Vendor Registration CTA Banner */}
      <section className="py-12 bg-white relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="bg-gradient-to-r from-rose-50 to-red-50 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between border border-red-100 shadow-sm">
            <div className="mb-6 md:mb-0 md:mr-8 text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Are you a Wedding Vendor?</h2>
              <p className="text-gray-600 text-lg">Join India's favorite wedding planning platform. Register your business and get discovered by thousands of couples.</p>
            </div>
            <button
              onClick={() => handleVendorNavigation()}
              className="bg-red-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-red-700 transition-colors shadow-md hover:shadow-xl transform hover:-translate-y-1 whitespace-nowrap"
            >
              Register as a Vendor
            </button>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="py-16 max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Popular Categories</h2>
            <p className="text-gray-600 mt-2">Browse through some of the most requested categories</p>
          </div>
          <button 
            onClick={() => navigate("/wedding-shop/vendors")}
            className="text-red-600 font-semibold hover:text-red-800 hidden md:block"
          >
            View All Categories &rarr;
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat, index) => (
            <div
              key={index}
              onClick={() => navigate(`/wedding-shop/vendors?category=${cat.name}`)}
              className="group cursor-pointer flex flex-col items-center"
            >
              <div className="w-full aspect-[4/5] rounded-2xl overflow-hidden mb-3 relative shadow-sm group-hover:shadow-md transition-shadow">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out"
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors"></div>
              </div>
              <h3 className="text-gray-900 font-semibold text-center group-hover:text-red-600 transition-colors">{cat.label || cat.name}</h3>
            </div>
          ))}
        </div>
        <button 
          onClick={() => navigate("/wedding-shop/vendors")}
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredVendors.map((vendor, index) => (
              <div 
                key={vendor._id || index} 
                onClick={() => navigate(`/wedding-shop/vendors/${vendor._id}`)}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 group cursor-pointer flex flex-col"
              >
                <div className="h-48 overflow-hidden relative">
                  <img
                    src={vendor.image || (vendor.gallery && vendor.gallery[0]) || "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop"}
                    alt={vendor.name}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                  {vendor.rating > 0 && (
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-sm font-bold text-gray-900 flex items-center gap-1 shadow-sm">
                      <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                      {vendor.rating}
                    </div>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <p className="text-sm text-red-600 font-semibold mb-1">
                    {Array.isArray(vendor.categories) ? vendor.categories[0] : vendor.category || "Vendor"}
                  </p>
                  <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">{vendor.name}</h3>
                  <div className="flex items-center text-gray-500 text-sm mb-3">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    {vendor.location?.city ? `${vendor.location.city}, ${vendor.location.state}` : "Location not specified"}
                  </div>
                  <div className="mt-auto flex justify-between items-center text-sm text-gray-600 border-t pt-3">
                    <span className="font-semibold text-gray-900">{vendor.price ? `₹${Number(vendor.price).toLocaleString()} onwards` : "Contact for Price"}</span>
                    <span>{vendor.reviews || 0} Reviews</span>
                  </div>
                </div>
              </div>
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
            <img src="https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" alt="Inspiration" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-4 left-4 text-white">
              <h3 className="text-xl font-bold">Real Weddings</h3>
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden group relative">
            <img src="https://images.unsplash.com/photo-1543881528-769b0fa69db4?q=80&w=400&auto=format&fit=crop" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" alt="Inspiration" />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
          </div>
          <div className="rounded-2xl overflow-hidden group relative">
            <img src="https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=400&auto=format&fit=crop" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" alt="Inspiration" />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
          </div>
          <div className="col-span-2 rounded-2xl overflow-hidden group relative">
            <img src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" alt="Inspiration" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-4 left-4 text-white">
              <h3 className="text-xl font-bold">Bridal Fashion</h3>
            </div>
          </div>
        </div>
      </section>

      {/* App Download Banner (Mock) */}
      <section className="bg-rose-50 py-16">
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
          <div className="mb-8 md:mb-0 md:mr-8 text-center md:text-left max-w-lg">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Plan Your Wedding Anywhere</h2>
            <p className="text-gray-600 text-lg mb-6">Download our app to discover vendors, get inspiration, and manage your wedding planning on the go.</p>
            <div className="flex gap-4 justify-center md:justify-start">
              <button className="bg-black text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:bg-gray-800 transition">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.26-.74 3.58-.79 1.5-.04 2.54.54 3.21 1.35-2.81 1.5-2.45 4.88.24 5.92-.61 1.77-1.48 3.56-2.11 5.69zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                App Store
              </button>
              <button className="bg-black text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:bg-gray-800 transition">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M3 20.5v-17c0-.83.67-1.5 1.5-1.5h15c.83 0 1.5.67 1.5 1.5v17c0 .83-.67 1.5-1.5 1.5h-15c-.83 0-1.5-.67-1.5-1.5zM12 2v20M2 12h20M2 7h20M2 17h20"/></svg>
                Google Play
              </button>
            </div>
          </div>
          <div className="w-full md:w-1/3">
            <div className="bg-white p-6 rounded-3xl shadow-xl transform rotate-3">
              <div className="bg-gray-100 rounded-2xl h-80 overflow-hidden relative">
                 <img src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=400&auto=format&fit=crop" className="w-full h-full object-cover" alt="App Preview" />
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