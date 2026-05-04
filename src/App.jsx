import Navbar from "./components/navbar"
import Footer from "./components/footer"
import { Navigate, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import VendorList from "./pages/VendorList";
import VendorDetails from "./pages/VendorDetails";
import VendorRegister from "./pages/VendorRegister";
import VendorAuth from "./pages/VendorAuth";
import VendorDashboard from "./pages/VendorDashboard";
import MyEnquiries from "./pages/MyEnquiries";
import MyShortlist from "./pages/MyShortlist";
import SignUp from "./pages/SignUp";
function App() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-8 bg-gray-50">
        <Routes>
          <Route path="/wedding-shop" element={<Home />} />
          <Route path="/wedding-shop/vendors" element={<VendorList />} />
          <Route path="/wedding-shop/vendors/:id" element={<VendorDetails />} />
          <Route path="/wedding-shop/vendor-auth" element={<VendorAuth />} />
          <Route path="/wedding-shop/vendor-register" element={<VendorRegister />} />
          <Route path="/wedding-shop/vendor/dashboard" element={<VendorDashboard />} />
          <Route path="/wedding-shop/my-enquiries" element={<MyEnquiries />} />
          <Route path="/wedding-shop/my-shortlist" element={<MyShortlist />} />
          <Route path="/shops" element={<Navigate to="/wedding-shop" replace />} />
          <Route path="/" element={<Navigate to="/wedding-shop" replace />} />
          <Route path="/sign-up" element={<SignUp />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}

export default App
