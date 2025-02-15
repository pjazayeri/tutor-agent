import Link from "next/link"; // Import Next.js Link component
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const About = () => {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar /> {/* Use the Navbar component */}

            <main className="flex-grow bg-gray-900 py-6 flex flex-col justify-center sm:py-12">
                <h1 className="text-4xl font-bold text-center text-gray-100 mb-8">About Us</h1>
                <p className="text-center text-gray-400 max-w-xl mx-auto">
                    This is the About page. Here you can learn more about us and our mission.
                </p>
            </main>

            <Footer /> {/* Use the Footer component */}

        </div>
    );
};

export default About;
