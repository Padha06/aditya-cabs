/* ============================================================================
   ADITYA CABS - i18n.js
   ---------------------------------------------------------------------------
   English / Marathi. No framework: the engine walks text nodes and remembers
   the original string the first time it sees one, so switching back and forth
   is lossless and re-rendered components are picked up on the next pass.

   Adding a string: put it in MR keyed by the exact English text you wrote in
   the markup or in a template. Anything without a key simply stays English,
   so a missing translation can never break the page.

   NOTE: this file contains Devanagari. Edit it with a UTF-8 aware editor.
   ========================================================================= */

const I18N_LANG_KEY = "aditya.lang";
let currentLang = "en";

const MR = {
  /* ---------- nav ---------- */
  "Routes": "मार्ग",
  "Share a Cab": "कॅब शेअर करा",
  "Fleet": "गाड्या",
  "Why Us": "आम्ही का",
  "FAQ": "प्रश्न",
  "How It Works": "कसे चालते",
  "Call 24x7": "२४x७ कॉल करा",
  "Call now": "आता कॉल करा",
  "Book on WhatsApp": "व्हॉट्सअ‍ॅपवर बुक करा",
  "One-Way Taxi, Maharashtra": "वन-वे टॅक्सी, महाराष्ट्र",

  /* ---------- hero ---------- */
  "24x7 one-way taxi network": "२४x७ वन-वे टॅक्सी नेटवर्क",
  "Maharashtra,": "महाराष्ट्र,",
  "one way": "वन-वे",
  ", one fixed price.": ", एकच ठरलेले भाडे.",
  "Door-to-door one-way cabs between Pune, Mumbai, Nashik, Chhatrapati Sambhajinagar and Ahilyanagar. No return fare, no hidden charges.":
    "पुणे, मुंबई, नाशिक, छत्रपती संभाजीनगर आणि अहिल्यानगर दरम्यान घरापासून घरापर्यंत वन-वे कॅब. परतीचे भाडे नाही, छुपे शुल्क नाही.",
  "Fixed-fare one-way cabs across Maharashtra. No return fare, no hidden charges.":
    "संपूर्ण महाराष्ट्रात ठरलेल्या भाड्याने वन-वे कॅब. परतीचे भाडे नाही, छुपे शुल्क नाही.",
  "Get your fixed fare": "तुमचे ठरलेले भाडे मिळवा",
  "Instant estimate. Confirm on WhatsApp.": "तत्काळ अंदाज. व्हॉट्सअ‍ॅपवर निश्चित करा.",
  "From": "कुठून",
  "Drop": "कुठे",
  "Travel date": "प्रवासाची तारीख",
  "Car class": "गाडीचा प्रकार",
  "Sedan": "सेडान",
  "SUV": "एसयूव्ही",
  "Fixed fare, starting": "ठरलेले भाडे, सुरुवात",
  "Call to confirm": "निश्चित करण्यासाठी कॉल करा",
  "Toll, parking and driver allowance included. Pickup from your doorstep.":
    "टोल, पार्किंग आणि ड्रायव्हर भत्ता समाविष्ट. तुमच्या दारातून पिकअप.",
  "Pick two different cities": "दोन वेगळी शहरे निवडा",
  "Pickup and drop are the same city. Choose two different cities.": "पिकअप आणि ड्रॉप एकच शहर आहे. दोन वेगळी शहरे निवडा.",
  "This pair is not a fixed-fare route yet. Send it on WhatsApp and we will quote you within minutes.":
    "या जोडीचे ठरलेले भाडे अजून नाही. व्हॉट्सअ‍ॅपवर पाठवा, काही मिनिटांत दर सांगतो.",
  "Quote": "दर",
  "Please quote": "कृपया दर सांगा",

  /* ---------- rail ---------- */
  "Every route we run, moving through.": "आमचे प्रत्येक मार्ग, सरकत आहेत.",
  "Sixteen fixed-fare one-way routes, each direction at the same price. Drag to browse, stop it whenever you like, or tap any card for the full details and a direct line to book.":
    "सोळा ठरलेल्या भाड्याचे वन-वे मार्ग, दोन्ही दिशांना समान दर. सरकवून पाहा, हवे तेव्हा थांबवा, किंवा संपूर्ण माहिती आणि थेट बुकिंगसाठी कोणतेही कार्ड टॅप करा.",
  "routes": "मार्ग",
  "cities": "शहरे",
  "dispatch": "डिस्पॅच",
  "Pause": "थांबवा",
  "Play": "सुरू करा",
  "Surprise me": "कोणताही मार्ग",
  "Drag the slider to stop and browse. Tap any card, or hit Surprise me, to open the route and book it.":
    "थांबवून पाहण्यासाठी स्लायडर सरकवा. मार्ग उघडून बुक करण्यासाठी कोणतेही कार्ड किंवा 'कोणताही मार्ग' टॅप करा.",
  "View details": "तपशील पाहा",
  "Pause route motion": "मार्गाची हालचाल थांबवा",
  "Resume route motion": "मार्गाची हालचाल सुरू करा",

  /* ---------- routes section ---------- */
  "One-way routes, both directions": "वन-वे मार्ग, दोन्ही दिशा",
  "Pick a route. See the fare. Book it.": "मार्ग निवडा. भाडे पाहा. बुक करा.",
  "Every route runs both ways at the same fixed price. Choose a city to filter, or tap a route to load it into the booking box.":
    "प्रत्येक मार्ग दोन्ही दिशांना त्याच ठरलेल्या भाड्याने चालतो. फिल्टरसाठी शहर निवडा, किंवा भाडे बॉक्समध्ये भरण्यासाठी मार्ग टॅप करा.",
  "All routes": "सर्व मार्ग",
  "From Pune": "पुण्याहून",
  "From Mumbai": "मुंबईहून",
  "From Nashik": "नाशिकहून",
  "From Sambhajinagar": "संभाजीनगरहून",
  "From Ahilyanagar": "अहिल्यानगरहून",
  "Hover a route, tap a city": "मार्गावर हॉव्हर करा, शहर टॅप करा",
  "Major hub": "प्रमुख शहर",
  "Getaway / temple town": "पर्यटन / तीर्थक्षेत्र",
  "Book this route": "हा मार्ग बुक करा",
  "both directions": "दोन्ही दिशा",
  "km one way": "किमी वन-वे",
  "to": "ते",
  "km": "किमी",

  /* ---------- pool ---------- */
  "Pool and save": "शेअर करा आणि वाचवा",
  "Same route, same day? Split the cab and halve the fare.": "त्याच मार्गावर, त्याच दिवशी? कॅब शेअर करा आणि भाडे अर्धे करा.",
  "Post your trip. If another traveller is going the same way on the same date, we pair you in one car and you each pay half. The office connects you both, so no phone number is shared until both sides agree.":
    "तुमचा प्रवास पोस्ट करा. त्याच तारखेला त्याच मार्गावर दुसरा प्रवासी असल्यास, आम्ही तुम्हाला एकाच गाडीत बसवतो आणि प्रत्येकी अर्धे भाडे भरता. कार्यालय तुमची ओळख करून देते, त्यामुळे दोघे संमती देईपर्यंत कोणताही नंबर शेअर होत नाही.",
  "Full one-way fare": "पूर्ण वन-वे भाडे",
  "Each, when two share": "दोघांनी शेअर केल्यास प्रत्येकी",
  "You save": "तुमची बचत",
  "Same car, same driver, same comfort": "तीच गाडी, तोच ड्रायव्हर, तीच सुविधा",
  "Booked and confirmed by our office": "आमच्या कार्यालयाकडून बुक व निश्चित",
  "Post your trip": "तुमचा प्रवास पोस्ट करा",
  "Free to post. No payment until we confirm a match.": "पोस्ट करणे मोफत. जुळणी निश्चित होईपर्यंत पैसे नाही.",
  "Seats you need": "किती जागा हव्या",
  "Your name": "तुमचे नाव",
  "Preferred car": "पसंतीची गाडी",
  "Cheapest split": "सर्वात स्वस्त वाटणी",
  "More room": "अधिक जागा",
  "Post my trip": "माझा प्रवास पोस्ट करा",
  "Your number stays with our office. We only share it once both travellers confirm the seat.":
    "तुमचा नंबर आमच्या कार्यालयाकडे राहतो. दोघांनी जागा निश्चित केल्यावरच तो शेअर करतो.",
  "1 seat": "१ जागा",
  "2 seats": "२ जागा",
  "3 seats": "३ जागा",
  "Open seats on the board": "उपलब्ध जागा",
  "Traveller": "प्रवासी",
  "Route": "मार्ग",
  "Date and time": "तारीख व वेळ",
  "Fare each": "प्रत्येकी भाडे",
  "Request": "विनंती करा",
  "Remove post": "पोस्ट काढा",
  "Verified": "पडताळलेले",
  "Match": "जुळणी",
  "You": "तुम्ही",
  "full": "पूर्ण",
  "on request": "विनंतीनुसार",
  "seats needed": "जागा हव्या",
  "seat needed": "जागा हवी",
  "trips posted": "प्रवास पोस्ट",
  "Posters are name and ID verified before a seat goes live. The office makes the introduction, then both travellers confirm.":
    "जागा लाइव्ह होण्यापूर्वी पोस्टरचे नाव व ओळख पडताळली जाते. कार्यालय ओळख करून देते, मग दोघे निश्चित करतात.",
  "No trips posted yet. Be the first on this route.": "अजून कोणताही प्रवास पोस्ट नाही. या मार्गावर पहिले व्हा.",
  "Add your name so co-travellers know who they are sharing with.": "सहप्रवाशांना कोणासोबत शेअर करत आहेत हे कळावे म्हणून नाव द्या.",
  "Add your travel date and pickup time.": "प्रवासाची तारीख व पिकअप वेळ द्या.",
  "Trip posted": "प्रवास पोस्ट झाला",
  "Match found": "जुळणी सापडली",
  "Confirm on WhatsApp": "व्हॉट्सअ‍ॅपवर निश्चित करा",

  /* ---------- fleet ---------- */
  "Two classes. Both spotless.": "दोन प्रकार. दोन्ही स्वच्छ.",
  "Air-conditioned, seat-belted and deep-cleaned before every pickup. Your fare is locked at the class you choose.":
    "प्रत्येक पिकअपपूर्वी एसी, सीटबेल्ट आणि खोल स्वच्छता. तुम्ही निवडलेल्या प्रकारातच भाडे ठरते.",
  "2 large bags": "२ मोठ्या बॅगा",
  "4 large bags": "४ मोठ्या बॅगा",
  "4 passengers": "४ प्रवासी",
  "6 to 7 passengers": "६ ते ७ प्रवासी",
  "Chilled AC": "थंड एसी",
  "Rear AC vents": "मागील एसी व्हेंट",
  "Need an Innova Crysta for a family of seven, or an extra stop on the way? Mention it on WhatsApp and we will quote it in one message.":
    "सात जणांच्या कुटुंबासाठी इनोव्हा क्रिस्टा हवी असेल, किंवा वाटेत थांबायचे असेल? व्हॉट्सअ‍ॅपवर सांगा, एका संदेशात दर सांगतो.",

  /* ---------- why ---------- */
  "Built for the way people actually travel.": "लोक प्रत्यक्षात जसे प्रवास करतात त्यासाठी बनवलेले.",
  "The fare you see is the fare you pay": "जे भाडे दिसते तेच भरता",
  "One-way pricing means you never pay for the return leg. Toll, parking and driver allowance are already inside the number we quote you.":
    "वन-वे दरामुळे परतीच्या प्रवासाचे पैसे कधीच लागत नाहीत. टोल, पार्किंग आणि ड्रायव्हर भत्ता आम्ही सांगितलेल्या आकड्यातच समाविष्ट आहे.",
  "Quoted": "सांगितलेले",
  "Toll and parking": "टोल व पार्किंग",
  "Included": "समाविष्ट",
  "Return fare": "परतीचे भाडे",
  "Not charged": "आकारले जात नाही",
  "Dispatch at any hour": "कोणत्याही वेळी डिस्पॅच",
  "A real person answers at 2am as fast as at 2pm. Early airport runs and late-night drops are our normal.":
    "रात्री २ वाजता फोन केला तरी दुपारी २ वाजताच्या तितक्याच वेगाने खरा माणूस उत्तर देतो. पहाटेचे विमानतळ फेरे आणि रात्रीचे ड्रॉप आमच्यासाठी सामान्य आहे.",
  "Verified cars, known drivers": "पडताळलेल्या गाड्या, ओळखीचे ड्रायव्हर",
  "Every driver is police-verified and every car is on our own list, so you are never handed to a stranger.":
    "प्रत्येक ड्रायव्हर पोलिस-पडताळलेला आहे आणि प्रत्येक गाडी आमच्या स्वतःच्या यादीत आहे, त्यामुळे तुम्ही अनोळखी माणसाकडे कधीच दिले जात नाही.",
  "Doorstep to doorstep": "दारापासून दारापर्यंत",
  "We collect from your building gate and drop at the exact address, not a bus stand on the highway. Airport, Dadar, Navi Mumbai, Thane and every town in between.":
    "आम्ही तुमच्या इमारतीच्या गेटवरून घेतो आणि नेमक्या पत्त्यावर सोडतो, महामार्गावरील बस स्टँडवर नाही. विमानतळ, दादर, नवी मुंबई, ठाणे आणि मधली प्रत्येक गाव.",
  "One-way routes": "वन-वे मार्ग",
  "Cars in the fleet": "ताफ्यातील गाड्या",
  "Trips completed": "पूर्ण झालेले प्रवास",
  "Average rating": "सरासरी रेटिंग",

  /* ---------- how ---------- */
  "Booked in three messages.": "तीन संदेशांत बुकिंग.",
  "No app to install, no account to create. You talk to us the way you already talk to people.":
    "कोणतेही अ‍ॅप इन्स्टॉल करायचे नाही, खाते बनवायचे नाही. तुम्ही आधीच लोकांशी बोलता तसेच आमच्याशी बोला.",
  "Send your route": "तुमचा मार्ग पाठवा",
  "Pick your cities above or send us a message. We reply with the exact fare for your date.":
    "वर तुमची शहरे निवडा किंवा आम्हाला संदेश पाठवा. तुमच्या तारखेचे नेमके भाडे सांगतो.",
  "We confirm your car": "आम्ही गाडी निश्चित करतो",
  "You get the car, the driver's name and the pickup time in one message. No waiting on hold.":
    "एका संदेशात गाडी, ड्रायव्हरचे नाव आणि पिकअप वेळ मिळते. होल्डवर थांबावे लागत नाही.",
  "Ride and pay at drop": "प्रवास करा आणि उतरताना पैसे द्या",
  "Pay by cash or UPI when you reach. The fare does not change on the road.":
    "पोहोचल्यावर रोख किंवा UPI ने पैसे द्या. वाटेत भाडे बदलत नाही.",

  /* ---------- reviews ---------- */
  "What riders tell us after the trip.": "प्रवासानंतर प्रवासी काय सांगतात.",
  "reviews from travellers across Maharashtra.": "महाराष्ट्रभरातील प्रवाशांचे अभिप्राय.",
  "Travelled with us? Add your review.": "आमच्यासोबत प्रवास केला? तुमचा अभिप्राय द्या.",
  "It appears at the top of the list straight away, so the next traveller can see what your trip was really like.":
    "तो लगेच यादीत सर्वात वर दिसतो, त्यामुळे पुढच्या प्रवाशाला तुमचा प्रवास कसा होता ते कळते.",
  "Route travelled": "प्रवास केलेला मार्ग",
  "Your rating": "तुमचे रेटिंग",
  "Your review": "तुमचा अभिप्राय",
  "Post my review": "माझा अभिप्राय पोस्ट करा",
  "Your review is published for everyone visiting the site.": "तुमचा अभिप्राय साइटला भेट देणाऱ्या प्रत्येकाला दिसतो.",
  "Saved on this device. Connect the review service to publish it for everyone.":
    "या डिव्हाइसवर साठवले. सर्वांसाठी प्रकाशित करण्यासाठी अभिप्राय सेवा जोडा.",
  "Thank you, your review is live.": "धन्यवाद, तुमचा अभिप्राय लाइव्ह आहे.",
  "It is showing at the top of the list above.": "तो वरील यादीत सर्वात वर दिसत आहे.",
  "Write another": "आणखी एक लिहा",
  "Remove my review": "माझा अभिप्राय काढा",
  "Add your name so the review reads as a real trip.": "अभिप्राय खरा वाटावा म्हणून तुमचे नाव द्या.",
  "Write at least a short sentence about your trip.": "तुमच्या प्रवासाबद्दल किमान एक वाक्य लिहा.",
  "Could not publish right now. Please try again in a moment.": "आत्ता पोस्ट करता आले नाही. थोड्या वेळाने पुन्हा प्रयत्न करा.",

  /* ---------- faq ---------- */
  "Questions we get before every trip.": "प्रत्येक प्रवासापूर्वी विचारले जाणारे प्रश्न.",
  "Is the price fixed, or does it change with traffic?": "दर ठरलेला असतो की वाहतुकीनुसार बदलतो?",
  "It is fixed. The number we quote for your route and car class is what you pay, regardless of traffic or how long the drive takes.":
    "तो ठरलेला असतो. तुमच्या मार्गासाठी व गाडीच्या प्रकारासाठी सांगितलेला आकडाच तुम्ही भरता, वाहतूक कितीही असो वा प्रवास किती वेळ घेऊन.",
  "What does the fare include?": "भाड्यात काय समाविष्ट आहे?",
  "Toll, parking, fuel and driver allowance are included. There is no return fare because it is a one-way booking.":
    "टोल, पार्किंग, इंधन आणि ड्रायव्हर भत्ता समाविष्ट आहे. वन-वे बुकिंग असल्याने परतीचे भाडे नाही.",
  "Can I book for a late-night or early-morning pickup?": "रात्रीच्या किंवा पहाटेच्या पिकअपसाठी बुक करू शकतो का?",
  "Yes. We run 24x7. Tell us your pickup time on WhatsApp and we will confirm the car and driver before you sleep.":
    "हो. आम्ही २४x७ चालतो. व्हॉट्सअ‍ॅपवर पिकअप वेळ सांगा, झोपण्यापूर्वीच गाडी व ड्रायव्हर निश्चित करतो.",
  "Do you serve airport and railway station pickups?": "विमानतळ व रेल्वे स्थानक पिकअप करता का?",
  "Yes. Pune and Mumbai airports, Dadar, Thane, Navi Mumbai and railway stations are all standard pickups and drops.":
    "हो. पुणे व मुंबई विमानतळ, दादर, ठाणे, नवी मुंबई आणि रेल्वे स्थानके हे सर्व सामान्य पिकअप व ड्रॉप आहेत.",
  "How do I pay?": "पैसे कसे द्यायचे?",
  "Cash or UPI at the end of the trip. If you need a GST invoice for a company trip, ask us on WhatsApp and we will arrange it.":
    "प्रवासाच्या शेवटी रोख किंवा UPI. कंपनीच्या प्रवासासाठी GST बिल हवे असल्यास व्हॉट्सअ‍ॅपवर सांगा, व्यवस्था करतो.",

  /* ---------- cta band ---------- */
  "Your cab is one message away.": "तुमची कॅब एका संदेशावर आहे.",
  "Tell us the route and the date. We will send the fare and the driver's details right back.":
    "मार्ग आणि तारीख सांगा. भाडे व ड्रायव्हरची माहिती लगेच पाठवतो.",

  /* ---------- footer ---------- */
  "Popular one-way routes": "लोकप्रिय वन-वे मार्ग",
  "More routes": "अधिक मार्ग",
  "Company": "कंपनी",
  "Our fleet": "आमच्या गाड्या",
  "Why choose us": "आम्ही का निवडावे",
  "How it works": "कसे चालते",
  "Get a fare": "भाडे मिळवा",
  "Fixed-fare one-way cabs across Maharashtra, running 24x7 from Pune, Mumbai, Nashik, Chhatrapati Sambhajinagar and Ahilyanagar.":
    "महाराष्ट्रभर ठरलेल्या भाड्याने वन-वे कॅब, पुणे, मुंबई, नाशिक, छत्रपती संभाजीनगर आणि अहिल्यानगर येथून २४x७.",
  "WhatsApp booking": "व्हॉट्सअ‍ॅप बुकिंग",
  "One-way taxi service, Maharashtra.": "वन-वे टॅक्सी सेवा, महाराष्ट्र.",
  "Sedan and SUV · Airport transfers · Outstation · 24x7 dispatch": "सेडान आणि एसयूव्ही · विमानतळ ट्रान्सफर · आउटस्टेशन · २४x७ डिस्पॅच",

  /* ---------- route modal ---------- */
  "One way · fixed fare": "वन-वे · ठरलेले भाडे",
  "Pick a car class to load the fare": "भाडे भरण्यासाठी गाडीचा प्रकार निवडा",
  "Toll, parking and driver allowance included": "टोल, पार्किंग आणि ड्रायव्हर भत्ता समाविष्ट",
  "Doorstep pickup and drop, not a highway bus stand": "दारातून पिकअप व ड्रॉप, महामार्गावरील बस स्टँड नाही",
  "Verified driver, name shared before you travel": "पडताळलेला ड्रायव्हर, प्रवासापूर्वी नाव सांगितले जाते",
  "No return fare, because the trip is one way": "प्रवास वन-वे असल्याने परतीचे भाडे नाही",
  "Close route details": "मार्ग तपशील बंद करा",
  "cab": "कॅब",
  "Or split it:": "किंवा शेअर करा:",
  "each when two travellers share this route": "दोघांनी हा मार्ग शेअर केल्यास प्रत्येकी",

  /* ---------- city names (also used inside generated cards) ---------- */
  "Pune": "पुणे",
  "Mumbai": "मुंबई",
  "Nashik": "नाशिक",
  "Sambhajinagar": "छत्रपती संभाजीनगर",
  "Ahilyanagar": "अहिल्यानगर",
  "Shirdi": "शिर्डी",
  "Mahabaleshwar": "महाबळेश्वर",
  "Kolhapur": "कोल्हापूर",
  "Lonavala": "लोणावळा",
  "Chhatrapati Sambhajinagar": "छत्रपती संभाजीनगर",
  "Ahilyanagar (Ahmednagar)": "अहिल्यानगर (अहमदनगर)",
  "Aditya network": "आदित्य नेटवर्क",
  "Popular routes": "लोकप्रिय मार्ग",
  "Browse the routes": "मार्ग पाहा",
  "Pickup time": "पिकअप वेळ",
  "5 stars": "५ स्टार",
  "4 stars": "४ स्टार",
  "3 stars": "३ स्टार",
  "2 stars": "२ स्टार",
  "1 star": "१ स्टार",
  "Skip to booking": "बुकिंगवर जा",
  "Aditya Cabs. One-way taxi service, Maharashtra.": "Aditya Cabs. वन-वे टॅक्सी सेवा, महाराष्ट्र.",

  /* ---------- placeholders ---------- */
  "First and last name": "नाव व आडनाव",
  "How was the car, the driver and the fare?": "गाडी, ड्रायव्हर आणि भाडे कसे होते?"
};

