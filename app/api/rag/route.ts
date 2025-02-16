import { NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { initializeVectorStore, queryVectorStore } from "@/app/utils/pdf-loader";
import path from "path";

const chatModel = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure your API key is set in the environment variables
  model: "gpt-4",
});

// Initialize the vector store with PDFs
const PDF_DIR = path.join(process.cwd(), 'pdf');
let vectorStoreInitialized = false;

export async function POST(req: Request) {
  const { messages } = await req.json();
  console.log("POST", { messages });

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
        const context = relevantDocs.map(doc => doc.pageContent).join('\n\n');

        // Customize the prompt based on the parameters and include the context
        const prompt = `You are a helpful tutor with access to a knowledge base. 
Create a lesson plan based on the user's request and the following context from the knowledge base:

${context}


Use the context information when it's relevant to the user's question, but don't feel constrained to only use that information.
If the context isn't relevant to the current topic, you can rely on your general knowledge.`;
        console.log(prompt);
        const systemMessage = {
            role: "system",
            content: prompt
        };
        const conversationMessages = [systemMessage, ...messages];
        
        const response = await chatModel.invoke(
            conversationMessages,
        );

        return NextResponse.json({
            content: response.content,
        });
    } catch (error) {
        console.error('Error in chat route:', error);
        return NextResponse.json(
            { error: 'Failed to process the chat request' },
            { status: 500 }
        );
    }
}