// Search bar hai ye UI ka main

import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_KEY || "http://localhost:8000/api";
const FORM_KEY = "vendor_onboarding";

const SearchBar = ({ onSearch }) => {
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const formRes = await fetch(`${API_BASE}/marketplace/forms/${FORM_KEY}/config`);
        const formData = await formRes.json().catch(() => ({}));

        const sections = formData?.data?.sections || [];
        const categoryField = sections
          .flatMap((section) => section?.fields || [])
          .find((field) => field?.key === "category");
        const configLocations = formData?.data?.locations || [];

        const categoryOptions = (categoryField?.options || []).map((option) => ({
          value: option?.value || option?.label || "",
          label: option?.label || option?.value || "",
        })).filter((option) => option.value && option.label);

        const locationMap = new Map();
        configLocations.forEach((stateItem) => {
          const stateName = stateItem?.state?.trim();
          if (stateName) {
            locationMap.set(`state-${stateName.toLowerCase()}`, {
              value: stateName,
              label: stateName,
            });
          }

          (stateItem?.cities || []).forEach((city) => {
            const cityName = city?.trim();
            if (!cityName) return;
            locationMap.set(`city-${cityName.toLowerCase()}`, {
              value: cityName,
              label: `${cityName}${stateName ? `, ${stateName}` : ""}`,
            });
          });
        });

        if (categoryOptions.length > 0) {
          setCategories(categoryOptions);
        } else {
          const catRes = await fetch(`${API_BASE}/categories`);
          const catData = await catRes.json().catch(() => ({}));
          setCategories(
            (catData?.data || []).map((item) => ({
              value: item?.value || item?.name || item?.label || "",
              label: item?.label || item?.name || item?.value || "",
            })).filter((item) => item.value && item.label)
          );
        }

        setLocations(Array.from(locationMap.values()));
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
    <form onSubmit={handleSubmit} className="bg-white/95 backdrop-blur-sm md:rounded-full rounded-2xl shadow-2xl p-2 md:p-3 flex flex-col md:flex-row items-center gap-3 w-full max-w-4xl mx-auto border border-gray-100">
      <div className="w-full flex-1 flex flex-col md:flex-row gap-3">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full bg-gray-50/50 md:bg-transparent border border-gray-200 md:border-none md:border-r border-gray-300 rounded-xl md:rounded-none p-3 text-gray-700 focus:outline-none focus:ring-0 appearance-none font-medium"
          style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
        >
          <option key="" value="" className="text-gray-500">All Vendor Types</option>
          {categories.map((item) => (
            <option key={item.value} value={item.value} className="text-gray-900">
              {item.label}
            </option>
          ))}
        </select>

        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full bg-gray-50/50 md:bg-transparent border border-gray-200 md:border-none rounded-xl md:rounded-none p-3 text-gray-700 focus:outline-none focus:ring-0 appearance-none font-medium"
          style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
        >
          <option key="" value="" className="text-gray-500">All Locations</option>
          {locations.map((item) => (
            <option key={item.value || item._id} value={item.value} className="text-gray-900">
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" className="w-full md:w-auto bg-red-600 text-white rounded-xl md:rounded-full px-8 py-3 font-semibold hover:bg-red-700 transition-all duration-300 shadow-md hover:shadow-lg whitespace-nowrap">
        Search Vendors
      </button>
    </form>
  );
};

export default SearchBar;
