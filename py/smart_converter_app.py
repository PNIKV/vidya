import os
import json
import tkinter as tk
from tkinter import filedialog, messagebox

try:
    import docx
except ImportError:
    pass

class SmartConverterApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Recursive Converter (WARNING: Deletes Originals)")
        self.root.geometry("450x200")
        self.root.eval('tk::PlaceWindow . center')
        
        # UI Elements
        tk.Label(root, text="Select Main Folder to Process All Sub-folders", font=("Arial", 11, "bold")).pack(pady=(20,10))
        
        tk.Button(root, text="Select Main Folder & Start", command=self.process_main_folder, 
                  bg="#f44336", fg="white", font=("Arial", 12, "bold"), pady=10, padx=20).pack(pady=10)

        tk.Label(root, text="⚠️ Warning: Original files will be PERMANENTLY deleted!", fg="red", font=("Arial", 10, "bold")).pack(pady=5)

    def process_main_folder(self):
        # Ask for the main root directory
        main_folder = filedialog.askdirectory(title="Select the Main Folder")
        if not main_folder:
            return
            
        # Critical warning prompt
        confirm = messagebox.askyesno(
            "Confirm Permanent Deletion", 
            "Are you absolutely sure?\n\nThis will scan ALL sub-folders inside this directory.\nEvery DOCX and PPTX file will be PERMANENTLY DELETED after conversion."
        )
        
        if not confirm:
            return
            
        docx_count = 0
        pptx_count = 0
        
        # os.walk automatically digs into all folders and sub-folders
        for root_dir, dirs, files in os.walk(main_folder):
            for filename in files:
                filepath = os.path.join(root_dir, filename)
                
                # Skip temp files
                if filename.startswith("~"):
                    continue
                    
                # DOCX to JSON
                if filename.lower().endswith(".docx"):
                    if self.convert_docx(filepath):
                        os.remove(filepath)  # PERMANENTLY DELETE ORIGINAL
                        docx_count += 1
                        
                # PPTX to PDF
                elif filename.lower().endswith(".pptx"):
                    if self.convert_pptx(filepath):
                        os.remove(filepath)  # PERMANENTLY DELETE ORIGINAL
                        pptx_count += 1
                        
        messagebox.showinfo("Success", f"Conversion & Cleanup Finished!\n\nConverted & Deleted:\n{docx_count} DOCX files.\n{pptx_count} PPTX files.")

    def convert_docx(self, filepath):
        try:
            doc = docx.Document(filepath)
            # Combine all text into one large string
            full_text = "\n".join([para.text for para in doc.paragraphs if para.text.strip()])
            
            # Remove smart quotes that break JSON parsing
            full_text = full_text.replace('“', '"').replace('”', '"').replace("‘", "'").replace("’", "'")
            
            json_path = os.path.splitext(filepath)[0] + ".json"
            
            # Try to parse the text AS native JSON
            try:
                parsed_json = json.loads(full_text)
            except json.JSONDecodeError:
                # Fallback if it isn't perfect JSON
                parsed_json = {
                    "filename": os.path.basename(filepath),
                    "content": full_text
                }
            
            # Save the actual JSON structure
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(parsed_json, f, indent=4, ensure_ascii=False)
                
            return True
        except Exception as e:
            print(f"Failed to convert {filepath}: {e}")
            return False

    def convert_pptx(self, filepath):
        try:
            import win32com.client
            import pythoncom
        except ImportError:
            print("pywin32 library is missing. Cannot convert PPTX.")
            return False
            
        try:
            # win32com requires absolute paths
            abs_in_path = os.path.abspath(filepath)
            abs_out_path = os.path.abspath(os.path.splitext(filepath)[0] + ".pdf")
            
            # Initialize COM and open PowerPoint invisibly
            pythoncom.CoInitialize()
            powerpoint = win32com.client.Dispatch("Powerpoint.Application")
            deck = powerpoint.Presentations.Open(abs_in_path, WithWindow=False)
            
            # 32 is the code for saving as PDF
            deck.SaveAs(abs_out_path, 32)
            deck.Close()
            powerpoint.Quit() # Ensure PowerPoint closes
            return True
        except Exception as e:
            print(f"Failed to convert PPTX {filepath}: {e}")
            return False

if __name__ == "__main__":
    root = tk.Tk()
    app = SmartConverterApp(root)
    root.mainloop()