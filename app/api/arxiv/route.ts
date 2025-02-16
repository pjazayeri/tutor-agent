import { NextResponse } from "next/server";
import fetch from 'node-fetch'; // Ensure you have node-fetch installed
import { XMLParser } from 'fast-xml-parser'; // Import the XML parser

export async function POST(req) {
    const { topic, maxResults } = await req.json();

    const url = `http://export.arxiv.org/api/query?search_query=ti:"${encodeURIComponent(topic)}"&sortBy=relevance&sortOrder=ascending&max_results=${maxResults}`;

    try {
        const response = await fetch(url);
        const text = await response.text();

        // Parse the XML response using fast-xml-parser
        const parser = new XMLParser();
        const jsonObj = parser.parse(text);

        // Check if entries exist
        if (!jsonObj.feed.entry) {
            return NextResponse.json({ results: [] }); // Return empty array if no entries
        }

        // Extract and format the entries
        const entries = Array.isArray(jsonObj.feed.entry) ? jsonObj.feed.entry : [jsonObj.feed.entry];

        return NextResponse.json(entries);
    } catch (error) {
        console.error('Error fetching data from arXiv:', error);
        return NextResponse.json({ error: 'Failed to fetch data from arXiv' }, { status: 500 });
    }
}