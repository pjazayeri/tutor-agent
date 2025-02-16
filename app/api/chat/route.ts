// import OpenAI from "openai";
// import { NextResponse } from "next/server";
//
// const openai = new OpenAI();
//
// export const runtime = "edge";
//
// export async function POST(req: Request) {
//     const { messages } = await req.json();
//     console.log('POST', messages);
//
//     const response = await openai.chat.completions.create({
//         model: "gpt-4o-mini",
//         messages,
//     });
//
//     return NextResponse.json({
//         content: response.choices[0].message.content,
//     });
// }

import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Ensure your API key is set in the environment variables
});

export const runtime = "edge";

export async function POST(req: Request) {
    const { messages, lessonLength, detailLevel, includeQuiz } = await req.json();
    console.log("POST", { messages, lessonLength, detailLevel, includeQuiz });

    // Customize the prompt based on the parameters
    const systemPrompt = `You are a helpful tutor. Create a lesson plan based on the user's request. 
  The lesson should be ${lessonLength} minutes long and should be ${detailLevel === "high" ? "high-level" : "detailed"}. 
  ${includeQuiz ? "Include a quiz at the end of the lesson." : ""}`;

    // Add the system prompt to the messages
    const updatedMessages = [
        { role: "system", content: systemPrompt },
        ...messages,
    ];

    // Call the OpenAI API
    const response = await openai.chat.completions.create({
        model: "gpt-4", // Use your desired model
        messages: updatedMessages,
    });

    return NextResponse.json({
        content: response.choices[0].message.content,
    });
}