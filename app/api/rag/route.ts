import {NextResponse} from "next/server";
import {ChatOpenAI} from "@langchain/openai";
import {initializeVectorStore, queryVectorStore} from "@/app/utils/pdf-loader";
import path from "path";
import fs from "fs";
import fetch from 'node-fetch';


const chatModel = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Ensure your API key is set in the environment variables
    model: "gpt-4",
});

// Initialize the vector store with PDFs
const PDF_DIR = path.join(process.cwd(), 'pdf');
let vectorStoreInitialized = false;

export async function POST(req: Request) {
    const {pdfLinks, keywords, maxResults} = await req.json();
    console.log("POST rag/route", {pdfLinks, keywords, maxResults});

    // Step 1: Ensure the `pdf` directory exists
    const pdfDir = path.join(process.cwd(), 'pdf');
    if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
        console.log('Created pdf directory:', pdfDir);
    } else {
        // Step 2: Delete all existing files in the `pdf` directory
        const files = fs.readdirSync(pdfDir);
        for (const file of files) {
            const filePath = path.join(pdfDir, file);
            fs.unlinkSync(filePath); // Delete the file
            console.log(`Deleted existing file: ${filePath}`);
        }
        console.log('Cleared pdf directory:', pdfDir);
    }

    for (let i = 0; i < pdfLinks.length; i++) {
        const pdfUrl = pdfLinks[i];
        try {
            // Fetch the PDF
            const response = await fetch(pdfUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch PDF from ${pdfUrl}: ${response.statusText}`);
            }

            // Convert the response to a buffer
            const arrayBuffer = await response.arrayBuffer();
            const pdfBuffer = Buffer.from(arrayBuffer);

            // Save the PDF to the `pdf` directory
            const pdfFilePath = path.join(pdfDir, `pdf${i + 1}.pdf`);
            fs.writeFileSync(pdfFilePath, pdfBuffer);
            console.log(`Saved PDF to ${pdfFilePath}`);
        } catch (error) {
            console.error(`Error processing PDF from ${pdfUrl}:`, error);
        }
    }

    // return NextResponse.json({
    //     // content: response.content,
    //     content: "Finished pdf",
    // });

    try {
        // Initialize vector store if not already done
        if (!vectorStoreInitialized) {
            await initializeVectorStore(PDF_DIR);
            vectorStoreInitialized = true;
        }
        let messages = keywords;

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
            {error: 'Failed to process the chat request'},
            {status: 500}
        );
    }

}
