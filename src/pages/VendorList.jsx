// Yeh component VendorList page hai — matlab vendors ki list fetch karke UI me dikhata hai, aur saath me search + filter + pagination handle karta hai.

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import VendorCard from "../components/VendorCard";

const API_BASE = import.meta.env.VITE_API_KEY || "http://localhost:8000/api";

const VendorList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  const category = searchParams.get("category") || "";
  const location = searchParams.get("location") || "";
  const page = Number(searchParams.get("page") || 1);

  useEffect(() => {
    const fetchVendors = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams({ status: "approved", page: String(page), limit: "9" });
        if (category) query.set("category", category);
        if (location) query.set("location", location);
        const res = await fetch(`${API_BASE}/vendors?${query.toString()}`);
        const data = await res.json();
        setVendors(data?.data || []);
        setPagination(data?.pagination || { page: 1, totalPages: 1 });
      } catch (error) {
        console.error("Failed to fetch vendors", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVendors();
  }, [category, location, page]);

  const handleSearch = ({ category: c, location: l }) => {
    const query = new URLSearchParams();
    if (c) query.set("category", c);
    if (l) query.set("location", l);
    query.set("page", "1");
    setSearchParams(query);
  };

  const changePage = (nextPage) => {
    const query = new URLSearchParams(searchParams);
    query.set("page", String(nextPage));
    setSearchParams(query);
  };

  return (
    <section className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <SearchBar onSearch={handleSearch} />
      {loading ? (
        <p>Loading vendors...</p>
      ) : vendors.length === 0 ? (
        <p>No approved vendors found for selected filters.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.map((vendor) => (
            <VendorCard key={vendor._id} vendor={vendor} />
          ))}
        </div>
      )}

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => changePage(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="px-4 py-2 border rounded disabled:opacity-40"
        >
          Prev
        </button>
        <span>Page {pagination.page || page} of {pagination.totalPages || 1}</span>
        <button
          onClick={() => changePage(Math.min(pagination.totalPages || 1, page + 1))}
          disabled={page >= (pagination.totalPages || 1)}
          className="px-4 py-2 border rounded disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </section>
  );
};

export default VendorList;
