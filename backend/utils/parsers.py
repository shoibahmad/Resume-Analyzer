import io
import PyPDF2
import docx
import fitz  # PyMuPDF
from google.genai import types

def extract_text_from_pdf(file_bytes):
    text = ""
    reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
    for page in reader.pages:
        text += page.extract_text() + "\n"
    return text

def extract_vision_part_from_pdf(file_bytes):
    try:
        pdf_doc = fitz.open(stream=file_bytes, filetype="pdf")
        if len(pdf_doc) > 0:
            page = pdf_doc[0]
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
            img_data = pix.tobytes("png")
            return types.Part.from_bytes(data=img_data, mime_type="image/png")
        pdf_doc.close()
    except Exception as e:
        print(f"Vision processing error: {e}")
    return None

def extract_text_from_docx(file_bytes):
    text = ""
    doc = docx.Document(io.BytesIO(file_bytes))
    for paragraph in doc.paragraphs:
        text += paragraph.text + "\n"
    return text
