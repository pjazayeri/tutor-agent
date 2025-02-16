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
      <div className="min-h-screen flex flex-col bg-gray-900">
        <Navbar />
        <main
            className={`flex-grow transition-all duration-500 ease-in-out ${
                step === "topic" ? "flex items-center justify-center p-4" : "p-0"
            }`}
        >
          <div
              className={`transition-all duration-500 ease-in-out ${
                  step === "topic"
                      ? "w-full max-w-lg transform scale-100"
                      : "w-full transform scale-100"
              }`}
          >
            <div
                className={`bg-gray-800 shadow-lg rounded-lg overflow-hidden transition-all duration-500 ${
                    step === "topic"
                        ? "bg-opacity-80"
                        : "bg-opacity-100 rounded-none min-h-[calc(100vh-4rem)]"
                }`}
            >
              {step === "topic" ? (
                  <div className="px-8 pt-6 pb-8">
                    <h2 className="text-3xl font-bold text-center text-white mb-8">
                      What would you like to learn?
                    </h2>
                    <form onSubmit={handleTopicSubmit} className="space-y-6">
                      <div className="flex flex-col space-y-2">
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="Enter a topic (e.g., 'Python Programming', 'AI Agents')"
                            className="px-4 py-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            disabled={loading}
                        />
                      </div>
                      <button
                          type="submit"
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-colors duration-200"
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
                  </div>
              ) : (
                  <div className="fixed inset-0 flex flex-col bg-gray-800">
                    {/* Chat Header */}
                    <div className="bg-gray-900 px-6 py-4 border-b border-gray-700">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-white">
                          Learning: {topic}
                        </h2>
                        <button
                            onClick={handleReset}
                            className="text-gray-400 hover:text-white transition-colors duration-200"
                        >
                          <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-6 w-6"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                          >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Content Container with Fixed Height */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                      {/* Scrollable Content Area */}
                      <div className="flex-1 overflow-y-auto py-6 bg-gray-700">
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
                                <p className="text-white text-lg">
                                  Generating your personalized lesson plan...
                                </p>
                              </div>
                            </div>
                        ) : (
                            <div className="max-w-5xl mx-auto px-4">
                              {chatHistory.map((msg, index) => (
                                  <div
                                      key={index}
                                      className={`${
                                          msg.role === "user"
                                              ? "ml-auto mb-4 max-w-[70%]"
                                              : "mx-auto mb-20"
                                      }`}
                                  >
                                    <div
                                        className={`${
                                            msg.role === "user" ? "bg-blue-600" : "w-full"
                                        } rounded-lg overflow-hidden`}
                                    >
                                      {msg.modules ? (
                                          <LessonPlan modules={msg.modules} />
                                      ) : (
                                          <p className="p-4 text-white">{msg.content}</p>
                                      )}
                                    </div>
                                  </div>
                              ))}
                            </div>
                        )}
                      </div>

                      {/* Chat Input - Fixed at bottom with margin */}
                      <div className="bg-gray-800 border-t border-gray-700 px-4 py-4 mt-auto">
                        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto">
                          <div className="flex space-x-4">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Ask a question about the lesson..."
                                className="flex-grow px-4 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                            <button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-200"
                            >
                              Send
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
              )}
            </div>
          </div>
        </main>
        <Footer />
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
