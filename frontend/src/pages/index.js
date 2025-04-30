import { useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiSend, FiFileText } from 'react-icons/fi';
import { ThreeDots } from 'react-loader-spinner';

export default function PDFChat() {
  const [file, setFile] = useState(null);
  const [fileId, setFileId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: 'application/pdf',
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        await handleUpload(acceptedFiles[0]);
      }
    },
  });

  const handleUpload = async (file) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setFile(file);
      setFileId(data.file_id);
      setMessages([{
        id: 1,
        text: `PDF "${file.name}" uploaded successfully! Ask me anything about it.`,
        sender: 'bot',
      }]);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || !fileId) return;
    
    const userMessage = {
      id: messages.length + 1,
      text: input,
      sender: 'user',
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_id: fileId,
          query: input,
        }),
      });
      const data = await response.json();
      
      setMessages(prev => [...prev, {
        id: messages.length + 2,
        text: data.choices[0].message.content,
        sender: 'bot',
      }]);
    } catch (error) {
      console.error('Chat failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto p-4">
        <header className="text-center py-8">
          <h1 className="text-4xl font-bold text-indigo-800">PDF Chat Assistant</h1>
          <p className="text-lg text-indigo-600 mt-2">
            Upload a PDF and chat with it using AI
          </p>
        </header>

        <main className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Upload Section */}
          {!file && (
            <div 
              {...getRootProps()} 
              className={`p-12 text-center border-2 border-dashed rounded-lg m-6 transition-all 
                ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-300'}`}
            >
              <input {...getInputProps()} />
              <FiUpload className="mx-auto text-4xl text-indigo-500 mb-4" />
              <p className="text-lg text-gray-700">
                {isDragActive ? 'Drop the PDF here' : 'Drag & drop a PDF, or click to select'}
              </p>
              <p className="text-sm text-gray-500 mt-2">Supports PDF files only</p>
            </div>
          )}

          {/* Chat Interface */}
          {file && (
            <div className="flex flex-col h-[70vh]">
              {/* File Info */}
              <div className="bg-indigo-50 p-4 flex items-center">
                <FiFileText className="text-indigo-600 mr-2" />
                <span className="font-medium text-indigo-800 truncate">{file.name}</span>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.sender === 'user'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-4">
                      <ThreeDots color="#4F46E5" height={20} width={40} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Input Form */}
              <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
                <div className="flex">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask something about the PDF..."
                    className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-r-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <FiSend className="mr-2" />
                    Send
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>

        <footer className="text-center text-gray-500 text-sm mt-8 py-4">
          Powered by DeepSeek-R1 and OpenRouter AI
        </footer>
      </div>
    </div>
  );
}