// main UI hai yha pr search or component show hoge


import { useNavigate } from "react-router-dom";
import SearchBar from "../components/SearchBar";

const Home = () => {
  const navigate = useNavigate();

  const handleSearch = ({ category, location }) => {
    const query = new URLSearchParams();
    if (category) query.set("category", category);
    if (location) query.set("location", location);
    navigate(`/wedding-shop/vendors?${query.toString()}`);
  };

  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Wedding Vendor Marketplace</h1>
      <p className="text-gray-600 mb-6">
        Find photographers, makeup artists, decorators and more.
      </p>

      {/* ✅ Buttons always rendered, not dependent on any state */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={() => navigate("/wedding-shop/vendor-register")}
          className="bg-red-700 text-white px-5 py-2 rounded-md hover:bg-black transition"
        >
          Register as Vendor
        </button>
        <button
          onClick={() => navigate("/wedding-shop/vendors")}
          className="border border-red-700 text-red-700 px-5 py-2 rounded-md hover:bg-red-50 transition"
        >
          Browse Vendors
        </button>
      </div>

      {/* ✅ key prop forces SearchBar to fully remount on back-navigation,
           clearing any stale internal state that could affect layout */}
      <SearchBar key="home-search" onSearch={handleSearch} />

      <p className="mt-4 text-sm text-gray-600">
        Vendor registration is public. After submission, admin can approve or
        reject from Admin Dashboard.
      </p>
    </section>
  );
};

export default Home;