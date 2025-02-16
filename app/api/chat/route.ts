import { NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";

const chatModel = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure your API key is set in the environment variables
  model: "gpt-4",
});

export async function POST(req: Request) {
  const { messages, lessonLength, detailLevel, includeQuiz } = await req.json();
  console.log("POST", { messages, lessonLength, detailLevel, includeQuiz });

  // Customize the prompt based on the parameters
  const prompt = `You are a helpful tutor. Create a lesson plan based on the user's request. 
  The lesson should be ${lessonLength} minutes long and should be ${
    detailLevel === "high" ? "high-level" : "detailed"
  }. 
  ${includeQuiz ? "Include a quiz at the end of the lesson." : ""}`;

  const systemMessage = {
    role: "system",
    content: prompt,
  };
  const conversationMessages = [systemMessage, ...messages];
  const response = await chatModel.invoke(conversationMessages);
  return NextResponse.json({
    content: response.content,
  });
}
