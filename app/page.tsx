"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LessonPlan from "./components/LessonPlan";
import { parsePlan } from "./utils/planParser";
import styles from "./styles/FloatingHearts.module.css";

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

        // // Don't show keywords in chat, wait for RAG response
        // const response = await fetch("/api/rag", {
        //   method: "POST",
        //   headers: {
        //     "Content-Type": "application/json",
        //   },
        //   body: JSON.stringify({ messages: [topic], maxResults: 10 }),
        // });

        // const ragData = await response.json();

        // if (response.ok) {
        //   try {
        //     const modules = parsePlan(ragData.content);
        //     setChatHistory([
        //       {
        //         role: "assistant",
        //         content: ragData.content,
        //         modules: modules,
        //       },
        //     ]);
        //   } catch (error) {
        //     setChatHistory([
        //       {
        //         role: "assistant",
        //         content: ragData.content,
        //       },
        //     ]);
        //   }
        // }
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
          const response = await fetch("/api/arxiv", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ topic: keywords.join(" "), maxResults: 10 }), // Use keywords here
          });
          const data = await response.json();
          if (response.ok) {
            console.log("ArXiv API Response:", data); // Log the response
            setArxivData(data);

            // Extract pdf links
            // @ts-ignore
            setPdfLinks(extractPdfLinks(data));
          } else {
            console.error("Failed to fetch data:", data.error);
          }
        } catch (error) {
          console.error("Error:", error);
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
            console.log("Chunk response:", data); // Log the response
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
    setLoading(true);

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

      if (!res.ok) {
        throw new Error("Failed to get response");
      }

      const data = await res.json();

      if (!data.content) {
        throw new Error("No content in response");
      }

      // // Try to parse the content as a lesson plan
      // try {
      //   const modules = parsePlan(data.content);
      //   setChatHistory([
      //     ...updatedChatHistory,
      //     {
      //       role: "assistant",
      //       content: data.content,
      //       modules: modules,
      //     },
      //   ]);
      // } catch (error) {
      // If parsing fails, just display the content as regular text
      setChatHistory([
        ...updatedChatHistory,
        { role: "assistant", content: data.content },
      ]);
      // }
    } catch (error) {
      console.error("Error in chat:", error);
      // Optionally show error message to user
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    // Reset all state variables
    setChatHistory([]);
    setKeywords([]);
    setTopic("");
    setMessage("");
    setStep("topic");
    setLoading(false);
    setArxivData([]);
    setPdfLinks([]);
    setChunks("");
    setLessonLength(10);
    setDetailLevel("high");
    setIncludeQuiz(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#ff6eb0]">
      {step === "topic" && <Navbar />}
      <main
        className={`flex-grow transition-all duration-500 ease-in-out ${
          step === "topic" ? "flex items-center justify-center p-4" : "p-0"
        } ${styles.heartBackground}`}
      >
        {/* Add the floating hearts */}
        <div className="absolute inset-0 pointer-events-none">
          <div className={styles.heart}></div>
          <div className={styles.heart}></div>
          <div className={styles.heart}></div>
          <div className={styles.heart}></div>
          <div className={styles.heart}></div>
          <div className={styles.heart}></div>
          <div className={styles.heart}></div>
          <div className={styles.heart}></div>
          <div className={styles.heart}></div>
          <div className={styles.heart}></div>
        </div>

        <div
          className={`transition-all duration-500 ease-in-out ${
            step === "topic"
              ? "w-full max-w-lg transform scale-100"
              : "w-full transform scale-100"
          }`}
        >
          <div
            className={`bg-white shadow-lg rounded-lg overflow-hidden transition-all duration-500 ${
              step === "topic"
                ? "bg-opacity-100"
                : "bg-opacity-100 rounded-none min-h-[calc(100vh-4rem)]"
            }`}
          >
            {step === "topic" ? (
              <div className="px-8 pt-6 pb-8">
                <h2 className="text-3xl font-bold text-center text-black mb-8">
                  What would you like to learn?
                </h2>
                <form onSubmit={handleTopicSubmit} className="space-y-6">
                  <div className="flex flex-col space-y-2">
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="Enter a topic (e.g., 'Python Programming', 'AI Agents')"
                      className="px-4 py-3 bg-[#ff6eb0] text-white rounded-lg focus:ring-2 focus:ring-[#ff1493] focus:outline-none placeholder-white"
                      disabled={loading}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-[#FF0000] hover:bg-[#cc0000] text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-colors duration-200"
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
              <div className="fixed inset-0 flex flex-col bg-[#ff6eb0] bg-opacity-90">
                {/* Floating Hearts Background - Always visible */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className={styles.heart}></div>
                  <div className={styles.heart}></div>
                  <div className={styles.heart}></div>
                  <div className={styles.heart}></div>
                  <div className={styles.heart}></div>
                  <div className={styles.heart}></div>
                  <div className={styles.heart}></div>
                  <div className={styles.heart}></div>
                  <div className={styles.heart}></div>
                  <div className={styles.heart}></div>
                </div>

                {/* Main Content Container */}
                <div className="relative z-10 flex flex-col h-[calc(100vh-4rem)]">
                  {/* Chat Header */}
                  <div className="flex-none bg-[#ff6eb0] bg-opacity-90 px-6 py-4 border-b border-[#FFFFFF]">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-white">
                        Learning: {topic}
                      </h2>
                      <button
                        onClick={handleReset}
                        className="text-white hover:text-[#ff1493] transition-colors duration-200"
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

                  {/* Scrollable Content Area */}
                  <div className="flex-1 overflow-y-auto">
                    <div className="py-6 bg-[#ff6eb0]">
                      <div className="max-w-5xl mx-auto px-4">
                        {/* First show the lesson plan */}
                        {chunks && (
                          <div className="mx-auto mb-8">
                            <div className="w-full rounded-lg overflow-hidden">
                              <LessonPlan modules={parsePlan(chunks)} />
                            </div>
                          </div>
                        )}

                        {/* Then show the chat messages */}
                        {chatHistory.slice(1).map((msg, index) => (
                          <div
                            key={index}
                            className={`${
                              msg.role === "user"
                                ? "ml-auto mb-4 max-w-[70%]"
                                : "mr-auto mb-4 max-w-[70%]"
                            }`}
                          >
                            <div
                              className={`${
                                msg.role === "user"
                                  ? "bg-[#ff1493]"
                                  : "bg-white"
                              } rounded-lg overflow-hidden`}
                            >
                              <p
                                className={`p-4 ${
                                  msg.role === "user"
                                    ? "text-white"
                                    : "text-[#ff1493]"
                                }`}
                              >
                                {msg.content}
                              </p>
                            </div>
                          </div>
                        ))}

                        {/* Show thinking indicator when loading */}
                        {loading && (
                          <div className="mr-auto mb-4 max-w-[70%]">
                            <div className="bg-white rounded-lg overflow-hidden">
                              <div className="p-4 text-[#ff1493] flex items-center space-x-2">
                                <span>Thinking</span>
                                <span className="flex space-x-1">
                                  <span className="animate-bounce delay-100">
                                    .
                                  </span>
                                  <span className="animate-bounce delay-200">
                                    .
                                  </span>
                                  <span className="animate-bounce delay-300">
                                    .
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Chat Input - At bottom of container */}
                  <div className="flex-none bg-[#ff6eb0] bg-opacity-90 border-t border-[#ffffff] p-4">
                    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto">
                      <div className="flex space-x-4">
                        <input
                          type="text"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Ask a question about the lesson..."
                          className="flex-grow px-4 py-2 bg-white text-[#ff1493] rounded-lg focus:ring-2 focus:ring-[#ff1493] focus:outline-none placeholder-[#ff6eb0]"
                          disabled={loading}
                        />
                        <button
                          type="submit"
                          className="bg-[#ff1493] hover:bg-[#ff1493]/80 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-200"
                          disabled={loading}
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
  return data
    .map((item: { [x: string]: string }) => {
      if (item["id"] != void 0) {
        return item["id"].replace("abs", "pdf");
      } else {
        return "";
      }
    })
    .filter((item: string) => item !== "");
}

export default Home;
