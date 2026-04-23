import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, User, MapPin, Phone, Briefcase, Calendar, Star, TrendingUp, Package, Eye } from "lucide-react";

const API_URL = import.meta.env.VITE_API_KEY || "http://localhost:8000/api";

export default function VendorDashboard() {
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchVendorData = async () => {
      const token = localStorage.getItem("vendorToken");
      if (!token) {
        navigate("/wedding-shop/vendor-auth");
        return;
      }

      try {
        const res = await fetch(`${API_URL}/vendor/me`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.message || "Session expired");
        }
        
        // If status is not submitted/approved/rejected, they MUST go to registration
        const status = data.data.registrationStatus;
        const submission = data.data.submission;
        const hasData = submission && submission.data && Object.keys(submission.data).length > 0;

        // If not approved/rejected, and not (submitted WITH data), send to registration
        if (status !== 'approved' && status !== 'rejected' && !(status === 'submitted' && hasData)) {
          navigate("/wedding-shop/vendor-register");
          return;
        }

        setVendor(data.data);
      } catch (err) {
        console.error("Dashboard error:", err);
        localStorage.removeItem("vendorToken");
        localStorage.removeItem("vendorData");
        navigate("/wedding-shop/vendor-auth");
      } finally {
        setLoading(false);
      }
    };

    fetchVendorData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("vendorToken");
    localStorage.removeItem("vendorData");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!vendor) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Profile Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="h-32 bg-gradient-to-r from-amber-600 to-red-600"></div>
        <div className="px-6 sm:px-10 pb-8 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between">
            <div className="flex items-center sm:items-end -mt-12 sm:-mt-16 mb-4 sm:mb-0 gap-4 sm:gap-6 flex-col sm:flex-row">
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-full p-2 shadow-lg">
                <div className="w-full h-full bg-amber-100 rounded-full flex items-center justify-center text-amber-600 text-3xl sm:text-4xl font-bold">
                  {vendor.brandName?.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="text-center sm:text-left mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{vendor.brandName}</h1>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4 text-amber-600" />
                    {vendor.vendorType}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-amber-600" />
                    {vendor.city}
                  </span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-28">
            <nav className="flex flex-col p-4 space-y-1">
              <button 
                onClick={() => setActiveTab("overview")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'overview' ? 'bg-amber-50 text-amber-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <TrendingUp className="w-5 h-5" />
                Overview
              </button>
              <button 
                onClick={() => setActiveTab("profile")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'profile' ? 'bg-amber-50 text-amber-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <User className="w-5 h-5" />
                My Profile
              </button>
              <button 
                onClick={() => setActiveTab("services")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'services' ? 'bg-amber-50 text-amber-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <Package className="w-5 h-5" />
                Manage Services
              </button>
              <button 
                onClick={() => setActiveTab("bookings")}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'bookings' ? 'bg-amber-50 text-amber-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <Calendar className="w-5 h-5" />
                Bookings
                <span className="ml-auto bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs">2 New</span>
              </button>
            </nav>
            
            <div className="p-4 border-t border-gray-100">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-sm font-medium text-gray-900 mb-1">Registration Status</div>
                {vendor.registrationStatus === 'approved' ? (
                  <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    Approved & Active
                  </div>
                ) : vendor.registrationStatus === 'rejected' ? (
                  <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    Application Rejected
                  </div>
                ) : vendor.registrationStatus === 'submitted' ? (
                  <div className="flex items-center gap-2 text-amber-600 text-sm font-medium">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    Under Review
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 text-amber-600 text-sm font-medium mb-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                      Pending Registration
                    </div>
                    <button 
                      onClick={() => navigate('/wedding-shop/vendor-register')}
                      className="w-full py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition"
                    >
                      Complete Now
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          {vendor.registrationStatus === 'submitted' && (
            <div className="bg-amber-50 rounded-2xl shadow-sm border border-amber-200 p-8 text-center flex flex-col items-center justify-center mb-6">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Account Under Review</h3>
              <p className="text-gray-600 max-w-md mx-auto mb-6">
                Your vendor registration has been submitted and is currently being reviewed by our admin team. You will be notified once it is approved and you can start listing your services.
              </p>
              <button 
                onClick={() => navigate('/wedding-shop/vendor-register')}
                className="px-6 py-2 bg-white border border-amber-600 text-amber-600 rounded-lg font-medium hover:bg-amber-50 transition"
              >
                View / Edit Registration
              </button>
            </div>
          )}

          {vendor.registrationStatus === 'rejected' && (
            <div className="bg-red-50 rounded-2xl shadow-sm border border-red-200 p-8 text-center flex flex-col items-center justify-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <LogOut className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Application Rejected</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Unfortunately, your vendor application has been rejected by the admin. Please contact support for more information or to appeal this decision.
              </p>
            </div>
          )}

          {vendor.registrationStatus === 'approved' && activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                      <Eye className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-green-600">+12%</span>
                  </div>
                  <div className="text-gray-500 text-sm font-medium mb-1">Profile Views</div>
                  <div className="text-2xl font-bold text-gray-900">1,248</div>
                </div>
                
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-amber-600" />
                    </div>
                    <span className="text-sm font-medium text-green-600">+3%</span>
                  </div>
                  <div className="text-gray-500 text-sm font-medium mb-1">Total Bookings</div>
                  <div className="text-2xl font-bold text-gray-900">42</div>
                </div>
                
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                      <Star className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-400">Current</span>
                  </div>
                  <div className="text-gray-500 text-sm font-medium mb-1">Average Rating</div>
                  <div className="text-2xl font-bold text-gray-900">4.8 / 5.0</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Inquiries (Placeholder)</h3>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl border border-gray-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
                          {['R', 'A', 'S'][i-1]}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{['Rahul Sharma', 'Anjali Gupta', 'Sneha Patel'][i-1]}</div>
                          <div className="text-sm text-gray-500">Requested a quote for {vendor.vendorType} services</div>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {vendor.registrationStatus === 'approved' && activeTab === "profile" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Account Details</h3>
                <button className="text-amber-600 hover:text-amber-700 font-medium text-sm flex items-center gap-1">
                  Edit Profile
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Brand Name</label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 font-medium text-gray-900">
                    {vendor.brandName}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Vendor Type</label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 font-medium text-gray-900">
                    {vendor.vendorType}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Email Address</label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 font-medium text-gray-900">
                    {vendor.email}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Mobile Number</label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 font-medium text-gray-900">
                    {vendor.mobile}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Base City</label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 font-medium text-gray-900">
                    {vendor.city}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Member Since</label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 font-medium text-gray-900">
                    {new Date(vendor.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {vendor.registrationStatus === 'approved' && activeTab === "services" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Service Management</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                You currently don't have any individual service packages listed. Create packages to allow customers to easily book your services.
              </p>
              <button className="px-6 py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition shadow-lg shadow-amber-600/30">
                + Add New Service Package
              </button>
            </div>
          )}

          {vendor.registrationStatus === 'approved' && activeTab === "bookings" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="text-lg font-bold text-gray-900">All Bookings</h3>
                <div className="flex gap-2">
                  <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white outline-none">
                    <option>Upcoming</option>
                    <option>Past</option>
                    <option>Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Calendar className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-1">No Upcoming Bookings</h4>
                <p className="text-gray-500">Your upcoming confirmed bookings will appear here.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
