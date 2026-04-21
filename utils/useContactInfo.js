// hooks/useContactInfo.js
// file change kiya hu pehle ye component me thi maine utils me add kiya hu usko iske route ko adjust kiya hu contactPage me 
import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_KEY ;

export const useContactInfo = () => {
  const [contactInfo, setContactInfo] = useState({
    phone: "+1 (214) 836 4935",
    email: "info@vivahanam.com",
    office: "11583 Independence Parkway Suite 430 Frisco 75035 Texas USA",
    socialMedia: {
      facebook: "",
      twitter: "",
      instagram: "",
      linkedin: "",
      youtube: ""
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/admin/contact-info/active`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch contact info');
        }

        const data = await response.json();
        
        if (data.success && data.data) {
          setContactInfo({
            phone: data.data.phone || "+1 (214) 836 4935",
            email: data.data.email || "ourdivinethoughts@gmail.com",
            office: data.data.office || "North America",
            socialMedia: data.data.socialMedia || {
              facebook: "",
              twitter: "",
              instagram: "",
              linkedin: "",
              youtube: ""
            }
          });
        }
      } catch (err) {
        console.error('Error fetching contact info:', err);
        setError(err.message);
        // Keep default values if fetch fails
      } finally {
        setLoading(false);
      }
    };

    fetchContactInfo();
  }, []);

  return { contactInfo, loading, error };
};