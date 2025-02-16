"use client";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Define a type for chat messages
type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const Home = () => {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return; // Don't send empty messages

    // Add the user's message to the chat history
    const updatedChatHistory = [
      ...chatHistory,
      { role: "user", content: message },
    ];
    setChatHistory(updatedChatHistory);
    setMessage(""); // Clear the input field

    // Send the message to the API
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: updatedChatHistory,
      }),
    });

    const data = await res.json();
    // Add the assistant's response to the chat history
    setChatHistory([...updatedChatHistory, { role: "assistant", content: data.content }]);
  };

  // Reset the chat history
  const handleReset = () => {
    setChatHistory([]);
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
            <h1
                className="text-7xl font-extrabold text-white text-center"
                style={{ textShadow: "2px 2px 10px rgba(0, 0, 0, 0.8)" }}
            >
              Tutor Agent
            </h1>
          </div>

          {/* Right Section for Chat Box */}
          <section className="flex items-center justify-center">
            <div className="max-w-3xl mx-auto w-full">
              {/* Chat Box */}
              <div className="bg-gray-800 shadow-lg rounded px-8 pt-6 pb-8 mb-4 bg-opacity-80">
                <h2 className="text-2xl font-bold text-center text-gray-100 mb-4">
                  GPT-4o Mini
                </h2>

                {/* Chat History */}
                <div className="h-96 overflow-y-auto mb-4">
                  {chatHistory.map((msg, index) => (
                      <div
                          key={index}
                          className={`flex ${
                              msg.role === "user" ? "justify-end" : "justify-start"
                          } mb-2`}
                      >
                        <div
                            className={`max-w-[70%] p-3 rounded-lg ${
                                msg.role === "user"
                                    ? "bg-blue-500 text-white"
                                    : "bg-gray-700 text-white"
                            }`}
                        >
                          <p>{msg.content}</p>
                        </div>
                      </div>
                  ))}
                </div>

                {/* Input Form */}
                <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
                  <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Enter your message"
                      className="px-3 py-2 bg-gray-700 bg-opacity-50 text-white rounded"
                  />
                  <div className="flex space-x-4">
                    <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded flex-grow"
                    >
                      Send
                    </button>
                    <button
                        type="button"
                        onClick={handleReset}
                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
                    >
                      Reset
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </section>
        </main>

        <Footer /> {/* Use the Footer component */}
      </div>
  );
};

export default Home;