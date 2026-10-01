import React from "react";
import { Stethoscope, CalendarHeart, Users2, Sparkles, Heart } from "lucide-react";

export default function Apropos() {
  const features = [
    {
      icon: CalendarHeart,
      bg: "#E4F0FF",
      ring: "#172554",
      iconColor: "#172554",
      rotate: "-rotate-2",
      title: "Agenda & rendez-vous",
      description:
        "Prise et suivi des rendez-vous en temps réel, gestion des disponibilités et petits rappels tout doux.",
    },
    {
      icon: Users2,
      bg: "#E4F7FF",
      ring: "#172554",
      iconColor: "#1E3A8A",
      rotate: "rotate-2",
      title: "Dossiers & patients",
      description:
        "Accès sécurisé à l'historique médical, aux ordonnances et aux infos de contact, bien rangés.",
    },
  ];

  return (
    <div
      className="min-h-screen"
      style={{
        background: "#FFF9F2",
        fontFamily: "'Nunito', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700&family=Nunito:wght@400;600;700&display=swap');
        .font-display { font-family: 'Baloo 2', sans-serif; }
      `}</style>

      {/* EN-TÊTE */}
      <div
        className="relative overflow-hidden rounded-[2.5rem] p-6 md:p-9 mb-6"
        style={{ background: "linear-gradient(135deg, #26415E 0%, #3A5570 100%)" }}
      >
        {/* blobs décoratifs */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/15" />
        <div className="absolute bottom-[-30px] left-24 w-24 h-24 rounded-full bg-white/10" />
        <Sparkles className="absolute top-6 right-16 text-white/70" size={20} />
        <Sparkles className="absolute bottom-8 right-8 text-white/50" size={14} />

        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-white flex items-center justify-center shrink-0 shadow-[0_6px_0_rgba(0,0,0,0.06)] -rotate-3">
            <Stethoscope size={30} color="#172554" strokeWidth={2.2} />
          </div>
          <div>
            <p className="text-white/90 text-xs font-bold tracking-wide">
              Présentation
            </p>
            <h1 className="font-display text-2xl md:text-3xl font-semibold text-white mt-1">
              À propos de MedPlatform
            </h1>
            <p className="text-white/90 text-sm mt-1">
              Le petit coup de pouce numérique pour vos soins au quotidien
            </p>
          </div>
        </div>
      </div>

      {/* MISSION */}
      <div className="relative bg-white rounded-[2rem] border-[3px] border-[#172554] p-6 md:p-8 mb-6">
        <div
          className="absolute -top-4 left-8 w-8 h-8 bg-white border-l-[3px] border-t-[3px] border-[#172554] rotate-45"
        />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-3" style={{ background: "#E4F0FF" }}>
            <Sparkles size={14} color="#172554" />
            <span className="text-xs font-bold" style={{ color: "#172554" }}>Notre mission</span>
          </div>
          <h2 className="font-display text-xl md:text-2xl font-semibold text-[#3D3450] mb-3">
            Simplifier le quotidien des soignants et de leurs patients
          </h2>
          <p className="text-[#6B6377] text-sm md:text-base leading-relaxed">
            centraliser la gestion des cabinets médicaux, la planification des rendez-vous
            et le suivi des dossiers patients dans une interface unique, fluide et rassurante.
          </p>
        </div>
      </div>

      {/* FONCTIONNALITÉS CLÉS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {features.map((item, idx) => {
          const IconComponent = item.icon;
          return (
            <div
              key={idx}
              className={`${item.rotate} hover:rotate-0 transition-transform duration-300 bg-white p-6 rounded-[1.75rem] border-[3px]`}
              style={{ borderColor: item.ring }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border-[3px]"
                style={{ background: item.bg, borderColor: item.ring }}
              >
                <IconComponent size={22} color={item.iconColor} strokeWidth={2.2} />
              </div>
              <h3 className="font-display font-semibold text-[#3D3450] text-base mb-1.5">
                {item.title}
              </h3>
              <p className="text-sm text-[#8A8296] leading-relaxed">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>

     
    </div>
  );
}
