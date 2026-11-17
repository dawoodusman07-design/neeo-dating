/**
 * Urdu (RTL). Partial: core navigation, Welcome, Discover and Region & language, so the
 * language switch can be checked end to end. Missing keys fall back to English.
 * [TRANSLATION REVIEW] Every string must be reviewed by a native speaker before release.
 */
const ur = {
  common: { continue: 'جاری رکھیں', cancel: 'منسوخ کریں', done: 'ہو گیا', back: 'واپس', close: 'بند کریں', retry: 'دوبارہ کوشش کریں', save: 'محفوظ کریں', verified: 'تصدیق شدہ' },
  welcome: {
    headline: 'کسی سچے رشتے کے لیے جگہ بنائیں۔',
    sub: 'ایک جیسے ارادوں والے لوگوں سے ملیں۔ آپ کی حدیں آپ کی اپنی ہیں۔',
    trust1: 'ہر رکن کی تصویر کی تصدیق ہو چکی ہے یا ہو رہی ہے',
    trust2: 'تصویر کی پرائیویسی ہمیشہ مفت ہے',
    trust3: 'جواب کا کوئی ٹائمر نہیں۔ اپنا وقت لیں۔',
    create: 'شروع کریں',
    signIn: 'میرا پہلے سے اکاؤنٹ ہے',
  },
  discover: {
    tab: 'دریافت',
    header: 'آج کے تعارف',
    count: '{{total}} میں سے {{seen}}',
    pass: '{{name}} کو چھوڑ دیں',
    like: '{{name}} کو پسند کریں',
    seeMore: '{{name}} کے بارے میں مزید دیکھیں',
    filters: 'ترجیحات',
  },
  likes: { title: 'پسند', subtitle: 'سوچے سمجھے سلام، آپ کے منتظر۔', received: 'موصول', sent: 'بھیجے گئے' },
  chats: { title: 'گفتگو', conversations: 'گفتگو', newConnections: 'نئے رابطے', yourTurn: 'آپ کی باری' },
  you: { tab: 'آپ', title: 'آپ کی جگہ', settings: 'ترتیبات', helpRow: 'مدد اور نیا کیا ہے' },
  settings: {
    regionTitle: 'علاقہ اور زبان',
    language: 'زبان',
    region: 'علاقہ',
    formats: 'فارمیٹ',
    rtlNote: 'عربی اور اردو دائیں سے بائیں لکھی جاتی ہیں۔',
  },
  a11y: { unread: '{{count}} نہ پڑھے گئے', loading: 'لوڈ ہو رہا ہے' },
};
export default ur;
