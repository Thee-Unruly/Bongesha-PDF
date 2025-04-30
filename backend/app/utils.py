import PyPDF2
from sentence_transformers import SentenceTransformer
import chromadb
from typing import List
import numpy as np

# Initialize ChromaDB client
chroma_client = chromadb.PersistentClient(path="./chroma_db")
embedding_model = SentenceTransformer("BAAI/bge-small-en")

def extract_text(file_path: str) -> str:
    with open(file_path, "rb") as file:
        pdf = PyPDF2.PdfReader(file)
        return " ".join([page.extract_text() for page in pdf.pages])

def generate_embeddings(text: str, file_id: str, chunk_size: int = 1000):
    # Split text into chunks
    chunks = [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]
    
    # Generate embeddings
    embeddings = embedding_model.encode(chunks).tolist()
    
    # Store in ChromaDB
    collection = chroma_client.get_or_create_collection(name="pdf_chat")
    collection.add(
        documents=chunks,
        embeddings=embeddings,
        ids=[f"{file_id}_{i}" for i in range(len(chunks))]
    )

def query_vector_db(file_id: str, query: str, top_k: int = 3) -> str:
    collection = chroma_client.get_collection(name="pdf_chat")
    
    # Get relevant chunks
    query_embedding = embedding_model.encode(query).tolist()
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        where={"file_id": file_id}  # Filter by this PDF only
    )
    
    return "\n\n".join(results["documents"][0])