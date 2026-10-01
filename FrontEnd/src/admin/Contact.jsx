import React, { useState } from "react";
import {
    Mail,
    Phone,
    MapPin,
    Send,
    CheckCircle2,
    MessageCircle,
    Sparkles,
    Clock3
} from "lucide-react";

function Contact() {

    const [form, setForm] = useState({
        nom: "",
        email: "",
        sujet: "",
        message: ""
    });

    const [sent, setSent] = useState(false);

    const handleChange = (event) => {

        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const handleSubmit = (event) => {

        event.preventDefault();

        setSent(true);
    };

    const inputWrapClass = `
        flex
        items-center
        gap-2.5
        w-full
        px-4
        py-2.5
        rounded-xl
        bg-[#FBFAF7]
        border-[2px]
        border-[#EDE9E1]
        focus-within:border-[#172554]
        focus-within:bg-white
        transition
    `;

    const inputBareClass = `
        w-full
        bg-transparent
        text-sm
        text-[#3D3450]
        placeholder-[#B8AFC4]
        focus:outline-none
    `;

    return (
        <div
            className="min-h-screen"
            style={{ background: "#FFF9F2", fontFamily: "'Nunito', sans-serif" }}
        >
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700&family=Nunito:wght@400;600;700&display=swap');
                .font-display { font-family: 'Baloo 2', sans-serif; }
            `}</style>

            {/* HEADER */}
            <div
                className="relative overflow-hidden rounded-[2.5rem] p-6 md:p-9 mb-6"
                style={{ background: "linear-gradient(135deg, #26415E 0%, #3A5570 100%)" }}
            >
                <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10" />
                <div className="absolute bottom-[-40px] left-28 w-28 h-28 rounded-full bg-white/10" />
                <div className="absolute top-1/2 -translate-y-1/2 right-10 w-16 h-16 rounded-full bg-white/5 hidden md:block" />
                <Sparkles className="absolute top-6 right-16 text-white/60" size={20} />
                <Sparkles className="absolute bottom-8 right-8 text-white/40" size={14} />

                <div className="relative flex items-center justify-between gap-4 flex-wrap">

                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-3xl bg-white flex items-center justify-center shrink-0 shadow-[0_6px_0_rgba(0,0,0,0.15)] -rotate-3">
                            <MessageCircle size={30} color="#172554" strokeWidth={2.2} />
                        </div>

                        <div>
                            <p className="text-white/90 text-xs font-bold tracking-wide">
                                Nous contacter
                            </p>
                            <h1 className="font-display text-2xl md:text-3xl font-semibold text-white mt-1">
                                Contact
                            </h1>
                            <p className="text-white/90 text-sm mt-1">
                                Une question, un besoin d'assistance ? Écrivez-nous.
                            </p>
                        </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2">
                        <Clock3 size={16} className="text-white" />
                        <span className="text-white text-xs font-semibold">Réponse sous 24h</span>
                    </div>

                </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

                {/* INFORMATIONS DE CONTACT */}
                <div className="lg:col-span-2 space-y-4 lg:sticky lg:top-6">

                    {[
                        {
                            icon: MapPin,
                            title: "Adresse",
                            value: "Rue de la Médecine, Tunis",
                            rotate: "-rotate-1"
                        },
                        {
                            icon: Phone,
                            title: "Téléphone",
                            value: "+216 71 000 000",
                            rotate: "rotate-1"
                        },
                        {
                            icon: Mail,
                            title: "Email",
                            value: "contact@medplatform.tn",
                            rotate: "-rotate-1"
                        }
                    ].map((item) => {

                        const Icon = item.icon;

                        return (
                            <div
                                key={item.title}
                                className={`${item.rotate} hover:rotate-0 hover:-translate-y-0.5 transition-all duration-300 bg-white rounded-[1.5rem] border-[3px] border-[#172554] p-5 flex items-center gap-4 shadow-[0_4px_0_rgba(23,37,84,0.08)]`}
                            >

                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border-[3px]" style={{ background: "#E4F0FF", borderColor: "#172554" }}>
                                    <Icon size={20} color="#172554" strokeWidth={2.2} />
                                </div>

                                <div>
                                    <p className="text-xs text-[#B8AFC4] font-bold tracking-wide">
                                        {item.title}
                                    </p>
                                    <p className="text-sm font-semibold text-[#3D3450] mt-0.5">
                                        {item.value}
                                    </p>
                                </div>

                            </div>
                        );
                    })}

                    <div className="rounded-[1.5rem] border-[3px] border-dashed border-[#BFDBFF] p-5 text-center">
                        <p className="text-xs text-[#8A8296] leading-relaxed">
                            Besoin d'une réponse urgente ? Appelez-nous directement,
                            notre équipe est disponible du lundi au vendredi.
                        </p>
                    </div>

                </div>

                {/* FORMULAIRE */}
                <div className="lg:col-span-3">

                    <div className="bg-white rounded-[2rem] border-[3px] border-[#172554] p-6 md:p-8 shadow-[0_6px_0_rgba(23,37,84,0.08)]">

                        <h2 className="font-display font-semibold text-[#3D3450] text-lg">
                            Envoyez-nous un message
                        </h2>

                        <p className="text-sm text-[#8A8296] mt-1 mb-6">
                            Nous vous répondrons dans les plus brefs délais.
                        </p>

                        {sent ? (

                            <div className="rounded-[1.5rem] border-[3px] border-[#172554] p-8 text-center" style={{ background: "#E4F0FF" }}>

                                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-4 shadow-[0_4px_0_rgba(23,37,84,0.1)]">
                                    <CheckCircle2 size={32} color="#172554" />
                                </div>

                                <p className="font-display font-semibold text-[#172554] text-lg">
                                    Message envoyé avec succès !
                                </p>

                                <p className="text-sm text-[#3D3450] mt-1.5">
                                    Merci {form.nom || "cher utilisateur"}, nous
                                    revenons vers vous rapidement.
                                </p>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setSent(false);
                                        setForm({
                                            nom: "",
                                            email: "",
                                            sujet: "",
                                            message: ""
                                        });
                                    }}
                                    className="mt-5 inline-flex items-center gap-2 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90 active:scale-95"
                                    style={{ background: "#172554" }}
                                >
                                    Nouveau message
                                </button>

                            </div>

                        ) : (

                            <form onSubmit={handleSubmit} className="space-y-4">

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                    <div>
                                        <label className="block text-xs font-bold text-[#8A8296] mb-1.5">
                                            Nom complet
                                        </label>
                                        <div className={inputWrapClass}>
                                            <input
                                                type="text"
                                                name="nom"
                                                value={form.nom}
                                                onChange={handleChange}
                                                required
                                                placeholder="Votre nom"
                                                className={inputBareClass}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-[#8A8296] mb-1.5">
                                            Email
                                        </label>
                                        <div className={inputWrapClass}>
                                            <Mail size={16} color="#B8AFC4" className="shrink-0" />
                                            <input
                                                type="email"
                                                name="email"
                                                value={form.email}
                                                onChange={handleChange}
                                                required
                                                placeholder="vous@exemple.com"
                                                className={inputBareClass}
                                            />
                                        </div>
                                    </div>

                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#8A8296] mb-1.5">
                                        Sujet
                                    </label>
                                    <div className={inputWrapClass}>
                                        <input
                                            type="text"
                                            name="sujet"
                                            value={form.sujet}
                                            onChange={handleChange}
                                            required
                                            placeholder="Objet de votre message"
                                            className={inputBareClass}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#8A8296] mb-1.5">
                                        Message
                                    </label>
                                    <div className={`${inputWrapClass} items-start`}>
                                        <textarea
                                            name="message"
                                            value={form.message}
                                            onChange={handleChange}
                                            required
                                            rows="5"
                                            placeholder="Votre message..."
                                            className={`${inputBareClass} resize-none`}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-xl text-sm font-semibold transition hover:opacity-90 active:scale-95 shadow-[0_4px_0_rgba(23,37,84,0.2)]"
                                    style={{ background: "#172554" }}
                                >
                                    <Send size={16} />
                                    Envoyer le message
                                </button>

                            </form>

                        )}

                    </div>

                </div>

            </div>

        </div>
    );
}

export default Contact;
