import axios from 'axios';

// Define the arXiv API endpoint
const ARXIV_API_URL = 'http://export.arxiv.org/api/query';

const _searchTerm = "ai agents"
// Define the search parameters
const maxResults = 5;

// Function to fetch papers from arXiv
async function fetchPapers(searchTerm = _searchTerm) {
    const searchQuery = `all:"${_searchTerm}"`;
    try {
        const response = await axios.get(ARXIV_API_URL, {
            params: {
                search_query: searchQuery,
                max_results: maxResults,
                sortBy: 'relevance',
                sortOrder: 'descending'
            }
        });

        // Parse the response data (which is in XML format)
        const papers = response.data;

        // Log the papers to the console
        console.log(papers);
    } catch (error) {
        console.error('Error fetching papers:', error);
    }
}

// // Call the function to fetch and display papers
// fetchPapers();
