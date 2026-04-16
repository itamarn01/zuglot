import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ContractView = () => {
  const { linkToken } = useParams();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [selectedOptionals, setSelectedOptionals] = useState({});
  const [signed, setSigned] = useState(false);
  const [generating, setGenerating] = useState(false);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const contractRef = useRef(null);
  const [lang, setLang] = useState('he'); // 'he' or 'en'
  const [editing, setEditing] = useState(false);
  const [editedFields, setEditedFields] = useState({});

  const t = {
    he: {
      title: 'הסכם הופעה - להקת קולות',
      bandSub: 'להקת קולות',
      packageLabel: 'תופיע בהרכב',
      included: 'כולל:',
      extras: 'תוספות - בחרו מה מעניין אתכם:',
      extrasIntro: 'המוצרים הבאים אינם כלולים בחבילה הבסיסית - ניתן להוסיף אותם לפי בחירתכם',
      addToPackage: 'הוסף לחבילה',
      eventDetails: 'פרטי האירוע',
      ordererDetails: 'פרטי המזמין',
      date: 'תאריך:',
      location: 'אולם/מיקום:',
      orderer: 'המזמין:',
      address: 'כתובת:',
      phone: 'טלפון:',
      idNumber: 'ת.ז:',
      groom: 'שם חתן:',
      bride: 'שם כלה:',
      duration: 'זמן נגינה:',
      hours: 'שעות',
      packagePrice: 'מחיר חבילה:',
      paymentTitle: 'סכום ותנאי תשלום',
      discount: 'הנחה מיוחדת:',
      extras_total: 'תוספות שנבחרו:',
      finalPrice: 'סכום סופי:',
      advance: 'מקדמה:',
      notes: 'הערות מיוחדות:',
      signTitle: 'חתימות',
      bandRep: 'נציגי להקת קולות',
      client: 'המזמין',
      signHere: 'חתום כאן',
      fullName: 'שם מלא',
      confirmSign: 'אשר חתימה',
      clear: 'נקה',
      signed: '✓ חוזה חתום',
      signedBy: 'נחתם ע"י:',
      signedAt: 'בתאריך:',
      weddingOf: 'החתונה של',
      and: 'ו',
      footer: '055-5081080 • KOLOTMUSIC@GMAIL.COM • KOLOTBAND.CO.IL',
      expiredTitle: 'החוזה אינו זמין',
      expiredText: 'הסכם זה אינו זמין כעת. לפרטים נוספים צרו קשר עם הלהקה.',
      selectedTotal: 'סה"כ תוספות שנבחרו',
      notFound: 'חוזה לא נמצא',
      aboutTitle: 'מזל טוב - קצת עלינו',
      aboutContent: [
        'להקת ׳קולות׳ היא להקה מהמובילות בעולם האירועים והחתונות. הלהקה משלבת בין סגנונות רבים ומביאה לבמה מוסיקה איכותית ברמה גבוהה תוך הבאת אנרגיות מטורפות של שמחה אמיתית לאירוע שלכם!',
        'הלהקה מורכבת ממוסיקאים מקצועיים עתירי נסיון במה, ועומדת בסטנדרטים גבוהים מאוד של סאונד וציוד.',
        '׳קולות׳ שמה לה למטרה לשלב בין מקצועיות ברמת איכות בלתי מתפשרת, יוקרה ועמידה בסטנדרטים גבוהים יחד עם אנרגיות ושמחה ללא גבולות.',
        'נשמח לקחת חלק באירוע שלכם 🎶'
      ],
      weddingDetailsTitle: 'פרטי החתונה - מה זה כולל',
      weddingDetailsContent: [
        'המחיר הבסיסי כולל נגינה ליד כיסא כלה, וכן בעת ליווי החתן והכלה לחופה, נגינה של כל ההרכב בזמן החופה. לאחר מכן, נגינת שירי רקע בזמן המנה הראשונה, ונגינה בסבבי ההרקדות.',
        (duration) => `זמן נגינת הלהקה הינו ${duration} שעות מזמן תחילת הנגינה בכסא כלה/בחופה. שעת ההתחלה תיקבע בפגישה בין הצדדים.`,
        'במידה וירצה המזמין שהלהקה תנגן מעבר לשעה זו, ישלם המזמין תוספת של 10% (מהמחיר הכולל) לכל חצי שעה נוספת. (המחיר כולל שימוש בהגברה)'
      ],
      soundTitle: 'הגברה',
      soundContent: [
        'הלהקה תדאג לספק מערכת הגברה מתאימה לרחבת הריקודים וכן לרמקול נוסף ברחבת הנשים במידת הצורך.',
        'הלהקה תדאג לספק מערכת הגברה לחופה, מיקרופון לעורך החופה ולמוזיקת רקע מתאימה וכן למערכת הגברה נוספת ליד כסא הכלה.',
        'שעת הקמת ציוד ההגברה באולם היא כשעתיים וחצי לפני שעת קבלת פנים. על המזמין לוודא שהאולם פנוי בשעה זו, וזאת ע"מ שחברת ההגברה תוכל להתחיל מייד עם הגעתה למקום ללא עיכובים.',
        'בכל מקרה אחר אשר ההגברה שתסופק איננה מצד הלהקה, יבוצע תאום מול הלהקה על מנת להתאים את המפרט הנדרש ללהקה.',
        (duration) => `זמן השימוש בהגברה הינו ${duration} שעות מזמן תחילת הנגינה בכסא כלה/בחופה. שעת ההתחלה תיקבע בפגישה בין הצדדים.`,
        'במידה וירצה המזמין להשתמש בהגברה להשמעת מוסיקה מעבר לשעה זו, ישלם המזמין תוספת של 500 ₪ לכל חצי שעה נוספת.',
        'השימוש במערכת ההגברה עבור ספק חיצוני (כגון להקה או דיג׳יי) כרוך בתשלום. הצעת מחיר תישלח לפי הדרישה.'
      ],
      paymentIncludes: (price) => `הסכום לתשלום הוא ${price.toLocaleString()} ₪ כולל מע"מ, כתשלום מלא עבור שרותיה הבסיסיים (לא כולל תוספות כלשהן).`,
      paymentTiming: 'התשלום יתבצע מיד לאחר סיום האירוע במזומן.',
      paymentAdvance: (advance) => `מקדמה בסך ${advance.toLocaleString()} ₪ תשולם במעמד חתימת הסכם זה.`,
      paymentExtrasTitle: 'תשלום עבור תוספות:',
      paymentExtrasContent: 'התשלום עבור התוספות עפ״י סעיף זה לעיל (ככל שיחולו) הינו כולל מע״מ ויבוצע אף הוא מיד בסיום האירוע במזומן (יחד עם התשלום הבסיסי).',
      cancellationTitle: 'ביטול',
      cancellationIntro: 'מוסכם בזאת, כי בכל מקרה של ביטול, יחולו הוראות סימן זה לחוזה.',
      cancellationContent: [
        'הלהקה תדאג לנגנים/זמר חלופיים בגין אי הופעתם למעט אי הופעתם מחמת כח עליון.',
        'במקרה של ביטול עקב כוח עליון, רשאי המזמין לשנות את הרכב הלהקה או לבטל את ההסכם ללא דמי ביטול. במידה והמזמין יבחר לדחות את מועד האירוע, יתואם מועד חלופי שבו הלהקה תוכל להופיע והמקדמה ששולמה תועבר למועד החדש.',
      ],
      cancellationClientIntro: 'כל ביטול של חוזה זה מצדו של המזמין למעט מחמת כוח עליון ולמעט ביטול או דחיית האירוע מחמת המצב הביטחוני:',
      cancellationTiers: [
        { label: 'תוך 30 ימים לפני האירוע', pct: '30%' },
        { label: 'תוך 3 שבועות לפני האירוע', pct: '50%' },
        { label: 'תוך 7 ימים לפני האירוע', pct: '100%' },
      ],
      cancellationTierSuffix: 'מסך ההזמנה',
      miscTitle: 'שונות',
      miscContent: 'הצדדים להסכם זה ייפגשו לפני האירוע, לצורך תכנון משותף של תוכנית האירוע.',
      noSignature: 'חתימה לא נמצאה',
      signInsideBox: 'חתמו כאן במסגרת',
      selectedLabel: 'נבחר ✓',
      addLabel: 'הוסף',
    },
    en: {
      title: 'Performance Agreement',
      bandSub: 'Kolot Band',
      packageLabel: 'Performing in formation',
      included: 'Included:',
      extras: 'Add-ons - Choose what interests you:',
      extrasIntro: 'The following are not included in the base package - you can add them to your package',
      addToPackage: 'Add to package',
      eventDetails: 'Event Details',
      ordererDetails: 'Orderer Details',
      date: 'Date:',
      location: 'Venue:',
      orderer: 'Orderer:',
      address: 'Address:',
      phone: 'Phone:',
      idNumber: 'ID:',
      groom: 'Groom:',
      bride: 'Bride:',
      duration: 'Performance duration:',
      hours: 'hours',
      packagePrice: 'Package price:',
      paymentTitle: 'Amount & Payment terms',
      discount: 'Special discount:',
      extras_total: 'Selected add-ons:',
      finalPrice: 'Total Payment:',
      advance: 'Advance:',
      notes: 'Special Notes:',
      signTitle: 'Signatures',
      bandRep: 'Kolot Band Representatives',
      client: 'Client',
      signHere: 'Sign Here',
      fullName: 'Full Name',
      confirmSign: 'Confirm Signature',
      clear: 'Clear',
      signed: '✓ Contract Signed',
      signedBy: 'Signed by:',
      signedAt: 'Date:',
      weddingOf: 'The wedding of',
      and: '&',
      footer: '055-5081080 • KOLOTMUSIC@GMAIL.COM • KOLOTBAND.CO.IL',
      expiredTitle: 'Contract No Longer Available',
      expiredText: 'This contract is no longer available. Please contact the band for more information.',
      selectedTotal: 'Total selected add-ons',
      notFound: 'Contract Not Found',
      aboutTitle: 'About Us',
      aboutContent: [
        'Kolot is one of the leading bands in the world of events and weddings.',
        'The band combines many styles and brings to the stage high-quality music with a high level of performance, while bringing crazy energies of true joy to your event!',
        'The band consists of professional musicians with rich stage experience, and meets very high standards of sound and equipment.',
        'Kolot has set itself the goal of combining professionalism with uncompromising quality, and adherence to high standards, along with limitless energies and happiness.',
        'We would love to take part in your event.'
      ],
      weddingDetailsTitle: 'Wedding Performance',
      weddingDetailsContent: [], // English version merges this into Sound per user's text
      soundTitle: 'Sound',
      soundContent: [
        ' The Basic Price (as defined below) includes playing at the bride\'s chair, at \'beddeken\', playing during the wedding ceremony, as well as accompanying the Bride and Groom to the chupa (חופה). Thereafter, the Band will play continuous music through the dancing rounds.',
        (duration) => ` The Live Band will play for a total of ${duration} hours (the "Basic Playing Time"), starting from the beginning of the music at the bride's chair/chuppah. The exact start time will be determined in the meeting between the parties.`,
        ' To the extent the Client wishes that the Band will play beyond the Basic Playing Time, the Client will pay an additional 10% (from the Total Payment) per each additional half hour.',
        ' The Band shall provide an appropriate sound system for the dance floor.',
        ' The Band shall provide additional sound system (if necessary) to the chupa, including a microphone for the chupa conductor, as well as appropriate background music.',
        ' The Band shall provide additional sound system (if necessary) to the Bridal chair.',
        ' In the event where the sound system is not provided by the Band, coordination will be performed with the Band in order to meet the specification required to the Band.',
        (duration) => `H. The sound system may be used for a total of ${duration} hours starting from the beginning of the music at the bride's chair/chuppah. The start time will be determined in a meeting between the parties.`,
        ' If the client wishes to use the sound system beyond the agreed time for music playback, an additional charge of 500 NIS will apply for every additional half hour.',
        ' The use of the sound system by an external provider (such as a band or DJ) is subject to an additional fee. A price quote will be provided upon request.'
      ],
      paymentIncludes: (price) => `It is hereby agreed that in consideration for the Services, the Client shall pay the Band, promptly, and in any event not later than the end of the Event, an amount of NIS ${price.toLocaleString()} including VAT, as a full payment for the basic Services.`,
      paymentTiming: 'The payment shall be made immediately following the end of the Event, in cash.',
      paymentAdvance: (advance) => `An advance payment of NIS ${advance ? advance.toLocaleString() : 0} shall be paid upon the signing of this Agreement.`,
      paymentExtrasTitle: 'Sound Additional amplification system for "Tish"/reception:',
      paymentExtrasContent: 'For the avoidance of doubt, the payment for any Additional Services shall also be made following the end of the Event (together with the Basic Price) (the "Total Payment").',
      cancellationTitle: 'Cancellation',
      cancellationIntro: 'In the event of any cancellation, the following provisions shall apply:',
      cancellationContent: [
        'A. In the event of non-appearance by the Band, the Band shall provide alternative musicians/singers, except for non-appearance due to force majeure.',
        'B. In the event of cancellation due to force majeure, the Clients have the right to reduce the size of the Band or cancel this Agreement without a cancellation fee. If the Clients choose to postpone the event to another date, they will use their best efforts to find an alternative date, when the Band are able to perform. The deposit paid will be transferred to the alternative date.',
      ],
      cancellationClientIntro: 'C. In the event of any cancellation of this Agreement by the Client, except for cancellation due to force majeure, then:',
      cancellationTiers: [
        { label: 'Within 30 days prior to the Event', pct: '30%' },
        { label: 'Within 3 weeks prior to the Event', pct: '50%' },
        { label: 'Within 7 days prior to the Event', pct: '100%' },
      ],
      cancellationTierSuffix: 'of the Total Payment',
      miscTitle: 'Miscellaneous',
      miscContent: 'The parties to this Agreement shall meet prior to the Event, for mutual planning of the Event\'s plan.',
      noSignature: 'Signature not found',
      signInsideBox: 'Sign above inside the box',
      selectedLabel: 'Selected ✓',
      addLabel: 'Add',
    }
  };
  const tx = t[lang];

  const translateValue = (val) => {
    if (!val || lang === 'he') return val;
    const map = {
      'בסיס': 'Basic',
      'מורחב': 'Extended',
      'פרמיום': 'Premium',
      'זהב': 'Gold',
      'פלטינה': 'Platinum',
      'הגברת חוץ': 'Outdoor Sound System',
      'דיג׳יי': 'DJ',
      'די ג׳יי': 'DJ',
      'חופה': 'Chuppah',
      'כסא כלה': 'Bridal Chair',
      'ליווי חתן וכלה': 'Procession',
      'קבלת פנים': 'Reception',
      'טיש': 'Tish',
      'זמר': 'Singer',
      'סקסופון': 'Saxophone',
      'כינור': 'Violin',
      'פסנתר': 'Piano',
      'תופים': 'Drums',
      'גיטרה': 'Guitar',
      'בס': 'Bass',
      'כלי נשיפה': 'Brass Section',
      'תאורה': 'Lighting',
      'מסכים': 'Screens',
      'קלידים': 'Keys',
      'הגברה': 'Sound System',
    };
    return map[val] || val;
  };

  useEffect(() => { fetchContract(); }, [linkToken]);

  const fetchContract = async () => {
    try {
      const { data } = await api.get(`/contracts/public/${linkToken}`);
      setContract(data);
      setEditedFields({
        eventDate: data.eventDate ? new Date(data.eventDate).toISOString().split('T')[0] : '',
        eventLocation: data.eventLocation || '',
        performanceDuration: data.performanceDuration || 4.5,
        ordererName: data.ordererName || '',
        ordererIdNumber: data.ordererIdNumber || '',
        ordererAddress: data.ordererAddress || '',
        ordererPhone: data.ordererPhone || '',
        groomName: data.groomName || '',
        brideName: data.brideName || '',
      });
      // Pre-populate selectedOptionals from already-selected optional products
      if (data.status === 'signed' && data.products) {
        const pre = {};
        data.products.forEach(p => {
          if (p.isOptional && p.isSelected) {
            pre[p.product?.toString() || p.name] = true;
          }
        });
        setSelectedOptionals(pre);
      }
    } catch (e) {
      if (e.response?.status === 403) setExpired(true);
    } finally { setLoading(false); }
  };

  const saveEdits = async () => {
    try {
      await api.patch(`/contracts/public/${linkToken}/update-details`, editedFields);
      setContract(c => ({
        ...c, ...editedFields,
        eventDate: editedFields.eventDate ? new Date(editedFields.eventDate).toISOString() : c.eventDate
      }));
      setEditing(false);
    } catch (e) {
      alert(lang === 'he' ? 'שגיאה בשמירה' : 'Save failed');
    }
  };

  const startDraw = (e) => {
    const canvas = canvasRef.current; const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    ctx.beginPath(); ctx.moveTo(x, y); setIsDrawing(true);
  };
  const draw = (e) => {
    if (!isDrawing) return; e.preventDefault();
    const canvas = canvasRef.current; const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.strokeStyle = '#1a1a2e'; ctx.lineTo(x, y); ctx.stroke();
  };
  const stopDraw = () => setIsDrawing(false);
  const clearSig = () => { const c = canvasRef.current; c.getContext('2d').clearRect(0, 0, c.width, c.height); };

  const toggleOptional = (prodId) => {
    setSelectedOptionals(prev => ({ ...prev, [prodId]: !prev[prodId] }));
  };

  const getOptionalTotal = () => {
    if (!contract) return 0;
    return contract.products
      .filter(p => p.isOptional && selectedOptionals[p.product?.toString() || p.name])
      .reduce((sum, p) => sum + (p.price || 0), 0);
  };

  const getFinalTotal = () => {
    if (!contract) return 0;
    const base = contract.basePrice || contract.totalPrice || 0;
    const discount = contract.discount || 0;
    return base - discount + getOptionalTotal();
  };

  const generateAndDownloadPDF = async () => {
    if (!contractRef.current) return null;
    setGenerating(true);
    try {
      const canvas = await html2canvas(contractRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        scrollX: 0,
        scrollY: -window.scrollY,
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const ratio = canvas.height / canvas.width;
      const imgH = pageW * ratio;
      let yPos = 0;
      let remaining = imgH;
      while (remaining > 0) {
        pdf.addImage(imgData, 'JPEG', 0, -yPos, pageW, imgH);
        remaining -= pageH;
        if (remaining > 0) { pdf.addPage(); yPos += pageH; }
      }
      pdf.save(`kolot-contract-${linkToken.slice(0, 8)}.pdf`);
      return pdf.output('datauristring');
    } catch (err) {
      console.error('PDF generation error:', err);
      return null;
    } finally {
      setGenerating(false);
    }
  };

  const submitSign = async () => {
    if (!signerName.trim()) { alert(lang === 'he' ? 'נא להזין שם' : 'Please enter your name'); return; }
    // Check canvas is not empty
    const canvas = canvasRef.current;
    const blank = document.createElement('canvas');
    blank.width = canvas.width; blank.height = canvas.height;
    if (canvas.toDataURL() === blank.toDataURL()) {
      alert(lang === 'he' ? 'נא לחתום בתוך המסגרת' : 'Please sign in the box'); return;
    }
    const sigUrl = canvas.toDataURL();
    const selectedIds = contract.products
      .filter(p => p.isOptional && selectedOptionals[p.product?.toString() || p.name])
      .map(p => p.product?.toString() || p.name);
    try {
      setSigning(false);
      setSigned(true); // optimistic – show signed state so PDF captures signature
      setTimeout(async () => {
        setGenerating(true);
        const pdfDataUrl = await generateAndDownloadPDF();
        await api.post(`/contracts/public/${linkToken}/sign`, {
          signatureUrl: sigUrl,
          signerName,
          selectedOptionalProducts: selectedIds,
          finalTotalPrice: getFinalTotal(),
          pdfDataUrl: pdfDataUrl || '',
        });
        fetchContract();
      }, 600);
    } catch (e) {
      setSigned(false);
      alert(e.response?.data?.message || (lang === 'he' ? 'שגיאה' : 'Error'));
    }
  };

  const saveExtras = async () => {
    const selectedIds = contract.products
      .filter(p => p.isOptional && selectedOptionals[p.product?.toString() || p.name])
      .map(p => p.product?.toString() || p.name);
    try {
      await api.post(`/contracts/public/${linkToken}/add-extras`, {
        selectedOptionalProducts: selectedIds,
      });
      alert(lang === 'he' ? 'התוספות נשמרו בהצלחה!' : 'Extras saved successfully!');
      fetchContract();
    } catch (e) {
      alert(e.response?.data?.message || (lang === 'he' ? 'שגיאה' : 'Error'));
    }
  };

  const printPDF = async () => {
    await generateAndDownloadPDF();
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 16, fontFamily: 'Assistant,sans-serif', color: '#EAB21B', fontWeight: 900, letterSpacing: 8 }}>KOLOT</div>
        <div className="spinner" style={{ margin: '0 auto' }} />
      </div>
    </div>
  );

  if (expired) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <div style={{ maxWidth: 480, padding: 40, background: '#fff', borderRadius: 16, textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}>
        <div style={{ fontSize: '4rem', marginBottom: 16 }}>🔒</div>
        <h2 style={{ color: '#1a1a2e', marginBottom: 12 }}>{tx.expiredTitle}</h2>
        <p style={{ color: '#666' }}>{tx.expiredText}</p>
        <p style={{ marginTop: 24, color: '#EAB21B', fontWeight: 700 }}>KOLOT BAND</p>
      </div>
    </div>
  );

  if (!contract) return (
    <div style={{ textAlign: 'center', padding: 60, background: '#f0f2f5', minHeight: '100vh' }}>
      <h2>{tx.notFound}</h2>
    </div>
  );

  const includedProds = contract.products?.filter(p => !p.isOptional && p.isSelected) || [];
  const optionalProds = contract.products?.filter(p => p.isOptional) || [];
  const basePrice = contract.basePrice || contract.totalPrice || 0;
  const discount = contract.discount || 0;
  const optionalTotal = getOptionalTotal();
  const finalTotal = getFinalTotal();

  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh', padding: '20px 16px', direction: lang === 'he' ? 'rtl' : 'ltr' }}>
      {/* Language Toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16, gap: 8 }}>
        <button onClick={() => setLang('he')} style={{ padding: '6px 18px', background: lang === 'he' ? '#1a1a2e' : '#fff', color: lang === 'he' ? '#fff' : '#1a1a2e', border: '2px solid #1a1a2e', borderRadius: 20, fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s' }}>עברית</button>
        <button onClick={() => setLang('en')} style={{ padding: '6px 18px', background: lang === 'en' ? '#1a1a2e' : '#fff', color: lang === 'en' ? '#fff' : '#1a1a2e', border: '2px solid #1a1a2e', borderRadius: 20, fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s' }}>English</button>
      </div>

      <div ref={contractRef} style={{ maxWidth: 820, margin: '0 auto', background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}>
        {/* Header */}
        <div className="responsive-padding responsive-flex" style={{ background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)' }}>
          <div>
            {contract.logoUrl && <img src={contract.logoUrl} alt="logo" style={{ height: 60, marginBottom: 8, borderRadius: 4 }} />}
            {/* <h1 style={{ fontFamily: 'Assistant,sans-serif', fontSize: '2.8rem', color: '#EAB21B', letterSpacing: 6, fontWeight: 900 }}>KOLOT</h1>
            <div style={{ color: '#81C7D5', fontFamily: 'Assistant,sans-serif', letterSpacing: 3, fontSize: '0.9rem' }}>TURN IT UP.</div> */}
          </div>
          <div style={{ textAlign: lang === 'he' ? 'left' : 'right', color: '#fff' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{tx.title}</div>
            <div style={{ color: '#81C7D5', fontSize: '0.9rem', marginTop: 4 }}>{tx.bandSub}</div>
          </div>
        </div>

        <div className="responsive-padding">
          {/* Event Title */}
          <div style={{ textAlign: 'center', marginBottom: 32, paddingBottom: 24, borderBottom: '2px solid #f0f2f5' }}>
            <h2 style={{ fontSize: '1.8rem', color: '#1a1a2e', fontFamily: 'Georgia,serif' }}>
              {contract.groomName && contract.brideName
                ? `${tx.weddingOf} ${contract.brideName} ${tx.and}${contract.groomName}`
                : tx.title}
            </h2>
          </div>

          {/* ── ABOUT THE BAND ── */}
          <div style={{ marginBottom: 24, borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ background: 'linear-gradient(135deg,#1a1a2e,#16213e)', padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '1.4rem' }}>🎵</span>
              <h3 style={{ color: '#EAB21B', fontFamily: 'Assistant,sans-serif', fontWeight: 800, fontSize: '1.05rem', margin: 0 }}>{tx.aboutTitle}</h3>
            </div>
            <div style={{ padding: '20px 22px', background: '#f8f9fb', fontFamily: 'Assistant,sans-serif', color: '#2a2a3e', lineHeight: 1.85, fontSize: '0.93rem' }}>
              {tx.aboutContent.map((item, i) => (
                <p key={i} style={{ margin: i === tx.aboutContent.length - 1 ? 0 : '0 0 10px', fontWeight: i === tx.aboutContent.length - 1 ? 700 : 400, color: i === tx.aboutContent.length - 1 ? '#EAB21B' : 'inherit' }}>{item}</p>
              ))}
            </div>
          </div>
          {/* Event Details */}
          {contract.status !== 'signed' && !signed && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16, gap: 10 }}>
              {!editing ? (
                <button onClick={() => setEditing(true)}
                  style={{ padding: '8px 22px', background: '#1a1a2e', color: '#EAB21B', border: '2px solid #EAB21B', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
                  {'\u270F\uFE0F'} {lang === 'he' ? 'עריכת פרטים' : 'Edit Details'}
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={saveEdits}
                    style={{ padding: '8px 22px', background: '#4CAF50', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
                    {lang === 'he' ? 'שמור שינויים' : 'Save Changes'}
                  </button>
                  <button onClick={() => setEditing(false)}
                    style={{ padding: '8px 18px', background: '#f0f2f5', color: '#333', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
                    {lang === 'he' ? 'ביטול' : 'Cancel'}
                  </button>
                </div>
              )}
            </div>
          )}
          <div className="contract-grid" style={{ marginBottom: 28 }}>
            <div style={{ background: '#f8f9fb', padding: 20, borderRadius: 12, border: '1px solid #e8eaf0' }}>
              <h3 style={{ color: '#EAB21B', marginBottom: 14, fontFamily: 'Georgia,serif', letterSpacing: 1 }}>{tx.eventDetails}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <strong style={{ color: '#555', fontSize: '0.85rem' }}>{tx.date}</strong>
                  {editing
                    ? <input type="date" value={editedFields.eventDate || ''} onChange={e => setEditedFields(f => ({ ...f, eventDate: e.target.value }))} style={{ padding: '5px 8px', border: '1px solid #ccc', borderRadius: 6, fontSize: '0.9rem', color: '#1a1a2e' }} />
                    : <span style={{ color: '#1a1a2e', fontWeight: 500 }}>{contract.eventDate ? new Date(contract.eventDate).toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US') : '-'}</span>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <strong style={{ color: '#555', fontSize: '0.85rem' }}>{tx.location}</strong>
                  {editing
                    ? <input value={editedFields.eventLocation || ''} onChange={e => setEditedFields(f => ({ ...f, eventLocation: e.target.value }))} style={{ padding: '5px 8px', border: '1px solid #ccc', borderRadius: 6, fontSize: '0.9rem', color: '#1a1a2e' }} />
                    : <span style={{ color: '#1a1a2e', fontWeight: 500 }}>{contract.eventLocation || '-'}</span>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <strong style={{ color: '#555', fontSize: '0.85rem' }}>{tx.groom}</strong>
                  {editing
                    ? <input value={editedFields.groomName || ''} onChange={e => setEditedFields(f => ({ ...f, groomName: e.target.value }))} style={{ padding: '5px 8px', border: '1px solid #ccc', borderRadius: 6, fontSize: '0.9rem', color: '#1a1a2e' }} />
                    : <span style={{ color: '#1a1a2e', fontWeight: 500 }}>{contract.groomName || '-'}</span>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <strong style={{ color: '#555', fontSize: '0.85rem' }}>{tx.bride}</strong>
                  {editing
                    ? <input value={editedFields.brideName || ''} onChange={e => setEditedFields(f => ({ ...f, brideName: e.target.value }))} style={{ padding: '5px 8px', border: '1px solid #ccc', borderRadius: 6, fontSize: '0.9rem', color: '#1a1a2e' }} />
                    : <span style={{ color: '#1a1a2e', fontWeight: 500 }}>{contract.brideName || '-'}</span>}
                </div>
                {/*  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingTop: 8, borderTop: '1px solid #e8eaf0' }}>
                  <strong style={{ color: '#555', fontSize: '0.85rem' }}>{tx.duration}</strong>
                  {editing
                    ? <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input type="number" step="0.5" min="0.5" max="12" value={editedFields.performanceDuration || 4.5}
                        onChange={e => setEditedFields(f => ({ ...f, performanceDuration: parseFloat(e.target.value) || 4.5 }))}
                        style={{ width: 70, padding: '5px 8px', border: '1px solid #ccc', borderRadius: 6, fontSize: '0.9rem', color: '#1a1a2e' }} />
                      <span style={{ color: '#555', fontSize: '0.85rem' }}>{tx.hours}</span>
                    </div>
                    : <span style={{ color: '#1a1a2e', fontWeight: 600 }}>{contract.performanceDuration || 4.5} {tx.hours}</span>}
                </div> */}
              </div>
            </div>
            <div style={{ background: '#f8f9fb', padding: 20, borderRadius: 12, border: '1px solid #e8eaf0' }}>
              <h3 style={{ color: '#EAB21B', marginBottom: 14, fontFamily: 'Georgia,serif', letterSpacing: 1 }}>{tx.ordererDetails}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <strong style={{ color: '#555', fontSize: '0.85rem' }}>{tx.orderer}</strong>
                  {editing
                    ? <input value={editedFields.ordererName || ''} onChange={e => setEditedFields(f => ({ ...f, ordererName: e.target.value }))} style={{ padding: '5px 8px', border: '1px solid #ccc', borderRadius: 6, fontSize: '0.9rem', color: '#1a1a2e' }} />
                    : <span style={{ color: '#1a1a2e', fontWeight: 500 }}>{contract.ordererName || '-'}</span>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <strong style={{ color: '#555', fontSize: '0.85rem' }}>{tx.idNumber}</strong>
                  {editing
                    ? <input value={editedFields.ordererIdNumber || ''} onChange={e => setEditedFields(f => ({ ...f, ordererIdNumber: e.target.value }))} style={{ padding: '5px 8px', border: '1px solid #ccc', borderRadius: 6, fontSize: '0.9rem', color: '#1a1a2e' }} />
                    : <span style={{ color: '#1a1a2e', fontWeight: 500 }}>{contract.ordererIdNumber || '-'}</span>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <strong style={{ color: '#555', fontSize: '0.85rem' }}>{tx.address}</strong>
                  {editing
                    ? <input value={editedFields.ordererAddress || ''} onChange={e => setEditedFields(f => ({ ...f, ordererAddress: e.target.value }))} style={{ padding: '5px 8px', border: '1px solid #ccc', borderRadius: 6, fontSize: '0.9rem', color: '#1a1a2e' }} />
                    : <span style={{ color: '#1a1a2e', fontWeight: 500 }}>{contract.ordererAddress || '-'}</span>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <strong style={{ color: '#555', fontSize: '0.85rem' }}>{tx.phone}</strong>
                  {editing
                    ? <input value={editedFields.ordererPhone || ''} onChange={e => setEditedFields(f => ({ ...f, ordererPhone: e.target.value }))} style={{ padding: '5px 8px', border: '1px solid #ccc', borderRadius: 6, fontSize: '0.9rem', color: '#1a1a2e' }} />
                    : <span style={{ color: '#1a1a2e', fontWeight: 500 }}>{contract.ordererPhone || '-'}</span>}
                </div>
              </div>
            </div>
          </div>



          {/* Package */}
          {contract.packageName && (
            <div style={{ textAlign: 'center', marginBottom: 24, padding: '16px', background: 'linear-gradient(135deg,#f8f9fb,#fff)', borderRadius: 12, border: '1px solid #e8eaf0' }}>
              <div style={{ fontSize: '0.9rem', color: '#888' }}>{tx.packageLabel}</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#1a1a2e', fontFamily: 'Georgia,serif', letterSpacing: 2 }}>{translateValue(contract.packageName).toUpperCase()}</div>
            </div>
          )}

          {/* Included Products */}
          {includedProds.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <h3 style={{ color: '#EAB21B', marginBottom: 16, fontFamily: 'Georgia,serif', letterSpacing: 1 }}>{tx.included}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12 }}>
                {includedProds.map((p, i) => (
                  <div key={i} style={{ background: '#f8f9fb', borderRadius: 10, overflow: 'hidden', border: '1px solid #e8eaf0', textAlign: 'center' }}>
                    {p.imageUrl && <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: 100, objectFit: 'cover' }} />}
                    <div style={{ padding: '10px 12px', fontWeight: 700, fontSize: '0.9rem', color: '#1a1a2e' }}>{translateValue(p.name)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* ── PERFORMANCE DETAILS ── */}
          {tx.weddingDetailsContent.length > 0 && (
            <div style={{ marginBottom: 24, borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ background: 'linear-gradient(135deg,#1a1a2e,#16213e)', padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '1.4rem' }}>💍</span>
                <h3 style={{ color: '#EAB21B', fontFamily: 'Assistant,sans-serif', fontWeight: 800, fontSize: '1.05rem', margin: 0 }}>{tx.weddingDetailsTitle}</h3>
              </div>
              <div style={{ padding: '20px 22px', background: '#f8f9fb', fontFamily: 'Assistant,sans-serif' }}>
                {tx.weddingDetailsContent.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10, padding: '11px 14px', background: '#fff', borderRadius: 8, border: '1px solid #eef0f5', fontSize: '0.92rem', color: '#2a2a3e', lineHeight: 1.75 }}>
                    <span style={{ background: '#1a1a2e', color: '#EAB21B', borderRadius: '50%', minWidth: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0, marginTop: 1 }}>{lang === 'he' ? ['א', 'ב', 'ג'][i] : String.fromCharCode(65 + i)}</span>
                    <span>{typeof item === 'function' ? item(contract.performanceDuration || 4.5) : item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SOUND SYSTEM ── */}
          <div style={{ marginBottom: 24, borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ background: 'linear-gradient(135deg,#1a1a2e,#16213e)', padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '1.4rem' }}>🔊</span>
              <h3 style={{ color: '#EAB21B', fontFamily: 'Assistant,sans-serif', fontWeight: 800, fontSize: '1.05rem', margin: 0 }}>{tx.soundTitle}</h3>
            </div>
            <div style={{ padding: '20px 22px', background: '#f8f9fb', fontFamily: 'Assistant,sans-serif' }}>
              {tx.soundContent.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10, padding: '11px 14px', background: '#fff', borderRadius: 8, border: '1px solid #eef0f5', fontSize: '0.92rem', color: '#2a2a3e', lineHeight: 1.75 }}>
                  <span style={{ background: '#1a1a2e', color: '#EAB21B', borderRadius: '50%', minWidth: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0, marginTop: 1 }}>{lang === 'he' ? ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז'][i] : String.fromCharCode(65 + i)}</span>
                  <span>{typeof item === 'function' ? item(contract.performanceDuration || 4.5) : item}</span>
                </div>
              ))}
            </div>
          </div>



          {/* Optional Products - Interactive (always visible, even after signing) */}
          {optionalProds.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ background: 'linear-gradient(135deg,#fff8e1,#fffde7)', border: `2px solid ${(contract.status === 'signed' || signed) ? '#ccc' : '#EAB21B'}`, borderRadius: 14, padding: 24 }}>
                <h3 style={{ color: '#1a1a2e', marginBottom: 6, fontFamily: 'Georgia,serif', fontSize: '1.2rem' }}>{tx.extras}</h3>
                <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: 20 }}>
                  {(contract.status === 'signed' || signed)
                    ? (lang === 'he' ? 'ניתן להוסיף תוספות גם לאחר חתימה. לחץ על המוצר ולאחר מכן שמור.' : 'You can still add extras after signing. Click a product then save.')
                    : tx.extrasIntro}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16 }}>
                  {optionalProds.map((p, i) => {
                    const key = p.product?.toString() || p.name;
                    const isSelected = !!selectedOptionals[key];
                    return (
                      <div key={i} onClick={() => toggleOptional(key)}
                        style={{ background: isSelected ? '#1a1a2e' : '#fff', borderRadius: 12, overflow: 'hidden', border: `2px solid ${isSelected ? '#EAB21B' : '#e8eaf0'}`, cursor: 'pointer', transition: 'all 0.3s ease', transform: isSelected ? 'scale(1.02)' : 'scale(1)', boxShadow: isSelected ? '0 8px 24px rgba(234,178,27,0.3)' : '0 2px 8px rgba(0,0,0,0.06)' }}>
                        {p.imageUrl && (
                          <div style={{ position: 'relative', height: 140, overflow: 'hidden' }}>
                            <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s', transform: isSelected ? 'scale(1.05)' : 'scale(1)' }} />
                            {isSelected && <div style={{ position: 'absolute', top: 8, right: 8, background: '#EAB21B', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.9rem' }}>✓</div>}
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(to top,rgba(0,0,0,0.7),transparent)' }} />
                          </div>
                        )}
                        {!p.imageUrl && isSelected && <div style={{ textAlign: 'center', padding: '16px 0 0', fontSize: '2rem' }}>✓</div>}
                        <div style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: isSelected ? '#EAB21B' : '#1a1a2e', marginBottom: 4 }}>{translateValue(p.name)}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: isSelected ? '#fff' : '#1a1a2e' }}>+₪{p.price?.toLocaleString()}</span>
                            <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: 10, background: isSelected ? 'rgba(234,178,27,0.2)' : '#f0f2f5', color: isSelected ? '#EAB21B' : '#888', fontWeight: 600 }}>
                              {isSelected ? tx.selectedLabel : tx.addLabel}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {optionalTotal > 0 && (
                  <div style={{ marginTop: 16, padding: '10px 16px', background: 'rgba(234,178,27,0.15)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: '#1a1a2e' }}>{tx.selectedTotal}:</span>
                    <span style={{ fontWeight: 800, color: '#EAB21B', fontSize: '1.1rem' }}>+₪{optionalTotal.toLocaleString()}</span>
                  </div>
                )}
                {/* Save extras button – only visible after signing */}
                {(contract.status === 'signed' || signed) && (
                  <div style={{ marginTop: 16, textAlign: 'center' }}>
                    <button onClick={saveExtras}
                      style={{ padding: '12px 32px', background: '#1a1a2e', color: '#EAB21B', border: '2px solid #EAB21B', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem', fontFamily: 'Assistant,sans-serif' }}>
                      💾 {lang === 'he' ? 'שמור תוספות' : 'Save Extras'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Price Summary */}
          <div style={{ background: 'linear-gradient(135deg,#1a1a2e,#16213e)', borderRadius: 14, padding: 28, marginBottom: 28, color: '#fff', fontFamily: 'Assistant,sans-serif' }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#81C7D5', marginBottom: 16, letterSpacing: 0.5 }}>{tx.paymentTitle}</div>
            {basePrice > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.95rem', color: '#ccc' }}>
                <span>{tx.packagePrice}</span>
                <span style={{ textDecoration: discount > 0 ? 'line-through' : 'none', opacity: discount > 0 ? 0.6 : 1 }}>₪{basePrice.toLocaleString()}</span>
              </div>
            )}
            {discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.95rem', color: '#81C7D5' }}>
                <span>{tx.discount}</span>
                <span style={{ color: '#4CAF50' }}>-₪{discount.toLocaleString()}</span>
              </div>
            )}
            {optionalTotal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.95rem', color: '#ccc' }}>
                <span>{tx.extras_total}</span>
                <span style={{ color: '#EAB21B' }}>+₪{optionalTotal.toLocaleString()}</span>
              </div>
            )}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1rem', color: '#81C7D5' }}>{tx.finalPrice}</span>
              <span style={{ fontSize: '2.6rem', fontWeight: 900, color: '#EAB21B' }}>₪{finalTotal.toLocaleString()}</span>
            </div>
            {contract.advancePayment > 0 && (
              <div style={{ marginTop: 8, color: '#aaa', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>{tx.advance}</span>
                <span>₪{contract.advancePayment.toLocaleString()}</span>
              </div>
            )}
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.85rem', color: '#ccc', lineHeight: 1.8 }}>
              <div style={{ marginBottom: 8 }}>{tx.paymentIncludes(basePrice)}</div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ color: '#EAB21B', flexShrink: 0, fontSize: '1rem' }}>•</span>
                <span>{tx.paymentTiming}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 4 }}>
                <span style={{ color: '#EAB21B', flexShrink: 0, fontSize: '1rem' }}>•</span>
                <span>{tx.paymentAdvance(contract.advancePayment || 0)}</span>
              </div>
            </div>
            {optionalProds.length > 0 && (
              <div style={{ marginTop: 12, padding: '12px 14px', background: 'rgba(234,178,27,0.08)', borderRadius: 8, fontSize: '0.82rem', color: '#bbb', lineHeight: 1.75, borderRight: lang === 'he' ? '3px solid #EAB21B' : 'none', borderLeft: lang === 'en' ? '3px solid #EAB21B' : 'none' }}>
                <strong style={{ color: '#EAB21B', display: 'block', marginBottom: 4 }}>{tx.paymentExtrasTitle}</strong>
                {tx.paymentExtrasContent}
              </div>
            )}
          </div>

          {/* Special Notes */}
          {contract.specialNotes && (
            <div style={{ background: '#fff8e1', padding: 20, borderRadius: 12, marginBottom: 28, border: '1px solid #ffe082', fontFamily: 'Assistant,sans-serif' }}>
              <strong style={{ color: '#795548' }}>{tx.notes}</strong><br />
              <span style={{ color: '#333' }}>{contract.specialNotes}</span>
            </div>
          )}





          {/* ── CANCELLATION ── */}
          <div style={{ marginBottom: 28, borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #ffd5d5' }}>
            <div style={{ background: 'linear-gradient(135deg,#2d1414,#3a1818)', padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '1.4rem' }}>📋</span>
              <h3 style={{ color: '#ff9090', fontFamily: 'Assistant,sans-serif', fontWeight: 800, fontSize: '1.05rem', margin: 0 }}>{tx.cancellationTitle}</h3>
            </div>
            <div style={{ padding: '20px 22px', background: '#fff8f8', fontFamily: 'Assistant,sans-serif' }}>
              <p style={{ fontSize: '0.92rem', color: '#555', marginBottom: 14, fontWeight: 600, lineHeight: 1.6 }}>{tx.cancellationIntro}</p>
              {tx.cancellationContent.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10, padding: '11px 14px', background: '#fff', borderRadius: 8, border: '1px solid #ffe4e4', fontSize: '0.92rem', color: '#2a2a3e', lineHeight: 1.75 }}>
                  <span style={{ background: '#c0392b', color: '#fff', borderRadius: '50%', minWidth: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0, marginTop: 1 }}>{lang === 'he' ? ['א', 'ב'][i] : String.fromCharCode(65 + i)}</span>
                  <span>{item}</span>
                </div>
              ))}
              <div style={{ padding: '14px', background: '#fff', borderRadius: 8, border: '1px solid #ffe4e4', marginBottom: 4 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ background: '#c0392b', color: '#fff', borderRadius: '50%', minWidth: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0, marginTop: 1 }}>{lang === 'he' ? 'ג' : 'C'}</span>
                  <div style={{ fontSize: '0.92rem', color: '#2a2a3e', lineHeight: 1.75 }}>
                    <div style={{ marginBottom: 10, fontWeight: 500 }}>{tx.cancellationClientIntro}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {tx.cancellationTiers.map((x, j) => (
                        <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 14px', background: '#fff5f5', borderRadius: 6, border: '1px solid #ffd0d0' }}>
                          <span style={{ color: '#555', fontWeight: 500 }}>{x.label}</span>
                          <span style={{ fontWeight: 800, color: '#c0392b', fontSize: '1rem' }}>{x.pct} <span style={{ fontWeight: 400, fontSize: '0.85rem', color: '#888' }}>{tx.cancellationTierSuffix}</span></span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── MISCELLANEOUS ── */}
          <div style={{ background: '#f8f9fb', padding: 20, borderRadius: 12, marginBottom: 28, border: '1px solid #e8eaf0', fontFamily: 'Assistant,sans-serif' }}>
            <strong style={{ color: '#1a1a2e' }}>{tx.miscTitle}</strong><br />
            <span style={{ color: '#333' }}>{tx.miscContent}</span>
          </div>

          {/* ── SIGNATURE SECTION ── */}
          {contract.status === 'signed' || signed ? (
            <div style={{ borderRadius: 14, overflow: 'hidden', border: '2px solid #4CAF50', marginBottom: 28, fontFamily: 'Assistant,sans-serif' }}>
              <div style={{ background: 'linear-gradient(135deg,#e8f5e9,#f1f8e9)', padding: '18px 28px', textAlign: 'center' }}>
                {generating ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <div className="spinner" style={{ borderTopColor: '#4CAF50', margin: '0 auto' }} />
                    <div style={{ color: '#2e7d32', fontWeight: 700 }}>
                      {lang === 'he' ? '⏳ מייצר PDF ומוריד...' : '⏳ Generating & downloading PDF...'}
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#2e7d32', marginBottom: 4 }}>{tx.signed}</div>
                    <div style={{ color: '#333' }}>{tx.signedBy} <strong>{contract.signerName || signerName}</strong></div>
                    {contract.signedAt && <div style={{ fontSize: '0.85rem', color: '#666', marginTop: 4 }}>{tx.signedAt} {new Date(contract.signedAt).toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US')}</div>}
                  </>
                )}
              </div>
              <div className="contract-grid" style={{ background: '#fff', padding: '16px clamp(16px, 4vw, 28px)', borderTop: '1px solid #e8f5e9' }}>
                {/* Band signatures */}
                {contract.bandSignatures && contract.bandSignatures.length > 0 ? (
                  contract.bandSignatures.map((sig, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <div style={{ marginBottom: 6, fontWeight: 600, color: '#666', fontSize: '0.82rem' }}>{sig.name}{sig.role ? ` / ${sig.role}` : ''}</div>
                      <img src={sig.signatureUrl} alt={sig.name}
                        style={{ width: '100%', height: 68, objectFit: 'contain', border: '1px solid #e0e0e0', borderRadius: 6, background: '#fff', padding: 4, display: 'block', margin: '0 auto' }} />
                      <div style={{ borderTop: '2px solid #1a1a2e', marginTop: 4, paddingTop: 3, fontSize: '0.78rem', color: '#888' }}>{tx.bandRep}</div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ marginBottom: 8, fontWeight: 600, color: '#666', fontSize: '0.85rem' }}>{tx.bandRep}</div>
                    <div style={{ padding: '14px 12px', borderBottom: '2px solid #1a1a2e', fontFamily: 'Georgia,cursive', fontSize: '1.5rem', color: '#EAB21B', letterSpacing: 3 }}>Kolot</div>
                  </div>
                )}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ marginBottom: 8, fontWeight: 600, color: '#666', fontSize: '0.85rem' }}>{tx.client}</div>
                  {contract.signatureUrl ? (
                    <img src={contract.signatureUrl} alt="חתימת לקוח"
                      style={{ maxWidth: '100%', height: 72, objectFit: 'contain', border: '1px solid #ddd', borderRadius: 6, background: '#fff', padding: 4, display: 'block', margin: '0 auto 4px' }} />
                  ) : (
                    <div style={{ height: 72, border: '1px dashed #ccc', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '0.8rem', margin: '0 auto 4px' }}>{tx.noSignature}</div>
                  )}
                  <div style={{ borderTop: '2px solid #1a1a2e', paddingTop: 4, fontSize: '0.82rem', color: '#555', fontWeight: 600 }}>{contract.signerName || signerName}</div>
                </div>
              </div>
              <div style={{ background: '#f8f9fb', padding: '14px 28px', textAlign: 'center', borderTop: '1px solid #e8f5e9' }}>
                <button onClick={printPDF} style={{ padding: '10px 28px', background: '#1a1a2e', color: '#EAB21B', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem', fontFamily: 'Assistant,sans-serif' }}>
                  📄 {lang === 'he' ? 'הורד PDF' : 'Download PDF'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ border: '2px dashed #EAB21B', borderRadius: 14, padding: 'clamp(16px, 4vw, 28px)', marginBottom: 28, fontFamily: 'Assistant,sans-serif' }}>
              <h3 style={{ textAlign: 'center', marginBottom: 24, color: '#1a1a2e', fontWeight: 800 }}>{tx.signTitle}</h3>
              <div className="contract-grid">
                {/* Band signatures (pre-sign view) */}
                {contract.bandSignatures && contract.bandSignatures.length > 0 ? (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ marginBottom: 10, fontWeight: 700, color: '#1a1a2e', fontSize: '0.9rem' }}>{tx.bandRep}</div>
                    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                      {contract.bandSignatures.map((sig, i) => (
                        <div key={i} style={{ textAlign: 'center', flex: '1', minWidth: 100 }}>
                          <img src={sig.signatureUrl} alt={sig.name}
                            style={{ width: '100%', maxWidth: 140, height: 60, objectFit: 'contain', border: '1px solid #ddd', borderRadius: 6, background: '#fff', padding: 4, display: 'block', margin: '0 auto' }} />
                          <div style={{ borderTop: '2px solid #1a1a2e', paddingTop: 3, marginTop: 4, fontSize: '0.78rem', color: '#555', fontWeight: 600 }}>{sig.name}</div>
                          {sig.role && <div style={{ fontSize: '0.72rem', color: '#999' }}>{sig.role}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ marginBottom: 12, fontWeight: 700, color: '#1a1a2e' }}>{tx.bandRep}</div>
                    <div style={{ padding: '12px', borderBottom: '2px solid #1a1a2e', fontFamily: 'Georgia,cursive', fontSize: '1.4rem', color: '#EAB21B', letterSpacing: 2 }}>Kolot</div>
                  </div>
                )}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ marginBottom: 12, fontWeight: 700, color: '#1a1a2e' }}>{tx.client}</div>
                  {!signing ? (
                    <button onClick={() => setSigning(true)} style={{ padding: '14px 36px', background: '#EAB21B', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 16px rgba(234,178,27,0.4)', transition: 'all 0.2s', color: '#000', fontFamily: 'Assistant,sans-serif' }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                      ✍️ {tx.signHere}
                    </button>
                  ) : (
                    <div>
                      <input value={signerName} onChange={e => setSignerName(e.target.value)} placeholder={tx.fullName}
                        style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: 8, marginBottom: 10, textAlign: 'center', fontSize: '1rem', fontFamily: 'Assistant,sans-serif' }} />
                      <canvas ref={canvasRef} width={300} height={110}
                        style={{ border: '2px solid #1a1a2e', borderRadius: 8, background: '#fff', cursor: 'crosshair', touchAction: 'none', display: 'block', margin: '0 auto' }}
                        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw} />
                      <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: 4, marginBottom: 10 }}>{tx.signInsideBox}</div>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        <button onClick={submitSign} style={{ padding: '10px 24px', background: '#4CAF50', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'Assistant,sans-serif' }}>{tx.confirmSign}</button>
                        <button onClick={clearSig} style={{ padding: '10px 16px', background: '#f0f2f5', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#333', fontFamily: 'Assistant,sans-serif' }}>{tx.clear}</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ background: '#1a1a2e', padding: '20px 40px', textAlign: 'center', color: '#666', fontSize: '0.8rem' }}>
          {tx.footer}
        </div>
      </div>
    </div>
  );
};

export default ContractView;
