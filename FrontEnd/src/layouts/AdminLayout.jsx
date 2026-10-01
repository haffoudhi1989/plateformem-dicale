import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

function AdminLayout() {
    return (
        <div className="flex min-h-screen bg-slate-50">

            {/* Sidebar */}
            <Sidebar />

            {/* Main */}
            <div className="flex-1 w-full lg:ml-64 flex flex-col">

                <main className="flex-1 min-w-0">
                    {/* Conteneur centré : même largeur de contenu (bannière incluse)
                        que les autres espaces (max-w-7xl + p-4 md:p-8). */}
                    <div className="mx-auto w-full max-w-7xl p-4 md:p-8">
                        <Outlet />
                    </div>
                </main>

            </div>

        </div>
    );
}

export default AdminLayout;