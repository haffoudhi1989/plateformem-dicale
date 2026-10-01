import React from "react";
import { MessageSquare } from "lucide-react";
import StaffMessenger from "../components/StaffMessenger";

/**
 * Espace admin — Messages
 * Uniquement l'échange entre l'administration et les secrétaires
 * (messagerie interne /api/staff/messages, table staff_messages).
 */
export default function Messages() {
    return (
        <div>
            {/* EN-TÊTE — rectangle bleu nuit (même design que le reste de l'espace admin) */}
            <div className="rounded-2xl bg-gradient-to-r from-[#26415E] to-[#3A5570] shadow-lg shadow-blue-200/60 p-4 md:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 min-h-[88px] md:min-h-[96px] mb-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                        <MessageSquare size={26} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg md:text-xl font-bold text-white mt-0.5">
                            Messages
                        </h1>
                        <p className="text-blue-100 text-sm mt-0.5">
                            Échangez avec les secrétaires des cabinets
                        </p>
                    </div>
                </div>
            </div>

            {/* MESSAGERIE INTERNE — ADMIN ↔ SECRÉTAIRES */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="h-[600px]">
                    <StaffMessenger groupes={["Secrétaires"]} />
                </div>
            </div>
        </div>
    );
}
