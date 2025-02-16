from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
import xmltodict

app = FastAPI()

class QueryRequest(BaseModel):
    topic: str
    maxResults: int

@app.post("/fetch_arxiv/")
async def fetch_arxiv(request: QueryRequest):
    topic = request.topic
    max_results = request.maxResults

    url = f"http://export.arxiv.org/api/query?search_query=ti:{topic}&sortBy=relevance&sortOrder=ascending&max_results={max_results}"
    
    print("ARXIV")
    print(url)

    try:
        response = requests.get(url)
        response.raise_for_status()  # Raise an error for bad responses
        data = xmltodict.parse(response.text)

        # Check if 'entry' exists in parsed XML
        if "feed" not in data or "entry" not in data["feed"]:
            return {"results": []}  # Return an empty array if no entries

        # Ensure entries are always a list
        entries = data["feed"]["entry"]
        if not isinstance(entries, list):
            entries = [entries]

        return {"results": entries}

    except requests.RequestException as e:
        print(f"Error fetching data from arXiv: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch data from arXiv")
