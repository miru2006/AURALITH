from flask import Flask, request, jsonify,send_from_directory
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# ============================
# Complete Multilingual Question-Answer Data
# ============================

qa_data = {
    "English": {
        "hi" :"hello,how may i help you ",
        "where is kpr college": "KPR Institute of Engineering and Technology is located in Peelamedu, Coimbatore, along Avinashi Road.",
        "are there tourist attractions near kpr college": "Yes: VOC Park & Zoo (8 km), Lakshmi Mills Temple (2 km), Codissia Trade Fair Complex (4 km), Race Course Road cafes and shops (6 km).",
        "are there temples near kpr college": "Yes: Sri Lakshmi Narayana Temple (~2 km), Kottaimedu Murugan Temple (~5 km), Perur Pateeswarar Temple (~10 km).",
        "are there hotels near kpr college": "Yes: Hotel Saravana Bhavan Stay (+91 98765 43210), Peelamedu Guesthouse (+91 87654 32109), Coimbatore Inn (+91 94444 55666).",
        "are there restaurants near kpr college": "Yes: Sree Annapoorna, Shree Bhojan, Hotel Saravana Bhavan; all 2–3 km away.",
        "is the kpr college area safe": "Yes, Peelamedu is generally safe. Avoid isolated streets late at night.",
        "are there atms and banks near kpr college": "Yes, SBI, ICICI, HDFC banks are within 1–2 km.",
        "are taxis and auto-rickshaws available near kpr college": "Yes, Ola, Uber, and local autos are available 24/7.",
        "are there cafes near kpr college": "Yes, Café Coffee Day, Starbucks, and local cafes on Avinashi Road.",
        "can i rent bikes or scooters near kpr college": "Yes, local rental shops provide bikes/scooters for ₹300–₹500/day.",
        "what are must visit places in coimbatore": "Marudamalai Temple, VOC Park & Zoo, Brookefields Mall, Siruvani Waterfalls, Perur Pateeswarar Temple.",
        "what are the best hill stations near coimbatore": "Ooty (85 km), Coonoor (70 km), Valparai (110 km).",
        "are there waterfalls near coimbatore": "Siruvani Waterfalls & Dam (35 km), Monkey Falls (90 km).",
        "can i do trekking around coimbatore": "Yes, popular trekking spots include Velliangiri Hills, Siruvani Hills, and Nilgiri Hills.",
        "are there eco-tourism or wildlife spots": "Yes: Anamalai Tiger Reserve (~100 km), Singanallur Lake for bird watching, Siruvani forests.",
        "are there museums in coimbatore": "Gass Forest Museum, Kovai Museum of Art.",
        "what are good shopping areas in coimbatore": "Brookefields Mall, RS Puram Market, Town Hall area.",
        "are there cultural events in coimbatore": "Codissia Trade Fair Complex hosts exhibitions, craft fairs, and cultural events.",
        "where can i experience local tamil culture": "Visit Perur Pateeswarar Temple, Marudamalai Temple, and local festivals like Pongal and Karthigai Deepam.",
        "are there lakes for relaxation": "Singanallur Lake, Valankulam Lake, and canals around Peelamedu are popular for evening walks.",
        "how do i reach kpr college from coimbatore airport": "Taxi/Uber ~20–25 mins (~₹300–₹350), or Bus No. 15A (every 30 mins, 6 AM–9 PM).",
        "are there buses from kpr college to marudamalai temple": "Bus No. 3B, 6 AM–7 PM, every 30 mins, journey ~40–50 mins.",
        "are there buses to siruvani waterfalls": "Bus No. 19, 7 AM–5:30 PM, every 1 hour; cabs recommended for convenience.",
        "are night transport options available": "No official night buses; taxis and app-based cabs are available 24/7.",
        "is there train connectivity from coimbatore": "Yes, Coimbatore Junction connects to Chennai, Bangalore, Trichy, and Ooty via Nilgiri Mountain Railway.",
        "can i rent bicycles or scooters": "Yes, Peelamedu and Avinashi Road have rental shops.",
        "are there auto-rickshaw stands near kpr college": "Yes, multiple auto stands on Avinashi Road and nearby streets.",
        "is uber/ola reliable in coimbatore": "Yes, available almost anywhere in the city and airport.",
        "are buses safe for tourists": "Yes, day-time buses are safe; prefer cab/auto at night.",
        "can i hire private transport for day trips": "Yes, local taxi operators and tourist guides can arrange day trips.",
        "are there vegetarian restaurants near kpr college": "Sree Annapoorna, Shree Bhojan, Hotel Saravana Bhavan.",
        "are there non-vegetarian restaurants near kpr college": "Anandha Bhavan, Kovai Curry House, and local South Indian restaurants serve non-veg meals.",
        "are there vegan options near kpr college": "Most South Indian dishes (idli, dosa, sundal) can be made vegan; request no ghee.",
        "where can i try local street food": "RS Puram Market, Town Hall, and Race Course Road street vendors.",
        "are there cafes near kpr college": "Café Coffee Day, Starbucks, and local tea stalls.",
        "are there places for international cuisine": "Brookefields Mall and nearby areas offer Chinese, Italian, and fast food.",
        "is filter coffee widely available": "Yes, traditional filter coffee is available at almost all South Indian eateries.",
        "are there dessert shops near kpr college": "Adyar Ananda Bhavan and local sweet shops.",
        "can i get food delivery near kpr college": "Yes, Swiggy, Zomato, and Dunzo deliver widely.",
        "are there halal or kosher food options": "Some restaurants in Peelamedu and RS Puram offer halal food; kosher options are limited.",
        "is kpr college area safe for solo women travelers": "Yes, during the day; avoid isolated streets at night.",
        "what are the emergency numbers": "Police: 100, Ambulance: 108, Fire: 101, Tourist Helpline: 1800-425-5555",
        "are there hospitals near kpr college": "K.G. Hospital (+91 422 1234567), GKNM Hospital (+91 422 7654321)",
        "are there pharmacies near kpr college": "Yes, multiple pharmacies are on Avinashi Road and surrounding streets.",
        "are there tourist police or help desks": "Yes, Gandhipuram and major tourist spots have assistance counters.",
        "is drinking water safe for tourists": "Bottled water is recommended; avoid tap water if sensitive.",
        "are there dangerous areas to avoid": "Avoid industrial areas and isolated roads at night.",
        "is it safe to travel by bus": "Yes, daytime buses are safe; evening trips are better by cab.",
        "are fire extinguishers available in hotels": "Yes, standard safety regulations are followed in most hotels.",
        "are there vaccination requirements": "No mandatory vaccines; routine vaccinations recommended.",
        "restricted tourist places near kpr college": "Avoid isolated forested regions, industrial zones at night. Check local advisories before visiting lesser-known spots.",
        "safe tourist places near kpr college": "Marudamalai Hill Temple, Adiyogi Shiva Statue, Dhyanalinga Temple, VOC Park & Zoo, Perur Pateeswarar Temple, Siruvani Waterfalls.",
        "which festivals are celebrated in coimbatore": "Pongal (January), Karthigai Deepam (November), Vinayagar Chaturthi (August/September).",
        "are there cultural events or exhibitions for tourists": "Codissia Trade Fair Complex hosts exhibitions, craft shows, and cultural performances.",
        "can i hire a local guide": "Yes, Mr. Aravind Kumar (+91 98765 12345) and Ms. Priya Natarajan (+91 87654 67890) offer temple tours, hill trips, and cultural visits.",
        "where can tourists buy local handicrafts": "Brookefields Mall, RS Puram Market, local street shops.",
        "can i do day trips from coimbatore": "Yes, Ooty, Coonoor, Valparai, Siruvani & Marudamalai are popular day trips.",
        "what's a recommended one-day itinerary": "Morning: Marudamalai → Perur Pateeswarar; Noon: Lunch at Sree Annapoorna; Afternoon: VOC Park → Isha Yoga Center; Evening: Singanallur Lake → Local markets."
    },

    "Tamil": {
        "hi":"வணக்கம்! 😄",
        "where is kpr college": "கேபிஆர் இன்ஸ்டிடியூட் ஆஃப் எஞ்சினீயரிங் அண்ட் டெக்னாலஜி பீலமீடு, கோயம்புத்தூரில், அவினாசி ரோட்டின் அருகே உள்ளது.",
        "are there tourist attractions near kpr college": "ஆம்: வி.ஓ.சி. பார்க் & பூங்கா (8 கி.மீ.), லட்சுமி மில்ஸ் கோவில் (2 கி.மீ.), கோடிஸ்சியா டிரேட் ஃபேர் காம்ப்ளெக்ஸ் (4 கி.மீ.), ரேஸ் கோர்ஸ் ரோடு கஃபேஸ் மற்றும் கடைகள் (6 கி.மீ.).",
        "are there temples near kpr college": "ஆம்: ஸ்ரீ லட்சுமி நாராயணா கோவில் (~2 கி.மீ.), கோட்டைமேடு முருகன் கோவில் (~5 கி.மீ.), பெரூர் பட்டீஸ்வரர் கோவில் (~10 கி.மீ.).",
        "are there hotels near kpr college": "ஆம்: ஹோட்டல் சரவணா பவான் ஸ்டே (+91 98765 43210), பீலமீடு கெஸ்ட்ஹவுஸ் (+91 87654 32109), கோயம்புத்தூர் இன் (+91 94444 55666).",
        "are there restaurants near kpr college": "ஆம்: ஸ்ரீ அன்னபூர்ணா, ஸ்ரீ போஜன், ஹோட்டல் சரவணா பவான்; அனைத்தும் 2–3 கி.மீ. தொலைவில்.",
        "is the kpr college area safe": "ஆம், பீலமீடு பொதுவாக பாதுகாப்பாக உள்ளது. இரவில் தனியாக சாலைகள் தவிர்க்கவும்.",
        "are there atms and banks near kpr college": "ஆம், SBI, ICICI, HDFC வங்கிகள் 1–2 கி.மீ. தொலைவில் உள்ளன.",
        "are taxis and auto-rickshaws available near kpr college": "ஆம், ஓலா, உபர் மற்றும் உள்ளூர் ஆட்டோக்கள் 24/7 கிடைக்கின்றன.",
        "are there cafes near kpr college": "ஆம், Café Coffee Day, Starbucks மற்றும் உள்ளூர் கஃபேஸ் அவினாசி ரோட்டில் உள்ளன.",
        "can i rent bikes or scooters near kpr college": "ஆம், உள்ளூர் வாடகை கடைகள் ₹300–₹500/நாள் வாடகைக்கு பைக்குகள்/ஸ்கூட்டர்கள் வழங்குகின்றன.",
        # Translate all remaining questions exactly as per English version
        "friendly_upgrade": "மன்னிக்கவும்! பதிலை பார்க்க Pro பதிப்பைப் பெறுங்கள் 😎"
    },

    "Hindi": {
        "hi":"नमस्ते! 😄",
        "where is kpr college": "KPR इंस्टिट्यूट ऑफ़ इंजीनियरिंग और टेक्नोलॉजी, पीलेमेडु, कोयम्बटूर, अविनाशी रोड के पास स्थित है।",
        "are there tourist attractions near kpr college": "हाँ: VOC पार्क & चिड़ियाघर (8 किमी), लक्ष्मी मिल्स मंदिर (2 किमी), कोडिसिया ट्रेड फेयर कॉम्प्लेक्स (4 किमी), रेस कोर्स रोड कैफ़े और दुकानें (6 किमी)।",
        "are there temples near kpr college": "हाँ: श्री लक्ष्मी नारायण मंदिर (~2 किमी), कोट्टाइमेडु मुरुगन मंदिर (~5 किमी), पेरूर पटीस्वर मंदिर (~10 किमी)।",
        "are there hotels near kpr college": "हाँ: होटल सरवाना भवन स्टे (+91 98765 43210), पीलेमेडु गेस्टहाउस (+91 87654 32109), कोयम्बटूर इन (+91 94444 55666)।",
        "are there restaurants near kpr college": "हाँ: श्री अन्नपूर्णा, श्री भोज़न, होटल सरवाना भवन; सभी 2–3 किमी दूर।",
        "is the kpr college area safe": "हाँ, पीलेमेडु सामान्यतः सुरक्षित है। रात में अकेले सड़क से बचें।",
        "are there atms and banks near kpr college": "हाँ, SBI, ICICI, HDFC बैंक 1–2 किमी के भीतर हैं।",
        "are taxis and auto-rickshaws available near kpr college": "हाँ, Ola, Uber और स्थानीय ऑटो 24/7 उपलब्ध हैं।",
        "are there cafes near kpr college": "हाँ, Café Coffee Day, Starbucks और स्थानीय कैफे अविनाशी रोड पर हैं।",
        "can i rent bikes or scooters near kpr college": "हाँ, स्थानीय रेंटल शॉप्स ₹300–₹500/दिन पर बाइक/स्कूटर उपलब्ध कराते हैं।",
        # Translate all remaining questions exactly as per English version
        "friendly_upgrade": "माफ़ करें! उत्तर देखने के लिए Pro प्राप्त करें 😎"
    }
}

# ============================
# Chatbot API
# ============================
@app.route("/")
def home():
    return send_from_directory(os.getcwd(), "index.html")

# ============================
# Chatbot API
# ============================
@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    message = data.get("message", "").strip().lower()
    language = data.get("language", "English")

    if language not in qa_data:
        language = "English"

    answer = None
    for q in qa_data[language]:
        if q in message:
            answer = qa_data[language][q]
            break

    if not answer:
        answer = qa_data[language].get("friendly_upgrade", "Sry! Get Pro to unlock this answer 😎")

    return jsonify({"reply": answer})

# ============================
# Run Flask
# ============================
if __name__ == "__main__":
    app.run(debug=True)