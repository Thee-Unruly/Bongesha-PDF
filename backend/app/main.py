from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from utils import extract_text, generate_embeddings, query_vector_db
from config import settings
import os
import uuid

app = FastAPI()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# PDF Processing Endpoint
@app.post("/api/upload")
async def upload_pdf(file: UploadFile = File(...)):
    try:
        # Save the uploaded file temporarily
        file_id = str(uuid.uuid4())
        file_path = f"temp_{file_id}.pdf"
        
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())
        
        # Process PDF
        text = extract_text(file_path)
        generate_embeddings(text, file_id)
        
        # Clean up
        os.remove(file_path)
        
        return JSONResponse(content={"status": "success", "file_id": file_id})
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Chat Endpoint
@app.post("/api/chat")
async def chat_with_pdf(file_id: str, query: str):
    try:
        # Get relevant context from vector DB
        context = query_vector_db(file_id, query)
        
        # Call OpenRouter API
        headers = {
            "Authorization": f"Bearer {settings.openrouter_api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": settings.app_url,
        }
        
        payload = {
            "model": "deepseek-ai/deepseek-r1: free",
            "messages": [
                {"role": "system", "content": f"Answer based on this context: {context}"},
                {"role": "user", "content": query},
            ],
            "temperature": 0.7,
        }
        
        # In production, use async HTTP client like httpx
        import requests
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=payload
        )
        
        return JSONResponse(content=response.json())
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)