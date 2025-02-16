import React, { useState } from "react";

type Module = {
  modulename: string;
  description: string[];
  content?: string;
  practice?: string;
};

type LessonPlanProps = {
  modules: Module[];
};

const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    className={`w-6 h-6 transform transition-transform ${
      isOpen ? "rotate-180" : ""
    }`}
    fill="none"
    stroke="white"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

const ModuleCard = ({ module }: { module: Module }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Debug log when module is rendered
  console.log("Rendering module:", {
    name: module.modulename,
    hasContent: !!module.content,
    contentLength: module.content?.length,
    hasPractice: !!module.practice,
    practiceLength: module.practice?.length,
  });

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left"
      >
        <div className="bg-[#ff1493] px-6 py-4 flex justify-between items-center cursor-pointer">
          <h3 className="text-xl font-bold text-white">{module.modulename}</h3>
          <ChevronIcon isOpen={isExpanded} />
        </div>
      </button>

      <div
        className={`transition-all duration-300 ease-in-out ${
          isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        } overflow-hidden`}
      >
        <div className="px-6 py-4 border-b border-[#ff6eb0]">
          <h4 className="text-lg font-semibold text-[#ff1493] mb-2">
            Overview
          </h4>
          <ul className="space-y-2">
            {module.description.map((line, lineIndex) => (
              <li
                key={lineIndex}
                className="text-[#ff6eb0] flex items-start space-x-2"
              >
                <span className="text-[#ff1493] mt-1">•</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        {module.content && module.content.trim() && (
          <div className="px-6 py-4 border-b border-[#ff6eb0]">
            <h4 className="text-lg font-semibold text-[#ff1493] mb-2">
              Content
            </h4>
            <div className="text-[#ff6eb0] prose prose-invert">
              {module.content
                .split("\n")
                .filter((para) => para.trim())
                .map((paragraph, idx) => (
                  <p key={idx} className="mb-4 whitespace-pre-wrap">
                    {paragraph.trim()}
                  </p>
                ))}
            </div>
          </div>
        )}

        {module.practice && module.practice.trim() && (
          <div className="px-6 py-4">
            <h4 className="text-lg font-semibold text-[#ff1493] mb-2">
              Practice
            </h4>
            <div className="text-[#ff6eb0] prose prose-invert">
              {module.practice
                .split("\n")
                .filter((para) => para.trim())
                .map((exercise, idx) => (
                  <p key={idx} className="mb-4 whitespace-pre-wrap">
                    {exercise.trim()}
                  </p>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const LessonPlan: React.FC<LessonPlanProps> = ({ modules }) => {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="grid gap-6">
        {modules.map((module, index) => (
          <ModuleCard key={index} module={module} />
        ))}
      </div>
    </div>
  );
};

export default LessonPlan;
