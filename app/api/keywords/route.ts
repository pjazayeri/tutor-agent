import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { topic } = await req.json();

    const prompt = `You are tasked with extracting relevant keywords from a given text for use in an arXiv API search. The goal is to identify keywords that will lead to interesting and unexpected research papers related to the topic.

                    Here is the text provided by the user:
                    ${topic}
                    
                    Analyze the text and identify key concepts, themes, and topics. Consider both explicit and implicit ideas present in the text. Focus on terms that are:
                    1. Central to the main topic
                    2. Specific enough to yield relevant results
                    3. Broad enough to potentially lead to unexpected discoveries
                    
                    Generate a list of keywords that capture the essence of the text and could be used for an arXiv API search. The keywords should be diverse enough to cover different aspects of the topic and potentially lead to interesting, unexpected research papers.
                    
                    Your output should be a comma-separated string of keywords, without any additional text, comments, or explanations. Do not include quotation marks around the keywords or the entire string.
                    
                    Remember:
                    - Only provide the comma-separated keywords
                    - Do not add any other text, explanations, or opinions
                    - Ensure the keywords are relevant and concise
                    
                    Output your keywords in the following format:
                    keyword1, keyword2, keyword3, ...`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4",
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content;
    let keywords = [];
    try {
      keywords = JSON.parse(content || "[]");
    } catch (e) {
      console.error("Failed to parse GPT response:", e);
      keywords = content?.split(",").map((k) => k.trim()) || [];
    }

    return NextResponse.json({ keywords });
  } catch (error) {
    console.error("Keywords generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate keywords" },
      { status: 500 }
    );
  }
}
