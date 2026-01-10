import React from "react";
import Cardimg from "../Assets/Cardimg.jpg";

const SubscribeSection = () => {
    return (
        <>
            {/* ✅ EMAIL SUBSCRIBE SECTION */}
            <div className="w-full bg-[#EAF4FF] py-20 px-6 md:px-12">
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 items-center gap-10">

                    {/* LEFT IMAGE */}
                    <div>
                        <img
                            src={Cardimg}
                            alt="Cards"
                            className="w-full rounded-2xl shadow-md object-cover"
                        />
                    </div>

                    {/* RIGHT CONTENT */}
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl md:text-4xl font-bold text-black">
                            It's good to be on the list.
                        </h2>

                        <p className="text-lg text-gray-700 mt-3 font-medium">
                            Get 15% off* your first order when you sign up for our emails
                        </p>

                        <div className="mt-6">
                            <input
                                type="email"
                                placeholder="Subscription email"
                                className="w-full border border-gray-400 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-black"
                            />
                        </div>

                        <p className="text-sm text-gray-600 mt-4 leading-relaxed">
                            Yes, I'd like to receive special offer emails from Mprint, as well as news
                            about products, services and my designs in progress. Read our{" "}
                            <span className="underline cursor-pointer">Privacy and Cookie policy.</span>
                        </p>

                        {/* <button
              disabled
              className="mt-6 bg-gray-300 text-gray-600 rounded-xl px-10 py-3 font-semibold cursor-not-allowed"
            >
              Submit
            </button> */}
                        <button
                            className="mt-6 bg-black text-white rounded-xl px-10 py-3 font-semibold 
             transition-all duration-300 transform 
             hover:bg-gray-800 hover:scale-[1.03] hover:shadow-lg"
                        >
                            Submit
                        </button>

                    </div>
                </div>
            </div>

            {/* ✅ NEW INFORMATION SECTION */}
            <div className="max-w-6xl mx-auto py-20 px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-10 text-gray-800">

                {/* LEFT SIDE TEXT */}
                <div>
                    <h3 className="text-3xl font-bold mb-4">
                        Mprint India : The leader in customisation
                    </h3>
                    <p className="text-lg leading-relaxed">
                        For more than 5 years, Mprint has helped business owners, entrepreneurs
                        and individuals create their identities with custom designs and professional
                        marketing. Our online printing services are intended to help you find high
                        quality customised products you need – business cards, personalized clothing,
                        gifting products, and much more.
                    </p>
                </div>

                {/* RIGHT SIDE TEXT */}
                <div className="space-y-6">
                    <div>
                        <h4 className="text-xl font-semibold">
                            Even Low Quantities @ Best Prices
                        </h4>
                        <p className="text-lg">
                            We offer low/ single product quantities at affordable prices.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-xl font-semibold">
                            High quality products and Easy design
                        </h4>
                        <p className="text-lg">
                            Our wide selection of high-quality products and online design tools
                            make it easy for you to customize and order your favourite products.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-xl font-semibold">
                            Free replacement or Full Refund
                        </h4>
                        <p className="text-lg">
                            We stand by everything we sell. So if you’re not satisfied,
                            we’ll make it right.
                        </p>
                    </div>
                </div>

            </div>
        </>
    );
};

export default SubscribeSection;
