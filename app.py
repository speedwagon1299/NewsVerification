from flask import Flask, jsonify, request
import time

from flask_cors import CORS  # Import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/summarize', methods=['POST'])
def summarize():
  data = request.json
  return jsonify({
    "summary": "GN Saibaba had to suffer over 10 years of brutal incarceration as an undertrial prisoner before the Court found him innocent. The stringent provisions of the UAPA allows the State to inverse the 'bail is the rule' and 'innocent until proven guilty' principles.",
    "resolved_facts": [
        "GN Saibaba had to suffer over 10 years of brutal incarceration as an undertrial prisoner before the Court found prisoner innocent .",
        "The stringent provisions of the UAPA allows the State to inverse the ' bail is the rule ' and ' innocent until proven guilty ' principles ."
    ]
})

@app.route('/verify', methods=['POST'])
def verify():
  data = request.json
  time.sleep(10)
  return jsonify({
    "fact_verification_results": [
        {
            "fact": "The stringent provisions of the UAPA allows the State to inverse the ' bail is the rule ' and ' innocent until proven guilty ' principles .",
            "url": "https://www.aljazeera.com/news/2021/8/16/india-uapa-terror-law-scrutiny",
            "verification_result": {
                "result": "Inconclusive",
                "confidence": 0.9989196062088013,
                "nli_result": {
                    "entailment": 0.0006463637109845877,
                    "neutral": 0.9989196062088013,
                    "contradiction": 0.000433997338404879
                }
            }
        },
        {
            "fact": "The stringent provisions of the UAPA allows the State to inverse the ' bail is the rule ' and ' innocent until proven guilty ' principles .",
            "url": "https://www.thehindu.com/news/national/bail-is-rule-for-offences-even-under-special-statutes-like-uapa-supreme-court/article68519548.ece",
            "verification_result": {
                "result": "Inconclusive",
                "confidence": 0.997005045413971,
                "nli_result": {
                    "entailment": 0.0016756477998569608,
                    "neutral": 0.997005045413971,
                    "contradiction": 0.001319289207458496
                }
            }
        },
        {
            "fact": "The stringent provisions of the UAPA allows the State to inverse the ' bail is the rule ' and ' innocent until proven guilty ' principles .",
            "url": "https://indconlawphil.wordpress.com/tag/uapa/",
            "verification_result": {
                "result": "Supported",
                "confidence": 0.9902693033218384,
                "nli_result": {
                    "entailment": 0.9902693033218384,
                    "neutral": 0.005475097801536322,
                    "contradiction": 0.004255505744367838
                }
            }
        },
        {
            "fact": "The stringent provisions of the UAPA allows the State to inverse the ' bail is the rule ' and ' innocent until proven guilty ' principles .",
            "url": "https://www.scconline.com/blog/post/2023/10/20/bail-under-pmla-presumed-guilty-until-proven-guilty/",
            "verification_result": {
                "result": "Inconclusive",
                "confidence": 0.7232955694198608,
                "nli_result": {
                    "entailment": 0.26120951771736145,
                    "neutral": 0.7232955694198608,
                    "contradiction": 0.015494885854423046
                }
            }
        },
        {
            "fact": "The stringent provisions of the UAPA allows the State to inverse the ' bail is the rule ' and ' innocent until proven guilty ' principles .",
            "url": "https://indianexpress.com/article/explained/explained-law/uapa-bail-supreme-court-9154999/",
            "verification_result": {
                "result": "Supported",
                "confidence": 0.9782782793045044,
                "nli_result": {
                    "entailment": 0.9782782793045044,
                    "neutral": 0.0155832814052701,
                    "contradiction": 0.006138400640338659
                }
            }
        },
        {
            "fact": "GN Saibaba had to suffer over 10 years of brutal incarceration as an undertrial prisoner before the Court found prisoner innocent .",
            "url": "https://frontline.thehindu.com/the-nation/human-rights/former-delhi-university-professor-gn-saibaba-acquitted-10-years-in-prison-unlawful-activities-prevention-act-uapa/article67932158.ece",
            "verification_result": {
                "result": "Inconclusive",
                "confidence": 0.6482728123664856,
                "nli_result": {
                    "entailment": 0.342265248298645,
                    "neutral": 0.6482728123664856,
                    "contradiction": 0.00946197658777237
                }
            }
        },
        {
            "fact": "GN Saibaba had to suffer over 10 years of brutal incarceration as an undertrial prisoner before the Court found prisoner innocent .",
            "url": "https://m.thewire.in/article/news/g-n-saibaba-passes-away",
            "verification_result": {
                "result": "Inconclusive",
                "confidence": 0.9724549055099487,
                "nli_result": {
                    "entailment": 0.0010691663483157754,
                    "neutral": 0.9724549055099487,
                    "contradiction": 0.02647588774561882
                }
            }
        },
        {
            "fact": "GN Saibaba had to suffer over 10 years of brutal incarceration as an undertrial prisoner before the Court found prisoner innocent .",
            "url": "https://mronline.org/2024/10/14/a-stolen-life/",
            "verification_result": {
                "result": "Contradicted",
                "confidence": 0.9703652858734131,
                "nli_result": {
                    "entailment": 0.0009183812071569264,
                    "neutral": 0.02871629409492016,
                    "contradiction": 0.9703652858734131
                }
            }
        },
        {
            "fact": "GN Saibaba had to suffer over 10 years of brutal incarceration as an undertrial prisoner before the Court found prisoner innocent .",
            "url": "https://indianexpress.com/article/india/former-delhi-university-professor-g-n-saibaba-passes-away-9617330/",
            "verification_result": {
                "result": "Contradicted",
                "confidence": 0.6495263576507568,
                "nli_result": {
                    "entailment": 0.02449806220829487,
                    "neutral": 0.3259756565093994,
                    "contradiction": 0.6495263576507568
                }
            }
        },
        {
            "fact": "GN Saibaba had to suffer over 10 years of brutal incarceration as an undertrial prisoner before the Court found prisoner innocent .",
            "url": "https://www.thehindu.com/news/national/prof-saibaba-could-not-enjoy-the-freedom-he-got-after-long-incarceration/article68747014.ece",
            "verification_result": {
                "result": "Inconclusive",
                "confidence": 0.8594821691513062,
                "nli_result": {
                    "entailment": 0.12275024503469467,
                    "neutral": 0.8594821691513062,
                    "contradiction": 0.017767636105418205
                }
            }
        }
    ]
})

if __name__ == '__main__':
    app.run(port=5000) 