/* Marathi place names, looked up by city id for generated content */
const MR_CITY = {
  pune: "पुणे", mumbai: "मुंबई", nashik: "नाशिक",
  sambhajinagar: "छत्रपती संभाजीनगर", ahilyanagar: "अहिल्यानगर",
  shirdi: "शिर्डी", mahabaleshwar: "महाबळेश्वर", kolhapur: "कोल्हापूर", lonavala: "लोणावळा"
};

/* ---------------------------------------------------------------------------
   engine
--------------------------------------------------------------------------- */
const _i18nText = new WeakMap();
const _i18nAttr = new WeakMap();
const I18N_ATTRS = ["placeholder", "aria-label", "title", "alt"];

function i18nT(key) {
  if (currentLang === "en") return key;
  return Object.prototype.hasOwnProperty.call(MR, key) ? MR[key] : key;
}

function i18nCity(id) {
  return (currentLang === "mr" && MR_CITY[id]) ? MR_CITY[id] : CITIES[id].short;
}

function i18nLocale() {
  return currentLang === "mr" ? "mr-IN" : "en-IN";
}

function applyI18n(root) {
  const scope = root || document.body;
  const dict = currentLang === "en" ? null : MR;

  const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, null);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  for (const node of nodes) {
    let orig = _i18nText.get(node);
    if (orig === undefined) { orig = node.nodeValue; _i18nText.set(node, orig); }
    const key = orig.trim();
    if (!key) continue;
    node.nodeValue = (dict && dict[key] != null) ? orig.replace(key, dict[key]) : orig;
  }

  for (const attr of I18N_ATTRS) {
    const els = scope.querySelectorAll ? scope.querySelectorAll("[" + attr + "]") : [];
    for (const el of els) {
      let store = _i18nAttr.get(el);
      if (!store) { store = {}; _i18nAttr.set(el, store); }
      if (store[attr] === undefined) store[attr] = el.getAttribute(attr);
      const orig = store[attr];
      if (orig == null) continue;
      el.setAttribute(attr, (dict && dict[orig] != null) ? dict[orig] : orig);
    }
  }
}

function syncLangButtons() {
  document.querySelectorAll("[data-lang]").forEach(btn => {
    const on = btn.getAttribute("data-lang") === currentLang;
    btn.classList.toggle("is-on", on);
    btn.setAttribute("aria-pressed", String(on));
  });
}

function setLang(lang) {
  currentLang = (lang === "mr") ? "mr" : "en";
  try { localStorage.setItem(I18N_LANG_KEY, currentLang); } catch (e) { /* private mode */ }
  document.documentElement.lang = currentLang;
  document.documentElement.setAttribute("data-lang", currentLang);
  syncLangButtons();
  applyI18n(document.body);
  // generated components repaint themselves in the new language
  document.dispatchEvent(new CustomEvent("langchange", { detail: currentLang }));
}

function initLang() {
  let saved = "en";
  try { saved = localStorage.getItem(I18N_LANG_KEY) || "en"; } catch (e) { /* private mode */ }
  currentLang = saved === "mr" ? "mr" : "en";
  document.documentElement.lang = currentLang;
  document.documentElement.setAttribute("data-lang", currentLang);
  syncLangButtons();
  document.querySelectorAll("[data-lang]").forEach(btn => {
    btn.addEventListener("click", () => setLang(btn.getAttribute("data-lang")));
  });
}
