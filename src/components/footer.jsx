// Footer.jsx
import React from "react";
const MAIN_DOMAIN = "https://vivahanam.com";
import logo from "../assets/Vivahanam Logo 2.png";
import { Mail, Phone, MapPin, Heart } from "lucide-react";
import {
  FaFacebook,
  FaInstagram,
  FaTwitter,
  FaLinkedin,
  FaYoutube,
} from "react-icons/fa";
import { useContactInfo } from "../../utils/useContactInfo";

const Footer = () => {
  const { contactInfo, loading: loadingContactInfo } = useContactInfo();

  // ✅ Old website pages (main domain) → FULL URL
  const quickLinks = [
    { name: "Blogs", href: `${MAIN_DOMAIN}/blogs` },
    { name: "FAQs", href: `${MAIN_DOMAIN}/faq` },
    { name: "About Us", href: `${MAIN_DOMAIN}/about` },
    { name: "Contact Us", href: `${MAIN_DOMAIN}/contact` },
    { name: "Testimonials", href: `${MAIN_DOMAIN}/testimonials` },
    { name: "Support Issue", href: `${MAIN_DOMAIN}/Raise-issue` },
    { name: "User Issues List", href: `${MAIN_DOMAIN}/user/issues` },
  ];

  // ✅ Services mix: old pages (full URL) + new module (relative)
  const services = [
    { name: "Matchmaking Service", href: `${MAIN_DOMAIN}/payas` },
    { name: "Wedding Service", href: `${MAIN_DOMAIN}/subscription-plans` },
    { name: "Traditional Rituals", href: `${MAIN_DOMAIN}/` },
    { name: "Wedding Shop", href: "/wedding-shop" }, // ✅ New module route
  ];

  // Dynamic Social Media Links based on contactInfo
  const getSocialLinks = () => {
    const socialPlatforms = [
      {
        key: "facebook",
        icon: <FaFacebook size={20} />,
        label: "Facebook",
        href: contactInfo.socialMedia?.facebook || "#",
        active:
          contactInfo.socialMedia?.facebook &&
          contactInfo.socialMedia.facebook.trim() !== "",
      },
      {
        key: "instagram",
        icon: <FaInstagram size={20} />,
        label: "Instagram",
        href: contactInfo.socialMedia?.instagram || "#",
        active:
          contactInfo.socialMedia?.instagram &&
          contactInfo.socialMedia.instagram.trim() !== "",
      },
      {
        key: "twitter",
        icon: <FaTwitter size={20} />,
        label: "Twitter",
        href: contactInfo.socialMedia?.twitter || "#",
        active:
          contactInfo.socialMedia?.twitter &&
          contactInfo.socialMedia.twitter.trim() !== "",
      },
      {
        key: "linkedin",
        icon: <FaLinkedin size={20} />,
        label: "LinkedIn",
        href: contactInfo.socialMedia?.linkedin || "#",
        active:
          contactInfo.socialMedia?.linkedin &&
          contactInfo.socialMedia.linkedin.trim() !== "",
      },
      {
        key: "youtube",
        icon: <FaYoutube size={20} />,
        label: "YouTube",
        href: contactInfo.socialMedia?.youtube || "#",
        active:
          contactInfo.socialMedia?.youtube &&
          contactInfo.socialMedia.youtube.trim() !== "",
      },
    ];

    return socialPlatforms.filter((platform) => platform.active);
  };

  const socialLinks = getSocialLinks();

  return (
    <footer className="bg-gradient-to-br from-amber-900 via-amber-800 to-amber-900 text-white">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-22 h-22 rounded flex items-center justify-center flex-shrink-0 rounded-full">
                <img src={logo} alt="logo" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Vivahanam</h3>
                <p className="text-sm text-amber-100">! विवाहनम् !</p>
              </div>
            </div>
            <p className="text-amber-100 leading-relaxed text-sm">
              वैदिक भारतीय विवाह एवं प्रामाणिक पवित्र संबंध :<br /> Marriage is
              a spiritual journey of trust and faith, strengthened by family
              blessings.
            </p>

            {/* Dynamic Social Media */}
            {socialLinks.length > 0 && (
              <div className="flex gap-3 pt-2">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="w-10 h-10 bg-white/10 hover:bg-white hover:text-amber-800 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold text-white mb-4 border-b-2 border-amber-600 pb-2 inline-block">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-amber-100 hover:text-white hover:pl-2 transition-all duration-200 inline-block"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-bold text-white mb-4 border-b-2 border-amber-600 pb-2 inline-block">
              Our Services
            </h4>
            <ul className="space-y-2">
              {services.map((service) => (
                <li key={service.name}>
                  <a
                    href={service.href}
                    className="text-amber-100 hover:text-white hover:pl-2 transition-all duration-200 inline-block"
                  >
                    {service.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info - DYNAMIC */}
          <div>
            <h4 className="text-lg font-bold text-white mb-4 border-b-2 border-amber-600 pb-2 inline-block">
              Contact Us
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin
                  size={20}
                  className="text-amber-300 flex-shrink-0 mt-1"
                />
                <span className="text-amber-100 text-sm">
                  {loadingContactInfo ? "Loading..." : contactInfo.office}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={20} className="text-amber-300 flex-shrink-0" />
                {loadingContactInfo ? (
                  <span className="text-amber-100">Loading...</span>
                ) : (
                  <a
                    href={`tel:${contactInfo.phone}`}
                    className="text-amber-100 hover:text-white transition-colors"
                  >
                    {contactInfo.phone}
                  </a>
                )}
              </li>
              <li className="flex items-center gap-3">
                <Mail size={20} className="text-amber-300 flex-shrink-0" />
                {loadingContactInfo ? (
                  <span className="text-amber-100">Loading...</span>
                ) : (
                  <a
                    href={`mailto:${contactInfo.email}`}
                    className="text-amber-100 hover:text-white transition-colors"
                  >
                    {contactInfo.email}
                  </a>
                )}
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-amber-700/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-amber-100">
            <p className="text-center md:text-left">
              © {new Date().getFullYear()} Vivahanam. All rights reserved.
            </p>
            <p className="flex items-center gap-2 text-center">
              Made with{" "}
              <Heart size={16} className="text-red-400 fill-red-400" /> for
              sacred unions
            </p>
            <div className="flex gap-4">
              <a
                href={`${MAIN_DOMAIN}/Privacy-Policy-Page`}
                className="hover:text-white transition-colors"
              >
                Privacy Policy
              </a>
              <span>|</span>
              <a
                href={`${MAIN_DOMAIN}/Privacy-Policy-Page`}
                className="hover:text-white transition-colors"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;