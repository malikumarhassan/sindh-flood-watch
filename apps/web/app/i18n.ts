import type { Language } from "@sfw/shared";

// Interface copy only. Published bulletins are never silently translated.
const rows = `
For the people of Sindh|سندھ کے لوگوں کے لیے|سنڌ جي ماڻهن لاءِ
Independent information service|آزاد معلوماتی خدمت|آزاد معلوماتي خدمت
Administrator login ↗|منتظم لاگ ان ↗|منتظم لاگ ان ↗
Sindh emblem|سندھ کا نشان|سنڌ جو نشان
Sindh Flood Watch|سندھ فلڈ واچ|سنڌ فلڊ واچ
INDEPENDENT FLOOD INFORMATION|سیلاب سے متعلق آزاد معلومات|ٻوڏ بابت آزاد ڄاڻ
YOUR INFORMATION HUB|آپ کا معلوماتی مرکز|توهان جو معلوماتي مرڪز
Independent. Source-led.|آزاد، مستند ذرائع پر مبنی۔|آزاد، ذريعن تي ٻڌل.
Public information, with provenance you can check.|عوامی معلومات، جن کا ماخذ آپ جانچ سکتے ہیں۔|عوامي ڄاڻ، جنهن جو ذريعو توهان جاچي سگهو ٿا.
⚙ Administrator workspace|⚙ منتظم کا شعبہ|⚙ منتظم جو شعبو
Made for the people of Sindh|سندھ کے لوگوں کے لیے بنایا گیا|سنڌ جي ماڻهن لاءِ ٺاهيل
Overview|جائزہ|جائزو
◇ No government endorsement|◇ سرکاری توثیق حاصل نہیں|◇ سرڪاري توثيق حاصل ناهي
Interface language|ویب سائٹ کی زبان|ويب سائيٽ جي ٻولي
DEMO — NOT A REAL WARNING|ڈیمو — یہ حقیقی انتباہ نہیں|ڊيمو — هي حقيقي چتاءُ ناهي
LIVE INFORMATION MODE|اصل معلومات کا موڈ|اصل ڄاڻ جو موڊ
Fictional advisories for testing. No real flood conditions are represented.|آزمائش کے لیے فرضی اطلاعات۔ یہ حقیقی سیلابی حالات کی نمائندگی نہیں کرتیں۔|آزمائش لاءِ فرضي اطلاع. اهي حقيقي ٻوڏ جي حالتن جي نمائندگي نٿا ڪن.
No verified feed is connected. Missing advisories do not mean safe conditions.|کوئی تصدیق شدہ فیڈ منسلک نہیں۔ اطلاع نہ ہونا محفوظ حالات کی علامت نہیں۔|ڪا تصديق ٿيل فيڊ ڳنڍيل ناهي. اطلاع نه هجڻ جو مطلب محفوظ حالتون ناهي.
View live mode|اصل معلومات دیکھیں|اصل ڄاڻ ڏسو
Return to demo|ڈیمو پر واپس جائیں|ڊيمو ڏانهن واپس وڃو
Interface translation draft. Emergency guidance remains in reviewed English. Human review is required before translated guidance can be published.|ویب سائٹ کے اردو اور سندھی تراجم ابتدائی ہیں۔ اصل بلیٹن اپنی اشاعتی زبان میں دکھائے جاتے ہیں۔|ويب سائيٽ جا اردو ۽ سنڌي ترجما ابتدائي آهن. اصل بليٽن پنهنجي اشاعتي ٻوليءَ ۾ ڏيکاريا وڃن ٿا.
Offline / connection unavailable. Cached information saved|آف لائن / رابطہ دستیاب نہیں۔ محفوظ نقل کی تاریخ|آف لائن / رابطو موجود ناهي. محفوظ نقل جي تاريخ
. This is not a fresh warning.|۔ یہ تازہ انتباہ نہیں ہے۔|. هي تازو چتاءُ ناهي.
Connection unavailable:|رابطہ دستیاب نہیں:|رابطو موجود ناهي:
. Missing data does not establish safety.|۔ معلومات کی عدم دستیابی حفاظت کی تصدیق نہیں۔|. ڄاڻ جي کوٽ حفاظت جي تصديق ناهي.
Retry|دوبارہ کوشش کریں|ٻيهر ڪوشش ڪريو
INFORMATION THAT HELPS YOU PREPARE|تیاری میں مددگار معلومات|تياريءَ ۾ مددگار ڄاڻ
Advisory details|اطلاع کی تفصیلات|اطلاع جا تفصيل
Stay informed. Stay prepared.|باخبر رہیں۔ تیار رہیں۔|باخبر رهو. تيار رهو.
Ask Flood Watch|فلڈ واچ سے پوچھیں|فلڊ واچ کان پڇو
Your alerts, your choices|آپ کی اطلاعات، آپ کا انتخاب|توهان جا اطلاع، توهان جي چونڊ
Prepare with confidence|اعتماد کے ساتھ تیاری کریں|اعتماد سان تياري ڪريو
District advisories|ضلعی اطلاعات|ضلعي اطلاع
Flood information for your district, with sources in view.|آپ کے ضلع کی سیلابی معلومات، ماخذ کے ساتھ۔|توهان جي ضلعي بابت ٻوڏ جي ڄاڻ، ذريعن سان گڏ.
Answers grounded in published information. No predictions or safety decisions.|جوابات شائع شدہ معلومات پر مبنی ہیں۔ پیش گوئی یا حفاظت کا فیصلہ نہیں کیا جاتا۔|جواب شايع ٿيل ڄاڻ تي ٻڌل آهن. اڳڪٿي يا حفاظت جو فيصلو نٿو ڪيو وڃي.
Choose districts manually. Precise location is never required.|اپنے اضلاع منتخب کریں۔ درست مقام دینا ضروری نہیں۔|پنهنجا ضلعا چونڊيو. صحيح هنڌ ڏيڻ ضروري ناهي.
Practical information to keep within reach.|کارآمد معلومات اپنے پاس رکھیں۔|ڪم جي ڄاڻ پاڻ وٽ رکو.
Read the original wording, source and validity of each bulletin.|ہر بلیٹن کا اصل متن، ماخذ اور مدت پڑھیں۔|هر بليٽن جو اصل متن، ذريعو ۽ مدو پڙهو.
↻ Refresh information|↻ معلومات تازہ کریں|↻ ڄاڻ تازو ڪريو
YOUR DISTRICT|آپ کا ضلع|توهان جو ضلعو
All times shown in Pakistan Standard Time (PKT)|تمام اوقات پاکستانی معیاری وقت کے مطابق ہیں|سڀ وقت پاڪستان جي معياري وقت موجب آهن
♧ Manage alerts →|♧ اطلاعات کی ترتیبات →|♧ اطلاعن جون سيٽنگون →
fictional samples|فرضی نمونے|فرضي نمونا
published records|شائع شدہ ریکارڈ|شايع ٿيل رڪارڊ
Official source status|سرکاری ذرائع کی حالت|سرڪاري ذريعن جي حالت
Unavailable|دستیاب نہیں|موجود ناهي
Automated integration pending|خودکار رابطہ ابھی باقی ہے|خودڪار ڳانڍاپو اڃا رهيل آهي
Your information|آپ کی معلومات|توهان جي ڄاڻ
Cached copy|محفوظ نقل|محفوظ نقل
Source transparent|ماخذ واضح ہے|ذريعو واضح آهي
Retrieved|حاصل کردہ|حاصل ڪيل
No retrieval yet|ابھی معلومات حاصل نہیں ہوئیں|اڃا ڄاڻ حاصل ناهي ٿي
Latest district advisories|تازہ ضلعی اطلاعات|تازا ضلعي اطلاع
Browse advisories|اطلاعات دیکھیں|اطلاع ڏسو
Demo collection|ڈیمو مجموعہ|ڊيمو مجموعو
Official records|اصل ریکارڈ|اصل رڪارڊ
records|ریکارڈ|رڪارڊ
Search advisories|اطلاعات تلاش کریں|اطلاع ڳوليو
Search advisories…|اطلاعات تلاش کریں…|اطلاع ڳوليو…
Flood type|سیلاب کی قسم|ٻوڏ جو قسم
All flood types|سیلاب کی تمام اقسام|ٻوڏ جا سڀ قسم
River flooding|دریائی سیلاب|درياهي ٻوڏ
Flash flooding|اچانک سیلاب|اوچتي ٻوڏ
Urban flooding|شہری سیلاب|شهري ٻوڏ
Official severity|سرکاری شدت|سرڪاري شدت
Exact official severity|سرکاری شدت کا اصل متن|سرڪاري شدت جو اصل متن
Issued since|اس تاریخ کے بعد جاری|هن تاريخ کان پوءِ جاري
No advisory found|کوئی اطلاع نہیں ملی|ڪو اطلاع نه مليو
We have no matching published information. This does not mean there is no flood risk. Check official channels.|متعلقہ شائع شدہ معلومات موجود نہیں۔ اس کا مطلب سیلاب کے خطرے کا نہ ہونا نہیں۔ سرکاری ذرائع دیکھیں۔|لاڳاپيل شايع ٿيل ڄاڻ موجود ناهي. ان جو مطلب ٻوڏ جو خطرو نه هجڻ ناهي. سرڪاري ذريعا ڏسو.
flooding|سیلاب|ٻوڏ
Valid until|مدت ختم ہونے کا وقت|مدو ختم ٿيڻ جو وقت
Cached · verify validity|محفوظ نقل · مدت کی تصدیق کریں|محفوظ نقل · مدي جي تصديق ڪريو
Within stated validity|درج مدت کے اندر|ڏنل مدي اندر
Outdated / not currently valid|پرانی / موجودہ مدت ختم|پراڻي / موجوده مدو ختم
◷ Validity is taken from the bulletin. No district-level safety inference.|◷ مدت بلیٹن کے مطابق ہے۔ ضلع کی حفاظت کا اندازہ نہیں لگایا جاتا۔|◷ مدو بليٽن موجب آهي. ضلعي جي حفاظت جو اندازو نٿو لڳايو وڃي.
A LITTLE CLARITY HELPS|واضح معلومات مددگار ہیں|واضح ڄاڻ مددگار آهي
Questions about|کیا آپ کے سوالات ہیں|ڇا توهان جا سوال آهن
flood information?|سیلابی معلومات کے بارے میں؟|ٻوڏ جي ڄاڻ بابت؟
Find information from published advisories and preparedness guidance, with citations.|ماخذ کے ساتھ شائع شدہ اطلاعات اور تیاری کی رہنمائی دیکھیں۔|ذريعن سان گڏ شايع ٿيل اطلاع ۽ تياريءَ جي رهنمائي ڏسو.
Structured retrieval · No LLM required|محفوظ معلومات سے جواب|محفوظ ڄاڻ مان جواب
Source transparency|ذرائع کی وضاحت|ذريعن جي وضاحت
Unavailable / stale|دستیاب نہیں / پرانا|موجود ناهي / پراڻو
Recently checked|حال ہی میں جانچا گیا|تازو جاچيل
Last successful check:|آخری کامیاب جانچ:|آخري ڪامياب جاچ:
Visit official source ↗|سرکاری ماخذ دیکھیں ↗|سرڪاري ذريعو ڏسو ↗
← Back to advisories|← اطلاعات پر واپس|← اطلاعن ڏانهن واپس
Issuing authority|جاری کرنے والا ادارہ|جاري ڪندڙ ادارو
Districts|اضلاع|ضلعا
Original severity|اصل شدت|اصل شدت
Official issue time|اصل وقتِ اجرا|اصل جاري ٿيڻ جو وقت
Ingested|ریکارڈ میں شامل|رڪارڊ ۾ شامل
Status|حالت|حالت
Cached; verify with source|محفوظ نقل؛ ماخذ سے تصدیق کریں|محفوظ نقل؛ ذريعي کان تصديق ڪريو
Open original source reference ↗|اصل ماخذ کھولیں ↗|اصل ذريعو کوليو ↗
Reference points to an official website for context; this fictional bulletin was not issued by that authority.|اصل ماخذ سیاق کے لیے ہے۔ ڈیمو کی اشاعتی مدت سرکاری توثیق نہیں ہے۔|اصل ذريعو حوالي لاءِ آهي. ڊيمو جو اشاعتي مدو سرڪاري توثيق ناهي.
What would you like to know?|آپ کیا جاننا چاہتے ہیں؟|توهان ڇا ڄاڻڻ چاهيو ٿا؟
Selected district:|منتخب ضلع:|چونڊيل ضلعو:
. Answers cite stored evidence and its date.|۔ جوابات میں محفوظ ماخذ اور اس کی تاریخ شامل ہیں۔|. جوابن ۾ محفوظ ذريعو ۽ ان جي تاريخ شامل آهي.
What is the latest advisory for|تازہ اطلاع بتائیں، ضلع|تازو اطلاع ٻڌايو، ضلعو
How should I prepare?|میں تیاری کیسے کروں؟|مان تياري ڪيئن ڪريان؟
Is my village safe?|کیا میرا گاؤں محفوظ ہے؟|ڇا منهنجو ڳوٺ محفوظ آهي؟
Your question|آپ کا سوال|توهان جو سوال
Ask about advisories or preparedness…|اطلاعات یا تیاری کے بارے میں پوچھیں…|اطلاعن يا تياري بابت پڇو…
Retrieving…|معلومات حاصل ہو رہی ہیں…|ڄاڻ حاصل ٿي رهي آهي…
Ask →|پوچھیں →|پڇو →
structured retrieval|محفوظ معلومات سے جواب|محفوظ ڄاڻ مان جواب
AI must not generate flood predictions or evacuation decisions. District information cannot establish village-level safety.|یہ معاون سیلاب کی پیش گوئی یا انخلا کے فیصلے نہیں کرتا۔ ضلعی معلومات گاؤں کی حفاظت کی تصدیق نہیں کرتیں۔|هي مددگار ٻوڏ جي اڳڪٿي يا لڏپلاڻ جا فيصلا نٿو ڪري. ضلعي جي ڄاڻ ڳوٺ جي حفاظت جي تصديق نٿي ڪري.
Search preparedness|تیاری کی معلومات تلاش کریں|تياريءَ جي ڄاڻ ڳوليو
Search preparedness guidance…|تیاری کی رہنمائی تلاش کریں…|تياريءَ جي رهنمائي ڳوليو…
Reviewed English|اصل انگریزی متن|اصل انگريزي متن
Original bulletin — shown in its published language|اصل بلیٹن — اشاعتی زبان میں|اصل بليٽن — اشاعتي ٻوليءَ ۾
Official information channel ↗|سرکاری معلومات کا ذریعہ ↗|سرڪاري ڄاڻ جو ذريعو ↗
Urdu and Sindhi emergency guidance translations are drafts and are not published. No helplines, shelters or routes are inferred.|ہنگامی رہنمائی اصل اشاعتی زبان میں ہے۔ ہیلپ لائن، پناہ گاہ یا راستے کا اندازہ نہیں لگایا جاتا۔|هنگامي رهنمائي اصل اشاعتي ٻوليءَ ۾ آهي. هيلپ لائن، پناهه گاهه يا رستي جو اندازو نٿو لڳايو وڃي.
District notifications|ضلعی اطلاعات|ضلعي اطلاع
Demo mode allows local mock notifications only.|ڈیمو میں صرف مقامی آزمائشی اطلاعات ہیں۔|ڊيمو ۾ رڳو مقامي آزمائشي اطلاع آهن.
External channels require operator configuration and a verified destination.|بیرونی ذرائع کے لیے منتظم کی ترتیب اور تصدیق شدہ پتہ ضروری ہے۔|ٻاهرين ذريعن لاءِ منتظم جون سيٽنگون ۽ تصديق ٿيل پتو ضروري آهي.
Delivery channel|اطلاع کا ذریعہ|اطلاع جو ذريعو
Local mock inbox|مقامی آزمائشی ان باکس|مقامي آزمائشي ان باڪس
Mobile push (Expo)|موبائل اطلاع (Expo)|موبائل اطلاع (Expo)
Provider destination|اطلاع وصول کرنے کا پتہ|اطلاع وصول ڪرڻ جو پتو
Expo push token from your physical device|اپنے موبائل کا Expo ٹوکن|پنهنجي موبائل جو Expo ٽوڪن
Telegram chat ID|ٹیلی گرام چیٹ آئی ڈی|ٽيليگرام چيٽ آئي ڊي
Notification language:|اطلاعات کی زبان:|اطلاعن جي ٻولي:
. A warning is sent only in its reviewed publication language; English content is not silently machine translated.|۔ انتباہ صرف نظرثانی شدہ اشاعتی زبان میں بھیجا جاتا ہے۔|. چتاءُ رڳو نظرثاني ٿيل اشاعتي ٻوليءَ ۾ موڪليو وڃي ٿو.
I consent to storing these preferences and destination for district notifications.|میں ضلعی اطلاعات کے لیے یہ ترجیحات اور پتہ محفوظ کرنے کی اجازت دیتا ہوں۔|مان ضلعي اطلاعن لاءِ اهي ترجيحون ۽ پتو محفوظ ڪرڻ جي اجازت ڏيان ٿو.
Save preferences|ترجیحات محفوظ کریں|ترجيحون محفوظ ڪريو
Subscribe to district alerts|ضلعی اطلاعات حاصل کریں|ضلعي اطلاع حاصل ڪريو
Refresh delivery history|اطلاعات کا ریکارڈ تازہ کریں|اطلاعن جو رڪارڊ تازو ڪريو
Unsubscribe & delete data|رکنیت ختم اور معلومات حذف کریں|رڪنيت ختم ۽ ڄاڻ ڊاهيو
Keep this browser’s subscription token to manage or delete your subscription. Losing browser storage loses this management capability.|رکنیت میں تبدیلی یا حذف کرنے کے لیے اسی براؤزر کا محفوظ ٹوکن ضروری ہے۔|رڪنيت بدلائڻ يا ڊاهڻ لاءِ هن برائوزر جو محفوظ ٽوڪن ضروري آهي.
An independent information service.|ایک آزاد معلوماتی خدمت۔|هڪ آزاد معلوماتي خدمت.
Sindh Flood Watch is not an official government warning authority. Do not rely on this as your sole emergency warning channel.|سندھ فلڈ واچ سرکاری انتباہی ادارہ نہیں۔ ہنگامی اطلاعات کے لیے صرف اسی پر انحصار نہ کریں۔|سنڌ فلڊ واچ سرڪاري چتاءَ وارو ادارو ناهي. هنگامي اطلاعن لاءِ رڳو هن تي ڀروسو نه ڪريو.
SOURCES OVER SPECULATION|قیاس کے بجائے ماخذ|اندازي بدران ذريعو
RESTRICTED WORKSPACE|محدود رسائی کا شعبہ|محدود رسائي وارو شعبو
Administrator sign in|منتظم سائن ان|منتظم سائن ان
Accounts are created by the local operator. Public administrator registration is disabled.|اکاؤنٹ منتظم بناتا ہے۔ عوامی رجسٹریشن بند ہے۔|کاتو منتظم ٺاهي ٿو. عوامي رجسٽريشن بند آهي.
Username|صارف نام|واپرائيندڙ جو نالو
Password|پاس ورڈ|پاس ورڊ
Sign in securely →|محفوظ سائن ان →|محفوظ سائن ان →
ADMINISTRATOR WORKSPACE|منتظم کا شعبہ|منتظم جو شعبو
Review before you publish.|اشاعت سے پہلے جائزہ لیں۔|اشاعت کان اڳ جائزو وٺو.
Publication requires approval. Only published, current advisories generate warning jobs.|اشاعت کے لیے منظوری ضروری ہے۔ صرف شائع شدہ، مؤثر اطلاعات بھیجی جاتی ہیں۔|اشاعت لاءِ منظوري ضروري آهي. رڳو شايع ٿيل، مؤثر اطلاع موڪليا وڃن ٿا.
Sign out|سائن آؤٹ|سائن آئوٽ
Edit draft|مسودہ تبدیل کریں|مسودو بدلايو
Create an advisory|اطلاع بنائیں|اطلاع ٺاهيو
Extract PDF or text bulletin (max 2 MiB)|پی ڈی ایف یا متن اپ لوڈ کریں (زیادہ سے زیادہ 2 MiB)|پي ڊي ايف يا متن اپ لوڊ ڪريو (وڌ ۾ وڌ 2 MiB)
Supersedes advisory ID (optional update)|پچھلی اطلاع کی شناخت (اختیاری)|اڳئين اطلاع جي سڃاڻپ (اختياري)
Original bulletin wording|بلیٹن کا اصل متن|بليٽن جو اصل متن
Intended districts (comma-separated, exact names)|متعلقہ اضلاع (کاما سے الگ اصل انگریزی نام)|لاڳاپيل ضلعا (ڪاما سان الڳ اصل انگريزي نالا)
Hazard|خطرے کی قسم|خطري جو قسم
Publication language|اشاعت کی زبان|اشاعت جي ٻولي
English|انگریزی|انگريزي
Urdu|اردو|اردو
Sindhi|سندھی|سنڌي
Fictional demo — mock delivery only|فرضی ڈیمو — صرف آزمائشی اطلاعات|فرضي ڊيمو — رڳو آزمائشي اطلاع
I have completed human review of this translation|میں نے اس ترجمے کا انسانی جائزہ مکمل کیا ہے|مون هن ترجمي جو انساني جائزو مڪمل ڪيو آهي
Save edit & reset approval|تبدیلی محفوظ کریں، منظوری دوبارہ درکار|تبديلي محفوظ ڪريو، منظوري ٻيهر گهربل
Save draft for review|جائزے کے لیے مسودہ محفوظ کریں|جائزي لاءِ مسودو محفوظ ڪريو
Publication queue|اشاعت کی فہرست|اشاعت جي فهرست
↻ Refresh|↻ تازہ کریں|↻ تازو ڪريو
ID:|شناخت:|سڃاڻپ:
Preview:|پیش منظر:|ڏيک:
Edit|ترمیم|ترميم
Worker, sources & audit trail|پس منظر کی خدمت، ذرائع اور سرگرمیوں کا ریکارڈ|پسمنظر خدمت، ذريعا ۽ سرگرمين جو رڪارڊ
title|عنوان|عنوان
authority|جاری کرنے والا ادارہ|جاري ڪندڙ ادارو
source url|ماخذ کا لنک|ذريعي جي لنڪ
severity|شدت|شدت
issued|جاری ہونے کا وقت|جاري ٿيڻ جو وقت
expires|مدت ختم ہونے کا وقت|مدو ختم ٿيڻ جو وقت
approve|منظور کریں|منظور ڪريو
publish|شائع کریں|شايع ڪريو
withdraw|واپس لیں|واپس وٺو
expire|مدت ختم کریں|مدو ختم ڪريو
draft|مسودہ|مسودو
approved|منظور شدہ|منظور ٿيل
published|شائع شدہ|شايع ٿيل
withdrawn|واپس لی گئی|واپس ورتل
expired|مدت ختم|مدو ختم
Not available|دستیاب نہیں|موجود ناهي
Manual integration pending; no successful automated source check|دستی رابطہ باقی ہے؛ خودکار جانچ کامیاب نہیں ہوئی|دستي ڳانڍاپو رهيل؛ خودڪار جاچ ڪامياب ناهي ٿي
PDMA Sindh|پی ڈی ایم اے سندھ|پي ڊي ايم اي سنڌ
PMD Flood Forecasting Division|محکمہ موسمیات، سیلاب کی پیش گوئی کا شعبہ|موسميات کاتو، ٻوڏ جي اڳڪٿي وارو شعبو
Extraction is untrusted. Review original wording and all source fields.|استخراج کی جانچ ضروری ہے۔ اصل متن اور ماخذ کی تفصیلات دیکھیں۔|ڪڍيل متن جي جاچ ضروري آهي. اصل متن ۽ ذريعي جا تفصيل ڏسو.
Draft saved. Review, approve, then publish.|مسودہ محفوظ ہوگیا۔ جائزہ لیں، منظور کریں، پھر شائع کریں۔|مسودو محفوظ ٿيو. جائزو وٺو، منظور ڪريو، پوءِ شايع ڪريو.
Subscription saved. No delivery is claimed until a mock record is available.|رکنیت محفوظ ہوگئی۔ آزمائشی ریکارڈ کے بغیر ترسیل کی تصدیق نہیں۔|رڪنيت محفوظ ٿي. آزمائشي رڪارڊ کان سواءِ پهچڻ جي تصديق ناهي.
Subscription and delivery data deleted.|رکنیت اور ترسیل کا ریکارڈ حذف ہوگیا۔|رڪنيت ۽ پهچ جو رڪارڊ ڊهي ويو.
reviewed|نظرثانی شدہ|نظرثاني ٿيل
Preferences updated.|ترجیحات تبدیل ہوگئیں۔|ترجيحون بدلجي ويون.
`;

