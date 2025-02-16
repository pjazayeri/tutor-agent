import { NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import {
  initializeVectorStore,
  queryVectorStore,
} from "@/app/utils/pdf-loader";
import path from "path";

const chatModel = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure your API key is set in the environment variables
  model: "gpt-4o",
});

// Initialize the vector store with PDFs
const PDF_DIR = path.join(process.cwd(), "pdf");
let vectorStoreInitialized = false;

export async function POST(req: Request) {
  const { messages } = await req.json();

  try {
    // Initialize vector store if not already done
    if (!vectorStoreInitialized) {
      await initializeVectorStore(PDF_DIR);
      vectorStoreInitialized = true;
    }

    // Get the last user message to use for context retrieval
    const lastUserMessage = messages.findLast((msg: any) => msg);
    // const lastUserMessage = messages.findLast((msg: any) => msg.role === 'user')?.content || '';

    // Query the vector store for relevant context
    const relevantDocs = await queryVectorStore(lastUserMessage);
    const context = relevantDocs.map((doc) => doc.pageContent).join("\n\n");

    // Customize the prompt based on the parameters and include the context
    //     const prompt = `You are a helpful tutor with access to a knowledge base.
    // Create a lesson plan based on the user's request and the following context from the knowledge base:

    // ${context}

    // Use the context information when it's relevant to the user's question, but don't feel constrained to only use that information.
    // If the context isn't relevant to the current topic, you can rely on your general knowledge.`;

    const prompt2 = `You are an expert, tutor, and professor tasked with creating a comprehensive learning plan for the following research paper chunks: ${context}

Your goal is to generate a series of modules that is directly related to the research paper chunks, add study cases and practice problems when necessary. 
Follow these steps to create the plan:

1. Identify the key areas and concepts within the research paper chunks that are essential for mastery.
2. Break down these areas into digestible modules
3. Organize the modules in a logical order, building from foundational concepts to more advanced topics.

Before presenting your final plan, consider:
- Fundamental concepts that need to be covered
- How concepts build upon each other according to the research paper chunks
- Advanced topics an expert should know
- Practical skills or applications to include

Present your plan using the following format:

<plan>
  <module>
    <modulename>Module 1 Title</modulename>
    <description>
      <line>[Brief description of the topic covered in this module]</line>
      [Continue with additional lines as needed]
    </description>
  </module>
  [Continue with additional modules as needed]
</plan>

Create a comprehensive plan that covers all essential aspects of the chunks. The plan should provide a clear path from beginner to expert level in ${context}

Important: Only output the plan itself, formatted exactly as shown above. Do not include any additional text, explanations, or introductions.`;

    const systemMessage = {
      role: "system",
      content: prompt2,
    };
    const conversationMessages = [systemMessage, ...messages];

    const response = await chatModel.invoke(conversationMessages);

    console.log("response", response);
    return NextResponse.json({
      content: response.content,
    });
  } catch (error) {
    console.error("Error in chat route:", error);
    return NextResponse.json(
      { error: "Failed to process the chat request" },
      { status: 500 }
    );
  }
}
