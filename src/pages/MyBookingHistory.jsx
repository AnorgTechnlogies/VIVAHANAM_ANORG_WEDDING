import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, CheckCircle, XCircle, AlertCircle, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const StatusBadge = ({ approvalStatus, status }) => {
  if (approvalStatus === 'PENDING') {
    return (
      <span className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200 shadow-sm">
        <AlertCircle className="w-3.5 h-3.5" />
        Pending Vendor Confirmation
      </span>
    );
  }
  if (approvalStatus === 'REJECTED') {
    return (
      <span className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200 shadow-sm">
        <XCircle className="w-3.5 h-3.5" />
        Declined by Vendor
      </span>
    );
  }
  if (approvalStatus === 'ACCEPTED') {
    return (
      <span className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm">
        <CheckCircle className="w-3.5 h-3.5" />
        Confirmed
      </span>
    );
  }
  // Fallback
  return (
    <span className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 shadow-sm">
      {status || 'Unknown'}
    </span>
  );
};

export default function MyBookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = localStorage.getItem("token"); // Assuming user token is stored as "token"
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, "")}/api/book/my-bookings`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (data.success) {
          setBookings(data.data || []);
        }
      } catch (err) {
        console.error("Error fetching bookings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Bookings</h1>
          <p className="mt-2 text-sm text-gray-500">Track and manage your vendor bookings and confirmations.</p>
        </div>
        <Link 
          to="/vendors"
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-amber-600 hover:bg-amber-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
        >
          Browse More Vendors
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
          <FileText className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No bookings yet</h3>
          <p className="mt-1 text-gray-500">You haven't made any vendor bookings.</p>
          <div className="mt-6">
            <Link to="/vendors" className="text-amber-600 hover:text-amber-500 font-medium">
              Start exploring vendors &rarr;
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          {bookings.map((booking) => (
            <div 
              key={booking._id} 
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300 relative"
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-amber-400 to-orange-500"></div>
              
              <div className="p-6 sm:p-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Left Column: Vendor info */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Booking ID: {booking._id.substring(booking._id.length - 8).toUpperCase()}</p>
                      <div className="lg:hidden">
                        <StatusBadge approvalStatus={booking.approvalStatus} status={booking.status} />
                      </div>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">{booking.vendorId?.brandName || 'Vendor'}</h2>
                    <p className="text-sm text-gray-500 font-medium">{booking.vendorType || 'Service'}</p>
                    
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-start text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2.5 mt-0.5 text-gray-400" />
                        <span>{new Date(booking.bookingDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                      <div className="flex items-start text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2.5 mt-0.5 text-gray-400" />
                        <span>{booking.bookingTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Status & Actions */}
                  <div className="lg:w-72 flex flex-col items-start lg:items-end lg:border-l lg:border-gray-100 lg:pl-6 pt-6 lg:pt-0 border-t border-gray-100">
                    <div className="hidden lg:block mb-4">
                      <StatusBadge approvalStatus={booking.approvalStatus} status={booking.status} />
                    </div>
                    
                    <div className="w-full bg-gray-50 rounded-xl p-4 mb-4 text-center lg:text-right">
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Total Amount</p>
                      <p className="text-2xl font-bold text-gray-900">${booking.finalAmount.toFixed(2)}</p>
                    </div>

                    <div className="w-full flex gap-3">
                      <Link 
                        to={`/vendors/${booking.vendorId?._id}`}
                        className="flex-1 text-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
                      >
                        View Vendor
                      </Link>
                    </div>
                  </div>
                </div>
                
                {/* Vendor Confirmation Alert */}
                {booking.approvalStatus === 'PENDING' && (
                  <div className="mt-6 bg-amber-50 rounded-lg p-4 flex items-start border border-amber-100">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 mr-3 shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-amber-800">Waiting for vendor confirmation</h4>
                      <p className="mt-1 text-sm text-amber-700">
                        The vendor has been notified and needs to accept your booking to lock in the date and time. We'll email you once confirmed.
                      </p>
                    </div>
                  </div>
                )}
                {booking.approvalStatus === 'ACCEPTED' && (
                   <div className="mt-6 bg-emerald-50 rounded-lg p-4 flex items-start border border-emerald-100">
                   <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 mr-3 shrink-0" />
                   <div>
                     <h4 className="text-sm font-medium text-emerald-800">Booking Confirmed!</h4>
                     <p className="mt-1 text-sm text-emerald-700">
                       The vendor has confirmed your booking. They will arrive at the scheduled location on time.
                     </p>
                   </div>
                 </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
