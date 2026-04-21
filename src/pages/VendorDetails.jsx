import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_KEY || "http://localhost:8000/api";

const VendorDetails = () => {
  const { id } = useParams();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVendor = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/vendors/${id}`);
        const data = await res.json();
        setVendor(data?.data || null);
      } catch (error) {
        console.error("Failed to load vendor details", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVendor();
  }, [id]);

  if (loading) return <section className="max-w-4xl mx-auto px-4 py-8">Loading...</section>;
  if (!vendor) return <section className="max-w-4xl mx-auto px-4 py-8">Vendor not found.</section>;

  return (
    <section className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">{vendor.name}</h1>
      <p className="text-gray-600 mb-4">{vendor.location?.city}, {vendor.location?.state}</p>
      <img
        src={vendor.image ? `${import.meta.env.VITE_ASSET_BASE || ""}${vendor.image}` : "https://via.placeholder.com/900x450?text=Wedding+Vendor"}
        alt={vendor.name}
        className="w-full h-72 object-cover rounded-xl mb-4"
      />
      <p className="mb-2"><strong>Status:</strong> {vendor.status}</p>
      <p className="mb-2"><strong>Rating:</strong> {vendor.rating || 0} / 5</p>
      <p className="mb-2"><strong>Price:</strong> {vendor.price ? `INR ${vendor.price}` : "On request"}</p>
      <p className="mb-2"><strong>Categories:</strong> {(vendor.categories || []).join(", ") || "N/A"}</p>
      <p className="text-gray-700 mt-4">{vendor.description || "No description available."}</p>
    </section>
  );
};

export default VendorDetails;
