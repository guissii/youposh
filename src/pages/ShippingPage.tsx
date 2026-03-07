import {
    Truck, MapPin, Clock, CreditCard, Package, Shield,
    CheckCircle, MessageCircle
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import WhatsAppButton from '@/components/ui/WhatsAppButton';

const cities = [
    { name: 'Casablanca', delay: '24h', price: '30 DH' },
    { name: 'Rabat', delay: '24h', price: '30 DH' },
    { name: 'Marrakech', delay: '24-48h', price: '35 DH' },
    { name: 'Fès', delay: '24-48h', price: '35 DH' },
    { name: 'Tanger', delay: '24-48h', price: '35 DH' },
    { name: 'Agadir', delay: '48h', price: '40 DH' },
    { name: 'Oujda', delay: '48h', price: '40 DH' },
    { name: 'Meknès', delay: '24-48h', price: '35 DH' },
    { name: 'Kénitra', delay: '24h', price: '30 DH' },
    { name: 'Tétouan', delay: '48h', price: '40 DH' },
    { name: 'Autres villes', delay: '48-72h', price: '40-50 DH' },
];

const steps = [
    {
        step: 1,
        title: 'Passez votre commande',
        description: 'Choisissez vos produits et envoyez-nous votre commande via WhatsApp.',
        icon: Package,
        color: 'var(--yp-blue)',
    },
    {
        step: 2,
        title: 'Confirmation',
        description: 'Nous confirmons votre commande et vous donnons le délai de livraison estimé.',
        icon: CheckCircle,
        color: 'var(--yp-whatsapp)',
    },
    {
        step: 3,
        title: 'Préparation & expédition',
        description: 'Votre colis est soigneusement préparé et confié à notre partenaire de livraison.',
        icon: Truck,
        color: 'var(--yp-blue)',
    },
    {
        step: 4,
        title: 'Livraison & paiement',
        description: 'Vous recevez votre colis et payez le livreur. C\'est aussi simple que ça !',
        icon: CreditCard,
        color: 'var(--yp-dark)',
    },
];

export default function ShippingPage() {

    return (
        <div className="min-h-screen bg-[var(--yp-gray-100)]">
            <Header />

            <main className="pb-20">
                {/* Hero */}
                <section className="bg-gradient-to-b from-white via-[#F8FAFC] to-[var(--yp-gray-100)]">
                    <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14 text-center">
                        <div className="inline-flex items-center gap-2 bg-[var(--yp-blue-50)] text-[var(--yp-blue)] px-4 py-2 rounded-full text-sm font-medium border border-[var(--yp-blue)]/10 mb-5">
                            <Truck className="w-4 h-4" />
                            Informations livraison
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--yp-dark)] font-heading mb-3">
                            Livraison partout au Maroc
                        </h1>
                        <p className="text-[var(--yp-gray-600)] text-base sm:text-lg max-w-lg mx-auto">
                            Livraison rapide et fiable dans toutes les villes du Maroc. Paiement à la livraison.
                        </p>
                    </div>
                </section>

                {/* Key advantages */}
                <section className="max-w-4xl mx-auto px-4 -mt-2 mb-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {[
                            { icon: Truck, title: 'Livraison rapide', desc: '24-72h selon la ville', color: 'var(--yp-blue)' },
                            { icon: CreditCard, title: 'Paiement à la livraison', desc: 'Payez à la réception', color: 'var(--yp-dark)' },
                            { icon: Shield, title: 'Colis protégé', desc: 'Emballage soigné', color: 'var(--yp-blue)' },
                            { icon: MapPin, title: 'Tout le Maroc', desc: 'Toutes les villes', color: 'var(--yp-red)' },
                        ].map((item, i) => (
                            <div key={i} className="bg-white rounded-2xl p-4 text-center border border-[var(--yp-gray-300)] hover:shadow-md transition-all group">
                                <div className="w-11 h-11 bg-[var(--yp-gray-200)] rounded-xl flex items-center justify-center mx-auto mb-2.5 group-hover:scale-110 transition-transform">
                                    <item.icon className="w-5 h-5" style={{ color: item.color }} />
                                </div>
                                <h3 className="font-semibold text-sm text-[var(--yp-dark)] mb-0.5">{item.title}</h3>
                                <p className="text-xs text-[var(--yp-gray-600)]">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* How it works */}
                <section className="max-w-3xl mx-auto px-4 mb-10">
                    <h2 className="text-xl sm:text-2xl font-bold text-[var(--yp-dark)] font-heading mb-6 text-center">
                        Comment ça marche ?
                    </h2>
                    <div className="space-y-4">
                        {steps.map((item, i) => (
                            <div key={i} className="flex items-start gap-4 bg-white rounded-2xl p-5 border border-[var(--yp-gray-300)] hover:shadow-sm transition-all">
                                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: item.color + '15' }}>
                                    <item.icon className="w-5 h-5" style={{ color: item.color }} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-md" style={{ backgroundColor: item.color }}>
                                            ÉTAPE {item.step}
                                        </span>
                                        <h3 className="font-semibold text-sm text-[var(--yp-dark)]">{item.title}</h3>
                                    </div>
                                    <p className="text-sm text-[var(--yp-gray-600)] leading-relaxed">{item.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* City pricing table */}
                <section className="max-w-3xl mx-auto px-4 mb-10">
                    <h2 className="text-xl sm:text-2xl font-bold text-[var(--yp-dark)] font-heading mb-2 text-center">
                        Tarifs et délais par ville
                    </h2>
                    <p className="text-sm text-[var(--yp-gray-600)] text-center mb-6">
                        Livraison <span className="font-semibold text-[var(--yp-whatsapp-dark)]">GRATUITE</span> pour les commandes supérieures à <span className="font-bold text-[var(--yp-dark)]">300 DH</span>
                    </p>

                    <div className="bg-white rounded-2xl border border-[var(--yp-gray-300)] overflow-hidden shadow-sm">
                        {/* Header row */}
                        <div className="grid grid-cols-3 bg-[var(--yp-gray-200)] px-5 py-3 border-b border-[var(--yp-gray-300)]">
                            <span className="text-xs font-semibold text-[var(--yp-gray-700)] uppercase tracking-wider">Ville</span>
                            <span className="text-xs font-semibold text-[var(--yp-gray-700)] uppercase tracking-wider text-center">Délai</span>
                            <span className="text-xs font-semibold text-[var(--yp-gray-700)] uppercase tracking-wider text-right">Tarif</span>
                        </div>

                        {/* City rows */}
                        {cities.map((city, i) => (
                            <div
                                key={i}
                                className={`grid grid-cols-3 px-5 py-3 items-center transition-colors hover:bg-[var(--yp-blue-50)] ${i < cities.length - 1 ? 'border-b border-[var(--yp-gray-300)]/50' : ''
                                    } ${city.name === 'Autres villes' ? 'bg-[var(--yp-gray-100)]' : ''}`}
                            >
                                <span className="text-sm font-medium text-[var(--yp-dark)] flex items-center gap-2">
                                    <MapPin className="w-3.5 h-3.5 text-[var(--yp-gray-500)]" />
                                    {city.name}
                                </span>
                                <span className="text-sm text-[var(--yp-gray-600)] text-center flex items-center justify-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    {city.delay}
                                </span>
                                <span className="text-sm font-semibold text-[var(--yp-dark)] text-right">
                                    {city.price}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Important notes */}
                <section className="max-w-3xl mx-auto px-4 mb-10">
                    <div className="bg-[var(--yp-blue-50)] border border-[var(--yp-blue)]/10 rounded-2xl p-5 sm:p-6">
                        <h3 className="font-semibold text-[var(--yp-dark)] mb-3 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-[var(--yp-blue)]" />
                            Informations importantes
                        </h3>
                        <ul className="space-y-2.5">
                            {[
                                'Vous ne payez rien avant de recevoir votre colis.',
                                'Vous pouvez vérifier le produit avant de payer.',
                                'En cas de problème, contactez-nous immédiatement sur WhatsApp.',
                                'Les retours sont possibles sous 7 jours si le produit est dans son emballage d\'origine.',
                                'Le suivi de votre colis est assuré par SMS ou WhatsApp.',
                            ].map((note, i) => (
                                <li key={i} className="flex items-start gap-2.5 text-sm text-[var(--yp-gray-700)]">
                                    <CheckCircle className="w-4 h-4 text-[var(--yp-whatsapp)] flex-shrink-0 mt-0.5" />
                                    <span>{note}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                {/* CTA */}
                <section className="max-w-3xl mx-auto px-4">
                    <div className="bg-gradient-to-br from-[var(--yp-dark)] to-[var(--yp-gray-900)] rounded-2xl p-7 sm:p-10 text-center text-white relative overflow-hidden">
                        <div className="absolute top-4 left-4 w-20 h-20 border border-white/5 rounded-full" />
                        <div className="relative z-10">
                            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Truck className="w-7 h-7" />
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold mb-2 font-heading">
                                Prêt à commander ?
                            </h2>
                            <p className="text-white/60 mb-6 max-w-md mx-auto text-sm">
                                Livraison rapide, paiement à la livraison. Commandez maintenant sur WhatsApp !
                            </p>
                            <button
                                onClick={() => window.open('https://wa.me/212600000000?text=' + encodeURIComponent('Bonjour, je souhaite passer une commande.'), '_blank')}
                                className="bg-[var(--yp-whatsapp)] hover:bg-[var(--yp-whatsapp-dark)] text-white px-7 py-3.5 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center gap-2 mx-auto"
                            >
                                <MessageCircle className="w-5 h-5" />
                                Commander sur WhatsApp
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
