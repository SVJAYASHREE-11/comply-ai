
import { useState } from "react";
import "./App.css";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

async function readResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof data.detail === "string"
        ? data.detail
        : `Request failed with status ${response.status}`
    );
  }

  return data;
}

function App() {
  const [documentId, setDocumentId] = useState("");
  const [file, setFile] = useState(null);
  const [uploadedFilename, setUploadedFilename] = useState("");
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [summary, setSummary] = useState("");
  const [compliance, setCompliance] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  function notify(text, type = "info") {
    setMessage(text);
    setMessageType(type);
  }

  function navigateTo(section) {
    setActiveSection(section);
    document.getElementById(section)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  async function handleUpload() {
    if (!file) {
      notify("Please select a PDF, DOCX, or TXT policy first.", "error");
      return;
    }

    const allowedExtensions = [".pdf", ".docx", ".txt"];
    const extension = file.name
      .slice(file.name.lastIndexOf("."))
      .toLowerCase();

    if (!allowedExtensions.includes(extension)) {
      notify("Unsupported file type. Please select PDF, DOCX, or TXT.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    notify("Uploading and indexing your document...");
    
    try {
      const response = await fetch(`${API}/api/documents/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await readResponse(response);

      setDocumentId(data.document_id);
      setUploadedFilename(data.filename || file.name);
      setSummary("");
      setCompliance("");
      setChatHistory([]);
      setQuestion("");
      notify("Document uploaded and indexed successfully.", "success");
    } catch (error) {
      notify(`Upload failed: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  }

  async function runDocumentAction(endpoint, resultType) {
    if (!documentId) {
      notify("Upload a document before running this action.", "error");
      return;
    }

    setLoading(true);
    notify(
      resultType === "summary"
        ? "Generating your policy summary..."
        : "Reviewing your policy for compliance gaps..."
    );

    try {
      const response = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id: documentId }),
      });

      const data = await readResponse(response);
      const result =
        resultType === "summary"
          ? data.summary
          : data.results;

      if (resultType === "summary") {
        setSummary(
          typeof result === "string"
            ? result
            : JSON.stringify(result ?? data, null, 2)
        );
        notify("Policy summary generated successfully.", "success");
      } else {
        setCompliance(
          typeof result === "string"
            ? result
            : JSON.stringify(result ?? data, null, 2)
        );
        notify("Compliance review completed successfully.", "success");
      }
    } catch (error) {
      notify(`Analysis failed: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleChat(event) {
    event.preventDefault();

    if (!documentId) {
      notify("Upload a policy document before asking questions.", "error");
      return;
    }

    if (!question.trim()) {
      notify("Please enter a question about your policy.", "error");
      return;
    }

    const submittedQuestion = question.trim();

    setLoading(true);
    notify("Searching your policy and preparing an answer...");

    try {
      const response = await fetch(`${API}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_id: documentId,
          question: submittedQuestion,
        }),
      });

      const data = await readResponse(response);

      setChatHistory((previous) => [
        ...previous,
        {
          question: submittedQuestion,
          answer:
            data.answer || "The AI did not return an answer.",
        },
      ]);

      setQuestion("");
      notify("Answer generated successfully.", "success");
    } catch (error) {
      notify(`Chat failed: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <a
          className="brand"
          href="#overview"
          onClick={() => navigateTo("overview")}
        >
          <span className="logo">C</span>
          <span>
            <strong>ComplyAI</strong>
            <small>POLICY INTELLIGENCE</small>
          </span>
        </a>

        <div className="workspace-label">WORKSPACE</div>

        <nav className="navigation" aria-label="Main navigation">
          <button
            className={`nav-item ${activeSection === "overview" ? "active" : ""}`}
            onClick={() => navigateTo("overview")}
          >
            <span>◈</span> Overview
          </button>
          <button
            className={`nav-item ${activeSection === "documents" ? "active" : ""}`}
            onClick={() => navigateTo("documents")}
          >
            <span>▤</span> Documents
          </button>
          <button
            className={`nav-item ${activeSection === "assistant" ? "active" : ""}`}
            onClick={() => navigateTo("assistant")}
          >
            <span>✧</span> AI Assistant
          </button>
          <button
            className={`nav-item ${activeSection === "compliance" ? "active" : ""}`}
            onClick={() => navigateTo("compliance")}
          >
            <span>✓</span> Compliance
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="local-ai-indicator">
            <span className="online-dot" />
            <div>
              <strong>Local AI</strong>
              <small>Powered by Ollama</small>
            </div>
          </div>
          <p>Your documents stay in your local development environment, subject to your storage configuration.</p>
        </div>
      </aside>

      <main className="main">
        <header className="topbar" id="overview">
          <div>
            <p className="breadcrumb">WORKSPACE / OVERVIEW</p>
            <h1>Compliance Dashboard</h1>
            <p className="page-subtitle">
              Analyze policies, ask questions, and identify compliance gaps.
            </p>
          </div>
          <span className="status">
            <span className="online-dot" />
            Local AI workspace
          </span>
        </header>

        <section className="welcome">
          <div className="welcome-content">
            <span className="eyebrow">YOUR AI COMPLIANCE ASSISTANT</span>
            <h2>Make your policies<br />easier to understand.</h2>
            <p>
              Upload a policy to generate summaries, ask document-specific
              questions, and discover areas that may need attention.
            </p>
            <button
              className="welcome-button"
              onClick={() => navigateTo("documents")}
            >
              Analyze a policy <span>↗</span>
            </button>
          </div>
          <div className="welcome-art" aria-hidden="true">
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <div className="art-shield">✓</div>
            <div className="art-spark spark-one">✦</div>
            <div className="art-spark spark-two">✧</div>
          </div>
        </section>

        {message && (
          <div
            className={`notice ${messageType}`}
            role="status"
            aria-live="polite"
          >
            <span>{messageType === "error" ? "!" : messageType === "success" ? "✓" : "i"}</span>
            {message}
          </div>
        )}

        <section className="section-heading">
          <div>
            <p className="eyebrow dark-eyebrow">YOUR WORKFLOW</p>
            <h2>Policy analysis tools</h2>
          </div>
          <span className="step-label">01 — 03</span>
        </section>

        <section className="cards" id="documents">
          <article className="card upload-card">
            <div className="card-top">
              <div className="card-icon purple">▤</div>
              <span className="tool-number">01</span>
            </div>
            <p className="card-label">DOCUMENT MANAGEMENT</p>
            <h3>Upload a policy</h3>
            <p className="card-description">
              Add a PDF, Word document, or plain-text policy to get started.
            </p>

            <label className="file-drop">
              <span className="upload-symbol">↑</span>
              <strong>{file ? file.name : "Choose a policy file"}</strong>
              <span>{file ? "Selected and ready to upload" : "PDF, DOCX or TXT"}</span>
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={(event) => {
                  setFile(event.target.files?.[0] || null);
                  if (event.target.files?.[0]) {
                    notify(`Selected ${event.target.files[0].name}.`);
                  }
                }}
              />
            </label>

            <button
              className="primary-button full-button"
              onClick={handleUpload}
              disabled={loading || !file}
            >
              {loading ? "Please wait..." : "Upload and index"}
            </button>

            {documentId && (
              <div className="document-chip">
                <span className="file-badge">TXT</span>
                <div className="document-info">
                  <strong>{uploadedFilename || "Uploaded document"}</strong>
                  <small>Indexed · ID: {documentId.slice(0, 8)}…</small>
                </div>
                <span className="check-mark">✓</span>
              </div>
            )}
          </article>

          <article className="card">
            <div className="card-top">
              <div className="card-icon blue">✧</div>
              <span className="tool-number">02</span>
            </div>
            <p className="card-label">AI SUMMARIZATION</p>
            <h3>Policy summary</h3>
            <p className="card-description">
              Extract the main purpose, key requirements, and open questions
              from your policy.
            </p>

            <div className="feature-list">
              <span>✓ Key policy points</span>
              <span>✓ Important requirements</span>
              <span>✓ Questions to investigate</span>
            </div>

            <button
              className="secondary-button full-button"
              disabled={loading || !documentId}
              onClick={() =>
                runDocumentAction("/api/documents/summarize", "summary")
              }
            >
              {loading ? "Processing..." : "Generate summary"} <span>↗</span>
            </button>

            {summary && (
              <div className="output-panel">
                <div className="output-heading">
                  <strong>Generated summary</strong>
                  <span>AI result</span>
                </div>
                <pre className="result">{summary}</pre>
              </div>
            )}
          </article>

          <article className="card" id="compliance">
            <div className="card-top">
              <div className="card-icon green">✓</div>
              <span className="tool-number">03</span>
            </div>
            <p className="card-label">COMPLIANCE REVIEW</p>
            <h3>Find policy gaps</h3>
            <p className="card-description">
              Compare your policy with the application's illustrative
              compliance checklist and identify areas for follow-up.
            </p>

            <div className="feature-list">
              <span>✓ Supporting evidence</span>
              <span>✓ Missing information</span>
              <span>✓ Recommended actions</span>
            </div>

            <button
              className="secondary-button full-button"
              disabled={loading || !documentId}
              onClick={() =>
                runDocumentAction("/api/compliance/check", "compliance")
              }
            >
              {loading ? "Processing..." : "Run compliance check"} <span>↗</span>
            </button>

            {compliance && (
              <div className="output-panel">
                <div className="output-heading">
                  <strong>Compliance findings</strong>
                  <span>AI result</span>
                </div>
                <pre className="result">{compliance}</pre>
              </div>
            )}
          </article>
        </section>

        <section className="chat card" id="assistant">
          <div className="chat-header">
            <div>
              <p className="card-label">DOCUMENT-BASED QUESTIONS</p>
              <h2>AI Policy Assistant</h2>
              <p className="card-description">
                Ask questions and get answers grounded in the uploaded policy.
              </p>
            </div>
            <div className="assistant-avatar">✧</div>
          </div>

          {!documentId && (
            <div className="empty-chat">
              <span>▤</span>
              <strong>Your policy is waiting</strong>
              <p>Upload and index a document to start asking questions.</p>
              <button
                className="text-button"
                onClick={() => navigateTo("documents")}
              >
                Go to document upload ↗
              </button>
            </div>
          )}

          {documentId && chatHistory.length === 0 && (
            <div className="suggestions">
              <p>Try asking</p>
              {[
                "What should employees do after a security incident?",
                "What access control requirements are mentioned?",
                "Which important details are missing from this policy?",
              ].map((suggestion) => (
                <button
                  className="suggestion"
                  key={suggestion}
                  onClick={() => setQuestion(suggestion)}
                >
                  {suggestion} <span>↗</span>
                </button>
              ))}
            </div>
          )}

          {chatHistory.length > 0 && (
            <div className="chat-history">
              {chatHistory.map((item, index) => (
                <div className="chat-exchange" key={`${index}-${item.question}`}>
                  <div className="user-question">
                    <span>You</span>
                    <p>{item.question}</p>
                  </div>
                  <div className="assistant-answer">
                    <span className="answer-icon">✧</span>
                    <div>
                      <strong>ComplyAI Assistant</strong>
                      <p>{item.answer}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <form className="chat-form" onSubmit={handleChat}>
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask something about your policy..."
              aria-label="Question about your policy"
            />
            <button
              className="primary-button"
              type="submit"
              disabled={loading || !documentId || !question.trim()}
            >
              Ask AI <span>↗</span>
            </button>
          </form>
          <p className="chat-footnote">
            AI-generated responses may be inaccurate. Verify important
            compliance decisions against authoritative requirements.
          </p>
        </section>

        <footer className="footer">
          <span>© {new Date().getFullYear()} ComplyAI</span>
          <span>Policy intelligence · Local AI development environment</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
