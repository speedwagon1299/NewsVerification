import requests
from readability import Document
from bs4 import BeautifulSoup

url = 'https://economictimes.indiatimes.com/news/defence/israels-secret-weapon-against-iran-can-be-a-deadly-option/articleshow/113915122.cms'
response = requests.get(url)

# Parse the article content using Readability
doc = Document(response.text)
article_html = doc.summary()  # Extract HTML of the main article content

# Use BeautifulSoup to clean up the HTML and extract plain text
soup = BeautifulSoup(article_html, 'html.parser')
article_text = soup.get_text()

print(article_text)

