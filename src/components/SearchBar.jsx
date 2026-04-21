// Search bar hai ye UI ka main

import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_KEY || "http://localhost:8000/api";
const ROOT_API_BASE = API_BASE.replace(/\/admin\/?$/, "");

const SearchBar = ({ onSearch }) => {
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [catRes, locRes] = await Promise.all([
          fetch(`${ROOT_API_BASE}/categories`),
          fetch(`${ROOT_API_BASE}/locations`),
        ]);
        const [catData, locData] = await Promise.all([catRes.json(), locRes.json()]);
        setCategories(catData?.data || []);
        setLocations(locData?.data || []);
      } catch (error) {
        console.error("Failed to load search filters", error);
      }
    };
    fetchMasters();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch({ category, location });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-4 grid md:grid-cols-3 gap-3">
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="border rounded-md p-2"
      >
        <option value="">All Vendor Types</option>
        {categories.map((item) => (
          <option key={item._id} value={item.name}>
            {item.label}
          </option>
        ))}
      </select>

      <select
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        className="border rounded-md p-2"
      >
        <option value="">All Locations</option>
        {locations.map((item) => (
          <option key={item._id} value={item.city}>
            {item.city}, {item.state}
          </option>
        ))}
      </select>

      <button type="submit" className="bg-red-700 text-white rounded-md px-4 py-2 hover:bg-black transition">
        Search Vendors
      </button>
    </form>
  );
};

export default SearchBar;
