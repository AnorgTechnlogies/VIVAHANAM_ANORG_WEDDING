// Search bar hai ye UI ka main

import { useEffect, useState, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const FORM_KEY = "vendor_onboarding";

const SearchBar = ({ onSearch }) => {
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [showAllCategories, setShowAllCategories] = useState(false);

  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const categoryRef = useRef(null);
  const locationRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setIsCategoryOpen(false);
      }
      if (locationRef.current && !locationRef.current.contains(event.target)) {
        setIsLocationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

        let categoryOptions = (categoryField?.options || []).map((option) => ({
          value: option?.value || option?.label || "",
          label: option?.label || option?.value || "",
          order: option?.order || 0,
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
          // Sort categories by assigned order, fallback to alphabetical
          categoryOptions = categoryOptions.sort((a, b) => {
            if (a.order !== b.order) return a.order - b.order;
            return a.label.localeCompare(b.label);
          });
          setCategories(categoryOptions);
        } else {
          const catRes = await fetch(`${API_BASE}/categories`);
          const catData = await catRes.json().catch(() => ({}));
          let categoriesData = (catData?.data || []).map((item) => ({
            value: item?.value || item?.name || item?.label || "",
            label: item?.label || item?.name || item?.value || "",
          })).filter((item) => item.value && item.label);

          // Sort categories alphabetically by label (fallback)
          categoriesData = categoriesData.sort((a, b) =>
            a.label.localeCompare(b.label)
          );
          setCategories(categoriesData);
        }

        // Sort locations alphabetically by label
        let locationsArray = Array.from(locationMap.values());
        locationsArray = locationsArray.sort((a, b) =>
          a.label.localeCompare(b.label)
        );
        setLocations(locationsArray);
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

        {/* Custom Category Dropdown */}
        <div ref={categoryRef} className="relative w-full">
          <div
            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
            className="w-full bg-gray-50/50 md:bg-transparent border border-gray-200 md:border-none md:border-r border-gray-300 rounded-xl md:rounded-none p-3 text-gray-700 cursor-pointer font-medium text-sm md:text-base flex justify-between items-center h-full"
          >
            <span className={category ? "text-gray-900 truncate pr-2" : "text-gray-500 pr-2"}>
              {category ? categories.find(c => c.value === category)?.label || category : "All Vendor Types"}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${isCategoryOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>

          {isCategoryOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-full bg-white border border-gray-100 shadow-xl rounded-xl max-h-[280px] overflow-y-auto z-50">
              <div
                className="px-3 py-2 text-xs md:text-sm hover:bg-red-50 cursor-pointer text-gray-500 transition-colors"
                onClick={() => { setCategory(""); setIsCategoryOpen(false); }}
              >
                All Vendor Types
              </div>
              {categories.slice(0, showAllCategories ? categories.length : 8).map((item) => (
                <div
                  key={item.value}
                  className="px-3 py-2 text-xs md:text-sm hover:bg-red-50 cursor-pointer text-gray-900 transition-colors"
                  onClick={() => { setCategory(item.value); setIsCategoryOpen(false); }}
                >
                  {item.label}
                </div>
              ))}
              {!showAllCategories && categories.length > 8 && (
                <div
                  className="px-3 py-2 text-xs md:text-sm hover:bg-gray-50 cursor-pointer text-red-600 font-semibold text-center border-t border-gray-100 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAllCategories(true);
                    setTimeout(() => {
                      if (categoryRef.current) {
                        const dropdown = categoryRef.current.querySelector('.overflow-y-auto');
                        if (dropdown) {
                          dropdown.scrollBy({ top: 200, behavior: 'smooth' });
                        }
                      }
                    }, 50);
                  }}
                >
                  --- See all categories ---
                </div>
              )}
            </div>
          )}
        </div>

        {/* Custom Location Dropdown */}
        <div ref={locationRef} className="relative w-full">
          <div
            onClick={() => setIsLocationOpen(!isLocationOpen)}
            className="w-full bg-gray-50/50 md:bg-transparent border border-gray-200 md:border-none rounded-xl md:rounded-none p-3 text-gray-700 cursor-pointer font-medium text-sm md:text-base flex justify-between items-center h-full"
          >
            <span className={location ? "text-gray-900 truncate pr-2" : "text-gray-500 pr-2"}>
              {location ? locations.find(l => l.value === location)?.label || location : "All Locations"}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${isLocationOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>

          {isLocationOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-full bg-white border border-gray-100 shadow-xl rounded-xl max-h-[280px] overflow-y-auto z-50">
              <div
                className="px-3 py-2 text-xs md:text-sm hover:bg-red-50 cursor-pointer text-gray-500 transition-colors"
                onClick={() => { setLocation(""); setIsLocationOpen(false); }}
              >
                All Locations
              </div>
              {locations.map((item) => (
                <div
                  key={item.value || item._id}
                  className="px-3 py-2 text-xs md:text-sm hover:bg-red-50 cursor-pointer text-gray-900 transition-colors"
                  onClick={() => { setLocation(item.value); setIsLocationOpen(false); }}
                >
                  {item.label}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      <button type="submit" className="w-full md:w-auto bg-red-600 text-white rounded-xl md:rounded-full px-8 py-3 font-semibold hover:bg-red-700 transition-all duration-300 shadow-md hover:shadow-lg whitespace-nowrap text-sm md:text-base flex-shrink-0">
        Search Vendors
      </button>
    </form>
  );
};

export default SearchBar;