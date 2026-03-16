import {
    ChevronDown, HelpCircle, MessageCircle,
    ShoppingCart, Truck, CreditCard, Package, RotateCcw
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import WhatsAppButton from '@/components/ui/WhatsAppButton';
import { useState } from 'react';

interface FAQItem {
    question: string;
    answer: string;
    icon: React.ElementType;
    category: string;
}

const faqData: FAQItem[] = [
    // Commandes
    {
        category: 'Commandes',
        icon: ShoppingCart,
        question: 'Comment passer une commande ?',
        answer: 'Choisissez votre produit, cliquez sur "Commander via WhatsApp" et envoyez-nous votre commande. Vous pouvez aussi nous contacter directement sur WhatsApp au +212 6XX XXX XXX. Nous confirmons votre commande sous 30 minutes.',
    },
    {
        category: 'Commandes',
        icon: ShoppingCart,
        question: 'Est-ce que je dois créer un compte ?',
        answer: 'Non, aucun compte n\'est nécessaire. Vous commandez directement via WhatsApp en nous envoyant vos coordonnées (nom, ville, adresse). C\'est simple et rapide !',
    },
    {
        category: 'Commandes',
        icon: ShoppingCart,
        question: 'Puis-je modifier ou annuler ma commande ?',
        answer: 'Oui, vous pouvez modifier ou annuler votre commande tant qu\'elle n\'a pas été expédiée. Contactez-nous sur WhatsApp dès que possible pour effectuer le changement.',
    },
    // Livraison
    {
        category: 'Livraison',
        icon: Truck,
        question: 'Quels sont les délais de livraison ?',
        answer: 'La livraison prend entre 24h et 48h pour Fès et les grandes villes. Pour les autres régions du Maroc, comptez 48h à 72h. Vous recevez un message de confirmation dès que votre colis est en route.',
    },
    {
        category: 'Livraison',
        icon: Truck,
        question: 'Combien coûte la livraison ?',
        answer: 'La livraison coûte 30 à 50 DH selon votre ville. La livraison est GRATUITE pour les commandes supérieures à 300 DH. Les frais exacts sont indiqués avant la confirmation de votre commande.',
    },
    {
        category: 'Livraison',
        icon: Truck,
        question: 'Est-ce que vous livrez partout au Maroc ?',
        answer: 'Oui ! Nous livrons dans toutes les villes et régions du Maroc grâce à nos partenaires de livraison fiables (Amana, CTM, etc.).',
    },
    // Paiement
    {
        category: 'Paiement',
        icon: CreditCard,
        question: 'Quels modes de paiement acceptez-vous ?',
        answer: 'Nous acceptons principalement le paiement à la livraison (Cash on Delivery). Vous payez uniquement lorsque vous recevez votre colis. Nous acceptons aussi le virement bancaire et les transferts (CashPlus, Wafacash).',
    },
    {
        category: 'Paiement',
        icon: CreditCard,
        question: 'Est-ce que je paye avant de recevoir le produit ?',
        answer: 'Non ! Avec le paiement à la livraison, vous ne payez qu\'à la réception de votre colis. Vous vérifiez d\'abord votre produit, puis vous payez le livreur.',
    },
    // Produits
    {
        category: 'Produits',
        icon: Package,
        question: 'Est-ce que les produits sont garantis ?',
        answer: 'Oui, tous nos produits sont sélectionnés avec soin et bénéficient d\'une garantie qualité. Si un produit arrive défectueux, nous le remplaçons ou vous remboursons.',
    },
    {
        category: 'Produits',
        icon: Package,
        question: 'Les photos correspondent aux produits réels ?',
        answer: 'Absolument ! Nous utilisons des photos réelles de nos produits. Il peut y avoir de légères variations de couleur dues à l\'écran, mais le produit reçu correspond à ce qui est affiché.',
    },
    // Retours
    {
        category: 'Retours & Échanges',
        icon: RotateCcw,
        question: 'Comment retourner un produit ?',
        answer: 'Si le produit ne vous convient pas ou est défectueux, contactez-nous sur WhatsApp dans les 48h suivant la réception. Nous organisons le retour et l\'échange ou le remboursement gratuit.',
    },
    {
        category: 'Retours & Échanges',
        icon: RotateCcw,
        question: 'Quelles sont les conditions de retour ?',
        answer: 'Le produit doit être dans son emballage d\'origine, non utilisé, et retourné dans les 7 jours suivant la réception. Les frais de retour sont à notre charge si le produit est défectueux.',
    },
];

import { useStoreSettings } from '@/data/storeSettings';

export default function FAQPage() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const [activeCategory, setActiveCategory] = useState<string>('Tous');
    const { phone } = useStoreSettings();

    const categoriesList = ['Tous', ...Array.from(new Set(faqData.map(f => f.category)))];
    const filtered = activeCategory === 'Tous' ? faqData : faqData.filter(f => f.category === activeCategory);

    return (
        <div className="min-h-screen bg-[var(--yp-gray-100)]">
            <Header />

            <main className="pb-20">
                {/* Hero */}
                <section className="bg-gradient-to-b from-white via-[#F8FAFC] to-[var(--yp-gray-100)]">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 text-center">
                        <div className="inline-flex items-center gap-2 bg-[var(--yp-blue-50)] text-[var(--yp-blue)] px-4 py-2 rounded-full text-sm font-medium border border-[var(--yp-blue)]/10 mb-5">
                            <HelpCircle className="w-4 h-4" />
                            Centre d'aide
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--yp-dark)] font-heading mb-3">
                            Questions fréquentes
                        </h1>
                        <p className="text-[var(--yp-gray-600)] text-base sm:text-lg max-w-lg mx-auto">
                            Tout ce que vous devez savoir sur nos produits, la livraison et le paiement au Maroc.
                        </p>
                    </div>
                </section>

                {/* Category Filter */}
                <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-2 mb-6">
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {categoriesList.map(cat => (
                            <button
                                key={cat}
                                onClick={() => { setActiveCategory(cat); setOpenIndex(null); }}
                                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${activeCategory === cat
                                    ? 'bg-[var(--yp-blue)] text-white shadow-md'
                                    : 'bg-white text-[var(--yp-gray-700)] border border-[var(--yp-gray-300)] hover:bg-[var(--yp-blue-50)] hover:text-[var(--yp-blue)]'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </section>

                {/* FAQ Accordion */}
                <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="space-y-3">
                        {filtered.map((item) => {
                            const realIndex = faqData.indexOf(item);
                            const isOpen = openIndex === realIndex;
                            return (
                                <div
                                    key={realIndex}
                                    className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${isOpen
                                        ? 'border-[var(--yp-blue)]/20 shadow-md'
                                        : 'border-[var(--yp-gray-300)] hover:shadow-sm'
                                        }`}
                                >
                                    <button
                                        onClick={() => setOpenIndex(isOpen ? null : realIndex)}
                                        className="w-full flex items-center gap-3 px-5 py-4 text-left"
                                    >
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${isOpen ? 'bg-[var(--yp-blue-50)]' : 'bg-[var(--yp-gray-200)]'
                                            }`}>
                                            <item.icon className={`w-4 h-4 ${isOpen ? 'text-[var(--yp-blue)]' : 'text-[var(--yp-gray-600)]'}`} />
                                        </div>
                                        <span className={`flex-1 text-sm font-semibold transition-colors ${isOpen ? 'text-[var(--yp-blue)]' : 'text-[var(--yp-dark)]'
                                            }`}>
                                            {item.question}
                                        </span>
                                        <ChevronDown className={`w-4 h-4 text-[var(--yp-gray-500)] transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180' : ''
                                            }`} />
                                    </button>

                                    <div className={`overflow-hidden transition-all duration-300 ease-out ${isOpen ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'
                                        }`}>
                                        <div className="px-5 pb-5 pl-[4.25rem]">
                                            <p className="text-sm text-[var(--yp-gray-600)] leading-relaxed">
                                                {item.answer}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Contact CTA */}
                <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
                    <div className="bg-gradient-to-br from-[var(--yp-dark)] to-[var(--yp-gray-900)] rounded-2xl p-7 sm:p-10 text-center text-white relative overflow-hidden">
                        <div className="absolute top-4 left-4 w-20 h-20 border border-white/5 rounded-full" />
                        <div className="absolute bottom-4 right-4 w-28 h-28 border border-white/5 rounded-full" />

                        <div className="relative z-10">
                            <div className="w-14 h-14 bg-[var(--yp-whatsapp)]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <MessageCircle className="w-7 h-7 text-[var(--yp-whatsapp)]" />
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold mb-2 font-heading">
                                Vous ne trouvez pas votre réponse ?
                            </h2>
                            <p className="text-white/60 mb-6 max-w-md mx-auto text-sm">
                                Notre équipe est disponible sur WhatsApp pour répondre à toutes vos questions.
                            </p>
                            <button
                                onClick={() => {
                                    const cleanPhone = phone.replace(/[^\d]/g, '') || '212690939090';
                                    window.open(`https://wa.me/${cleanPhone}?text=` + encodeURIComponent('Bonjour, j\'ai une question.'), '_blank');
                                }}
                                className="bg-[var(--yp-whatsapp)] hover:bg-[var(--yp-whatsapp-dark)] text-white px-7 py-3.5 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center gap-2 mx-auto"
                            >
                                <MessageCircle className="w-5 h-5" />
                                Contacter sur WhatsApp
                            </button>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
            <CartDrawer />
            <WhatsAppButton variant="floating" />
        </div>
    );
}
