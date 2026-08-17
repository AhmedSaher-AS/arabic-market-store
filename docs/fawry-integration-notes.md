# ملاحظات تكامل فوري

لا يصدر المتجر رمز فوري حقيقيًا من تلقاء نفسه. توضح وثائق FawryPay أن إنشاء طلب دفع برقم مرجعي يحتاج إلى رمز التاجر ومفتاح أمانه، ويُنشئ رقمًا مرجعيًا فريدًا ليدفع العميل به في نقاط فوري، كما يمكن إعداد عنوان Webhook لإبلاغ الخادم بتحديثات الدفع. [1]

تدعم Fawry Accept الدفع عبر **Fawry Pay Reference Code**، وتوفر بوابة تسجيل للتاجر لبدء التفعيل. [2] لذلك، تنفذ النسخة الحالية طريقة **إثبات يدوي**: مرجع داخلي للطلب، ورفع لقطة السداد، ومراجعة المدير. ويُستبدل هذا المسار بتكامل فوري حقيقي بعد حصول المالك على بيانات حساب التاجر.

## المراجع

[1]: https://developer.fawrystaging.com/docs/server-apis/create-payment-refno-apis "Create Payment Requests Using FawryPay Reference Number"
[2]: https://www.fawry.com/business/acceptance/online-checkout/ "Fawry Accept Online Checkout"
