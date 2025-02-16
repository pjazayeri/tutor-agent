import React from "react";

type Module = {
  modulename: string;
  description: string[];
};

type LessonPlanProps = {
  modules: Module[];
};

const LessonPlan: React.FC<LessonPlanProps> = ({ modules }) => {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 p-6">
      <div className="grid gap-6">
        {modules.map((module, index) => (
          <div
            key={index}
            className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
          >
            <div className="bg-blue-600 px-6 py-4">
              <h3 className="text-xl font-bold text-white">
                {module.modulename}
              </h3>
            </div>
            <div className="px-6 py-4">
              <ul className="space-y-2">
                {module.description.map((line, lineIndex) => (
                  <li
                    key={lineIndex}
                    className="text-gray-300 flex items-start space-x-2"
                  >
                    <span className="text-blue-400 mt-1">•</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LessonPlan;
