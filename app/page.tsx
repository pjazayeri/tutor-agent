"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LessonPlan from "./components/LessonPlan";
import { parsePlan } from "./utils/planParser";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  modules?: { modulename: string; description: string[] }[];
};

const Home = () => {
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [step, setStep] = useState<"topic" | "chat">("topic");
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [lessonLength, setLessonLength] = useState(10); // Default to 10 minutes
  const [detailLevel, setDetailLevel] = useState<"high" | "detailed">("high"); // Default to high level
  const [includeQuiz, setIncludeQuiz] = useState(false); // Default to no quiz
  const [loading, setLoading] = useState(false);
  const [arxivData, setArxivData] = useState([]);
  const [pdfLinks, setPdfLinks] = useState([]);
  const [chunks, setChunks] = useState("");

  const handleTopicSubmit = async (e: React.FormEvent) => {

    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/keywords", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic }),
      });

      const data = await res.json();
      if (data.keywords) {
        setKeywords(data.keywords);
        setStep("chat");

        // Don't show keywords in chat, wait for RAG response
        const response = await fetch("/api/rag", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ messages: [topic], maxResults: 10 }),
        });

        const ragData = await response.json();

        if (response.ok) {
          try {
            const modules = parsePlan(ragData.content);
            setChatHistory([
              {
                role: "assistant",
                content: ragData.content,
                modules: modules,
              },
            ]);
          } catch (error) {
            setChatHistory([
              {
                role: "assistant",
                content: ragData.content,
              },
            ]);
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Use useEffect to trigger the arXiv request after keywords are updated
  useEffect(() => {
    if (keywords.length > 0) {
      const fetchArxivData = async () => {
        setLoading(true);
        try {
          const response = await fetch('/api/arxiv', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ topic: keywords.join(' '), maxResults: 10 }), // Use keywords here
          });
          const data = await response.json();
          if (response.ok) {
            console.log('ArXiv API Response:', data); // Log the response
            setArxivData(data);

            // Extract pdf links
            // @ts-ignore
            setPdfLinks(extractPdfLinks(data));


          } else {
            console.error('Failed to fetch data:', data.error);
          }
        } catch (error) {
          console.error('Error:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchArxivData();
    }
  }, [keywords]); // Trigger this effect when keywords change


  useEffect(() => {
    if (pdfLinks.length > 0) {
      console.log("Found arxivData, send pdf links to get articles...");
      console.log("pdf links:", pdfLinks);
      console.log("keywords:", keywords);
      const populateVector = async () => {
        setLoading(true);
        try {
          const response = await fetch("/api/rag", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ pdfLinks, keywords, maxResults: 10 }), // Use keywords here
          });
          const data = await response.json();
          if (response.ok) {
            console.log('Chunk response:', data); // Log the response
            setChunks(data.content);
          } else {
            console.error("Failed to fetch data:", data.error);
          }
        } catch (error) {
          console.error("Error:", error);
        } finally {
          setLoading(false);
        }
      };

      populateVector(); // Call the arXiv request function
    }
  }, [pdfLinks]); // Trigger this effect when keywords change

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const newMessage = { role: "user" as const, content: message };
    const updatedChatHistory = [...chatHistory, newMessage];
    setChatHistory(updatedChatHistory);
    setMessage("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedChatHistory,
          lessonLength,
          detailLevel,
          includeQuiz,
          keywords,
        }),
      });

      const data = await res.json();

      // Try to parse the content as a lesson plan
      try {
        const modules = parsePlan(data.content);
        setChatHistory([
          ...updatedChatHistory,
          {
            role: "assistant" as const,
            content: data.content,
            modules: modules,
          },
        ]);
      } catch (error) {
        // If parsing fails, just display the content as regular text
        setChatHistory([
          ...updatedChatHistory,
          { role: "assistant" as const, content: data.content },
        ]);
      }
    } catch (error) {
      console.error("Error in chat:", error);
    }
  };

  const handleReset = () => {
    setChatHistory([]);
    setKeywords([]);
    setTopic("");
    setStep("topic");
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
                GPT-4 Mini
              </h2>

              {step === "topic" ? (
                <form onSubmit={handleTopicSubmit} className="space-y-4">
                  <div className="flex flex-col space-y-2">
                    <label className="text-gray-100">
                      What would you like to learn about?
                    </label>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="Enter a topic (e.g., 'Python Programming', 'AI Agents')"
                      className="px-3 py-2 bg-gray-700 bg-opacity-50 text-white rounded"
                      disabled={loading}
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full flex items-center justify-center"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Generating Lesson Plan...
                      </>
                    ) : (
                      "Start Learning"
                    )}
                  </button>
                </form>
              ) : (
                <>
                  {/* Chat History */}
                  <div className="h-96 overflow-y-auto mb-4">
                    {loading ? (
                      <div className="flex justify-center items-center h-full">
                        <div className="flex flex-col items-center space-y-4">
                          <svg
                            className="animate-spin h-10 w-10 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          <p className="text-white">
                            Generating your personalized lesson plan...
                          </p>
                        </div>
                      </div>
                    ) : (
                      chatHistory.map((msg, index) => (
                        <div
                          key={index}
                          className={`flex ${
                            msg.role === "user"
                              ? "justify-end"
                              : "justify-start"
                          } mb-2`}
                        >
                          <div
                            className={`max-w-[90%] p-3 rounded-lg ${
                              msg.role === "user"
                                ? "bg-blue-500 text-white"
                                : "bg-gray-700 text-white"
                            }`}
                          >
                            {msg.modules ? (
                              <LessonPlan modules={msg.modules} />
                            ) : (
                              <p>{msg.content}</p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Input Form */}
                  <form
                    onSubmit={handleSubmit}
                    className="flex flex-col space-y-4"
                  >
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Enter your message"
                      className="px-3 py-2 bg-gray-700 bg-opacity-50 text-white rounded"
                    />

                    {/* Include Quiz Checkbox */}
                    {/* <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={includeQuiz}
                        onChange={(e) => setIncludeQuiz(e.target.checked)}
                        className="form-checkbox text-blue-500"
                      />
                      <label className="text-gray-100">
                        Include Quiz at the End
                      </label>
                    </div> */}

                    {/* Buttons */}
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
                </>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer /> {/* Use the Footer component */}
    </div>
  );
};


// @ts-ignore
function extractPdfLinks(data) {
  return data.map((item: { [x: string]: string; }) => {
    if (item['id'] != void 0) {
      return item['id'].replace("abs", "pdf")
    } else {
      return ""
    }
  }).filter((item: string) => item !== "");
}

export default Home;
