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
import Plans from "./pages/Plans";

function App() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-8 bg-gray-50">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/vendors" element={<VendorList />} />
          <Route path="/vendors/:id" element={<VendorDetails />} />
          <Route path="/vendor-auth" element={<VendorAuth />} />
          <Route path="/vendor-register" element={<VendorRegister />} />
          <Route path="/vendor/dashboard" element={<VendorDashboard />} />
          <Route path="/my-enquiries" element={<MyEnquiries />} />
          <Route path="/my-shortlist" element={<MyShortlist />} />
          
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/plans" element={<Plans />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}

export default App
