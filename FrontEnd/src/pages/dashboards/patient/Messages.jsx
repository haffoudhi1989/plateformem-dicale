import React from "react";
import MessagerieInterne from "../../../components/MessagerieInterne";

export default function Messages() {
    return (
        <div className="bg-slate-50">
            <div className="max-w-6xl mx-auto px-6 py-10">
                {/* Carte blanche contenant la messagerie */}
                <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden h-[580px]">
                    <MessagerieInterne titre="Mes médecins" />
                </div>
            </div>
        </div>
    );
}
