"use client";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Home = () => {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");

  const [turboMessage, setTurboMessage] = useState("");
  const [turboResponse, setTurboResponse] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: message }],
      }),
    });
    const data = await res.json();
    setResponse(data.content);
    setMessage("");
  };

  const handleSubmitTurbo = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/turbo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: turboMessage }],
      }),
    });
    const data = await res.json();
    setTurboResponse(data.content);
    setTurboMessage("");
  };

  // Reset both forms back to initial state
  const handleReset = () => {
    setMessage("");
    setResponse("");
    setTurboMessage("");
    setTurboResponse("");
  };

  return (
      <div className="min-h-screen flex flex-col">
        <Navbar /> {/* Use the Navbar component */}

        <main
            className="flex-grow bg-cover bg-center grid grid-cols-1 md:grid-cols-2 py-6 sm:py-12"
            style={{
              backgroundImage: "url('/images/main.jpg')", // Path to your image file
            }}
        >
          {/* Left Section for Large Text */}
          <div className="flex items-center justify-center bg-gray-800 bg-opacity-0 p-10">
            <h1 className="text-7xl font-extrabold text-white text-center"
                style={{textShadow: '2px 2px 10px rgba(0, 0, 0, 0.8)'}}> {/* Custom text shadow */}
              "Tutor Agent"
            </h1>
          </div>


          {/* Right Section for Forms */}
          <section className="flex items-center justify-center">
            <div className="max-w-3xl mx-auto w-full">
              {/* GPT-4o Mini Form */}
              <div className="bg-gray-800 shadow-lg rounded px-8 pt-6 pb-8 mb-4 bg-opacity-80">
                <h2 className="text-2xl font-bold text-center text-gray-100 mb-4">GPT-4o Mini</h2>
                {!response && (
                    <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
                      <input
                          type="text"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Enter your message"
                          className="px-3 py-2 bg-gray-700 bg-opacity-50 text-white rounded"
                      />
                      <button
                          type="submit"
                          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                      >
                        Send to GPT-4o Mini
                      </button>
                    </form>
                )}
                {response && (
                    <div className="mt-4 p-3 bg-gray-700 bg-opacity-50 text-white rounded">
                      <p>{response}</p>
                    </div>
                )}
              </div>


            </div>
          </section>
        </main>

        <Footer /> {/* Use the Footer component */}

      </div>
  );
};

export default Home;