export const messages: Record<string, { ur: string; sd: string }> =
  Object.fromEntries(
    rows
      .trim()
      .split("\n")
      .map((row) => {
        const [en, ur, sd] = row.split("|");
        return [en, { ur, sd }];
      }),
  );

export function translate(language: Language, text: string) {
  return language === "en" ? text : messages[text]?.[language] || text;
}

const districtRows = `Badin|بدین|بدين
Dadu|دادو|دادو
Ghotki|گھوٹکی|گهوٽڪي
Hyderabad|حیدرآباد|حيدرآباد
Jacobabad|جیکب آباد|جيڪب آباد
Jamshoro|جامشورو|ڄامشورو
Kambar Shahdadkot|قنبر شہدادکوٹ|قنبر شهدادڪوٽ
Karachi Central|کراچی وسطی|ڪراچي وچ
Karachi East|کراچی شرقی|ڪراچي اوڀر
Karachi South|کراچی جنوبی|ڪراچي ڏکڻ
Karachi West|کراچی غربی|ڪراچي اولهه
Kashmore|کشمور|ڪشمور
Keamari|کیماڑی|ڪياماڙي
Khairpur|خیرپور|خيرپور
Korangi|کورنگی|ڪورنگي
Larkana|لاڑکانہ|لاڙڪاڻو
Malir|ملیر|ملير
Matiari|مٹیاری|مٽياري
Mirpur Khas|میرپور خاص|ميرپور خاص
Naushahro Feroze|نوشہرو فیروز|نوشهرو فيروز
Shaheed Benazirabad|شہید بینظیرآباد|شهيد بينظيرآباد
Sanghar|سانگھڑ|سانگهڙ
Shikarpur|شکارپور|شڪارپور
Sujawal|سجاول|سجاول
Sukkur|سکھر|سکر
Tando Allahyar|ٹنڈو الہ یار|ٽنڊو الهيار
Tando Muhammad Khan|ٹنڈو محمد خان|ٽنڊو محمد خان
Tharparkar|تھرپارکر|ٿرپارڪر
Thatta|ٹھٹھہ|ٺٽو
Umerkot|عمرکوٹ|عمرڪوٽ`;
for (const row of districtRows.split("\n")) {
  const [en, ur, sd] = row.split("|");
  messages[en] = { ur, sd };
}
