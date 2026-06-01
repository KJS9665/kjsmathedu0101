import re

with open(r"C:\Users\kjs96\.gemini\antigravity\scratch\math-academy-web\src\old_index.html", "r", encoding="utf-8") as f:
    content = f.read()

# Try to find the App() function
match = re.search(r'function App\(\) \{(.*?)\n    \}\n', content, re.DOTALL)

if match:
    app_body = match.group(1)
    
    # React JSX replacements
    app_body = app_body.replace('class=', 'className=')
    app_body = app_body.replace('stroke-linecap', 'strokeLinecap')
    app_body = app_body.replace('stroke-linejoin', 'strokeLinejoin')
    app_body = app_body.replace('stroke-width', 'strokeWidth')
    app_body = app_body.replace('allowfullscreen=""', 'allowFullScreen={true}')
    app_body = app_body.replace('for=', 'htmlFor=')
    
    # Prepend imports
    imports = """import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import './index.css';

"""
    
    full_code = imports + "export default function App() {\n" + app_body + "\n}\n"
    
    with open(r"C:\Users\kjs96\.gemini\antigravity\scratch\math-academy-web\src\App.jsx", "w", encoding="utf-8") as out:
        out.write(full_code)
    print("App.jsx created.")
else:
    print("Could not find App() function in old_index.html")
