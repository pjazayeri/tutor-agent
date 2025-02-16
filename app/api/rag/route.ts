import { NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import {
  initializeVectorStore,
  queryVectorStore,
} from "@/app/utils/pdf-loader";
import path from "path";
import fs from "fs";
import fetch from "node-fetch";

const chatModel = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure your API key is set in the environment variables
  model: "gpt-4",
});

// Initialize the vector store with PDFs
const PDF_DIR = path.join(process.cwd(), "pdf");
let vectorStoreInitialized = false;

export async function POST(req: Request) {
  const { pdfLinks, keywords, maxResults } = await req.json();
  console.log("POST rag/route", { pdfLinks, keywords, maxResults });

  // Step 1: Ensure the `pdf` directory exists
  const pdfDir = path.join(process.cwd(), "pdf");
  if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir, { recursive: true });
    console.log("Created pdf directory:", pdfDir);
  } else {
    // Step 2: Delete all existing files in the `pdf` directory
    const files = fs.readdirSync(pdfDir);
    for (const file of files) {
      const filePath = path.join(pdfDir, file);
      fs.unlinkSync(filePath); // Delete the file
      console.log(`Deleted existing file: ${filePath}`);
    }
    console.log("Cleared pdf directory:", pdfDir);
  }

  for (let i = 0; i < pdfLinks.length; i++) {
    const pdfUrl = pdfLinks[i];
    try {
      // Fetch the PDF
      const response = await fetch(pdfUrl);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch PDF from ${pdfUrl}: ${response.statusText}`
        );
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
    const context = relevantDocs.map((doc) => doc.pageContent).join("\n\n");

    // Customize the prompt based on the parameters and include the context
    const prompt = `You are an expert professor tasked with creating a comprehensive and engaging learning plan based on research paper content. 
        Your goal is to generate a study material that consists of series of modules directly related to these content, 
        adding study cases and practice problems when necessary. 
        
        The most crucial aspect of this task is to create an extensive and highly informative content block for each module.
    
    Here are the research paper chunks you will be working with:
    
    ${context}
    
    The content block is the heart of each module. It should be a treasure trove of knowledge, providing in-depth explanations, fascinating insights, and comprehensive coverage of the topic. Your aim is to make the content so rich and informative that users will gain significant knowledge from studying it. The content should be engaging, thought-provoking, and leave the user with a deep understanding of the subject matter.
    
    Follow these steps to create the learning plan:
    
    1. Carefully analyze the research paper chunks to identify key areas and concepts that are essential for mastery.
    2. Break down these areas into digestible modules, ensuring that each module covers a specific aspect of the research in depth.
    3. Organize the modules in a logical order, building from foundational concepts to more advanced topics.
    4. For each module, develop an extensive content block that goes beyond basic explanations, including:
       - Detailed breakdowns of complex concepts
       - Cutting-edge research
    5. Create practice cases and exercises that reinforce the in-depth knowledge presented in the content block if applicable only
    
    Present your plan using the following format: 
    
    <plan>
      <module>
        <modulename>Module Title</modulename>
        <description>
          <line>[Brief description of the topic covered in this module]</line>
          [Continue with additional lines as needed]
        </description>
        <content>
          Provide extremely detailed, 
          engaging content that teaches the user everything in depth about this module. 
          Explain complex concepts in an understandable way and ensure comprehensive coverage. This is where the user LEARNS, its not a description, but in fact the lesson itself. 
          The size is unlimited; 
          the main point is that the user should learn a great deal from this content. 
          The content should be so informative and engaging that users feel they've gained significant expertise in the topic after studying it.
          This is as deep as user can learn from this module. There will be no more content after this. 
          Do not include any special formatting, just plain text. 
        </content> 
        <practice>
          If applicable, include practice cases or exercises related to this module. Otherwise, omit this tag entirely.
        </practice>
      </module>
      [Continue with additional modules as needed]
    </plan>
    
    When creating the content for each module:
    - Aim to teach the user something new, interesting, and advanced about the module topic.
    - Explain complex concepts in a clear, understandable manner, but don't shy away from diving deep into technical details.
    - Include real-world examples, case studies, and applications to enhance understanding and demonstrate practical relevance.
    - Discuss current research, debates, and controversies in the field to provide a well-rounded view of the topic.
    - Connect the module's content to other relevant fields or disciplines to broaden the user's perspective.
    
    For practice cases and exercises:
    - Include these when you believe they would be helpful for reinforcing the module's concepts and applying the in-depth knowledge gained from the content block.
    - Ensure that practice items are directly related to the module content and research paper chunks, and challenge the user to think critically about the material.
    - Vary the types of practice (e.g., multiple-choice questions, short answer prompts, problem-solving scenarios, case studies, research proposals) to engage different learning styles and assess various levels of understanding.
    - Include some advanced exercises that require synthesis of information across multiple concepts or modules.
    
    Create a comprehensive plan that covers all essential aspects of the chunks, providing a clear path from beginner to expert level in the subject matter. The content blocks should be so informative and engaging that users feel they've gained significant expertise in the topic after studying them.
    
    Important: Only output the plan itself, formatted exactly as shown above. Do not include any additional text, explanations, or introductions outside of the <plan> tags.`;
    console.log(prompt);
    const systemMessage = {
      role: "system",
      content: prompt,
    };
    const conversationMessages = [systemMessage, ...messages];

    const response = await chatModel.invoke(conversationMessages);

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
