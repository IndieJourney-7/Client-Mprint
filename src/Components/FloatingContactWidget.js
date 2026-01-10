import { IoCall, IoLogoWhatsapp } from "react-icons/io5";

const FloatingContactWidget = ({
  phoneNumber = "02522-669393",
  whatsappNumber = "919876543210"
}) => {

  const handlePhoneClick = () => {
    window.location.href = `tel:${phoneNumber.replace(/-/g, "")}`;
  };

  const handleWhatsAppClick = () => {
    window.open(`https://wa.me/${whatsappNumber}`, "_blank");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {/* WhatsApp Button */}
      <button
        onClick={handleWhatsAppClick}
        className="group relative w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
        aria-label="Chat on WhatsApp"
      >
        <IoLogoWhatsapp className="text-white" size={28} />
        {/* Tooltip */}
        <span className="absolute right-16 bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Chat with us
        </span>
      </button>

      {/* Call Button */}
      <button
        onClick={handlePhoneClick}
        className="group relative w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
        aria-label="Call us"
      >
        <IoCall className="text-white" size={24} />
        {/* Pulse animation */}
        <span className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20"></span>
        {/* Tooltip */}
        <span className="absolute right-16 bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          {phoneNumber}
        </span>
      </button>
    </div>
  );
};

export default FloatingContactWidget;
