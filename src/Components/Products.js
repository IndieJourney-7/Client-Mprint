import React, { useRef } from "react";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import Standardboard from "../Assets/Standardboard.jpg";
import A4brochures from "../Assets/A4brochures.jpg";
import circlebusinesscard from "../Assets/circlebusinesscard.jpg";
import certificatesImg from "../Assets/certificates.jpg";
import greetingcard from "../Assets/greetingcard.jpg";
import personalisedcase from "../Assets/personalisedcase.jpg";
import photoFramesImg from "../Assets/photo-frame.png";
import photoPrintsImg from "../Assets/photo-prints.png";
import postersImg from "../Assets/posters.png";

const products = [
  { title: "Bookmarks", price: "BUY 10 @ Rs.150", img: Standardboard },
  { title: "Brochures", price: "BUY 10 @ Rs.230", img: A4brochures },
  { title: "Cards", price: "BUY 10 @ Rs.199", img: circlebusinesscard },
  { title: "Certificates", price: "BUY 1 @ Rs.299", img: certificatesImg },
  { title: "Greeting Cards", price: "BUY 5 @ Rs.249", img: greetingcard },
  { title: "Personalised Cards", price: "BUY 1 @ Rs.299", img: personalisedcase },
  { title: "Photo Frames", price: "BUY 1 @ Rs.499", img: photoFramesImg },
  { title: "Photo Prints", price: "BUY 20 @ Rs.149", img: photoPrintsImg },
  { title: "Posters", price: "BUY 1 @ Rs.199", img: postersImg },
];

const Products = () => {
  const scrollRef = useRef(null);

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -300, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 300, behavior: "smooth" });
  };

  return (
    <div className="w-full py-8 md:py-14 bg-white">
      <div className="max-w-[1600px] mx-auto px-4 md:px-10">
        <h2 className="text-2xl md:text-4xl font-bold mb-6 md:mb-12 text-left">
          Our Most Popular Products
        </h2>
        {/* Mobile: 2-column grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:hidden">
          {products.map((item, i) => (
            <div key={i} className="flex flex-col items-center relative">
              {item.price && (
                <div className="absolute top-2 left-2 bg-[#27B1E2] text-white text-[10px] font-medium py-[2px] px-2 rounded-full z-10 shadow">
                  {item.price}
                </div>
              )}
              <img
                src={item.img}
                alt={item.title}
                className="w-[140px] h-[120px] object-cover mb-2 rounded-md"
                loading="lazy"
              />
              <p className="text-center font-semibold text-[15px] leading-tight mt-0">
                {item.title}
              </p>
            </div>
          ))}
        </div>
        {/* Desktop: horizontal scroll with buttons */}
        <div className="hidden md:block relative mt-10">
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-white border shadow-lg p-3 rounded-full z-20 hover:scale-110 transition"
            aria-label="Scroll Left"
          >
          <IoChevronBack className="text-2xl" />
          </button>
          <div
            ref={scrollRef}
            className="flex gap-10 overflow-x-auto scroll-smooth px-14 no-scrollbar"
          >
            {products.map((item, i) => (
              <div key={i} className="flex flex-col items-center relative min-w-[200px]">
                {item.price && (
                  <div className="absolute top-2 left-2 bg-[#27B1E2] text-white text-[10px] font-medium py-[2px] px-2 rounded-full z-10 shadow">
                    {item.price}
                  </div>
                )}
                <img
                  src={item.img}
                  alt={item.title}
                  className="w-[200px] h-[170px] object-cover mb-3 rounded-md"
                  loading="lazy"
                />
                <p className="text-center font-semibold text-[16px] leading-tight mt-0">
                  {item.title}
                </p>
              </div>
            ))}
          </div>
          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-white border shadow-lg p-3 rounded-full z-20 hover:scale-110 transition"
            aria-label="Scroll Right"
          >
            <IoChevronForward className="text-2xl" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Products;
