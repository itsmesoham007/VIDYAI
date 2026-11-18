"""
VidyAI — GSEB English Medium RAG Pipeline (Standards 1 to 12)
Strict Metadata: {"board": "GSEB", "medium": "English", "standard": int(grade), "subject": str(subject)}
Strict Standard-First Filtering in ChromaDB & Gemini text-embedding-004 Integration
"""

import os
import re
from pathlib import Path
from typing import List, Dict, Any, Optional
from config import CURRICULUM_DIR, CHROMA_DB_DIR, GEMINI_API_KEY, EMBEDDING_MODEL
from gseb_downloader import ingest_pdf_file

# Disable ChromaDB telemetry noise and posthog signature mismatches
os.environ["ANONYMIZED_TELEMETRY"] = "False"
os.environ["CHROMA_TELEMETRY"] = "False"
try:
    import posthog
    posthog.capture = lambda *args, **kwargs: None
except Exception:
    pass

def detect_subject_from_query(query: str, grade: int, current_subject: Optional[str] = None) -> str:
    """
    Intelligently determines the best GSEB subject for the student's question.
    Prevents a History question ('who was shah jahan') or Math problem ('solve 3 - 4')
    from being misrouted to English or Physics just because the UI dropdown was left on that subject.
    """
    q = query.lower()
    q_strip = query.strip()

    # 0. Direct Mathematics / Arithmetic query check
    if (
        re.search(r'^\s*[-+]?\(?\d+(\.\d+)?\)?\s*[\+\-\*\/\^\%]\s*\(?[-+]?\d+(\.\d+)?\)?', q_strip) or
        re.search(r'\b(solve|calculate|evaluate|compute|what is|how much is|simplify)\b.*(\d+\s*[\+\-\*\/\^\%]\s*\d+|[a-zA-Z]\s*[\+\-\*\/=])', q) or
        re.search(r'\b\d+\s*[\+\-\*\/]\s*\d+\b', q) or
        re.search(r'\b\d+\s*(plus|minus|times|multiplied by|divided by)\s*\d+\b', q) or
        re.search(r'\b\d*[a-zA-Z]\s*[\+\-\*\/]\s*\d+\s*=\s*[-+]?\d+\b', q) or
        re.search(r'\b\d+[a-zA-Z]\s*=\s*[-+]?\d+\b', q)
    ):
        return "Mathematics"

    # 1. Social Science / History / Geography / Civics keywords
    social_keywords = [
        "shah jahan", "shahjahan", "mughal", "taj mahal", "red fort", "lal qila", "jama masjid",
        "peacock throne", "takht-i-taus", "babur", "humayun", "akbar", "jahangir", "aurangzeb",
        "sultan", "sultanate", "lodi", "khilji", "tughlaq", "slave dynasty", "qutb", "rajput",
        "chauhan", "prithviraj", "solanki", "siddharaj", "rani ki vav", "patan", "modhera",
        "sun temple", "lothal", "dholavira", "harappa", "indus valley", "heritage", "monument",
        "sculpture", "temple", "stupa", "sanchi", "ajanta", "ellora", "konark", "chola",
        "brihadeshwara", "british rule", "east india company", "1857", "freedom struggle",
        "gandhi", "satyagraha", "dandi", "constitution", "ambedkar", "parliament", "lok sabha",
        "rajya sabha", "democracy", "judiciary", "fundamental rights", "soil", "alluvial",
        "monsoon", "agriculture", "minerals", "industries", "economic liberalization", "lpg 1991",
        "wto", "primary sector", "secondary sector", "tertiary sector", "dynasty", "emperor",
        "king", "battle of", "reign", "archaeological", "ancient india", "medieval india", "ashoka"
    ]
    for kw in social_keywords:
        if kw in q:
            if grade in [6, 7, 8, 9, 10]:
                return "Social Science"
            elif 3 <= grade <= 5:
                return "Environmental Studies (EVS)"

    # 2. Physics keywords
    physics_keywords = [
        "coulomb", "electrostatic", "electric field", "electric flux", "gauss's law", "gauss law",
        "potential difference", "voltage", "capacitance", "capacitor", "dielectric", "drift velocity",
        "ohm's law", "ohms law", "kirchhoff", "wheatstone", "resistor", "series", "parallel",
        "magnetic field", "lorentz", "biot savart", "ampere's law", "solenoid", "faraday",
        "lenz", "electromagnetic induction", "alternating current", "transformer", "reflection",
        "refraction", "snell", "focal length", "lens", "mirror", "prism", "dispersion",
        "interference", "diffraction", "photoelectric", "de broglie", "radioactivity", "half life",
        "newton's law", "laws of motion", "friction", "projectile", "gravitation", "kepler",
        "thermodynamics", "isothermal", "adiabatic", "carnot", "torque", "angular momentum"
    ]
    for kw in physics_keywords:
        if kw in q:
            if grade in [11, 12]:
                return "Physics"
            elif grade in [6, 7, 8, 9, 10]:
                return "Science"

    # 3. Chemistry keywords
    chemistry_keywords = [
        "mole concept", "avogadro", "molarity", "molality", "stoichiometry", "bohr",
        "quantum number", "aufbau", "hund", "periodic table", "ionization enthalpy", "electronegativity",
        "vsepr", "hybridization", "chemical bonding", "enthalpy", "entropy",
        "equilibrium", "le chatelier", "redox", "oxidation", "reduction", "acid", "base", "salt",
        "ph scale", "chlor-alkali", "bleaching powder", "baking soda", "washing soda", "plaster of paris",
        "covalent", "catenation", "homologous", "hydrocarbon", "alkane", "alkene", "alkyne",
        "alcohol", "aldehyde", "ketone", "carboxylic", "saponification", "ester", "raoult",
        "colligative", "nernst", "electrochemistry", "galvanic", "chemical kinetics", "arrhenius",
        "rate of reaction", "d block", "f block", "coordination compound", "ligand", "haloalkane"
    ]
    for kw in chemistry_keywords:
        if kw in q:
            if grade in [11, 12]:
                return "Chemistry"
            elif grade in [6, 7, 8, 9, 10]:
                return "Science"

    # 4. Biology keywords
    biology_keywords = [
        "cell", "mitochondria", "chloroplast", "tissue", "photosynthesis", "stomata", "chlorophyll",
        "nutrition", "autotrophic", "heterotrophic", "digestion", "respiration", "aerobic",
        "anaerobic", "circulation", "heart", "artery", "vein", "excretion", "kidney", "nephron",
        "neuron", "nervous system", "hormone", "reproduction", "gamete", "fertilization",
        "menstrual", "embryo", "genetics", "mendel", "monohybrid", "dihybrid", "dna", "rna",
        "replication", "transcription", "translation", "mutation", "evolution", "natural selection",
        "ecosystem", "food chain", "biodiversity", "species", "biotechnology", "plasmid", "pcr"
    ]
    for kw in biology_keywords:
        if kw in q:
            if grade in [11, 12]:
                return "Biology"
            elif grade in [6, 7, 8, 9, 10]:
                return "Science"
            elif 3 <= grade <= 5:
                return "Environmental Studies (EVS)"

    # 5. Mathematics keywords
    math_keywords = [
        "solve for x", "find x", "quadratic equation", "polynomial", "bpt", "thales",
        "pythagoras", "similar triangle", "tangent to circle", "trigonometry",
        "sin theta", "cos theta", "tan theta", "arithmetic progression",
        "coordinate geometry", "probability", "statistics", "mean median mode", "matrix multiplication",
        "inverse of matrix", "derivative", "differentiation", "integral", "integration",
        "differential equation", "limits", "continuity", "dot product", "cross product"
    ]
    for kw in math_keywords:
        if kw in q:
            return "Mathematics"

    # 6. Computer Studies keywords
    computer_keywords = [
        "html", "css", "java oop", "python programming", "heading tag", "table tag",
        "ordered list", "unordered list", "firewall", "it act 2000", "sql query",
        "primary key", "binary numeral"
    ]
    for kw in computer_keywords:
        if kw in q:
            return "Computer Studies"

    # 7. Commerce Stream keywords (Accounts, Statistics, OCM, CC&SP, Economics)
    commerce_keywords = [
        "journal entry", "trial balance", "balance sheet", "p&l", "profit and loss",
        "partnership deed", "goodwill", "revaluation account", "realization account",
        "share capital", "debenture", "cash flow statement", "depreciation", "slm", "wdv",
        "subsidiary books", "petty cash", "bank reconciliation", "gst", "cgst", "sgst", "igst"
    ]
    for kw in commerce_keywords:
        if kw in q:
            if grade in [11, 12]:
                return "Elements of Accounts Part 1"
            elif grade in [9, 10]:
                return "Elements of Book Keeping"

    stats_keywords = [
        "index number", "laspeyres", "paasche", "fisher ideal", "linear correlation",
        "karl pearson", "spearman rank", "linear regression", "time series", "normal distribution",
        "binomial distribution", "standard deviation", "coefficient of variation"
    ]
    for kw in stats_keywords:
        if kw in q:
            if grade in [11, 12]:
                return "Statistics" if grade == 11 else "Statistics Part 1"

    ocm_keywords = [
        "principles of management", "henri fayol", "fw taylor", "scientific management",
        "planning process", "organizational structure", "staffing", "directing", "controlling",
        "capital structure", "marketing mix 4ps"
    ]
    for kw in ocm_keywords:
        if kw in q:
            if grade in [11, 12]:
                return "Organization of Commerce & Management (OCM)"

    # 8. Arts Stream keywords (Psychology, Sociology, Geography, Political Science, Philosophy)
    arts_keywords = [
        "psychology", "classical conditioning", "pavlov", "operant conditioning", "skinner",
        "gestalt", "gardner multiple intelligences", "freud", "id ego superego", "sociology",
        "social stratification", "sanskritization", "human geography", "political theory",
        "rawls", "berlin liberty", "epistemology", "pramana", "darshanas", "revolt of 1857"
    ]
    for kw in arts_keywords:
        if kw in q:
            if "psycholog" in q:
                return "Psychology"
            elif "sociolog" in q or "sanskritization" in q:
                return "Sociology"
            elif "darshana" in q or "pramana" in q or "epistemology" in q:
                return "Philosophy"
            elif "political" in q or "liberty" in q:
                return "Political Science"
            elif "geograph" in q:
                return "Geography"

    return current_subject or ("Science" if grade >= 6 else "Mathematics")

