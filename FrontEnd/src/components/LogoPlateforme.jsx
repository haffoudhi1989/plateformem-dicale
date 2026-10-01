import React from "react";
import { HeartPulse } from "lucide-react";

/*
|--------------------------------------------------------------------------
| LOGO DE LA PLATEFORME
|--------------------------------------------------------------------------
|
| Reprend exactement le logo de la page de connexion :
| pastille bleue arrondie + icône blanche + mot-symbole bicolore
| « MedPlateform » (+ signature sous le mot-symbole en version sidebar).
|
| Utilisé dans tous les espaces (médecin, secrétariat…) pour que le logo
| affiché en haut, dans le coin, soit identique à celui de la connexion.
|
| variant "sidebar" : pastille + mot-symbole + signature
| variant "mobile"  : pastille + mot-symbole (pas de place pour la signature)
|--------------------------------------------------------------------------
*/

export default function LogoPlateforme({ variant = "sidebar" }) {
    if (variant === "mobile") {
        return (
            <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[#1769E8] shadow-[0_8px_20px_rgba(23,105,232,0.22)]">
                    <HeartPulse size={20} className="text-white" strokeWidth={2.2} />
                </div>

                <span className="text-[18px] font-bold tracking-[-1px] text-[#12213D]">
                    Med<span className="text-[#1769E8]">Plateform</span>
                </span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#1769E8] shadow-[0_8px_20px_rgba(23,105,232,0.22)]">
                <HeartPulse size={25} className="text-white" strokeWidth={2.2} />
            </div>

            <div>
                <div className="text-[22px] font-bold leading-none tracking-[-1.2px] text-[#12213D]">
                    Med<span className="text-[#1769E8]">Plateform</span>
                </div>

                <p className="mt-1 text-[11px] font-semibold text-[#334967]">
                    Votre santé, notre priorité
                </p>
            </div>
        </div>
    );
}
