// yha pr kaam krna hai vendor ka card show hora hai UI me toh yha database se relavent info show karana hai 

import { Link } from "react-router-dom";


const VendorCard = ({ vendor }) => {
  return (
    <article className="bg-white rounded-xl shadow overflow-hidden border">
      <img
        src={vendor.image ? `${import.meta.env.VITE_ASSET_BASE || ""}${vendor.image}` : fallbackImage}
        alt={vendor.name}
        className="w-full h-48 object-cover"
      />
      <div className="p-4 space-y-2">
        <h3 className="font-bold text-lg">{vendor.name}</h3>
        <p className="text-sm text-gray-600">{vendor.location?.city}, {vendor.location?.state}</p>
        <p className="text-sm">Category: {(vendor.categories || []).join(", ") || "N/A"}</p>
        <p className="text-sm">Rating: {vendor.rating || 0} / 5</p>
        <p className="text-sm">Price: {vendor.price ? `INR ${vendor.price}` : "On request"}</p>
        <Link to={`/wedding-shop/vendors/${vendor._id}`} className="inline-block text-red-700 font-medium">
          View Details
        </Link>
      </div>
    </article>
  );
};

export default VendorCard;
