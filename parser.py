import requests
from readability import Document
from bs4 import BeautifulSoup

url = 'https://www.news18.com/elections/congress-could-have-won-inside-details-of-what-rahul-gandhi-said-at-haryana-poll-debacle-review-meet-9082312.html'
response = requests.get(url)

# Parse the article content using Readability
doc = Document(response.text)
article_html = doc.summary()  # Extract HTML of the main article content

# Use BeautifulSoup to clean up the HTML and extract plain text
soup = BeautifulSoup(article_html, 'html.parser')
article_text = soup.get_text()

print(article_text)

