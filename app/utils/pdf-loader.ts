import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { glob } from "glob";
import path from "path";

let vectorStore: MemoryVectorStore | null = null;

export async function initializeVectorStore(pdfDirectory: string) {
    if (vectorStore) {
        return vectorStore;
    }

    try {
        // Find all PDF files in the directory
        const pdfFiles = await glob("**/*.pdf", { cwd: pdfDirectory });
        
        if (pdfFiles.length === 0) {
            console.warn("No PDF files found in the specified directory");
            return null;
        }

        // Load and process each PDF
        const documents = [];
        for (const pdfPath of pdfFiles) {
            const fullPath = path.join(pdfDirectory, pdfPath);
            const loader = new PDFLoader(fullPath);
            const docs = await loader.load();
            documents.push(...docs);
        }

        // Split documents into chunks
        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 500,
            chunkOverlap: 200,
        });
        const splitDocs = await textSplitter.splitDocuments(documents);

        // Create vector store
        vectorStore = await MemoryVectorStore.fromDocuments(
            splitDocs,
            new OpenAIEmbeddings()
        );

        return vectorStore;
    } catch (error) {
        console.error("Error initializing vector store:", error);
        return null;
    }
}

export async function queryVectorStore(query: string | undefined, k: number = 20) {
    if (!vectorStore) {
        throw new Error("Vector store not initialized");
    }

    const results = await vectorStore.similaritySearch(query, k);
    return results;
}
