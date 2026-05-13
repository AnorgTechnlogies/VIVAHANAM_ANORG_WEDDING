import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { planService } from "../services/planService";
import { toast } from "react-toastify";

const Plans = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState("monthly");

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await planService.getAllPlans();
        if (response.success) {
          setPlans(response.data);
        }
      } catch (error) {
        toast.error("Failed to fetch subscription plans");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handleSelectPlan = (planId) => {
    // Basic redirection for now, can be connected to payment gateway later
    toast.success("Plan selected successfully!");
    navigate("/vendor/dashboard");
  };

  const filteredPlans = plans.filter(plan => plan.billingCycle === billingCycle);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-xl font-medium text-gray-600 animate-pulse">Loading Plans...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-base text-red-600 font-semibold tracking-wide uppercase">Pricing</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Choose the perfect plan for your business
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            Upgrade your vendor profile to get more leads, better visibility, and premium support.
          </p>
        </div>

        {/* Toggle Switch */}
        <div className="mt-12 sm:mt-16 sm:flex sm:justify-center">
          <div className="relative bg-white rounded-lg p-1 flex shadow-sm border border-gray-200">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`${
                billingCycle === "monthly"
                  ? "bg-red-600 text-white shadow-sm"
                  : "bg-transparent text-gray-500 hover:text-gray-900"
              } relative w-1/2 rounded-md py-2 text-sm font-medium whitespace-nowrap focus:outline-none transition-all sm:w-auto sm:px-8`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`${
                billingCycle === "yearly"
                  ? "bg-red-600 text-white shadow-sm"
                  : "bg-transparent text-gray-500 hover:text-gray-900"
              } relative w-1/2 rounded-md py-2 text-sm font-medium whitespace-nowrap focus:outline-none transition-all sm:w-auto sm:px-8`}
            >
              Yearly Billing <span className="text-green-500 font-bold ml-1 text-xs">SAVE 20%</span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="mt-16 space-y-12 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-x-8">
          {filteredPlans.length === 0 ? (
            <div className="col-span-3 text-center text-gray-500 py-10">
              No {billingCycle} plans available at the moment.
            </div>
          ) : (
            filteredPlans.map((plan, index) => {
              // Optionally highlight the middle plan or premium plan
              const isPopular = plan.planName.toLowerCase().includes("premium") || index === 1;

              return (
                <div 
                  key={plan._id} 
                  className={`relative p-8 bg-white border rounded-2xl shadow-sm flex flex-col ${
                    isPopular ? 'border-red-500 ring-2 ring-red-500 scale-105 z-10' : 'border-gray-200'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                      <span className="bg-red-600 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-900">{plan.planName}</h3>
                    <p className="mt-4 flex items-baseline text-5xl font-extrabold text-gray-900">
                      {plan.currency === 'INR' ? '₹' : '$'}{plan.price}
                      <span className="ml-1 text-xl font-medium text-gray-500">/{plan.billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                    </p>
                  </div>

                  <ul className="mt-6 space-y-4 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex">
                        <svg className="flex-shrink-0 w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="ml-3 text-gray-500">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSelectPlan(plan._id)}
                    className={`mt-8 block w-full py-3 px-6 border border-transparent rounded-md text-center font-medium transition-colors ${
                      isPopular 
                        ? 'bg-red-600 text-white hover:bg-red-700' 
                        : 'bg-red-50 text-red-700 hover:bg-red-100'
                    }`}
                  >
                    Choose Plan
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Plans;
