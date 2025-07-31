import chromadb
from chromadb.config import Settings

chroma_client = chromadb.Client(Settings(
    chroma_api_impl="rest",
    chroma_server_host="0.0.0.0",
    chroma_server_http_port=8000,
    persist_directory="/data"
))

app = chroma_client.app
