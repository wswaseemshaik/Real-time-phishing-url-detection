import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.model_selection import train_test_split
import json
import re

def extract_features(url):
    # Extract common keywords and patterns from URLs
    features = []
    
    # Common phishing-related keywords
    keywords = ['login', 'signin', 'verify', 'account', 'bank', 'secure', 'update', 
                'confirm', 'password', 'security', 'alert', 'suspicious', 'unusual',
                'verify', 'validate', 'authenticate', 'payment', 'transaction']
    
    # Check for keywords in URL
    for keyword in keywords:
        if keyword in url.lower():
            features.append(keyword)
    
    # Check for IP address in URL
    if re.search(r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}', url):
        features.append('has_ip')
    
    # Check for suspicious TLDs
    suspicious_tlds = ['.xyz', '.tk', '.pw', '.info', '.biz']
    if any(tld in url.lower() for tld in suspicious_tlds):
        features.append('suspicious_tld')
    
    # Check for HTTPS
    if 'https' in url.lower():
        features.append('has_https')
    
    return ' '.join(features)

def train_model(dataset_path):
    # Read the dataset
    df = pd.read_csv(dataset_path)
    
    # Extract features from URLs
    X = df['URL'].apply(extract_features)
    y = df['Label']
    
    # Convert labels to binary (0 for legitimate, 1 for phishing)
    y = (y == 'bad').astype(int)
    
    # Split the data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Create and train the vectorizer
    vectorizer = CountVectorizer()
    X_train_vec = vectorizer.fit_transform(X_train)
    
    # Train the model
    model = MultinomialNB()
    model.fit(X_train_vec, y_train)
    
    # Save the model and vectorizer
    model_data = {
        'feature_names': vectorizer.get_feature_names_out().tolist(),
        'class_log_prior': model.class_log_prior_.tolist(),
        'feature_log_prob': model.feature_log_prob_.tolist()
    }
    
    with open('model.json', 'w') as f:
        json.dump(model_data, f)
    
    # Evaluate the model
    X_test_vec = vectorizer.transform(X_test)
    accuracy = model.score(X_test_vec, y_test)
    print(f"Model accuracy: {accuracy:.2f}")
    
    return model, vectorizer

if __name__ == "__main__":
    # Example usage
    dataset_path = "phishing_dataset.csv"  # Update this with your dataset path
    model, vectorizer = train_model(dataset_path) 