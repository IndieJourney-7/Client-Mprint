import React, { useRef } from "react";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";

// Importing local images from Assets folder
import bookmarks from "../Assets/bookmarks.png";
import brochures from "../Assets/brochures.png";
import cardimg from "../Assets/Cardimg.jpg";
import circlebusinesscard from "../Assets/circlebusinesscard.jpg";
import certificates from "../Assets/certificates.jpg";
import greetingCards from "../Assets/greeting-cards.png";
import photoFrame from "../Assets/photo-frame.png";
import photoPrints from "../Assets/photo-prints.png";
import posters from "../Assets/posters.png";
import personalisedcase from "../Assets/personalisedcase.jpg";

const categories = [
  { title: "Bookmarks", img: bookmarks },
  { title: "Brochures", img: brochures },
  { title: "Cards", img: circlebusinesscard },
  { title: "Card Designs", img: cardimg },
  { title: "Certificates", img: certificates },
  { title: "Greeting Cards", img: greetingCards },
  { title: "Personalised Case", img: personalisedcase },
  { title: "Photo Frames", img: photoFrame },
  { title: "Photo Prints", img: photoPrints },
  { title: "Posters", img: posters },
];

const Categories = () => {
  const scrollRef = useRef(null);

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -350, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 350, behavior: "smooth" });
  };

  return (
    <div className="w-full py-10 md:py-16 bg-white">
      <div className="max-w-[1600px] mx-auto px-4 md:px-10 relative group">
        
        <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-10 text-center md:text-left">
          Explore all categories
        </h2>

        {/* Mobile Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:hidden">
          {categories.map((cat, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className="w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] rounded-full bg-white shadow-md overflow-hidden">
                <img src={cat.img} alt={cat.title} className="w-full h-full object-cover" />
              </div>
              <p className="text-center mt-2 text-xs sm:text-sm font-semibold px-1">
                {cat.title}
              </p>
            </div>
          ))}
        </div>

        {/* Desktop Scroll */}
        <div className="hidden md:block relative">
          <div className="relative flex items-center">

            {/* Left Arrow */}
            <button
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-white shadow-lg p-3 rounded-full z-20 opacity-0 group-hover:opacity-100 transition hover:scale-110"
            >
              <IoChevronBack className="text-2xl" />
            </button>

            {/* Scrollable */}
            <div
              ref={scrollRef}
              className="flex gap-16 overflow-x-auto px-14 scroll-smooth no-scrollbar"
            >
              {categories.map((cat, index) => (
                <div key={index} className="flex flex-col items-center min-w-[160px]">
                  <div className="w-[150px] h-[150px] rounded-full bg-white shadow-md overflow-hidden">
                    <img src={cat.img} alt={cat.title} className="w-full h-full object-cover" />
                  </div>
                  <p className="text-center mt-3 text-sm font-semibold w-[160px] leading-snug">
                    {cat.title}
                  </p>
                </div>
              ))}
            </div>

            {/* Right Arrow */}
            <button
              onClick={scrollRight}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-white shadow-lg p-3 rounded-full z-20 opacity-0 group-hover:opacity-100 transition hover:scale-110"
            >
              <IoChevronForward className="text-2xl" />
            </button>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Categories;