def is_matching_subject(req_subj: str, meta_subj: str) -> bool:
    r = req_subj.lower().strip()
    m = meta_subj.lower().strip()
    if r == m:
        return True
    if "social" in r and "social" in m:
        return True
    if "social" not in r and "social" in m:
        return False
    if "social" in r and "social" not in m:
        return False
    return r in m or m in r

class GSEBDocumentChunk:
    def __init__(self, doc_id: str, content: str, standard: int, subject: str, chapter: str, stream: str = "General"):
        self.doc_id = doc_id
        self.content = content
        self.standard = int(standard)
        self.grade = int(standard)
        self.subject = subject.strip()
        self.stream = stream.strip()
        self.chapter = chapter.strip()
        self.board = "GSEB"
        self.medium = "English"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.doc_id,
            "content": self.content,
            "standard": self.standard,
            "grade": self.standard,
            "subject": self.subject,
            "stream": self.stream,
            "chapter": self.chapter,
            "board": self.board,
            "medium": self.medium
        }

class RAGPipeline:
    def __init__(self):
        self.curriculum_dir = Path(CURRICULUM_DIR)
        self.chroma_client = None
        self.collection = None
        self.in_memory_docs: List[GSEBDocumentChunk] = []
        self._init_vector_store()
        self.ingest_curriculum()

    def _init_vector_store(self):
        """Initializes ChromaDB persistent store with cosine similarity index."""
        try:
            import chromadb
            from chromadb.config import Settings
            os.makedirs(CHROMA_DB_DIR, exist_ok=True)
            self.chroma_client = chromadb.PersistentClient(
                path=CHROMA_DB_DIR,
                settings=Settings(anonymized_telemetry=False)
            )
            self.collection = self.chroma_client.get_or_create_collection(
                name="gseb_english_curriculum",
                metadata={"hnsw:space": "cosine"}
            )
            print(f"[RAG] ChromaDB persistent client initialized at: {CHROMA_DB_DIR}")
        except Exception as e:
            print(f"[RAG] ChromaDB initialization note: {e}. Resilient vector engine active.")
            self.chroma_client = None

    def _get_embedding_vector(self, text: str) -> Optional[List[float]]:
        """Generates embedding using Gemini text-embedding-004 if API key is provided."""
        if not GEMINI_API_KEY:
            return None
        try:
            from google import genai
            client = genai.Client(api_key=GEMINI_API_KEY)
            res = client.models.embed_content(
                model=EMBEDDING_MODEL,
                contents=text[:2000]
            )
            if hasattr(res, "embedding") and hasattr(res.embedding, "values"):
                return res.embedding.values
            elif hasattr(res, "embeddings") and len(res.embeddings) > 0:
                return res.embeddings[0].values
        except Exception:
            try:
                import google.generativeai as legacy_genai
                legacy_genai.configure(api_key=GEMINI_API_KEY)
                res = legacy_genai.embed_content(
                    model=f"models/{EMBEDDING_MODEL}",
                    content=text[:2000]
                )
                return res.get("embedding")
            except Exception:
                pass
        return None

    def ingest_curriculum(self):
        """
        Ingests all GSEB English Medium curriculum files (Standards 1 to 12).
        Strictly filters out any non-GSEB or Gujarati-medium files.
        Chunks text by standard, subject, and chapter, using batch upserts.
        """
        if not self.curriculum_dir.exists():
            print(f"[RAG] Curriculum dir not found: {self.curriculum_dir}")
            return

        gseb_folder = self.curriculum_dir / "gseb"
        target_dirs = [gseb_folder] if gseb_folder.exists() else [self.curriculum_dir]

        batch_ids = []
        batch_docs = []
        batch_metas = []

        for target_dir in target_dirs:
            # 1. Process structured .txt and .md files
            for file_path in target_dir.glob("*.txt"):
                filename = file_path.stem.lower()

                # Rule 1: Strictly ignore or skip Gujarati-medium files
                if filename == "gseb_class_1_gujarati" or "gujarati_medium" in filename or "kalarav" in filename:
                    continue

                # Parse standard (1-12) from filename e.g. gseb_class_10_math
                grade_match = re.search(r'class_(\d+)', filename)
                if not grade_match:
                    continue
                standard = int(grade_match.group(1))

                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        text = f.read()

                    # Extract file-level metadata
                    subj_m = re.search(r'\*\*Subject\*\*:\s*([^\n\r]+)', text)
                    stream_m = re.search(r'\*\*Stream\*\*:\s*([^\n\r]+)', text)
                    file_subject = subj_m.group(1).strip() if subj_m else "General"
                    file_stream = stream_m.group(1).strip() if stream_m else "General"

                    # Split text by Markdown chapter headers: ## Chapter
                    sections = re.split(r'\n(?=## )', text)
                    for idx, section in enumerate(sections):
                        clean_text = section.strip()
                        if not clean_text or clean_text.startswith("# GSEB"):
                            continue

                        # Extract chapter title
                        match = re.search(r'##\s*Chapter\s*\d*:\s*(.*)', clean_text)
                        chapter = match.group(1).split("\n")[0].strip() if match else f"Chapter {idx+1}"

                        # Extract chapter-specific subject and stream if specified
                        ch_subj_m = re.search(r'-\s*\*\*Subject\*\*:\s*([^\n\r]+)', clean_text)
                        ch_stream_m = re.search(r'-\s*\*\*Stream\*\*:\s*([^\n\r]+)', clean_text)
                        ch_subject = ch_subj_m.group(1).strip() if ch_subj_m else file_subject
                        ch_stream = ch_stream_m.group(1).strip() if ch_stream_m else file_stream

                        doc_id = f"{filename}_{idx}"
                        chunk = GSEBDocumentChunk(doc_id, clean_text, standard, ch_subject, chapter, ch_stream)
                        self.in_memory_docs.append(chunk)

                        batch_ids.append(doc_id)
                        batch_docs.append(clean_text)
                        batch_metas.append({
                            "board": "GSEB",
                            "medium": "English",
                            "standard": standard,
                            "subject": ch_subject,
                            "stream": ch_stream,
                            "chapter": chapter
                        })
                except Exception as e:
                    print(f"[RAG] Error reading file {file_path}: {e}")

            # 2. Process real PDF files if present in curriculum folder
            for pdf_path in target_dir.glob("*.pdf"):
                filename = pdf_path.stem.lower()
                if "gujarati" in filename:
                    continue
                grade_match = re.search(r'(?:class|std)_?(\d+)', filename)
                standard = int(grade_match.group(1)) if grade_match else 10
                subject = "General"
                for s in ["physics", "chemistry", "biology", "math", "science", "english", "computer", "social"]:
                    if s in filename:
                        subject = s.capitalize()
                        break

                pdf_chunks = ingest_pdf_file(pdf_path, standard, subject)
                for idx, pc in enumerate(pdf_chunks):
                    doc_id = f"gseb_pdf_std_{standard}_{subject}_{idx}"
                    chunk = GSEBDocumentChunk(doc_id, pc["content"], standard, subject, pc["chapter"])
                    self.in_memory_docs.append(chunk)

                    batch_ids.append(doc_id)
                    batch_docs.append(pc["content"])
                    batch_metas.append({
                        "board": "GSEB",
                        "medium": "English",
                        "standard": standard,
                        "subject": subject,
                        "chapter": pc["chapter"]
                    })

        # Batch upsert into ChromaDB
        if self.collection and batch_ids:
            try:
                existing_count = self.collection.count()
                if existing_count >= len(batch_ids) and existing_count > 0:
                    print(f"[RAG] ChromaDB collection already loaded with {existing_count} chunks. Skipping re-embedding.")
                else:
                    # Upsert in chunks of 50 for optimal vector performance
                    print(f"[RAG] Upserting {len(batch_ids)} chunks into ChromaDB...")
                    for i in range(0, len(batch_ids), 50):
                        self.collection.upsert(
                            ids=batch_ids[i:i+50],
                            documents=batch_docs[i:i+50],
                            metadatas=batch_metas[i:i+50]
                        )
            except Exception as ce:
                print(f"[RAG] ChromaDB batch upsert note: {ce}")

        print(f"[RAG] Ingested {len(self.in_memory_docs)} GSEB English Medium textbook chunks across Standard 1 to 12.")

    def query(self, grade: int, subject: str, query_text: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Retrieves relevant GSEB English Medium curriculum chunks.
        Strictly filters ChromaDB by Standard == grade first.
        Automatically adapts to detected subject if query clearly belongs to a different subject.
        """
        standard = int(grade)
        clean_subj = subject.strip()
        detected_subj = detect_subject_from_query(query_text, grade, clean_subj)
        effective_subj = detected_subj if detected_subj else clean_subj
        norm_subj = effective_subj.lower()

        # 1. Query ChromaDB with strict Standard filter
        if self.collection:
            try:
                where_filter = {
                    "$and": [
                        {"board": {"$eq": "GSEB"}},
                        {"medium": {"$eq": "English"}},
                        {"standard": {"$eq": standard}}
                    ]
                }

                results = self.collection.query(
                    query_texts=[query_text],
                    n_results=top_k * 3,
                    where=where_filter
                )

                if results and results.get("documents") and len(results["documents"][0]) > 0:
                    retrieved = []
                    docs = results["documents"][0]
                    metas = results["metadatas"][0]
                    ids = results["ids"][0]

                    subj_matches = []
                    other_matches = []
                    query_tokens = set(re.findall(r'\w+', query_text.lower()))
                    for doc, meta, doc_id in zip(docs, metas, ids):
                        item = {
                            "id": doc_id,
                            "content": doc,
                            "standard": meta.get("standard", standard),
                            "grade": meta.get("standard", standard),
                            "stream": meta.get("stream", "General"),
                            "subject": meta.get("subject", effective_subj),
                            "chapter": meta.get("chapter", "Curriculum"),
                            "board": meta.get("board", "GSEB"),
                            "medium": meta.get("medium", "English")
                        }
                        doc_tokens = set(re.findall(r'\w+', doc.lower()))
                        item["_score"] = len(query_tokens.intersection(doc_tokens))
                        meta_subj = str(meta.get("subject", ""))
                        if is_matching_subject(effective_subj, meta_subj):
                            subj_matches.append(item)
                        else:
                            other_matches.append(item)

                    subj_matches.sort(key=lambda x: x["_score"], reverse=True)
                    other_matches.sort(key=lambda x: x["_score"], reverse=True)
                    combined = (subj_matches + other_matches)[:top_k]
                    if combined:
                        for c in combined:
                            c.pop("_score", None)
                        return combined
            except Exception as e:
                print(f"[RAG] ChromaDB strict standard query notice: {e}")

        # 2. Resilient In-Memory Search strictly filtered by standard == grade first
        exact_standard_docs = [
            doc for doc in self.in_memory_docs
            if doc.standard == standard
        ]

        subj_candidates = [
            doc for doc in exact_standard_docs
            if is_matching_subject(effective_subj, doc.subject)
        ]
        candidates = subj_candidates if subj_candidates else exact_standard_docs

        if not candidates:
            candidates = [doc for doc in self.in_memory_docs if abs(doc.standard - standard) <= 1]
        if not candidates:
            candidates = self.in_memory_docs

        query_tokens = set(re.findall(r'\w+', query_text.lower()))
        scored = []
        for doc in candidates:
            doc_tokens = re.findall(r'\w+', doc.content.lower())
            if not doc_tokens:
                continue
            matches = sum(1 for t in query_tokens if t in doc_tokens)
            score = matches / (len(doc_tokens) ** 0.5)
            scored.append((score, doc))

        scored.sort(key=lambda x: x[0], reverse=True)
        top_matches = [d.to_dict() for s, d in scored[:top_k] if s > 0]

        if not top_matches and candidates:
            top_matches = [candidates[0].to_dict()]

        return top_matches

# Global pipeline instance
rag_pipeline = RAGPipeline()
