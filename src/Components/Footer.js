import React from "react";
import { FaFacebookF, FaInstagram, FaYoutube } from "react-icons/fa";
import { RiMastercardFill, RiVisaLine } from "react-icons/ri";
import { IoLogoTwitter, IoChevronDown } from "react-icons/io5";

const Footer = () => {
  return (
    <footer className="text-white">
      {/* Top Section */}
      <div className="bg-[#364156]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 px-6 lg:px-10 py-16">
          {/* Column 1 */}
          <div>
            <p className="font-medium text-base text-white">
              Easy Returns:{" "}
              <a className="underline cursor-pointer hover:text-gray-200 transition">
                Free Replacement or Full Refund
              </a>
            </p>
          </div>

          {/* Column 2 */}
          <div>
            <p className="font-semibold text-base mb-3 text-white">Let us help</p>
            <ul className="space-y-2 text-sm text-gray-200">
              <li className="cursor-pointer hover:underline">My Account</li>
              <li className="cursor-pointer hover:underline">Contact us</li>
              <li className="cursor-pointer hover:underline">Bulk Order Inquiry</li>
            </ul>
          </div>

          {/* Column 3 */}
          <div>
            <p className="font-semibold text-base mb-3 text-white">Our Company</p>
            <ul className="space-y-2 text-sm text-gray-200">
              <li className="cursor-pointer hover:underline">Careers</li>
              <li className="cursor-pointer hover:underline">For investors</li>
              <li className="cursor-pointer hover:underline">For media</li>
              <li className="cursor-pointer hover:underline">Sustainability</li>
              <li className="cursor-pointer hover:underline">Annual Returns</li>
              <li className="cursor-pointer hover:underline">
                Corporate Social Responsibility
              </li>
            </ul>
          </div>

          {/* Column 4 */}
          <div>
            <p className="font-semibold text-base mb-3 text-white">Our policies</p>
            <ul className="space-y-2 text-sm text-gray-200">
              <li className="cursor-pointer hover:underline">Terms and Conditions</li>
              <li className="cursor-pointer hover:underline">
                Vista Privacy and Cookie Policy
              </li>
              <li className="cursor-pointer hover:underline">Copyright matters</li>
              <li className="cursor-pointer hover:underline">Patents & trademarks</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="bg-[#0B0B0B] py-8 px-6 lg:px-10 text-sm text-gray-300">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Left Side - Contact & Text */}
          <div className="text-center lg:text-left text-gray-400 text-sm leading-relaxed lg:w-1/3">
            <div className="space-x-3 mb-2">
              <a className="hover:underline text-blue-400 cursor-pointer">
                02522-669393
              </a>
              <a className="hover:underline text-blue-400 cursor-pointer">Home</a>
            </div>
            <p className="text-xs max-w-md mx-auto lg:mx-0 text-gray-400">
              A company © 2001-2025 Mprints. All rights reserved.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Unless stated otherwise, prices are exclusive of delivery and product options.
            </p>
          </div>

          {/* Center - Payment Icons */}
          <div className="flex justify-center items-center gap-3 text-4xl lg:w-1/3">
            <RiMastercardFill className="bg-white p-1 rounded text-[#EA001B]" />
            <RiVisaLine className="bg-white p-1 rounded text-[#1A1F71]" />
            <RiVisaLine className="bg-white p-1 rounded text-[#1A1F71]" />
          </div>

          {/* Right - Social Icons + Country */}
          <div className="flex items-center justify-center lg:justify-end gap-5 lg:w-1/3">
            {/* Social Icons */}
            <div className="flex items-center gap-4 text-2xl">
              <IoLogoTwitter className="cursor-pointer hover:text-blue-400 transition" />
              <FaFacebookF className="cursor-pointer hover:text-blue-500 transition" />
              <FaInstagram className="cursor-pointer hover:text-pink-500 transition" />
              <FaYoutube className="cursor-pointer hover:text-red-500 transition" />
            </div>

            {/* Country Selector */}
            <button className="flex items-center border border-gray-600 px-3 py-1 rounded-md hover:bg-gray-800 transition text-sm">
              <img
                src="https://flagcdn.com/w20/in.png"
                alt="India Flag"
                className="mr-2 rounded-sm"
              />
              <IoChevronDown className="text-lg" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;




